"""Database Seeding Script
Populates initial demonstration accounts, industrial machines, baseline observations,
and sample maintenance tickets with authentic AI4I-compatible telemetry.
"""

from app.core.security import get_password_hash
from app.db.session import SessionLocal, engine, Base
from app.models.entities import (
    User,
    FactoryAsset,
    MachineObservation,
    PredictionResult,
    MaintenanceTicket,
    Notification,
)
from app.ml.inference import model_engine


def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # 1. Seed Users if none exist
        if db.query(User).count() == 0:
            print("Seeding initial users...")
            admin = User(
                email="admin@machinemind360.com",
                full_name="Chief Plant Engineer",
                hashed_password=get_password_hash("AdminPassword123!"),
                role="admin",
                is_active=True,
            )
            tech = User(
                email="technician@machinemind360.com",
                full_name="Lead CNC Technician",
                hashed_password=get_password_hash("TechPassword123!"),
                role="technician",
                is_active=True,
            )
            viewer = User(
                email="viewer@machinemind360.com",
                full_name="Operations Auditor",
                hashed_password=get_password_hash("ViewerPassword123!"),
                role="viewer",
                is_active=True,
            )
            db.add_all([admin, tech, viewer])
            db.commit()

        # 2. Seed Factory Assets if none exist
        if db.query(FactoryAsset).count() == 0:
            print("Seeding industrial assets...")
            machines = [
                FactoryAsset(
                    asset_id="MAC-001",
                    name="5-Axis CNC Milling Center #1",
                    description="High-precision titanium aerospace milling unit.",
                    manufacturer="DMG MORI",
                    model="DMU 50 3rd Gen",
                    department="CNC Milling & Fabrication",
                    installation_date="2021-03-10",
                    criticality="critical",
                    assigned_technician="Lead CNC Technician",
                    notes="Primary spindle rebuilt Nov 2023. Coolant chiller serviced quarterly.",
                    qr_code_data="MACHINEMIND360://ASSET/MAC-001?name=5-Axis+CNC+Milling+Center+1",
                ),
                FactoryAsset(
                    asset_id="MAC-002",
                    name="Horizontal Heavy Turning Lathe #2",
                    description="Heavy shaft turning and threading station.",
                    manufacturer="Mazak Corp.",
                    model="Quick Turn 250MSY",
                    department="Shaft & Turning Bay",
                    installation_date="2020-08-15",
                    criticality="high",
                    assigned_technician="Lead CNC Technician",
                    notes="Requires synthetic ISO VG 68 slide lubrication.",
                    qr_code_data="MACHINEMIND360://ASSET/MAC-002?name=Horizontal+Heavy+Turning+Lathe+2",
                ),
                FactoryAsset(
                    asset_id="MAC-003",
                    name="Vertical Machining Center #3",
                    description="Cast iron transmission housing milling station.",
                    manufacturer="Haas Automation",
                    model="VF-4SS Super Speed",
                    department="CNC Milling & Fabrication",
                    installation_date="2022-05-20",
                    criticality="medium",
                    assigned_technician="Lead CNC Technician",
                    notes="Equipped with 30-pocket tool changer.",
                    qr_code_data="MACHINEMIND360://ASSET/MAC-003?name=Vertical+Machining+Center+3",
                ),
                FactoryAsset(
                    asset_id="MAC-004",
                    name="Precision Toolroom Lathe #4",
                    description="Rapid prototype precision component turning.",
                    manufacturer="Hardringe Inc.",
                    model="Super-Precision T-42",
                    department="Toolroom & Prototyping",
                    installation_date="2023-01-11",
                    criticality="low",
                    assigned_technician="Lead CNC Technician",
                    notes="Operates in temperature-controlled prototype bay.",
                    qr_code_data="MACHINEMIND360://ASSET/MAC-004?name=Precision+Toolroom+Lathe+4",
                ),
                FactoryAsset(
                    asset_id="MAC-005",
                    name="Multi-Spindle Drilling Array #5",
                    description="Automated cylinder head valve guide machining.",
                    manufacturer="Okuma Machine Tools",
                    model="GENOS M560-V",
                    department="Automated Engine Cell",
                    installation_date="2019-11-04",
                    criticality="critical",
                    assigned_technician="Lead CNC Technician",
                    notes="Continuous high-throughput production asset.",
                    qr_code_data="MACHINEMIND360://ASSET/MAC-005?name=Multi-Spindle+Drilling+Array+5",
                ),
            ]
            db.add_all(machines)
            db.commit()

            # 3. Seed Observations and Predictions for MAC-001 and MAC-002
            mac1 = db.query(FactoryAsset).filter(FactoryAsset.asset_id == "MAC-001").first()
            mac2 = db.query(FactoryAsset).filter(FactoryAsset.asset_id == "MAC-002").first()

            if mac1:
                # Normal reading
                obs1 = MachineObservation(
                    asset_id=mac1.id,
                    quality_type="M",
                    air_temperature_k=298.2,
                    process_temperature_k=308.7,
                    rotational_speed_rpm=1408.0,
                    torque_nm=46.3,
                    tool_wear_min=18.0,
                )
                db.add(obs1)

                pred1 = model_engine.predict_single("M", 298.2, 308.7, 1408.0, 46.3, 18.0)
                p1 = PredictionResult(
                    asset_id=mac1.id,
                    quality_type="M",
                    air_temperature_k=298.2,
                    process_temperature_k=308.7,
                    rotational_speed_rpm=1408.0,
                    torque_nm=46.3,
                    tool_wear_min=18.0,
                    machine_failure_prediction=pred1["machine_failure_prediction"],
                    failure_probability=pred1["failure_probability"],
                    threshold_used=pred1["threshold_used"],
                    derived_power_watts=pred1["derived_power_watts"],
                    derived_temp_diff_k=pred1["derived_temp_diff_k"],
                    fault_probabilities=pred1["fault_probabilities"],
                    feature_contributions=pred1["feature_contributions"],
                    model_version=pred1["model_version"],
                    notes="Baseline normal operation observation.",
                )
                db.add(p1)

            if mac2:
                # High wear reading triggering failure prediction
                obs2 = MachineObservation(
                    asset_id=mac2.id,
                    quality_type="L",
                    air_temperature_k=302.4,
                    process_temperature_k=311.2,
                    rotational_speed_rpm=1305.0,
                    torque_nm=68.5,
                    tool_wear_min=215.0,
                )
                db.add(obs2)

                pred2 = model_engine.predict_single("L", 302.4, 311.2, 1305.0, 68.5, 215.0)
                p2 = PredictionResult(
                    asset_id=mac2.id,
                    quality_type="L",
                    air_temperature_k=302.4,
                    process_temperature_k=311.2,
                    rotational_speed_rpm=1305.0,
                    torque_nm=68.5,
                    tool_wear_min=215.0,
                    machine_failure_prediction=pred2["machine_failure_prediction"],
                    failure_probability=pred2["failure_probability"],
                    threshold_used=pred2["threshold_used"],
                    derived_power_watts=pred2["derived_power_watts"],
                    derived_temp_diff_k=pred2["derived_temp_diff_k"],
                    fault_probabilities=pred2["fault_probabilities"],
                    feature_contributions=pred2["feature_contributions"],
                    model_version=pred2["model_version"],
                    notes="Simulated tool wear nearing critical threshold.",
                )
                db.add(p2)
                db.commit()

                # 4. Seed Maintenance Ticket linked to high wear prediction
                ticket1 = MaintenanceTicket(
                    ticket_number="TCK-1001",
                    asset_id=mac2.id,
                    prediction_id=p2.id,
                    issue_summary="Critical Tool Wear & Torque Spikes Detected on MAC-002",
                    priority="high",
                    status="Open",
                    assigned_technician="Lead CNC Technician",
                    due_date="2026-10-28",
                    resolution_notes="Pending replacement of carbide indexable inserts.",
                )
                notif = Notification(
                    title="High Failure Risk on MAC-002",
                    message="Model predicted elevated probability of Tool Wear Failure (TWF) and Overstrain (OSF).",
                    severity="critical",
                    is_read=False,
                )
                db.add_all([ticket1, notif])
                db.commit()

        print("Database seeding completed successfully.")
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
