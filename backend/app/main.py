"""MachineMind 360 - Backend Application Entrypoint
Explainable AI Factory Health and Maintenance Intelligence
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.api.v1.router import api_v1_router
from app.core.config import settings
from app.db.seed import seed_database
from app.ml.inference import model_engine


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure tables exist and seed default accounts/data
    try:
        seed_database()
    except Exception as e:
        print(f"Startup warning during seeding: {e}")

    # Ensure ML artifacts loaded
    try:
        model_engine.load_artifacts()
    except Exception as e:
        print(f"Warning: Could not pre-load ML artifacts: {e}")

    yield

    # Shutdown
    pass


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Explainable AI Factory Health and Maintenance Intelligence API",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if settings.DEBUG else settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API v1
app.include_router(api_v1_router, prefix=settings.API_V1_STR)


@app.get("/")
def root():
    return {
        "app": settings.PROJECT_NAME,
        "tagline": "From Machine Data to Smarter Maintenance Decisions.",
        "version": settings.VERSION,
        "documentation": "/docs",
        "health": "/api/v1/health",
    }


@app.get("/health")
def root_health():
    return {"status": "ok", "app": settings.PROJECT_NAME}


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal Server Error: {str(exc)}"},
    )
