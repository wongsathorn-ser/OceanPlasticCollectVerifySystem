"""Smoke tests for the shared app (SHARED FILE)."""


def test_health(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_health_db(client):
    """Needs a running database (compose locally, service container in CI)."""
    response = client.get("/api/health/db")
    assert response.status_code == 200
    assert response.json() == {"db_result": 1}
