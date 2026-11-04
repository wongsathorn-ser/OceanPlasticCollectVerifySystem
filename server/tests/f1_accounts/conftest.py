"""Feature 1 fixtures (own folder, so the shared conftest.py stays untouched)."""

import pytest
from fastapi.testclient import TestClient

from app.features.f1_accounts import memory_store
from app.main import app


@pytest.fixture(autouse=True)
def fresh_accounts():
    """Every test starts from the seeded demo accounts with no sessions."""
    memory_store.reset()
    yield
    memory_store.reset()


@pytest.fixture
def f1_client():
    # https base URL: the session cookie is Secure when COOKIE_SECURE=true
    return TestClient(app, base_url="https://testserver")
