"""Feature 1 - Accounts & access: API routes.

Owner : Wongsathorn Sereephap
Figma : flow 01 (Sign in, Request an account, Request submitted, Approve access),
        Users, Profile
Spec  : FR-1.1 - FR-1.10, BR-7, BR-8, BR-9 (docs/requirements/system_requirements.txt)

Endpoints (all under /api):

    POST /auth/register                      public   FR-1.4  create PENDING user (BR-9: no ADMIN)
    POST /auth/login                         public   FR-1.1  set HttpOnly session cookie
    POST /auth/logout                        any      FR-1.8  end session
    GET  /auth/me                            any      FR-1.2  current user + role
    POST /auth/change-password               any      FR-1.8  needs current password
    GET  /admin/requests                     ADMIN    FR-1.6  PENDING users
    POST /admin/requests/{user_id}/approve   ADMIN    FR-1.6  body: {role}
    POST /admin/requests/{user_id}/reject    ADMIN    FR-1.6
    GET  /admin/users?search=                ADMIN    FR-1.7
    POST /admin/users/{user_id}/suspend      ADMIN    FR-1.7  ends all sessions (BR-7)
    POST /admin/users/{user_id}/reactivate   ADMIN    FR-1.7

Data is stored in memory for now (memory_store.py).
"""

from fastapi import APIRouter, Depends, Response, status

from app.core import config
from app.features.f1_accounts import service
from app.features.f1_accounts.dependencies import CurrentUser, SessionIdDep, require_role
from app.features.f1_accounts.schemas import ApproveIn, ChangePasswordIn, LoginIn, RegisterIn, UserOut
from app.features.f1_accounts.seed import seed_memory_store

router = APIRouter(prefix="/api", tags=["F1 - Accounts & access"])


def set_session_cookie(response: Response, session_id: str) -> None:
    response.set_cookie(
        key=config.SESSION_COOKIE_NAME,
        value=session_id,
        max_age=config.SESSION_TTL_DAYS * 24 * 60 * 60,
        httponly=True,  # JavaScript cannot read it (FR-1.2)
        secure=config.COOKIE_SECURE,  # HTTPS only on Render; COOKIE_SECURE=false for local http
        samesite="lax",
        path="/",
    )


# ---------- /api/auth ----------

@router.post("/auth/register", status_code=status.HTTP_201_CREATED)
def register(body: RegisterIn) -> UserOut:
    return service.register(body.name, body.email, body.username, body.password, body.role)


@router.post("/auth/login")
def login(body: LoginIn, response: Response) -> UserOut:
    user = service.authenticate(body.username, body.password)
    set_session_cookie(response, service.create_session(user["id"]))
    return user


@router.post("/auth/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(session_id: SessionIdDep, response: Response) -> None:
    if session_id:
        service.end_session(session_id)
    response.delete_cookie(config.SESSION_COOKIE_NAME, path="/")


@router.get("/auth/me")
def me(user: CurrentUser) -> UserOut:
    return user


@router.post("/auth/change-password", status_code=status.HTTP_204_NO_CONTENT)
def change_password(body: ChangePasswordIn, user: CurrentUser) -> None:
    service.change_password(user.id, body.current_password, body.new_password)


# ---------- /api/admin (ADMIN only, checked once for the whole router) ----------

admin_router = APIRouter(prefix="/admin", dependencies=[Depends(require_role("ADMIN"))])


@admin_router.get("/requests")
def list_requests() -> list[UserOut]:
    return service.list_requests()


@admin_router.post("/requests/{user_id}/approve")
def approve_request(user_id: int, body: ApproveIn) -> UserOut:
    return service.approve(user_id, body.role)


@admin_router.post("/requests/{user_id}/reject")
def reject_request(user_id: int) -> UserOut:
    return service.reject(user_id)


@admin_router.get("/users")
def list_users(search: str = "") -> list[UserOut]:
    return service.list_users(search)


@admin_router.post("/users/{user_id}/suspend")
def suspend_user(user_id: int, admin: CurrentUser) -> UserOut:
    return service.suspend(user_id, admin.id)


@admin_router.post("/users/{user_id}/reactivate")
def reactivate_user(user_id: int) -> UserOut:
    return service.reactivate(user_id)


router.include_router(admin_router)

# No database yet: start every server process with the demo accounts in memory.
seed_memory_store()
