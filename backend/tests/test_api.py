"""Comprehensive Backend & ML Test Suite
MachineMind 360 - Pytest Suite
"""

import os
import shutil
import tempfile
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Configure test environment
TEST_DATA_DIR = tempfile.mkdtemp(prefix="machinemind360-pytest-")
TEST_DB_PATH = os.path.join(TEST_DATA_DIR, "test.db")
os.environ["DATABASE_URL"] = f"sqlite:///{TEST_DB_PATH}"
os.environ["DEBUG"] = "true"

from app.main import app
from app.db.session import Base, get_db
from app.core.security import create_access_token

TEST_DATABASE_URL = f"sqlite:///{TEST_DB_PATH}"
test_engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)
    shutil.rmtree(TEST_DATA_DIR, ignore_errors=True)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)


def test_health_endpoints():
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"

    res_v1 = client.get("/api/v1/health")
    assert res_v1.status_code == 200
    data = res_v1.json()
    assert data["status"] == "healthy"
    assert data["model_loaded"] is True


def test_auth_workflow():
    # 1. Register new user
    user_payload = {
        "email": "testuser@machinemind360.com",
        "password": "Password123!",
        "full_name": "Test QA Engineer",
        "role": "technician",
    }
    reg_res = client.post("/api/v1/auth/register", json=user_payload)
    assert reg_res.status_code == 201
    token = reg_res.json()["access_token"]
    assert token is not None

    # 2. Duplicate registration rejection
    dup_res = client.post("/api/v1/auth/register", json=user_payload)
    assert dup_res.status_code == 400

    # 3. Successful login
    login_res = client.post(
        "/api/v1/auth/login",
        json={"email": "testuser@machinemind360.com", "password": "Password123!"},
    )
    assert login_res.status_code == 200
    assert "access_token" in login_res.json()

    # 4. Invalid login
    bad_login = client.post(
        "/api/v1/auth/login",
        json={"email": "testuser@machinemind360.com", "password": "WrongPassword!"},
    )
    assert bad_login.status_code == 401

    # 5. Get current user
    me_res = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert me_res.status_code == 200
    assert me_res.json()["email"] == "testuser@machinemind360.com"


def test_machine_asset_crud():
    # 1. Create asset
    asset_data = {
        "asset_id": "TEST-MAC-999",
        "name": "QA Testing Lathe Unit",
        "description": "Automated test asset fixture.",
        "manufacturer": "TestWorks AG",
        "model": "TW-500",
        "department": "QA Test Cell",
        "installation_date": "2024-01-01",
        "criticality": "high",
        "assigned_technician": "Test QA Engineer",
        "notes": "Verified under test harness.",
    }
    create_res = client.post("/api/v1/machines", json=asset_data)
    assert create_res.status_code == 201
    created = create_res.json()
    assert created["asset_id"] == "TEST-MAC-999"
    assert created["qr_code_data"] is not None
    asset_id_num = created["id"]

    # 2. Get asset by ID
    get_res = client.get(f"/api/v1/machines/{asset_id_num}")
    assert get_res.status_code == 200
    assert get_res.json()["name"] == "QA Testing Lathe Unit"

    # 3. Update asset
    patch_res = client.patch(
        f"/api/v1/machines/{asset_id_num}",
        json={"criticality": "critical", "notes": "Updated notes via test."},
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["criticality"] == "critical"

    # 4. List assets and filter
    list_res = client.get("/api/v1/machines?criticality=critical")
    assert list_res.status_code == 200
    assets = list_res.json()
    assert any(a["asset_id"] == "TEST-MAC-999" for a in assets)

    # 5. Delete asset
    del_res = client.delete(f"/api/v1/machines/{asset_id_num}")
    assert del_res.status_code == 204

    # Confirm deletion
    get_after = client.get(f"/api/v1/machines/{asset_id_num}")
    assert get_after.status_code == 404


def test_ml_prediction_and_diagnostics():
    # 1. Normal safe operating values
    normal_input = {
        "quality_type": "M",
        "air_temperature_k": 298.1,
        "process_temperature_k": 308.6,
        "rotational_speed_rpm": 1551.0,
        "torque_nm": 42.8,
        "tool_wear_min": 0.0,
    }
    res = client.post("/api/v1/predict", json=normal_input)
    assert res.status_code == 200
    data = res.json()
    assert "machine_failure_prediction" in data
    assert data["risk_level"] == "LOW"
    assert data["derived_power_watts"] > 0
    assert data["derived_temp_diff_k"] == 10.5
    assert len(data["feature_contributions"]) > 0
    assert len(data["fault_probabilities"]) == 5

    # 2. High wear values (severe risk)
    critical_input = {
        "quality_type": "L",
        "air_temperature_k": 303.0,
        "process_temperature_k": 311.5,
        "rotational_speed_rpm": 1250.0,
        "torque_nm": 75.0,
        "tool_wear_min": 240.0,
    }
    res_crit = client.post("/api/v1/predict", json=critical_input)
    assert res_crit.status_code == 200
    crit_data = res_crit.json()
    assert crit_data["machine_failure_prediction"] is True
    assert crit_data["risk_level"] in ["ELEVATED", "CRITICAL"]
    assert any("Tool wear" in c for c in crit_data["checklist"])

    # 3. Model metrics endpoint
    metrics_res = client.get("/api/v1/models/metrics")
    assert metrics_res.status_code == 200
    meta = metrics_res.json()
    assert meta["model_version"] == "1.0.0"
    assert meta["metrics"]["accuracy"] > 0.90
    assert meta["metrics"]["roc_auc"] > 0.90


def test_invalid_prediction_inputs():
    # Out of range temperature (< 270 K)
    bad_temp = {
        "quality_type": "M",
        "air_temperature_k": 100.0,  # Invalid
        "process_temperature_k": 308.6,
        "rotational_speed_rpm": 1551.0,
        "torque_nm": 42.8,
        "tool_wear_min": 0.0,
    }
    res = client.post("/api/v1/predict", json=bad_temp)
    assert res.status_code == 422


def test_saved_model_single_batch_parity_and_prediction_persistence():
    payload = {
        "quality_type": "M", "air_temperature_k": 298.1,
        "process_temperature_k": 308.6, "rotational_speed_rpm": 1551.0,
        "torque_nm": 42.8, "tool_wear_min": 12.0,
    }
    single = client.post("/api/v1/predict", json=payload)
    assert single.status_code == 200
    prediction = single.json()
    assert prediction["id"] is not None

    import io
    csv = ("Type,Air temperature [K],Process temperature [K],Rotational speed [rpm],Torque [Nm],Tool wear [min]\n"
           "M,298.1,308.6,1551,42.8,12\n").encode()
    batch = client.post("/api/v1/predict/batch", files={"file": ("readings.csv", io.BytesIO(csv), "text/csv")})
    assert batch.status_code == 200
    row = batch.json()["rows"][0]
    assert row["prediction"] is prediction["machine_failure_prediction"]
    assert row["probability"] == prediction["failure_probability"]

    stored = client.get("/api/v1/predictions?limit=1")
    assert stored.status_code == 200
    assert stored.json()[0]["id"] == prediction["id"]


def test_batch_rejects_missing_predictor_columns():
    import io
    csv = b"Type,Air temperature [K]\nM,298.1\n"
    response = client.post("/api/v1/predict/batch", files={"file": ("bad.csv", io.BytesIO(csv), "text/csv")})
    assert response.status_code == 422


def test_maintenance_tickets():
    # First create an asset to link
    asset_res = client.post(
        "/api/v1/machines",
        json={
            "asset_id": "TEST-TCK-MAC",
            "name": "Ticket Test Unit",
            "criticality": "medium",
        },
    )
    asset_id = asset_res.json()["id"]

    # 1. Create ticket
    ticket_payload = {
        "asset_id": asset_id,
        "issue_summary": "High Vibration & Tool Wear Anomaly",
        "priority": "high",
        "assigned_technician": "Lead CNC Technician",
        "due_date": "2026-11-01",
    }
    t_create = client.post("/api/v1/maintenance/tickets", json=ticket_payload)
    assert t_create.status_code == 201
    ticket = t_create.json()
    assert ticket["status"] == "Open"
    t_id = ticket["id"]

    # 2. Update status to In Progress
    t_update = client.patch(
        f"/api/v1/maintenance/tickets/{t_id}",
        json={"status": "In Progress", "actions_taken": "Inspected cutter spindle."},
    )
    assert t_update.status_code == 200
    assert t_update.json()["status"] == "In Progress"

    # 3. List tickets
    t_list = client.get("/api/v1/maintenance/tickets?status=In Progress")
    assert t_list.status_code == 200
    assert any(t["id"] == t_id for t in t_list.json())


def test_cost_simulator():
    req = {
        "name": "Test Plant Line 1",
        "inspection_cost": 200.0,
        "repair_cost": 1000.0,
        "spare_part_cost": 500.0,
        "labor_cost": 400.0,
        "downtime_hours": 6.0,
        "downtime_cost_per_hour": 1200.0,
    }
    res = client.post("/api/v1/costs/simulate", json=req)
    assert res.status_code == 200
    data = res.json()
    assert data["net_savings"] > 0
    assert data["preventive_total_cost"] < data["reactive_total_cost"]
    assert data["roi_percent"] > 0


def test_copilot_assistant():
    # Test fault query
    res = client.post(
        "/api/v1/copilot/chat",
        json={"message": "Can you explain what HDF and PWF failure modes mean?"},
    )
    assert res.status_code == 200
    data = res.json()
    assert any("Heat Dissipation Failure" in i for i in data["technical_insights"])
    assert any("Power Failure" in i for i in data["technical_insights"])

    # Test checklist query
    check_res = client.post(
        "/api/v1/copilot/chat",
        json={"message": "Please give me the inspection checklist."},
    )
    assert check_res.status_code == 200
    assert len(check_res.json()["checklist"]) > 0


def test_dashboard_summary():
    res = client.get("/api/v1/dashboard/summary")
    assert res.status_code == 200
    data = res.json()
    assert "total_assets" in data
    assert "system_health" in data
    assert "model_roc_auc" in data
