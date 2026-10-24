"""Pydantic Schemas for MachineMind 360 API Contract
Versioned, validated, and aligned with TypeScript types.
"""

from datetime import datetime
from typing import Dict, List, Literal, Optional, Any
from pydantic import BaseModel, Field, EmailStr, ConfigDict


# --- AUTH SCHEMAS ---
class UserBase(BaseModel):
    email: str = Field(..., pattern=r"^[^@]+@[^@]+\.[^@]+$")
    full_name: str
    role: Literal["admin", "technician", "viewer"] = "viewer"


class UserCreate(UserBase):
    password: str = Field(..., min_length=6)


class UserLogin(BaseModel):
    email: str = Field(..., pattern=r"^[^@]+@[^@]+\.[^@]+$")
    password: str


class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class TokenPayload(BaseModel):
    sub: Optional[str] = None
    role: Optional[str] = None
    exp: Optional[int] = None


# --- ASSET SCHEMAS ---
class AssetBase(BaseModel):
    asset_id: str = Field(..., description="Unique factory equipment tag e.g. MAC-101")
    name: str = Field(..., min_length=2)
    description: Optional[str] = None
    manufacturer: str = "Industrial Heavy Machining Inc."
    model: str = "VMC-5000X"
    department: str = "CNC Milling & Fabrication"
    installation_date: str = "2022-01-15"
    criticality: Literal["low", "medium", "high", "critical"] = "medium"
    assigned_technician: Optional[str] = None
    notes: Optional[str] = None


class AssetCreate(AssetBase):
    pass


class AssetUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    manufacturer: Optional[str] = None
    model: Optional[str] = None
    department: Optional[str] = None
    installation_date: Optional[str] = None
    criticality: Optional[Literal["low", "medium", "high", "critical"]] = None
    assigned_technician: Optional[str] = None
    notes: Optional[str] = None


class AssetResponse(AssetBase):
    id: int
    qr_code_data: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


# --- OBSERVATION SCHEMAS ---
class ObservationCreate(BaseModel):
    asset_id: int
    quality_type: Literal["L", "M", "H"] = "M"
    air_temperature_k: float = Field(..., ge=250.0, le=350.0)
    process_temperature_k: float = Field(..., ge=250.0, le=360.0)
    rotational_speed_rpm: float = Field(..., ge=500.0, le=4000.0)
    torque_nm: float = Field(..., ge=0.0, le=150.0)
    tool_wear_min: float = Field(..., ge=0.0, le=400.0)


class ObservationResponse(ObservationCreate):
    id: int
    observed_at: datetime
    model_config = ConfigDict(from_attributes=True)


# --- PREDICTION SCHEMAS ---
class PredictionInput(BaseModel):
    asset_id: Optional[int] = None
    quality_type: Literal["L", "M", "H"] = Field("M", description="AI4I Product Quality Variant (L: 50%, M: 30%, H: 20%)")
    air_temperature_k: float = Field(..., ge=270.0, le=330.0, description="Air temperature in Kelvin [K] (approx 295 - 305K)")
    process_temperature_k: float = Field(..., ge=270.0, le=340.0, description="Process temperature in Kelvin [K] (approx 305 - 315K)")
    rotational_speed_rpm: float = Field(..., ge=800.0, le=3500.0, description="Rotational speed in RPM (approx 1100 - 2900 RPM)")
    torque_nm: float = Field(..., ge=1.0, le=100.0, description="Torque in Newton-meters [Nm] (approx 3 - 80 Nm)")
    tool_wear_min: float = Field(..., ge=0.0, le=300.0, description="Tool wear time in minutes (0 - 260 min)")
    notes: Optional[str] = None


class FaultProbability(BaseModel):
    fault_code: str
    fault_name: str
    probability: float
    detected: bool
    risk_level: Literal["NORMAL", "ELEVATED", "CRITICAL"]
    description: str


class FeatureContribution(BaseModel):
    feature_name: str
    display_name: str
    value: float
    unit: str
    importance_pct: float
    contribution: Literal["risk_increasing", "normal", "protective"]
    explanation: str


class PredictionResponse(BaseModel):
    id: Optional[int] = None
    machine_failure_prediction: bool
    failure_probability: float
    threshold_used: float
    risk_level: Literal["LOW", "ELEVATED", "CRITICAL"]
    model_version: str
    derived_power_watts: float
    derived_temp_diff_k: float
    fault_probabilities: Dict[str, FaultProbability]
    feature_contributions: List[FeatureContribution]
    checklist: List[str]
    input_readings: Dict[str, Any]
    created_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)


class BatchPredictionRow(BaseModel):
    row_index: int
    quality_type: str
    air_temperature_k: float
    process_temperature_k: float
    rotational_speed_rpm: float
    torque_nm: float
    tool_wear_min: float
    prediction: bool
    probability: float
    risk_level: str
    predicted_faults: List[str]


class BatchPredictionResponse(BaseModel):
    total_processed: int
    total_failures: int
    failure_rate_pct: float
    fault_breakdown: Dict[str, int]
    rows: List[BatchPredictionRow]


# --- MAINTENANCE SCHEMAS ---
class TicketCreate(BaseModel):
    asset_id: int
    prediction_id: Optional[int] = None
    issue_summary: str = Field(..., min_length=5)
    priority: Literal["low", "medium", "high", "critical"] = "medium"
    assigned_technician: Optional[str] = None
    due_date: Optional[str] = None


class TicketUpdate(BaseModel):
    status: Optional[Literal["Open", "Assigned", "In Progress", "Completed", "Closed"]] = None
    priority: Optional[Literal["low", "medium", "high", "critical"]] = None
    assigned_technician: Optional[str] = None
    due_date: Optional[str] = None
    resolution_notes: Optional[str] = None
    actions_taken: Optional[str] = None


class TicketResponse(BaseModel):
    id: int
    ticket_number: str
    asset_id: int
    asset_name: Optional[str] = None
    prediction_id: Optional[int] = None
    issue_summary: str
    priority: str
    status: str
    assigned_technician: Optional[str] = None
    due_date: Optional[str] = None
    resolution_notes: Optional[str] = None
    actions_taken: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


class MaintenanceActionCreate(BaseModel):
    action_description: str
    performed_by: str


class MaintenanceActionResponse(BaseModel):
    id: int
    ticket_id: int
    action_description: str
    performed_by: str
    performed_at: datetime
    model_config = ConfigDict(from_attributes=True)


# --- COST SIMULATOR SCHEMAS ---
class CostSimulateRequest(BaseModel):
    name: str = "Standard Plant Scenario"
    inspection_cost: float = Field(250.0, ge=0.0)
    repair_cost: float = Field(1200.0, ge=0.0)
    spare_part_cost: float = Field(850.0, ge=0.0)
    labor_cost: float = Field(500.0, ge=0.0)
    downtime_hours: float = Field(8.0, ge=0.0)
    downtime_cost_per_hour: float = Field(1500.0, ge=0.0)


class CostSimulateResponse(BaseModel):
    scenario_name: str
    preventive_total_cost: float
    reactive_total_cost: float
    net_savings: float
    roi_percent: float
    cost_breakdown: Dict[str, Any]
    formula_summary: str


# --- AI COPILOT SCHEMAS ---
class CopilotMessage(BaseModel):
    role: Literal["user", "assistant", "system"]
    content: str


class CopilotChatRequest(BaseModel):
    message: str
    context_type: Optional[str] = "general"  # general, prediction, ticket, fault
    current_readings: Optional[Dict[str, Any]] = None
    recent_prediction: Optional[Dict[str, Any]] = None
    history: Optional[List[CopilotMessage]] = None


class CopilotChatResponse(BaseModel):
    reply: str
    checklist: List[str]
    technical_insights: List[str]
    recommended_actions: List[str]


# --- DASHBOARD & METRICS SCHEMAS ---
class DashboardSummary(BaseModel):
    total_assets: int
    critical_assets_count: int
    total_predictions: int
    recent_failure_rate_pct: float
    active_alerts: int
    open_tickets: int
    in_progress_tickets: int
    model_version: str
    model_roc_auc: float
    model_f1: float
    recent_predictions: List[Dict[str, Any]]
    fault_distribution: Dict[str, int]
    system_health: str
