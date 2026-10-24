# MachineMind 360 — Automated Testing Documentation

## 1. Test Architecture Overview

MachineMind 360 incorporates a multi-layer test architecture covering backend APIs, physical calculations, model artifact loading, and frontend conversions.

```
                      ┌────────────────────────────────────────┐
                      │        Full Automated Test Gates       │
                      │          ./scripts/test_all.sh         │
                      └──────────────────┬─────────────────────┘
                                         │
                 ┌───────────────────────┴───────────────────────┐
                 │                                               │
    ┌────────────▼─────────────┐                   ┌─────────────▼─────────────┐
    │       BACKEND TESTS      │                   │       FRONTEND TESTS      │
    │      Pytest (9 tests)    │                   │      Vitest (6 tests)     │
    ├──────────────────────────┤                   ├───────────────────────────┤
    │ • Health Endpoint        │                   │ • Kelvin <-> Celsius      │
    │ • User Auth & JWT        │                   │ • Physical Power Math     │
    │ • Machine Registry CRUD  │                   │ • Temperature Delta Math  │
    │ • Real ML Inference      │                   │ • Currency Formatter      │
    │ • Out-of-Range Validation│                   │ • Strict TypeScript Check │
    │ • Tickets & Action Logs  │                   │ • Vite Production Build   │
    │ • Cost Simulator Engine  │                   └───────────────────────────┘
    │ • AI Copilot Assistant   │
    │ • Dashboard Summary KPI  │
    └──────────────────────────┘
```

## 2. Backend Automated Test Suite (`backend/tests/test_api.py`)

Run individually:
```bash
cd backend
source .venv/bin/activate
PYTHONPATH=. pytest tests -v
```

### Verified Test Cases:
1. `test_health_endpoints`: Asserts `/health` and `/api/v1/health` respond 200 with model loaded.
2. `test_auth_workflow`: Tests user registration, duplicate rejection, valid login, invalid password rejection, and token-based `/auth/me`.
3. `test_machine_asset_crud`: Tests asset creation, QR code generation, fetching, updating notes/criticality, listing, and decommissioning.
4. `test_ml_prediction_and_diagnostics`: Validates single ML prediction, physical power calculation, 5 fault mode probabilities, and feature contributions.
5. `test_invalid_prediction_inputs`: Confirms Pydantic rejects invalid temperatures outside physical industrial bounds (HTTP 422).
6. `test_maintenance_tickets`: Tests work order creation, linking to machine asset, updating status to `In Progress`, and filtering.
7. `test_cost_simulator`: Validates economic calculations for planned preventive maintenance vs emergency reactive failure.
8. `test_copilot_assistant`: Verifies physics-aware chatbot responses for fault codes and technician checklist requests.
9. `test_dashboard_summary`: Validates KPI aggregation, critical asset counts, and active alert counters.

## 3. Frontend Automated Test Suite (`frontend/src/tests/App.test.tsx`)

Run individually:
```bash
cd frontend
npm run test
```

### Verified Test Cases:
1. Exact Kelvin to Celsius conversion ($0^\circ\text{C} = 273.15\text{ K}$, $25^\circ\text{C} = 298.15\text{ K}$).
2. Exact Celsius to Kelvin conversion.
3. Spindle mechanical power calculation: $\text{Power} = \frac{\tau \times 2\pi \times \text{RPM}}{60}$.
4. Process minus air temperature delta calculations ($\Delta T$).
5. Currency and wattage formatting utilities.

## 4. Full Quality Gate Verification Command
```bash
# macOS / Linux
./scripts/test_all.sh

# Windows
.\scripts\test_all.ps1
```
Result: **4/4 Quality Gates Passed.**
