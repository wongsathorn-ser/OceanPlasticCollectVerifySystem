"""Feature 1 tests - owner: Wongsathorn Sereephap.

NFR-12: one test per endpoint and per business rule. Data comes from the
in-memory demo accounts (app/features/f1_accounts/seed.py), reset before
every test. Run: cd server && uv run pytest tests/f1_accounts -vv
"""

from fastapi.testclient import TestClient

from app.core import config
from app.features.f1_accounts.router import router
from app.main import app

NEW_USER = {
    "name": "Nina Holm",
    "email": "nina.holm@opr.org",
    "username": "nholm",
    "password": "longenough1",
    "role": "CREW_MEMBER",
}


def sign_in(client, username: str, password: str = "password123"):
    return client.post("/api/auth/login", json={"username": username, "password": password})


def admin_username() -> str:
    return (config.ADMIN_USERNAME or "admin").lower()


def admin_password() -> str:
    return config.ADMIN_PASSWORD or "password123"


def sign_in_admin(client):
    return sign_in(client, admin_username(), admin_password())


def test_f1_router_is_importable():
    assert router.prefix == "/api"


# ---------- sign in / session (FR-1.1 - FR-1.3, BR-8) ----------

def test_login_sets_httponly_cookie_and_me_returns_user(f1_client):
    response = sign_in(f1_client, "mreyes")
    assert response.status_code == 200
    assert response.json()["role"] == "CREW_MEMBER"
    assert "password_hash" not in response.json()
    cookie = response.headers["set-cookie"]
    assert config.SESSION_COOKIE_NAME in cookie and "HttpOnly" in cookie

    me = f1_client.get("/api/auth/me")
    assert me.status_code == 200
    assert me.json()["username"] == "mreyes"


def test_wrong_password_gives_generic_error(f1_client):
    wrong_password = sign_in(f1_client, "mreyes", "nope-nope")
    unknown_user = sign_in(f1_client, "nobody", "nope-nope")
    assert wrong_password.status_code == unknown_user.status_code == 401
    assert wrong_password.json()["detail"] == unknown_user.json()["detail"] == "Incorrect username or password."


def test_suspended_and_pending_users_cannot_sign_in(f1_client):
    assert sign_in(f1_client, "tiversen").status_code == 403
    assert sign_in(f1_client, "evasquez").status_code == 403


def test_me_without_session_is_401(f1_client):
    assert f1_client.get("/api/auth/me").status_code == 401


def test_logout_ends_the_session(f1_client):
    sign_in(f1_client, "mreyes")
    assert f1_client.post("/api/auth/logout").status_code == 204
    assert f1_client.get("/api/auth/me").status_code == 401


# ---------- register -> approve -> sign in (AC-1, FR-1.4 - FR-1.6, BR-9) ----------

def test_register_approve_then_sign_in(f1_client):
    created = f1_client.post("/api/auth/register", json=NEW_USER)
    assert created.status_code == 201
    assert created.json()["status"] == "PENDING"
    assert sign_in(f1_client, "nholm", NEW_USER["password"]).status_code == 403

    sign_in_admin(f1_client)
    pending = f1_client.get("/api/admin/requests").json()
    assert pending[0]["username"] == "nholm"  # newest first
    approved = f1_client.post(f"/api/admin/requests/{created.json()['id']}/approve", json={"role": "SPONSOR_MANAGEMENT"})
    assert approved.json()["status"] == "ACTIVE"
    assert approved.json()["role"] == "SPONSOR_MANAGEMENT"

    f1_client.post("/api/auth/logout")
    assert sign_in(f1_client, "nholm", NEW_USER["password"]).status_code == 200


def test_register_rejects_admin_role_and_duplicates(f1_client):
    as_admin = f1_client.post("/api/auth/register", json={**NEW_USER, "role": "ADMIN"})
    assert as_admin.status_code == 400  # BR-9
    taken = f1_client.post("/api/auth/register", json={**NEW_USER, "username": "mreyes"})
    assert taken.status_code == 409


def test_request_can_only_be_handled_once(f1_client):
    sign_in_admin(f1_client)
    assert f1_client.post("/api/admin/requests/7/reject").json()["status"] == "REJECTED"
    assert f1_client.post("/api/admin/requests/7/approve", json={"role": "CREW_MEMBER"}).status_code == 409


# ---------- users (FR-1.7, BR-7) ----------

def test_admin_lists_and_searches_users(f1_client):
    sign_in_admin(f1_client)
    users = f1_client.get("/api/admin/users").json()
    assert all(u["status"] != "PENDING" for u in users)
    found = f1_client.get("/api/admin/users", params={"search": "reyes"}).json()
    assert [u["username"] for u in found] == ["mreyes"]


def test_suspend_signs_the_user_out(f1_client):
    crew = sign_in(f1_client, "mreyes")
    crew_cookie = crew.cookies[config.SESSION_COOKIE_NAME]

    admin = TestClient(app, base_url="https://testserver")
    sign_in_admin(admin)
    assert admin.post("/api/admin/users/1/suspend").json()["status"] == "SUSPENDED"

    f1_client.cookies.set(config.SESSION_COOKIE_NAME, crew_cookie)
    assert f1_client.get("/api/auth/me").status_code == 401  # BR-7
    assert admin.post("/api/admin/users/1/reactivate").json()["status"] == "ACTIVE"


def test_admin_cannot_suspend_self(f1_client):
    me = sign_in_admin(f1_client).json()
    assert f1_client.post(f"/api/admin/users/{me['id']}/suspend").status_code == 400


def test_crew_cannot_call_admin_endpoints(f1_client):
    sign_in(f1_client, "mreyes")
    assert f1_client.get("/api/admin/users").status_code == 403  # AC-6


# ---------- change password (FR-1.8) ----------

def test_change_password(f1_client):
    sign_in(f1_client, "mreyes")
    wrong = f1_client.post(
        "/api/auth/change-password", json={"current_password": "bad-guess", "new_password": "brandnew123"}
    )
    assert wrong.status_code == 400
    ok = f1_client.post(
        "/api/auth/change-password", json={"current_password": "password123", "new_password": "brandnew123"}
    )
    assert ok.status_code == 204
    f1_client.post("/api/auth/logout")
    assert sign_in(f1_client, "mreyes").status_code == 401
    assert sign_in(f1_client, "mreyes", "brandnew123").status_code == 200
