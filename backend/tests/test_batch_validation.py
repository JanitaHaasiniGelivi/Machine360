import pytest
from fastapi.testclient import TestClient
from app.main import app

HEADER = 'Type,Air temperature [K],Process temperature [K],Rotational speed [rpm],Torque [Nm],Tool wear [min]\n'

@pytest.mark.parametrize('row', ['', 'X,300,310,1500,40,50\n', 'M,300,310,1500,40,NaN\n', 'M,300,310,1500,40,inf\n', 'M,300,310,1500,40,-1\n', 'M,300,310,nope,40,50\n'])
def test_invalid_batch_rejected(row):
    response = TestClient(app, raise_server_exceptions=False).post('/api/v1/predict/batch', files={'file':('readings.csv', HEADER+row, 'text/csv')})
    assert response.status_code == 422

def test_uppercase_csv_extension_allowed():
    response = TestClient(app).post('/api/v1/predict/batch', files={'file':('READINGS.CSV', HEADER+'M,300,310,1500,40,50\n', 'text/csv')})
    assert response.status_code == 200
    assert response.json()['total_processed'] == 1

def test_cost_calculation_does_not_save_without_request():
    from app.db.session import SessionLocal
    from app.models.entities import CostScenario
    with SessionLocal() as db:
        before = db.query(CostScenario).count()
    response = TestClient(app).post('/api/v1/costs/simulate', json={
        'name':'Regression calculation', 'inspection_cost':250, 'repair_cost':1200,
        'spare_part_cost':850, 'labor_cost':500, 'downtime_hours':8,
        'downtime_cost_per_hour':1500,
    })
    assert response.status_code == 200
    assert response.json()['preventive_total_cost'] == 4000
    with SessionLocal() as db:
        assert db.query(CostScenario).count() == before

def test_batch_fault_models_called_once_per_upload(monkeypatch):
    from app.ml.inference import model_engine
    model_engine.load_artifacts()
    calls = []
    for code, model in model_engine.fault_models.items():
        original = model.predict_proba
        def predict(X, original=original, code=code):
            calls.append((code,len(X)))
            return original(X)
        monkeypatch.setattr(model, 'predict_proba', predict)
    response = TestClient(app).post('/api/v1/predict/batch', files={'file':('readings.csv', HEADER+'M,300,310,1500,40,50\nL,298.9,309.2,1390,52,225\n', 'text/csv')})
    assert response.status_code == 200
    assert len(calls) == 5
    assert all(length == 2 for _, length in calls)
