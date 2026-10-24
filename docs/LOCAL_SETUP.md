# MachineMind 360 — Local Setup & Development Guide

This guide explains how to set up, run, and test MachineMind 360 locally on **macOS**, **Linux**, and **Windows**.

## 1. Prerequisites

- **Python:** 3.12 or higher (Python 3.12+ recommended).
- **Node.js:** v18.0.0 or higher (v20+ recommended).
- **npm:** 9.0 or higher.
- **Git**

## 2. Automated One-Command Setup

### macOS / Linux
Open a terminal in the project root:
```bash
./scripts/setup_mac.sh
```

### Windows (PowerShell)
Open PowerShell as Administrator in the project root:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process
.\scripts\setup_windows.ps1
```

The script will automatically:
1. Create a Python virtual environment (`backend/.venv`).
2. Install all backend dependencies.
3. Verify and train the ML model on `ai4i2020.csv`.
4. Apply database schema migrations via Alembic.
5. Seed initial demo accounts and factory assets into `machinemind360.db`.
6. Install frontend dependencies (`frontend/node_modules`).

If `backend/.venv` was created on another operating system, the Windows setup
script detects the incompatible environment and recreates it automatically.

---

## 3. Launching the Local Full-Stack Application

### macOS / Linux
```bash
./scripts/run_mac.sh
```

### Windows (PowerShell)
```powershell
.\scripts\run_windows.ps1
```

### Manual Individual Commands (Any OS)

#### Terminal 1 — Backend API
```bash
cd backend
source .venv/bin/activate        # On Windows: .\.venv\Scripts\Activate.ps1
export PYTHONPATH=.              # On Windows: $env:PYTHONPATH="."
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
- **Backend API:** `http://127.0.0.1:8000`
- **Swagger Documentation:** `http://127.0.0.1:8000/docs`
- **Health Check:** `http://127.0.0.1:8000/api/v1/health`

#### Terminal 2 — Frontend Application
```bash
cd frontend
npm run dev
```
- **Frontend Dashboard:** `http://localhost:5173`

---

## 4. Default Seeded Demonstration Accounts

| Role | Email Address | Password | Permissions |
|---|---|---|---|
| **Admin** | `admin@machinemind360.com` | `AdminPassword123!` | Full CRUD, user management, tickets, machine decommissioning |
| **Technician** | `technician@machinemind360.com` | `TechPassword123!` | Prediction, ticket action logging, status updates |
| **Viewer** | `viewer@machinemind360.com` | `ViewerPassword123!` | Read-only analytics, reports, digital twin inspection |

---

## 5. Running Automated Tests

```bash
# On macOS / Linux:
./scripts/test_all.sh

# On Windows:
.\scripts\test_all.ps1
```
This runs:
1. Backend Pytest suite (9 tests covering health, auth, assets, inference, costs, tickets).
2. Frontend Vitest suite (6 unit & calculation tests).
3. Strict TypeScript type check (`npx tsc --noEmit`).
4. Production bundle compilation (`npm run build`).
