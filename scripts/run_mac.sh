#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

echo "=========================================================="
echo " Launching MachineMind 360 Full-Stack Application"
echo " Backend API: http://127.0.0.1:8000"
echo " API Docs:    http://127.0.0.1:8000/docs"
echo " Frontend:    http://127.0.0.1:5173"
echo "=========================================================="

cleanup() {
    echo ""
    echo "Shutting down servers..."
    kill "$BACKEND_PID" 2>/dev/null || true
    kill "$FRONTEND_PID" 2>/dev/null || true
    exit 0
}

trap cleanup SIGINT SIGTERM

# Start Backend API
cd "${ROOT_DIR}/backend"
source .venv/bin/activate
PYTHONPATH=. python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000 &
BACKEND_PID=$!

# Start Frontend Vite Dev Server
cd "${ROOT_DIR}/frontend"
npm run dev -- --host 127.0.0.1 --port 5173 &
FRONTEND_PID=$!

echo "Servers running. Press CTRL+C to stop."
wait
