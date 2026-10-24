# MachineMind 360 — Explainable AI Factory Health and Maintenance Intelligence

> **Tagline:** From Machine Data to Smarter Maintenance Decisions.

[![Python](https://img.shields.io/badge/Python-3.12+-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18.2+-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4+-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.1+-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4+-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![scikit-learn](https://img.shields.io/badge/scikit--learn-1.4+-F7931E?logo=scikitlearn&logoColor=white)](https://scikit-learn.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 1. Executive Summary

**MachineMind 360** is a full-stack, production-ready industrial predictive maintenance platform. It transforms raw factory sensor telemetry into explainable breakdown risk forecasts, physics-informed fault taxonomy diagnoses (TWF, HDF, PWF, OSF, RNF), interactive 2D digital twin visualizers, and database-backed maintenance work order workflows.

Trained deterministically on the **UCI AI4I 2020 Predictive Maintenance Dataset** (10,000 real operating observations), the champion Random Forest ML pipeline achieves **98.20% Accuracy**, **0.9620 ROC-AUC**, and **0.7097 F1 Score** on held-out test data with zero target leakage.

---

## 2. Platform Capabilities & Architecture

| Feature | Description | Complete Implementation Route |
|---|---|---|
| **Factory Health Dashboard** | Unified command center featuring KPI cards, active failure alerts, fault distribution histograms, and recent machine telemetry. | `/` |
| **Machine Asset Registry** | Full CRUD equipment registry with criticality ratings, QR inspection codes, department filters, and observation tracking. | `/machines` |
| **Real AI Prediction Engine** | Live inference on Type (L/M/H), Air & Process temperatures (Kelvin/Celsius toggles), Spindle Speed, Torque, and Tool Wear. | `/predict` |
| **Explainable Fault Diagnosis** | Root-cause analysis of the 5 AI4I failure modes (TWF, HDF, PWF, OSF, RNF) with physical boundary calculations and checklists. | `/diagnosis` |
| **2D Digital Machine Twin** | Interactive schematic of motor drive, rotating spindle bearings, tool insert wear, and thermal coolant jacket. | `/digital-twin` |
| **What-If Scenario Simulator** | Real-time debounced parameter sliders with side-by-side baseline vs simulated failure probability delta calculations. | `/simulator` |
| **CSV Telemetry Batch Audit** | Drag-and-drop CSV processor with sample template download, batch model inference, and results CSV export. | `/batch` |
| **Maintenance Work Orders** | Database-backed ticket lifecycle (Open → Assigned → In Progress → Completed → Closed) with technician action logging. | `/maintenance` |
| **Maintenance Cost Simulator** | Transparent financial model comparing planned preventive maintenance against catastrophic unplanned production outages. | `/cost-simulator` |
| **AI Maintenance Copilot** | Physics-guided industrial assistant for machine troubleshooting, sensor interpretation, and technician checklist generation. | `/copilot` |
| **ML Analytics & Performance** | Authentic evaluation metrics, confusion matrix (1920 TN, 12 FP, 24 FN, 44 TP), and feature importance ranking. | `/analytics` |
| **Factory Audit Reports** | Executive and technical PDF/printable plant audit report with verification sign-offs and CSV export. | `/reports` |
| **System Settings** | Tunable model decision cutoff threshold (0.5139), demo account switcher (Admin/Tech/Viewer), and runtime specs. | `/settings` |

---

## 3. Real Machine Learning Benchmark (AI4I 2020)

Evaluated on **2,000 held-out test observations** (80/20 stratified split, random_state=42):

```
Accuracy:                     98.20%
Precision:                    78.57%
Recall:                       64.71%
F1 Score:                     0.7097
ROC-AUC:                      0.9620
PR-AUC:                       0.7198
5-Fold CV ROC-AUC:            0.9706 ± 0.0104
Selected Decision Cutoff:     0.5139
```

### Held-Out Confusion Matrix
- **True Negative (TN):** 1,920 normal operations correctly classified
- **False Positive (FP):** 12 false alarms
- **False Negative (FN):** 24 missed failures
- **True Positive (TP):** 44 confirmed caught failures

### Derived Physics Calculations (Zero Invention)
- **Mechanical Spindle Power:** $\text{Power [W]} = \frac{\text{Torque [Nm]} \times 2\pi \times \text{RPM}}{60}$
- **Temperature Dissipation Delta:** $\Delta T = \text{Process Temp [K]} - \text{Air Temp [K]}$

---

## 4. Quickstart: Local Development

### Prerequisites
- Python 3.12+
- Node.js 18+ and npm 9+
- Git

### One-Command Setup & Launch

#### macOS / Linux
```bash
# 1. Setup environment, train ML model, run migrations, and seed DB
./scripts/setup_mac.sh

# 2. Launch both Backend (Port 8000) and Frontend (Port 5173)
./scripts/run_mac.sh
```

#### Windows (PowerShell)
```powershell
# 1. Setup environment, train ML model, run migrations, and seed DB
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process
.\scripts\setup_windows.ps1

# 2. Launch both Backend and Frontend
.\scripts\run_windows.ps1
```

Access the application in your browser at:
- **Frontend App:** `http://localhost:5173`
- **Backend API:** `http://127.0.0.1:8000`
- **Interactive Swagger Docs:** `http://127.0.0.1:8000/docs`

---

## 5. Seeded Demonstration Accounts

| Role | Email Address | Password | Privileges |
|---|---|---|---|
| **Admin** | `admin@machinemind360.com` | `AdminPassword123!` | Full CRUD, machine registry, ticket assignment |
| **Technician** | `technician@machinemind360.com` | `TechPassword123!` | AI prediction, ticket action logging, status updates |
| **Viewer** | `viewer@machinemind360.com` | `ViewerPassword123!` | Read-only analytics, digital twin, audit reports |

*(You can also switch demo roles directly from the **Settings** page with one click).*

---

## 6. Automated Quality Gates

Run the unified test runner:
```bash
# macOS / Linux
./scripts/test_all.sh

# Windows
.\scripts\test_all.ps1
```

All 4 quality gates run and pass:
1. **Backend Tests:** 9/9 Pytest tests pass (Health, Auth, Machine CRUD, Inference, Bounds Check, Tickets, Costs, Copilot, Summary).
2. **Frontend Tests:** 6/6 Vitest unit tests pass (Physics formulas, Conversions, Math).
3. **TypeScript Lint:** Strict `tsc --noEmit` check passes with 0 errors.
4. **Production Build:** Vite builds the minified client bundle with 0 errors.

---

## 7. Project Structure

```text
MachineMind-360/
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/layout/   # Navbar, Sidebar, Layout
│   │   ├── context/             # AuthContext, ThemeContext
│   │   ├── pages/               # 13 Complete Functional Pages
│   │   ├── services/            # Centralized API client (api.ts)
│   │   ├── tests/               # Vitest test suite
│   │   ├── types/               # TypeScript schema definitions
│   │   ├── utils/               # Physics formatters, cn
│   │   ├── App.tsx              # React Router v6 tree
│   │   └── main.tsx             # Application entrypoint
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── .env.example
│
├── backend/
│   ├── app/
│   │   ├── api/v1/              # Auth, Machines, Predictions, Tickets, Costs, Copilot
│   │   ├── core/                # Settings, Security (Bcrypt + JWT)
│   │   ├── db/                  # Session, Engine, Seed script
│   │   ├── ml/                  # ModelEngine inference & physics calculations
│   │   ├── models/              # SQLAlchemy 2.0 entities
│   │   ├── schemas/             # Pydantic v2 validation contracts
│   │   └── main.py              # FastAPI application entrypoint
│   ├── alembic/                 # Database migrations
│   ├── tests/                   # Pytest test suite (test_api.py)
│   ├── requirements.txt
│   └── alembic.ini
│
├── ml/
│   ├── data/                    # ai4i2020.csv (UCI Dataset)
│   ├── scripts/                 # train.py (Reproducible ML pipeline)
│   ├── artifacts/               # model_pipeline.joblib, metadata.json
│   └── reports/                 # evaluation_report.md, dataset_analysis.md
│
├── scripts/
│   ├── setup_mac.sh             # macOS / Linux automated installer
│   ├── run_mac.sh               # macOS / Linux concurrent launcher
│   ├── test_all.sh              # macOS / Linux test quality gates
│   ├── setup_windows.ps1        # Windows automated installer
│   ├── run_windows.ps1          # Windows launcher
│   └── test_all.ps1             # Windows test quality gates
│
├── docs/                        # Complete technical documentation
│   ├── ARCHITECTURE.md
│   ├── DATASET.md
│   ├── MODEL_EVALUATION.md
│   ├── LOCAL_SETUP.md
│   ├── DEPLOYMENT.md
│   ├── TESTING.md
│   └── DEMO_GUIDE.md
│
├── docker-compose.yml           # Multi-container orchestration (App + PG)
├── render.yaml                  # Render production configuration
├── .gitignore
├── .env.example
├── LICENSE                      # MIT License
└── README.md
```

---

## 8. License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
