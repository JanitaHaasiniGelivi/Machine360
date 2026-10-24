#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

echo "=========================================================="
echo " MachineMind 360 — Automated Quality Gates & Verification"
echo "=========================================================="

# 1. Backend Pytest
echo ""
echo "[1/4] Running Backend Pytest Suite..."
cd "${ROOT_DIR}/backend"
source .venv/bin/activate
PYTHONPATH=. python -m pytest tests -v

# 2. Frontend Unit Tests
echo ""
echo "[2/4] Running Frontend Vitest Suite..."
cd "${ROOT_DIR}/frontend"
npm run test

# 3. Frontend Type Check
echo ""
echo "[3/4] Running TypeScript Strict Type Checking..."
npx tsc --noEmit

# 4. Frontend Production Build
echo ""
echo "[4/4] Verifying Vite Production Build..."
npm run build

echo ""
echo "=========================================================="
echo " ALL QUALITY GATES PASSED (4/4)! System Ready for Deployment."
echo "=========================================================="
