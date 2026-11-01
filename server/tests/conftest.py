"""Shared pytest fixtures. SHARED FILE - add feature-specific fixtures in your
own test folder (e.g. tests/f1_accounts/conftest.py) to avoid merge conflicts.

Run all tests:  docker compose exec backend python -m pytest -vv
           or:  cd server && uv run pytest -vv   (needs the compose database)
"""

import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def client():
    """FastAPI TestClient (same tool as the Testing Backend API lecture)."""
    return TestClient(app)
