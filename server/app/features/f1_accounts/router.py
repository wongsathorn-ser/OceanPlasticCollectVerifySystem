"""Feature 1 - Accounts & access: API routes.

Owner : Wongsathorn Sereephap
Figma : flow 01 (Sign in, Request an account, Request submitted, Approve access),
        Users, Profile
Spec  : FR-1.1 - FR-1.10, BR-7, BR-8, BR-9 (docs/requirements/system_requirements.txt)
"""

from fastapi import APIRouter

router = APIRouter(prefix="/api", tags=["F1 - Accounts & access"])

# TODO(F1) planned endpoints (spec section 7). Paths below are relative to /api.
#
#   POST /auth/register                      public   FR-1.4  create PENDING user (BR-9: no ADMIN)
#   POST /auth/login                         public   FR-1.1  set HttpOnly session cookie
#   POST /auth/logout                        any      FR-1.8  end session
#   GET  /auth/me                            any      FR-1.2  current user + role
#   POST /auth/change-password               any      FR-1.8  needs current password
#   GET  /admin/requests                     ADMIN    FR-1.6  PENDING users
#   POST /admin/requests/{user_id}/approve   ADMIN    FR-1.6  body: {role}
#   POST /admin/requests/{user_id}/reject    ADMIN    FR-1.6
#   GET  /admin/users?search=                ADMIN    FR-1.7
#   POST /admin/users/{user_id}/suspend      ADMIN    FR-1.7  ends all sessions (BR-7)
#   POST /admin/users/{user_id}/reactivate   ADMIN    FR-1.7
