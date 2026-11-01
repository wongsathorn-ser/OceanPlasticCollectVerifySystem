# F1 · Accounts & access (backend)

**Owner:** Wongsathorn Sereephap · **Frontend:** `client/src/features/f1_accounts/` · **Tests:** `server/tests/f1_accounts/`

Sign-in with a session cookie, account requests approved by an admin, user management, profile, and the role check every other feature relies on.

| File | Purpose |
|---|---|
| `router.py` | API routes (`/api/auth/*`, `/api/admin/requests/*`, `/api/admin/users/*`) |
| `schemas.py` | Pydantic request/response models (`...In` / `...Out`) |
| `models.py` | SQLModel tables `users` (DM-1) and `sessions` (DM-4) |
| `service.py` | Business logic |
| `dependencies.py` | `get_current_user`, `CurrentUser`, `require_role` – **used by all features** |
| `seed.py` | Default admin from env vars (FR-1.9) + demo users |

**Spec:** FR-1.1 – FR-1.10, BR-7, BR-8, BR-9, NFR-15 · **Figma:** flow 01, Users, Profile

Rules to remember: session-based auth, not JWT (FR-1.2) · generic error on failed sign-in (FR-1.1) · PENDING / REJECTED / SUSPENDED users cannot sign in (BR-8) · suspending ends all sessions, users are never deleted (BR-7) · ADMIN is never offered at registration (BR-9).
