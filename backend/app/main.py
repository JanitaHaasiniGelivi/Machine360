"""MachineMind 360 - Backend Application Entrypoint
Explainable AI Factory Health and Maintenance Intelligence
"""

from contextlib import asynccontextmanager
import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.api.v1.router import api_v1_router
from app.core.config import settings
from app.db.seed import seed_database
from app.ml.inference import model_engine, ModelUnavailableError


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Demo accounts and fixtures must be explicitly enabled for local development.
    if settings.SEED_DEMO_DATA:
        seed_database()

    # Ensure ML artifacts loaded
    try:
        model_engine.load_artifacts()
    except Exception as e:
        logging.getLogger(__name__).warning("ML preload failed: %s", type(e).__name__)

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
    allow_origins=settings.CORS_ORIGINS,
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


@app.exception_handler(ModelUnavailableError)
async def model_unavailable_handler(request: Request, exc: ModelUnavailableError):
    return JSONResponse(status_code=503, content={"detail": "Prediction models are unavailable. Contact the administrator."})


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
    )
