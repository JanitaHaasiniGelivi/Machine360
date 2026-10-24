"""ML Prediction & Batch Inference API
Handles single inference, CSV file upload batch inference, and model evaluation metrics.
"""

import io
from typing import List, Optional
import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query, status
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user_optional, require_production_writer
from app.ml.inference import model_engine
from app.models.entities import PredictionResult, FactoryAsset, AuditEvent, User
from app.schemas.schemas import (
    PredictionInput,
    PredictionResponse,
    BatchPredictionResponse,
)

router = APIRouter(prefix="", tags=["ML Prediction & Diagnostics"])


@router.post("/predict", response_model=PredictionResponse)
def run_prediction(
    input_data: PredictionInput,
    save_to_db: bool = Query(True, description="Whether to persist prediction record to database"),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    if save_to_db:
        require_production_writer(current_user)

    # Validate asset if specified
    if input_data.asset_id:
        asset = db.query(FactoryAsset).filter(FactoryAsset.id == input_data.asset_id).first()
        if not asset:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Asset with ID {input_data.asset_id} not found.",
            )

    # Run inference
    result = model_engine.predict_single(
        quality_type=input_data.quality_type,
        air_temp_k=input_data.air_temperature_k,
        proc_temp_k=input_data.process_temperature_k,
        rpm=input_data.rotational_speed_rpm,
        torque_nm=input_data.torque_nm,
        tool_wear_min=input_data.tool_wear_min,
    )

    saved_id = None
    if save_to_db:
        # Convert fault_probabilities and feature_contributions to JSON-serializable dictionaries
        faults_json = {
            k: v if isinstance(v, dict) else v.model_dump()
            for k, v in result["fault_probabilities"].items()
        }
        contribs_json = [
            c if isinstance(c, dict) else c.model_dump()
            for c in result["feature_contributions"]
        ]

        db_pred = PredictionResult(
            asset_id=input_data.asset_id,
            quality_type=input_data.quality_type,
            air_temperature_k=input_data.air_temperature_k,
            process_temperature_k=input_data.process_temperature_k,
            rotational_speed_rpm=input_data.rotational_speed_rpm,
            torque_nm=input_data.torque_nm,
            tool_wear_min=input_data.tool_wear_min,
            machine_failure_prediction=result["machine_failure_prediction"],
            failure_probability=result["failure_probability"],
            threshold_used=result["threshold_used"],
            derived_power_watts=result["derived_power_watts"],
            derived_temp_diff_k=result["derived_temp_diff_k"],
            fault_probabilities=faults_json,
            feature_contributions=contribs_json,
            model_version=result["model_version"],
            notes=input_data.notes,
        )
        db.add(db_pred)
        db.commit()
        db.refresh(db_pred)
        saved_id = db_pred.id
        result["created_at"] = db_pred.created_at

    result["id"] = saved_id
    return result


@router.post("/predict/batch", response_model=BatchPredictionResponse)
async def run_batch_prediction(
    file: UploadFile = File(..., description="CSV file with AI4I sensor columns"),
):
    if not (file.filename or "").lower().endswith(".csv"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file must be a CSV format document.",
        )

    # Read contents with upload size safety (limit to 10MB)
    contents = await file.read(10 * 1024 * 1024 + 1)
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="File size exceeds maximum permitted 10MB limit.",
        )

    try:
        df = pd.read_csv(io.BytesIO(contents), encoding="utf-8-sig")
        df.columns = [c.strip() for c in df.columns]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unable to parse CSV document: {str(e)}",
        )

    if df.empty:
        raise HTTPException(status_code=422, detail="CSV must contain at least one data row")
    if df.columns.duplicated().any() or any('.' in str(c) and str(c).rsplit('.', 1)[-1].isdigit() and str(c).rsplit('.', 1)[0] in df.columns for c in df.columns):
        raise HTTPException(status_code=422, detail="CSV column names must be unique")

    # Row count limit
    if len(df) > 10000:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Batch prediction maximum row limit is 10,000 rows.",
        )

    # Apply the same sensor limits as single inference before calling sklearn.
    columns = {
        "Type": "quality_type", "Air temperature [K]": "air_temperature_k",
        "Process temperature [K]": "process_temperature_k",
        "Rotational speed [rpm]": "rotational_speed_rpm", "Torque [Nm]": "torque_nm",
        "Tool wear [min]": "tool_wear_min",
    }
    missing = [c for c in columns if c not in df.columns]
    if missing:
        raise HTTPException(status_code=422, detail=f"Missing predictor columns: {missing}")
    import math
    for index, row in enumerate(df.to_dict(orient="records"), start=1):
        try:
            validated = PredictionInput.model_validate({dest: row[src] for src, dest in columns.items()})
            if not all(math.isfinite(getattr(validated, key)) for key in columns.values() if key != "quality_type"):
                raise ValueError("non-finite sensor reading")
        except (ValueError, TypeError):
            raise HTTPException(status_code=422, detail=f"Invalid sensor values in CSV data row {index}")

    try:
        batch_result = model_engine.predict_batch(df)
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(ve),
        )

    return batch_result


@router.get("/models/metrics")
def get_model_evaluation_metrics():
    """Returns genuine held-out evaluation metrics and training configuration."""
    if not model_engine.metadata:
        model_engine.load_artifacts()
    return model_engine.metadata


@router.get("/predictions", response_model=List[PredictionResponse])
def list_predictions(
    limit: int = Query(50, le=200),
    asset_id: Optional[int] = None,
    failure_only: bool = False,
    db: Session = Depends(get_db),
):
    query = db.query(PredictionResult)
    if asset_id:
        query = query.filter(PredictionResult.asset_id == asset_id)
    if failure_only:
        query = query.filter(PredictionResult.machine_failure_prediction == True)

    records = query.order_by(PredictionResult.id.desc()).limit(limit).all()

    formatted = []
    for r in records:
        risk = "CRITICAL" if r.failure_probability >= 0.70 else ("ELEVATED" if r.machine_failure_prediction else "LOW")
        formatted.append(
            {
                "id": r.id,
                "machine_failure_prediction": r.machine_failure_prediction,
                "failure_probability": r.failure_probability,
                "threshold_used": r.threshold_used,
                "risk_level": risk,
                "model_version": r.model_version,
                "derived_power_watts": r.derived_power_watts,
                "derived_temp_diff_k": r.derived_temp_diff_k,
                "fault_probabilities": r.fault_probabilities or {},
                "feature_contributions": r.feature_contributions or [],
                "checklist": [],
                "input_readings": {
                    "quality_type": r.quality_type,
                    "air_temperature_k": r.air_temperature_k,
                    "process_temperature_k": r.process_temperature_k,
                    "rotational_speed_rpm": r.rotational_speed_rpm,
                    "torque_nm": r.torque_nm,
                    "tool_wear_min": r.tool_wear_min,
                },
                "created_at": r.created_at,
            }
        )
    return formatted
