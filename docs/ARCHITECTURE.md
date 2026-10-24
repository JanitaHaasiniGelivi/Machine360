# MachineMind 360 — System Architecture & Design Specification

## 1. System Overview

**MachineMind 360** is an enterprise-grade industrial predictive maintenance and factory intelligence platform. The system bridges physical machinery telemetry with explainable AI models to forecast impending equipment breakdowns, diagnose failure modes, and automate maintenance workflows.

```
┌─────────────────────────────────────────────────────────────┐
│                       PRESENTATION LAYER                    │
│      React 18 + TypeScript + Vite + Tailwind CSS + Recharts │
│                                                             │
│   • Dashboard         • Machine Registry  • AI Prediction   │
│   • Fault Diagnosis   • 2D Digital Twin   • What-If Engine  │
│   • Batch CSV Audit   • Work Orders       • Cost Simulator  │
│   • AI Copilot        • ML Analytics      • Audit Reports   │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTPS / JSON API v1
┌──────────────────────────────▼──────────────────────────────┐
│                        API & BUSINESS LAYER                 │
│               FastAPI (Python 3.12+) + Pydantic v2          │
│                                                             │
│   • /api/v1/predict      • /api/v1/predict/batch            │
│   • /api/v1/machines     • /api/v1/maintenance/tickets      │
│   • /api/v1/costs        • /api/v1/copilot/chat             │
│   • /api/v1/auth         • /api/v1/models/metrics           │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
┌──────────────▼──────────────┐┌──────────────▼───────────────┐
│     DATA & PERSISTENCE      ││     MACHINE LEARNING CORE    │
│  SQLAlchemy 2.0 + Alembic   ││  scikit-learn + Random Forest│
│                             ││                              │
│ • Factory Assets            ││ • Pipeline Preprocessor      │
│ • Machine Observations      ││ • Champion RF Binary Model   │
│ • Prediction History        ││ • 5 Fault Mode Classifiers   │
│ • Maintenance Tickets       ││ • Physics Features Engine    │
│ • Cost Scenarios            ││ • Feature Contributions / XAI│
│ • SQLite (Dev) / PG (Prod)  ││ • 98.2% Accuracy / 0.962 AUC │
└─────────────────────────────┘└──────────────────────────────┘
```

## 2. Component Design

### 2.1 Frontend Architecture
- **Framework:** React 18, TypeScript (strict mode enabled), Vite 5.
- **Styling:** Tailwind CSS with the "Modern Industrial Command Center" dark/light palette.
- **State & Server Cache:** TanStack React Query v5 for asynchronous backend queries.
- **Forms & Validation:** Zod schema validation and React Hook Form.
- **Charts & Visualizations:** Recharts for telemetry histograms, confusion matrix, and feature importances. Custom SVG rendering for the 2D digital machine twin.
- **Client API:** Centralized `ApiClient` class (`services/api.ts`) managing authentication headers, error handling, and proxying.

### 2.2 Backend Architecture
- **Runtime:** Python 3.12+ with FastAPI.
- **API Versioning:** All domain routes grouped under `/api/v1/`.
- **Validation:** Pydantic v2 schemas providing type safety and serialization contracts identical to TypeScript interfaces.
- **Authentication & RBAC:** Direct bcrypt password hashing and HMAC-SHA256 JWT tokens. Enforces role-based permissions (`admin`, `technician`, `viewer`).

### 2.3 Machine Learning & Explainable Physics Core
- **Trained Model:** Random Forest Classifier trained deterministically on the UCI AI4I 2020 dataset.
- **No Target Leakage:** Identifier columns (`UDI`, `Product ID`) and fault targets (`TWF`, `HDF`, `PWF`, `OSF`, `RNF`) are strictly excluded from binary model predictor inputs.
- **Physics Calculations:**
  - Derived Mechanical Spindle Power: $\text{Power [W]} = \frac{\text{Torque [Nm]} \times 2\pi \times \text{RPM}}{60}$
  - Temperature Dissipation Delta: $\Delta T = \text{Process Temperature [K]} - \text{Air Temperature [K]}$
- **Explainability:** Tree feature importance attribution combined with standardized z-score deviation metrics and automated technician inspection checklists.

### 2.4 Database Architecture
- **ORM:** SQLAlchemy 2.0 with Declarative Base mapping.
- **Engines:** Unified schema supporting SQLite locally and PostgreSQL in production.
- **Migration Strategy:** Alembic version tracking with automated DDL migration generation.
