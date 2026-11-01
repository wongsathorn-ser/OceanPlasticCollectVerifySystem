"""Feature 1 - shared auth dependencies (FR-1.2, FR-1.10).

Every other feature uses these to protect its endpoints, for example:

    from fastapi import Depends
    from app.features.f1_accounts.dependencies import CurrentUser, require_role

    router = APIRouter(
        prefix="/api",
        dependencies=[Depends(require_role("SPONSOR_MANAGEMENT"))],
    )

    @router.get("/verify/queue")
    def queue(user: CurrentUser, session: SessionDep): ...

The functions below are placeholders so other members can already write
their routes against this contract. Until Feature 1 is implemented they
answer 501 Not Implemented.
"""

from typing import Annotated

from fastapi import Depends, HTTPException, status


def get_current_user():
    """Return the signed-in user, or raise 401 for a missing/expired session.

    TODO(F1): read the session cookie (config.SESSION_COOKIE_NAME), look up the
    session row, check expires_at and that the user is ACTIVE (BR-8), slide the
    expiry (FR-1.3) and return the User.
    """
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Authentication is not implemented yet (Feature 1).",
    )


# TODO(F1): change `object` to the User model once it exists.
CurrentUser = Annotated[object, Depends(get_current_user)]


def require_role(*allowed_roles: str):
    """Dependency factory: allow only users whose role is in allowed_roles.

    TODO(F1): raise 403 when user.role is not allowed (backend must enforce
    the permission matrix in spec section 3).
    """

    def checker(user: CurrentUser):
        return user

    return checker
