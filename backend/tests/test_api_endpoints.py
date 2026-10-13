import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_check_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "LearnMate" in data["service"]

def test_demo_login_endpoint():
    response = client.post("/api/auth/demo")
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["username"] == "demo_student"
    token = data["access_token"]

    # Verify /api/auth/me with bearer token
    me_resp = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_resp.status_code == 200
    assert me_resp.json()["username"] == "demo_student"

    # Verify /api/dashboard
    dash_resp = client.get("/api/dashboard", headers={"Authorization": f"Bearer {token}"})
    assert dash_resp.status_code == 200
    dash_data = dash_resp.json()
    assert dash_data["total_resources"] >= 1
    assert "quiz_trend" in dash_data

    # Verify /api/learning-path
    lp_resp = client.get("/api/learning-path", headers={"Authorization": f"Bearer {token}"})
    assert lp_resp.status_code == 200
    lp_data = lp_resp.json()
    assert lp_data["total_topics"] >= 1
    assert len(lp_data["topics"]) >= 1

def test_unauthorized_access():
    response = client.get("/api/resources")
    assert response.status_code == 401
