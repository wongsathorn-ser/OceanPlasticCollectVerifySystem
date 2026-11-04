"""Feature 1 - shared auth dependencies (FR-1.2, FR-1.10).

Every other feature uses these to protect its endpoints, for example:

    from fastapi import Depends
    from app.features.f1_accounts.dependencies import CurrentUser, require_role

    router = APIRouter(
        prefix="/api",
        dependencies=[Depends(require_role("SPONSOR_MANAGEMENT"))],
    )

    @router.get("/verify/queue")
    def queue(user: CurrentUser, session: SessionDep):
        ...  # user.id, user.name, user.role

`CurrentUser` is a UserOut (id, name, email, username, role, status,
created_at). It keeps the same attribute names when the users table arrives.
"""

from typing import Annotated

from fastapi import Cookie, Depends, HTTPException, status

from app.core import config
from app.features.f1_accounts import service
from app.features.f1_accounts.schemas import UserOut


def get_session_id(
    session_id: Annotated[str | None, Cookie(alias=config.SESSION_COOKIE_NAME)] = None,
) -> str | None:
    """The raw session cookie value (None when the browser sent none)."""
    return session_id


SessionIdDep = Annotated[str | None, Depends(get_session_id)]


def get_current_user(session_id: SessionIdDep) -> UserOut:
    """Return the signed-in user, or raise 401 for a missing/expired session.

    Also refuses users who are no longer ACTIVE (BR-8) and slides the session
    expiry on every request (FR-1.3) - both handled in service.user_for_session.
    """
    user = service.user_for_session(session_id) if session_id else None
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Please sign in again.",
        )
    return UserOut.model_validate(user)


CurrentUser = Annotated[UserOut, Depends(get_current_user)]


def require_role(*allowed_roles: str):
    """Dependency factory: allow only users whose role is in allowed_roles (403 otherwise).

    The backend enforces the permission matrix (spec section 3); hiding menu
    items in the frontend is not enough.
    """

    def checker(user: CurrentUser) -> UserOut:
        if user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to do this.",
            )
        return user

    return checker
