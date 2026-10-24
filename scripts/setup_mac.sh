#!/usr/bin/env bash
set -e

echo "=========================================================="
echo " MachineMind 360 — macOS / Linux Setup & Initialization"
echo "=========================================================="

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

cd "${ROOT_DIR}"

# 1. Check Python
echo "-> Checking Python installation..."
PYTHON_BIN=""
if command -v python3 &>/dev/null; then
    PYTHON_BIN="python3"
elif command -v python &>/dev/null; then
    PYTHON_BIN="python"
else
    echo "ERROR: Python 3 is not installed or not in PATH."
    exit 1
fi
echo "   Found: $($PYTHON_BIN --version)"

# 2. Check Node & npm
echo "-> Checking Node & npm..."
if ! command -v node &>/dev/null; then
    echo "ERROR: Node.js is not installed."
    exit 1
fi
if ! command -v npm &>/dev/null; then
    echo "ERROR: npm is not installed."
    exit 1
fi
echo "   Found Node $(node -v) and npm $(npm -v)"

# 3. Setup Backend Virtual Environment
echo "-> Setting up Python virtual environment..."
cd "${ROOT_DIR}/backend"
if [ ! -d ".venv" ]; then
    $PYTHON_BIN -m venv .venv
fi
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

# 4. Train ML Pipeline and verify artifacts
echo "-> Verifying ML Pipeline and model training..."
cd "${ROOT_DIR}"
if [ ! -f "ml/artifacts/model_pipeline.joblib" ]; then
    PYTHONPATH=backend backend/.venv/bin/python ml/scripts/train.py
else
    echo "   ML model artifacts already trained and persisted."
fi

# 5. Database Migrations and Seeding
echo "-> Applying database migrations and seeding initial records..."
cd "${ROOT_DIR}/backend"
PYTHONPATH=. .venv/bin/alembic upgrade head
PYTHONPATH=. .venv/bin/python app/db/seed.py

# 6. Setup Frontend
echo "-> Installing Frontend dependencies..."
cd "${ROOT_DIR}/frontend"
npm install

echo ""
echo "=========================================================="
echo " Setup Completed Successfully!"
echo " Run ./scripts/run_mac.sh to launch MachineMind 360 locally."
echo "=========================================================="
