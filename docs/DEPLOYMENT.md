# MachineMind 360 — Production Deployment Architecture

This document provides deployment blueprints for deploying **MachineMind 360** independently across **Vercel** (Frontend) and **Render** (Backend & Managed PostgreSQL).

---

## 1. Deployment Overview

```
 [User Browser]
       │
       ▼
 [Vercel CDN Edge] ─── HTTPS ───▶ [Render Backend API] ─── TLS ───▶ [Render Managed PostgreSQL]
 (React 18 SPA)                   (FastAPI + ML Core)               (Alembic Migrated DB)
```

---

## 2. Frontend Deployment (Vercel)

### Step 1: Connect Repository
1. Log in to [Vercel](https://vercel.com).
2. Click **Add New Project** and select your GitHub repository.
3. Configure the **Root Directory** as: `frontend`.

### Step 2: Build & Output Settings
- **Framework Preset:** Vite
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm ci`

### Step 3: Environment Variables
Add the following variable in Vercel project settings:
```ini
VITE_API_BASE_URL=https://your-backend-api-name.onrender.com/api/v1
```

### Step 4: SPA Routing
`frontend/vercel.json` is pre-configured with URL rewrites to route all traffic to `/index.html`:
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

---

## 3. Backend Deployment (Render)

### Step 1: Managed PostgreSQL Database
1. In Render Dashboard, click **New +** → **PostgreSQL**.
2. Name: `machinemind360-db`
3. Database: `machinemind360`
4. User: `machinemind_admin`
5. Copy the **Internal Database URL** for services in the same region, or **External Connection String**.

### Step 2: Web Service Configuration
1. Click **New +** → **Web Service**.
2. Select your repository.
3. Set **Root Directory** to repository root or `backend`.
4. **Environment:** Python 3.
5. **Region:** Same as your PostgreSQL database.
6. **Build Command:**
   ```bash
   cd backend && pip install -r requirements.txt && python ../ml/scripts/train.py
   ```
7. **Start Command:**
   ```bash
   cd backend && alembic upgrade head && python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT
   ```

### Step 3: Environment Variables
Configure the following in the Render Dashboard:

| Variable | Recommended Production Value | Purpose |
|---|---|---|
| `DATABASE_URL` | `postgresql://user:pass@host/db` | PostgreSQL connection string |
| `SECRET_KEY` | *(Generate a 64-char random hex key)* | JWT secret token encryption |
| `ENVIRONMENT` | `production` | Enforces production mode |
| `DEBUG` | `false` | Disables FastAPI debug mode |
| `CORS_ORIGINS` | `https://your-frontend.vercel.app` | Restricts API cross-origin requests |
| `ML_ARTIFACTS_DIR` | `/opt/render/project/src/ml/artifacts` | Path to persisted ML model pipeline |

---

## 4. Post-Deployment Verification Checklist

1. **Health Check:**
   Visit `https://your-backend-api-name.onrender.com/api/v1/health`. Ensure `"status": "healthy"` and `"model_loaded": true`.
2. **API Documentation:**
   Open `https://your-backend-api-name.onrender.com/docs`.
3. **Frontend Connection:**
   Open `https://your-frontend.vercel.app`. Verify that the dashboard displays live metrics and that the active telemetry pill indicates "LIVE TELEMETRY ACTIVE".
4. **Authentication:**
   Log in with `admin@machinemind360.com` / `AdminPassword123!`.
5. **Run Prediction:**
   Go to AI Prediction, select a preset, and execute inference. Confirm model returns failure probability, power calculation, and checklist.
6. **Database Persistence:**
   Create a maintenance ticket, refresh the browser page, and confirm ticket persists.
