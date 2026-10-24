"""MachineMind 360 ML Inference & Explainability Engine
Executes champion pipeline, computes derived physics features, calculates fault probabilities,
and generates explainable feature contributions and technician checklists.
"""

import json
import math
import os
from typing import Any, Dict, List, Tuple
import joblib
import numpy as np
import pandas as pd
from app.core.config import settings

FAULT_DESCRIPTIONS = {
    "TWF": {
        "name": "Tool Wear Failure",
        "description": "Failure caused by tool blade/insert wear exceeding safe micro-fracture threshold (typically tool wear > 200-240 min).",
    },
    "HDF": {
        "name": "Heat Dissipation Failure",
        "description": "Failure caused by insufficient heat dissipation (process - air temp diff < 8.6 K combined with rotational speed < 1380 rpm).",
    },
    "PWF": {
        "name": "Power Failure",
        "description": "Failure caused by mechanical spindle power outside safe operating bounds (< 3500 W or > 9000 W).",
    },
    "OSF": {
        "name": "Overstrain Failure",
        "description": "Failure caused by excessive load product of tool wear and applied torque exceeding mechanical shear limits.",
    },
    "RNF": {
        "name": "Random Failure",
        "description": "Uncorrelated component failure occurring independently of standard operational parameters.",
    },
}

DATASET_MEANS = {
    "Air temperature [K]": 300.0,
    "Process temperature [K]": 310.0,
    "Rotational speed [rpm]": 1538.0,
    "Torque [Nm]": 40.0,
    "Tool wear [min]": 108.0,
}

DATASET_STDS = {
    "Air temperature [K]": 2.0,
    "Process temperature [K]": 1.48,
    "Rotational speed [rpm]": 179.0,
    "Torque [Nm]": 9.97,
    "Tool wear [min]": 63.6,
}


class ModelEngine:
    def __init__(self, artifacts_dir: str = settings.ML_ARTIFACTS_DIR):
        self.artifacts_dir = artifacts_dir
        self.pipeline = None
        self.fault_models = None
        self.metadata = None
        self.load_artifacts()

    def load_artifacts(self):
        pipeline_path = os.path.join(self.artifacts_dir, "model_pipeline.joblib")
        fault_path = os.path.join(self.artifacts_dir, "fault_models.joblib")
        metadata_path = os.path.join(self.artifacts_dir, "model_metadata.json")

        if not os.path.exists(pipeline_path) or not os.path.exists(metadata_path):
            raise FileNotFoundError(
                f"Model artifacts not found in {self.artifacts_dir}. Run ml/scripts/train.py first."
            )

        self.pipeline = joblib.load(pipeline_path)
        if os.path.exists(fault_path):
            self.fault_models = joblib.load(fault_path)
        else:
            self.fault_models = {}

        with open(metadata_path, "r") as f:
            self.metadata = json.load(f)

    def calculate_derived_physics(
        self, air_temp_k: float, proc_temp_k: float, rpm: float, torque_nm: float
    ) -> Tuple[float, float]:
        """Calculates derived mechanical power (Watts) and temperature difference (K).
        Power = Torque * 2 * pi * RPM / 60
        Temp Difference = Process Temp - Air Temp
        """
        power_watts = round((torque_nm * 2.0 * math.pi * rpm) / 60.0, 2)
        temp_diff_k = round(proc_temp_k - air_temp_k, 2)
        return power_watts, temp_diff_k

    def predict_single(
        self,
        quality_type: str,
        air_temp_k: float,
        proc_temp_k: float,
        rpm: float,
        torque_nm: float,
        tool_wear_min: float,
    ) -> Dict[str, Any]:
        """Performs full explainable prediction."""
        if self.pipeline is None:
            self.load_artifacts()

        # Build single-row DataFrame matching training feature names & order
        input_data = pd.DataFrame(
            [
                {
                    "Type": quality_type,
                    "Air temperature [K]": air_temp_k,
                    "Process temperature [K]": proc_temp_k,
                    "Rotational speed [rpm]": rpm,
                    "Torque [Nm]": torque_nm,
                    "Tool wear [min]": tool_wear_min,
                }
            ]
        )

        # Champion prediction
        probs = self.pipeline.predict_proba(input_data)[0]
        failure_prob = float(probs[1])
        threshold = float(self.metadata.get("decision_threshold", 0.5139))
        prediction = bool(failure_prob >= threshold)

        # Derived physics
        power_watts, temp_diff_k = self.calculate_derived_physics(
            air_temp_k, proc_temp_k, rpm, torque_nm
        )

        # Risk level determination
        if failure_prob >= 0.70:
            risk_level = "CRITICAL"
        elif failure_prob >= threshold:
            risk_level = "ELEVATED"
        else:
            risk_level = "LOW"

        # Fault-specific predictions
        fault_probabilities = {}
        for fault_code, desc in FAULT_DESCRIPTIONS.items():
            f_prob = 0.0
            if self.fault_models and fault_code in self.fault_models:
                try:
                    f_pipeline = self.fault_models[fault_code]
                    f_prob = float(f_pipeline.predict_proba(input_data)[0][1])
                except Exception:
                    f_prob = 0.0

            # Determine risk
            if f_prob > 0.60:
                f_risk = "CRITICAL"
            elif f_prob > 0.30:
                f_risk = "ELEVATED"
            else:
                f_risk = "NORMAL"

            fault_probabilities[fault_code] = {
                "fault_code": fault_code,
                "fault_name": desc["name"],
                "probability": round(f_prob, 4),
                "detected": bool(f_prob >= 0.5),
                "risk_level": f_risk,
                "description": desc["description"],
            }

        # Feature contributions (SHAP-inspired linear approximation based on RF weights & standardized deviation)
        feature_contributions = self._compute_feature_contributions(
            quality_type, air_temp_k, proc_temp_k, rpm, torque_nm, tool_wear_min, failure_prob
        )

        # Technician checklist tailored to physics and fault flags
        checklist = self._generate_technician_checklist(
            air_temp_k, proc_temp_k, rpm, torque_nm, tool_wear_min, power_watts, temp_diff_k, fault_probabilities
        )

        return {
            "machine_failure_prediction": prediction,
            "failure_probability": round(failure_prob, 4),
            "threshold_used": round(threshold, 4),
            "risk_level": risk_level,
            "model_version": self.metadata.get("model_version", "1.0.0"),
            "derived_power_watts": power_watts,
            "derived_temp_diff_k": temp_diff_k,
            "fault_probabilities": fault_probabilities,
            "feature_contributions": feature_contributions,
            "checklist": checklist,
            "input_readings": {
                "quality_type": quality_type,
                "air_temperature_k": air_temp_k,
                "process_temperature_k": proc_temp_k,
                "rotational_speed_rpm": rpm,
                "torque_nm": torque_nm,
                "tool_wear_min": tool_wear_min,
            },
        }

    def _compute_feature_contributions(
        self,
        quality_type: str,
        air_temp_k: float,
        proc_temp_k: float,
        rpm: float,
        torque_nm: float,
        tool_wear_min: float,
        failure_prob: float,
    ) -> List[Dict[str, Any]]:
        importances = self.metadata.get("feature_importances", {})
        inputs = {
            "Torque [Nm]": (torque_nm, "Torque", "Nm"),
            "Rotational speed [rpm]": (rpm, "Rotational Speed", "rpm"),
            "Tool wear [min]": (tool_wear_min, "Tool Wear Time", "min"),
            "Process temperature [K]": (proc_temp_k, "Process Temperature", "K"),
            "Air temperature [K]": (air_temp_k, "Air Temperature", "K"),
        }

        contributions = []
        for feat_key, (val, display, unit) in inputs.items():
            mean = DATASET_MEANS.get(feat_key, 0.0)
            std = DATASET_STDS.get(feat_key, 1.0)
            z_score = (val - mean) / std
            imp = importances.get(feat_key, 0.15)

            # Determine contribution direction
            if abs(z_score) > 1.8:
                contrib_type = "risk_increasing"
                explanation = f"Value is {abs(z_score):.1f} std devs away from operational norm ({mean:.1f} {unit}), elevating strain."
            elif abs(z_score) > 1.0:
                contrib_type = "normal" if failure_prob < 0.4 else "risk_increasing"
                explanation = f"Moderate deviation from baseline ({mean:.1f} {unit})."
            else:
                contrib_type = "protective"
                explanation = f"Well within normal industrial baseline range (near {mean:.1f} {unit})."

            contributions.append(
                {
                    "feature_name": feat_key,
                    "display_name": display,
                    "value": round(val, 2),
                    "unit": unit,
                    "importance_pct": round(imp * 100, 1),
                    "contribution": contrib_type,
                    "explanation": explanation,
                }
            )

        # Sort by importance
        contributions.sort(key=lambda x: x["importance_pct"], reverse=True)
        return contributions

    def _generate_technician_checklist(
        self,
        air_temp: float,
        proc_temp: float,
        rpm: float,
        torque: float,
        tool_wear: float,
        power: float,
        temp_diff: float,
        fault_probs: Dict[str, Any],
    ) -> List[str]:
        checks = []

        if tool_wear >= 200:
            checks.append("[CRITICAL] Tool wear is at or exceeds 200 minutes. Inspect cutting inserts for micro-chipping and replace cutter head immediately.")
        elif tool_wear >= 150:
            checks.append("[WARNING] Tool wear exceeds 150 minutes. Schedule tool re-grinding or replacement during upcoming shift change.")

        if temp_diff < 8.6 and rpm < 1380:
            checks.append("[CRITICAL] Process/Air temperature delta is below 8.6 K with low spindle RPM. High risk of Heat Dissipation Failure (HDF). Flush cooling lines and verify coolant pump pressure.")

        if power < 3500:
            checks.append("[WARNING] Mechanical power output is below 3500 W. Inspect spindle drive motor for low torque delivery or electrical supply sag.")
        elif power > 9000:
            checks.append("[CRITICAL] Mechanical power exceeds 9000 W. Extreme spindle drive overload detected. Reduce feed rate and depth of cut immediately.")

        if torque > 60.0:
            checks.append("[WARNING] High torque observed (> 60 Nm). Check workpiece hardness, lubrication delivery, and tool clearance angle.")

        if not checks:
            checks.append("[NORMAL] All readings are within standard baseline tolerances. Proceed with standard preventive shift inspection.")
            checks.append("[INFO] Verify lubrication reservoir level and air filter cleanliness.")

        return checks

    def predict_batch(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Performs batch prediction on a pandas DataFrame."""
        if self.pipeline is None:
            self.load_artifacts()

        # Validate columns
        required_cols = [
            "Type",
            "Air temperature [K]",
            "Process temperature [K]",
            "Rotational speed [rpm]",
            "Torque [Nm]",
            "Tool wear [min]",
        ]
        missing = [c for c in required_cols if c not in df.columns]
        if missing:
            raise ValueError(f"Batch CSV missing required predictor columns: {missing}")

        X = df[required_cols].copy()
        probs = self.pipeline.predict_proba(X)[:, 1]
        threshold = float(self.metadata.get("decision_threshold", 0.5139))
        preds = (probs >= threshold).astype(bool)

        rows = []
        fault_counts = {"TWF": 0, "HDF": 0, "PWF": 0, "OSF": 0, "RNF": 0}

        for idx, (p, prob, (_, r)) in enumerate(zip(preds, probs, X.iterrows())):
            predicted_faults = []
            # Check fault conditions
            for fault_code, model in self.fault_models.items():
                try:
                    f_prob = float(model.predict_proba(pd.DataFrame([r]))[0][1])
                    if f_prob >= 0.5:
                        predicted_faults.append(fault_code)
                        fault_counts[fault_code] += 1
                except Exception:
                    pass

            risk = "CRITICAL" if prob >= 0.7 else ("ELEVATED" if p else "LOW")
            rows.append(
                {
                    "row_index": idx + 1,
                    "quality_type": str(r["Type"]),
                    "air_temperature_k": float(r["Air temperature [K]"]),
                    "process_temperature_k": float(r["Process temperature [K]"]),
                    "rotational_speed_rpm": float(r["Rotational speed [rpm]"]),
                    "torque_nm": float(r["Torque [Nm]"]),
                    "tool_wear_min": float(r["Tool wear [min]"]),
                    "prediction": bool(p),
                    "probability": round(float(prob), 4),
                    "risk_level": risk,
                    "predicted_faults": predicted_faults,
                }
            )

        total = len(rows)
        failures = sum(1 for r in rows if r["prediction"])
        failure_rate = round((failures / total) * 100, 2) if total > 0 else 0.0

        return {
            "total_processed": total,
            "total_failures": failures,
            "failure_rate_pct": failure_rate,
            "fault_breakdown": fault_counts,
            "rows": rows,
        }


# Global singleton instance
model_engine = ModelEngine()
