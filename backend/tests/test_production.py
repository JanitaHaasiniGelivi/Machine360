"""Regression checks for deployment configuration and dependency failures."""
import json
from pathlib import Path
import pytest
from fastapi.testclient import TestClient
from app.core.config import Settings
from app.main import app
from app.ml.inference import ModelEngine, ModelUnavailableError, model_engine

@pytest.mark.parametrize('origins', ['https://machine360.vercel.app', 'https://a.example, https://b.example', '["https://a.example", "https://b.example"]'])
def test_cors_environment_formats(monkeypatch, origins):
    monkeypatch.setenv('CORS_ORIGINS', origins)
    settings = Settings(_env_file=None)
    assert settings.CORS_ORIGINS[0].startswith('https://')
    assert all(',' not in x and '[' not in x for x in settings.CORS_ORIGINS)

def test_artifact_path_is_packaged():
    settings = Settings(_env_file=None)
    for filename in ['fault_models.joblib', 'model_pipeline.joblib', 'model_metadata.json']:
        assert (Path(settings.ML_ARTIFACTS_DIR) / filename).is_file()

def test_missing_models_do_not_fail_constructor(tmp_path):
    engine = ModelEngine(str(tmp_path))
    assert engine.pipeline is None
    with pytest.raises(ModelUnavailableError):
        engine.load_artifacts()

def test_prediction_returns_503_when_models_missing(monkeypatch, tmp_path):
    monkeypatch.setattr(model_engine, 'pipeline', None)
    monkeypatch.setattr(model_engine, 'metadata', None)
    monkeypatch.setattr(model_engine, 'artifacts_dir', str(tmp_path))
    response = TestClient(app).post('/api/v1/predict?save_to_db=false', json={
        'quality_type':'M', 'air_temperature_k':300, 'process_temperature_k':310,
        'rotational_speed_rpm':1500, 'torque_nm':40, 'tool_wear_min':50,
    })
    assert response.status_code == 503
    assert str(tmp_path) not in response.text
    assert TestClient(app).get('/health').status_code == 200

def test_partial_artifacts_are_rejected(tmp_path):
    (tmp_path/'model_pipeline.joblib').write_bytes(b'not a model')
    (tmp_path/'model_metadata.json').write_text('{}')
    with pytest.raises(ModelUnavailableError):
        ModelEngine(str(tmp_path)).load_artifacts()

@pytest.mark.parametrize('updates', [
    {'DATABASE_URL':'sqlite:////tmp/test.db'},
    {'SECRET_KEY':'short'},
    {'SEED_DEMO_DATA':True},
])
def test_unsafe_production_settings_rejected(updates):
    values = {'ENVIRONMENT':'production', 'DATABASE_URL':'postgresql://user:password@localhost/test', 'SECRET_KEY':'x'*48}
    values.update(updates)
    with pytest.raises(ValueError):
        Settings(_env_file=None, **values)

def test_production_config_accepts_hosted_database():
    cfg = Settings(_env_file=None, ENVIRONMENT='production', DATABASE_URL='postgresql://user:password@localhost/test', SECRET_KEY='x'*48)
    assert not cfg.SEED_DEMO_DATA

def test_registration_cannot_grant_admin():
    response = TestClient(app).post('/api/v1/auth/register', json={
        'email':'privilege-regression@example.com','password':'Regression123!',
        'full_name':'Regression User','role':'admin',
    })
    assert response.status_code == 201
    assert response.json()['user']['role'] == 'viewer'

def test_cors_preflight():
    response = TestClient(app).options('/api/v1/machines', headers={
        'Origin':'https://machine360.vercel.app',
        'Access-Control-Request-Method':'GET',
        'Access-Control-Request-Headers':'content-type,authorization',
    })
    assert response.status_code == 200
    assert response.headers['access-control-allow-origin'] == 'https://machine360.vercel.app'

@pytest.mark.parametrize('role,code', [(None,401),('viewer',403)])
def test_production_rejects_unauthorized_writes(monkeypatch, role, code):
    from app.api.deps import require_production_writer
    from types import SimpleNamespace
    from fastapi import HTTPException
    monkeypatch.setenv('VERCEL', '1')
    user = SimpleNamespace(role=role) if role else None
    with pytest.raises(HTTPException) as exc:
        require_production_writer(user)
    assert exc.value.status_code == code

def test_production_staff_write_allowed(monkeypatch):
    from app.api.deps import require_production_writer
    from types import SimpleNamespace
    monkeypatch.setenv('VERCEL', '1')
    user = SimpleNamespace(role='technician')
    assert require_production_writer(user) is user
