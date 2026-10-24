"""SQLAlchemy Database Models for MachineMind 360
Covers all required entities with PostgreSQL and SQLite compatibility.
"""

from datetime import datetime, timezone
from typing import Optional, List
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    JSON,
    Index,
)
from sqlalchemy.orm import relationship, Mapped, mapped_column
from app.db.session import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(50), default="viewer", nullable=False)  # admin, technician, viewer
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)


class FactoryAsset(Base):
    __tablename__ = "factory_assets"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    asset_id: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)  # e.g., MAC-001
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    manufacturer: Mapped[str] = mapped_column(String(255), default="Industrial Heavy Machining Inc.")
    model: Mapped[str] = mapped_column(String(255), default="VMC-5000X")
    department: Mapped[str] = mapped_column(String(100), default="CNC Milling & Fabrication")
    installation_date: Mapped[str] = mapped_column(String(50), default="2022-01-15")
    criticality: Mapped[str] = mapped_column(String(50), default="medium")  # low, medium, high, critical
    assigned_technician: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    qr_code_data: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    # Relationships
    observations: Mapped[List["MachineObservation"]] = relationship(
        "MachineObservation", back_populates="asset", cascade="all, delete-orphan"
    )
    predictions: Mapped[List["PredictionResult"]] = relationship(
        "PredictionResult", back_populates="asset"
    )
    tickets: Mapped[List["MaintenanceTicket"]] = relationship(
        "MaintenanceTicket", back_populates="asset", cascade="all, delete-orphan"
    )


class MachineObservation(Base):
    __tablename__ = "machine_observations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    asset_id: Mapped[int] = mapped_column(Integer, ForeignKey("factory_assets.id", ondelete="CASCADE"), index=True)
    quality_type: Mapped[str] = mapped_column(String(10), default="M")  # L, M, H
    air_temperature_k: Mapped[float] = mapped_column(Float, nullable=False)
    process_temperature_k: Mapped[float] = mapped_column(Float, nullable=False)
    rotational_speed_rpm: Mapped[float] = mapped_column(Float, nullable=False)
    torque_nm: Mapped[float] = mapped_column(Float, nullable=False)
    tool_wear_min: Mapped[float] = mapped_column(Float, nullable=False)
    observed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    asset: Mapped["FactoryAsset"] = relationship("FactoryAsset", back_populates="observations")


class PredictionResult(Base):
    __tablename__ = "prediction_results"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    asset_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("factory_assets.id", ondelete="SET NULL"), nullable=True, index=True)
    quality_type: Mapped[str] = mapped_column(String(10), default="M")
    air_temperature_k: Mapped[float] = mapped_column(Float, nullable=False)
    process_temperature_k: Mapped[float] = mapped_column(Float, nullable=False)
    rotational_speed_rpm: Mapped[float] = mapped_column(Float, nullable=False)
    torque_nm: Mapped[float] = mapped_column(Float, nullable=False)
    tool_wear_min: Mapped[float] = mapped_column(Float, nullable=False)
    
    # ML Outputs
    machine_failure_prediction: Mapped[bool] = mapped_column(Boolean, nullable=False)
    failure_probability: Mapped[float] = mapped_column(Float, nullable=False)
    threshold_used: Mapped[float] = mapped_column(Float, default=0.5)
    
    # Derived physical features
    derived_power_watts: Mapped[float] = mapped_column(Float, nullable=False)
    derived_temp_diff_k: Mapped[float] = mapped_column(Float, nullable=False)
    
    # Detailed diagnosis dictionaries
    fault_probabilities: Mapped[dict] = mapped_column(JSON, default=dict)
    feature_contributions: Mapped[dict] = mapped_column(JSON, default=dict)
    model_version: Mapped[str] = mapped_column(String(50), default="1.0.0")
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    asset: Mapped[Optional["FactoryAsset"]] = relationship("FactoryAsset", back_populates="predictions")
    tickets: Mapped[List["MaintenanceTicket"]] = relationship("MaintenanceTicket", back_populates="prediction")


class MaintenanceTicket(Base):
    __tablename__ = "maintenance_tickets"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    ticket_number: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    asset_id: Mapped[int] = mapped_column(Integer, ForeignKey("factory_assets.id", ondelete="CASCADE"), index=True)
    prediction_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("prediction_results.id", ondelete="SET NULL"), nullable=True)
    issue_summary: Mapped[str] = mapped_column(String(255), nullable=False)
    priority: Mapped[str] = mapped_column(String(50), default="medium")  # low, medium, high, critical
    status: Mapped[str] = mapped_column(String(50), default="Open")  # Open, Assigned, In Progress, Completed, Closed
    assigned_technician: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    due_date: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    resolution_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    actions_taken: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    asset: Mapped["FactoryAsset"] = relationship("FactoryAsset", back_populates="tickets")
    prediction: Mapped[Optional["PredictionResult"]] = relationship("PredictionResult", back_populates="tickets")
    actions: Mapped[List["MaintenanceAction"]] = relationship(
        "MaintenanceAction", back_populates="ticket", cascade="all, delete-orphan"
    )


class MaintenanceAction(Base):
    __tablename__ = "maintenance_actions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    ticket_id: Mapped[int] = mapped_column(Integer, ForeignKey("maintenance_tickets.id", ondelete="CASCADE"), index=True)
    action_description: Mapped[str] = mapped_column(Text, nullable=False)
    performed_by: Mapped[str] = mapped_column(String(255), nullable=False)
    performed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    ticket: Mapped["MaintenanceTicket"] = relationship("MaintenanceTicket", back_populates="actions")


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    severity: Mapped[str] = mapped_column(String(50), default="info")  # info, warning, critical
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class CostScenario(Base):
    __tablename__ = "cost_scenarios"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    inspection_cost: Mapped[float] = mapped_column(Float, default=250.0)
    repair_cost: Mapped[float] = mapped_column(Float, default=1200.0)
    spare_part_cost: Mapped[float] = mapped_column(Float, default=850.0)
    labor_cost: Mapped[float] = mapped_column(Float, default=500.0)
    downtime_hours: Mapped[float] = mapped_column(Float, default=8.0)
    downtime_cost_per_hour: Mapped[float] = mapped_column(Float, default=1500.0)
    total_preventive_cost: Mapped[float] = mapped_column(Float, default=0.0)
    total_reactive_cost: Mapped[float] = mapped_column(Float, default=0.0)
    net_savings: Mapped[float] = mapped_column(Float, default=0.0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class ModelVersion(Base):
    __tablename__ = "model_versions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    version_str: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    algorithm: Mapped[str] = mapped_column(String(100), nullable=False)
    accuracy: Mapped[float] = mapped_column(Float, nullable=False)
    f1_score: Mapped[float] = mapped_column(Float, nullable=False)
    roc_auc: Mapped[float] = mapped_column(Float, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    trained_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class AuditEvent(Base):
    __tablename__ = "audit_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    action: Mapped[str] = mapped_column(String(100), nullable=False)  # CREATE_ASSET, PREDICT, UPDATE_TICKET, etc.
    entity_type: Mapped[str] = mapped_column(String(100), nullable=False)
    entity_id: Mapped[str] = mapped_column(String(100), nullable=False)
    user_email: Mapped[str] = mapped_column(String(255), default="system")
    details: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
