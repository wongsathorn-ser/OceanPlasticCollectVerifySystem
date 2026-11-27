"""F4-only fixtures; keep the shared test configuration unchanged."""

import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture

def f4_client():
    """HTTPS client so the secure demo session cookie is sent on later requests."""
    return TestClient(app, base_url="https://testserver")
