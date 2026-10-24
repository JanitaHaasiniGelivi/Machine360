#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RUN_DIR="$(mktemp -d "${TMPDIR:-/tmp}/machinemind360-test.XXXXXX")"
BACKEND_PID=""
FRONTEND_PID=""

cleanup() {
  [[ -z "$FRONTEND_PID" ]] || kill "$FRONTEND_PID" 2>/dev/null || true
  [[ -z "$BACKEND_PID" ]] || kill "$BACKEND_PID" 2>/dev/null || true
  wait "$FRONTEND_PID" "$BACKEND_PID" 2>/dev/null || true
  rm -rf "$RUN_DIR"
}
trap cleanup EXIT INT TERM

echo "MachineMind 360 full automated verification"
echo "Isolated test database: $RUN_DIR/machinemind360.db"

cd "$ROOT_DIR/backend"
source .venv/bin/activate
export PYTHONPATH="$ROOT_DIR/backend"
export DATABASE_URL="sqlite:///$RUN_DIR/machinemind360.db"
export DEBUG=true
python -m pytest tests -v

cd "$ROOT_DIR/frontend"
npm run test
npm run lint
npm run build

echo "Checking real saved-model inference and batch parity..."
python - <<'PY'
import pandas as pd
from app.ml.inference import model_engine
row = {"Type":"M", "Air temperature [K]":298.1, "Process temperature [K]":308.6,
       "Rotational speed [rpm]":1551.0, "Torque [Nm]":42.8, "Tool wear [min]":12.0}
single = model_engine.predict_single("M", 298.1, 308.6, 1551.0, 42.8, 12.0)
batch = model_engine.predict_batch(pd.DataFrame([row]))
prediction = batch["rows"][0]
assert prediction["prediction"] == single["machine_failure_prediction"]
assert abs(prediction["probability"] - single["failure_probability"]) < 1e-5
assert model_engine.pipeline is not None and model_engine.metadata["model_version"] == "1.0.0"
print("Saved pipeline loaded; single and one-row batch inference agree.")
PY

for port in 5173 8000; do
  if lsof -nP -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1; then
    echo "Port $port is already occupied; stop the existing service before running browser tests." >&2
    exit 1
  fi
done

cd "$ROOT_DIR/backend"
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 >"$RUN_DIR/backend.log" 2>&1 &
BACKEND_PID=$!
cd "$ROOT_DIR/frontend"
npm run dev -- --host 127.0.0.1 --port 5173 >"$RUN_DIR/frontend.log" 2>&1 &
FRONTEND_PID=$!

ready=0
for _ in $(seq 1 60); do
  if curl --silent --fail http://127.0.0.1:8000/api/v1/health >/dev/null && \
     curl --silent --fail http://127.0.0.1:5173/ >/dev/null; then
    ready=1
    break
  fi
  sleep 1
done
if [[ "$ready" != 1 ]]; then
  cat "$RUN_DIR/backend.log" "$RUN_DIR/frontend.log"
  echo "Local services did not become healthy within 60 seconds." >&2
  exit 1
fi
echo "Backend and frontend HTTP startup checks passed."
npm run test:e2e
