"""Factory Asset and Machine Management API
Supports machine CRUD, QR code metadata, observation records, and history.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.api.deps import get_db, require_role, get_current_user_optional
from app.models.entities import FactoryAsset, MachineObservation, AuditEvent, User
from app.schemas.schemas import (
    AssetCreate,
    AssetResponse,
    AssetUpdate,
    ObservationCreate,
    ObservationResponse,
)

router = APIRouter(prefix="", tags=["Machine Registry"])


def generate_asset_qr_data(asset_id: str, name: str) -> str:
    """Encodes standard industrial asset inspection payload."""
    return f"MACHINEMIND360://ASSET/{asset_id}?name={name}"


@router.get("/machines", response_model=List[AssetResponse])
def list_machines(
    department: Optional[str] = None,
    criticality: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(FactoryAsset)
    if department:
        query = query.filter(FactoryAsset.department == department)
    if criticality:
        query = query.filter(FactoryAsset.criticality == criticality)
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            (FactoryAsset.name.ilike(search_filter))
            | (FactoryAsset.asset_id.ilike(search_filter))
            | (FactoryAsset.manufacturer.ilike(search_filter))
            | (FactoryAsset.model.ilike(search_filter))
        )
    return query.order_by(FactoryAsset.id.desc()).all()


@router.post("/machines", response_model=AssetResponse, status_code=status.HTTP_201_CREATED)
def create_machine(
    asset_in: AssetCreate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    existing = db.query(FactoryAsset).filter(FactoryAsset.asset_id == asset_in.asset_id).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"An asset with tag ID '{asset_in.asset_id}' already exists in registry.",
        )

    qr_data = generate_asset_qr_data(asset_in.asset_id, asset_in.name)
    asset = FactoryAsset(
        asset_id=asset_in.asset_id,
        name=asset_in.name,
        description=asset_in.description,
        manufacturer=asset_in.manufacturer,
        model=asset_in.model,
        department=asset_in.department,
        installation_date=asset_in.installation_date,
        criticality=asset_in.criticality,
        assigned_technician=asset_in.assigned_technician,
        notes=asset_in.notes,
        qr_code_data=qr_data,
    )
    db.add(asset)
    db.commit()
    db.refresh(asset)

    audit = AuditEvent(
        action="CREATE_ASSET",
        entity_type="FactoryAsset",
        entity_id=asset.asset_id,
        user_email=current_user.email if current_user else "anonymous",
        details={"name": asset.name, "criticality": asset.criticality},
    )
    db.add(audit)
    db.commit()

    return asset


@router.get("/machines/{machine_id}", response_model=AssetResponse)
def get_machine(machine_id: int, db: Session = Depends(get_db)):
    asset = db.query(FactoryAsset).filter(FactoryAsset.id == machine_id).first()
    if not asset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Machine asset with ID {machine_id} not found.",
        )
    return asset


@router.patch("/machines/{machine_id}", response_model=AssetResponse)
def update_machine(
    machine_id: int,
    asset_update: AssetUpdate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    asset = db.query(FactoryAsset).filter(FactoryAsset.id == machine_id).first()
    if not asset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Machine asset with ID {machine_id} not found.",
        )

    update_data = asset_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(asset, field, value)

    db.commit()
    db.refresh(asset)

    audit = AuditEvent(
        action="UPDATE_ASSET",
        entity_type="FactoryAsset",
        entity_id=asset.asset_id,
        user_email=current_user.email if current_user else "anonymous",
        details=update_data,
    )
    db.add(audit)
    db.commit()

    return asset


@router.delete("/machines/{machine_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_machine(
    machine_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    asset = db.query(FactoryAsset).filter(FactoryAsset.id == machine_id).first()
    if not asset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Machine asset with ID {machine_id} not found.",
        )

    db.delete(asset)
    db.commit()

    audit = AuditEvent(
        action="DELETE_ASSET",
        entity_type="FactoryAsset",
        entity_id=str(machine_id),
        user_email=current_user.email if current_user else "anonymous",
        details={"machine_id": machine_id},
    )
    db.add(audit)
    db.commit()
    return None


@router.get("/machines/{machine_id}/observations", response_model=List[ObservationResponse])
def get_machine_observations(
    machine_id: int,
    limit: int = Query(50, le=200),
    db: Session = Depends(get_db),
):
    asset = db.query(FactoryAsset).filter(FactoryAsset.id == machine_id).first()
    if not asset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Machine asset with ID {machine_id} not found.",
        )

    observations = (
        db.query(MachineObservation)
        .filter(MachineObservation.asset_id == machine_id)
        .order_by(MachineObservation.id.desc())
        .limit(limit)
        .all()
    )
    return observations


@router.post("/observations", response_model=ObservationResponse, status_code=status.HTTP_201_CREATED)
def create_observation(
    obs_in: ObservationCreate,
    db: Session = Depends(get_db),
):
    asset = db.query(FactoryAsset).filter(FactoryAsset.id == obs_in.asset_id).first()
    if not asset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Asset with ID {obs_in.asset_id} does not exist.",
        )

    obs = MachineObservation(
        asset_id=obs_in.asset_id,
        quality_type=obs_in.quality_type,
        air_temperature_k=obs_in.air_temperature_k,
        process_temperature_k=obs_in.process_temperature_k,
        rotational_speed_rpm=obs_in.rotational_speed_rpm,
        torque_nm=obs_in.torque_nm,
        tool_wear_min=obs_in.tool_wear_min,
    )
    db.add(obs)
    db.commit()
    db.refresh(obs)
    return obs
