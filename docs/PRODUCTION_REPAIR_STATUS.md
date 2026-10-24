# Production repair status

Changes are prepared on fix/production-deployment and have not been deployed.

## Verified production failure

The public dashboard renders but displays Failed to fetch. Its backend dashboard summary returned sqlite3.OperationalError: unable to open database file. The root /health returned ok despite this failure. Vercel backend environment metadata has no DATABASE_URL; the team has no installed database integration.

## Prepared changes

- Packaged backend/artifacts resolved relative to Python source, with a backend/main.py entry point.
- Model loading deferred until startup/request; missing or corrupt artifacts return HTTP 503 without crashing module import.
- JSON and comma-separated CORS configuration supported before settings decoding.
- Readiness checks database connectivity, users table, and trained artifacts.
- Production rejects SQLite, default JWT secrets, and demo seeding.
- PostgreSQL driver added, sklearn pinned to 1.9.1 found in the committed trained artifact.
- Public registration cannot self-assign admin or technician. Production machine and maintenance mutations require staff authentication; anonymous predictions do not persist by default.
- Frontend normalizes API base URLs and preserves response body when JSON error parsing fails.
- Vitest excludes Playwright suites; Playwright accepts PLAYWRIGHT_BASE_URL.
- Alembic escapes percent signs in URLs.

## Validation

Backend: 27 passed, 0 failed. Frontend unit tests: 6 passed. Production frontend build passes. Alembic initial migration passes against isolated SQLite. PostgreSQL migration and live persistence remain unverified until a hosted database is provisioned. Playwright Chromium download returned an invalid ZIP, preventing local browser execution. Existing E2E mutation tests contain localhost URLs and demo credentials; they must not be treated as production tests.

## Required before release

1. Grant the GitHub connection write access to JanitaHaasiniGelivi/Machine360 so the prepared branch and review PR can be published.
2. Provision a free Neon Postgres database in the existing backend project using Vercel Marketplace, accepting provider terms through the account owner. Set DATABASE_URL to the provider connection string without exposing it in chat or Git.
3. Verify SECRET_KEY is unique and at least 32 characters. Configure ENVIRONMENT=production, DEBUG=false, SEED_DEMO_DATA=false, ML_ARTIFACTS_DIR=artifacts, CORS_ORIGINS=https://machine360.vercel.app. Frontend VITE_API_BASE_URL must be https://machine360-jnue.vercel.app/api/v1.
4. Run alembic upgrade head against the hosted database once; do not run demo seeding or replace existing data. Provision an authorized staff account and add a browser sign-in flow (the existing navbar only supports session display/sign-out).
5. Stage corrected backend and frontend builds on their existing projects. Verify actual prediction, auth, dashboard, machine CRUD, maintenance, batch, and persistence flows before promotion.

Vercel projects: machine360 (prj_scZDRuDT3OUIkZ7Fk6qlZBsMQAgV), machine360-jnue (prj_JwFFMunrTcDobdwW2UbwfRXnB7Qs). Team: team_HbR2iu2HehSIY1yARYoSeBSv.
