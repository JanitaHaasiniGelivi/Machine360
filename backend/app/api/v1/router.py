"""API v1 Router Aggregator
Combines Auth, Machine Registry, Prediction, Maintenance, Cost Simulator, Copilot, and Dashboard.
"""

from fastapi import APIRouter
from app.api.v1.auth import router as auth_router
from app.api.v1.machines import router as machines_router
from app.api.v1.predictions import router as predictions_router
from app.api.v1.maintenance import router as maintenance_router
from app.api.v1.costs import router as costs_router
from app.api.v1.copilot import router as copilot_router
from app.api.v1.dashboard import router as dashboard_router

api_v1_router = APIRouter()

api_v1_router.include_router(auth_router)
api_v1_router.include_router(machines_router)
api_v1_router.include_router(predictions_router)
api_v1_router.include_router(maintenance_router)
api_v1_router.include_router(costs_router)
api_v1_router.include_router(copilot_router)
api_v1_router.include_router(dashboard_router)
