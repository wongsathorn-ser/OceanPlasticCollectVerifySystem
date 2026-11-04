# F1 · Accounts & access (backend)

**Owner:** Wongsathorn Sereephap · **Frontend:** `client/src/features/f1_accounts/` · **Tests:** `server/tests/f1_accounts/`

Sign-in with a session cookie, account requests approved by an admin, user management, profile, and the role check every other feature relies on.

| File | Purpose |
|---|---|
| `router.py` | API routes (`/api/auth/*`, `/api/admin/requests/*`, `/api/admin/users/*`) |
| `schemas.py` | Pydantic request/response models (`...In` / `...Out`) |
| `memory_store.py` | **Temporary** storage: Python dictionaries `USERS` and `SESSIONS` (no database yet) |
| `models.py` | Planned SQLModel tables `users` (DM-1) and `sessions` (DM-4) - for when the database arrives |
| `service.py` | Business logic - the only module that reads/writes the store |
| `dependencies.py` | `get_current_user`, `CurrentUser`, `require_role` – **used by all features** |
| `seed.py` | Default admin from env vars (FR-1.9, falls back to `admin` / `password123`) + demo users, loaded into memory at start-up |

**Status (2026-11-04):** all endpoints in `router.py` work and the F1 screens use them. Data is in memory, so it resets when the server restarts; the server starts without a database (`main.py` prints a warning). Tests: `uv run pytest tests/f1_accounts -vv`.

Passwords use PBKDF2-SHA256 from Python's standard library (`hashlib`) as a stand-in - NFR-15 asks for bcrypt/argon2, which still needs approval before real accounts are stored.

**Spec:** FR-1.1 – FR-1.10, BR-7, BR-8, BR-9, NFR-15 · **Figma:** flow 01, Users, Profile

Rules to remember: session-based auth, not JWT (FR-1.2) · generic error on failed sign-in (FR-1.1) · PENDING / REJECTED / SUSPENDED users cannot sign in (BR-8) · suspending ends all sessions, users are never deleted (BR-7) · ADMIN is never offered at registration (BR-9).
