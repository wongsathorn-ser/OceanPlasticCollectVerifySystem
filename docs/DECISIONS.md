# Decisions log

Technical decisions for the ITCS525 project. Rule from the team: use only what ITCS525 teaches; anything else is listed here and needs team (and if needed professor) agreement before use.

## Decided

| ID | Date | Decision | Why |
|---|---|---|---|
| D1 | 2026-11-01 | **PostgreSQL 16 everywhere for now** (compose, CI, Render). May change later. | Render, the course's deployment platform, only offers PostgreSQL (Render lab). One engine in dev and prod. |
| D2 | 2026-11-01 | **One folder per feature** (`features/f1_…f5_`) in backend, frontend and tests | One owner per folder → no merge conflicts, clear ownership for grading. Mirrors the "structure by domain" layout in the FastAPI best-practices repo linked in the lecture. |
| D3 | 2026-11-01 | Frontend in **JavaScript (.jsx)** from `npm create vite@latest -- --template react` | Same as the labs. The current template ships **oxlint** as its linter. |
| D4 | 2026-11-01 | API served under the **same origin at `/api`** (Vite proxy locally, Render static-site rewrite in production) | Session cookies stay first-party (Safari blocks third-party cookies). Needs a week-1 spike on Render. |
| D5 | 2026-11-01 | Tables created with `SQLModel.metadata.create_all` at start-up + seed script; no migration tool | Same as the ORM lecture. |
| D6 | 2026-11-01 | Photos stored as binary in the database | Render's filesystem is ephemeral; avoids an external storage service not covered in class. |
| D7 | 2026-11-01 | `postgresql://` URLs are rewritten to `postgresql+psycopg2://` in `app/core/config.py` | SQLAlchemy 2.1 now defaults to the newer psycopg 3 driver; we keep psycopg2-binary from the Render lab. |

### Switching to MySQL later (D1)

1. `uv add mysql-connector-python` (and `uv remove psycopg2-binary` if Postgres is dropped), re-export `requirements.txt`.
2. `DATABASE_URL=mysql+mysqlconnector://user:password@database:3306/appdb`.
3. In `compose.yaml` use `mysql:8.4` (port 3306, volume `/var/lib/mysql`, health check from the W9 Docker lab); same in the CI service container.
4. Photos: a plain MySQL `BLOB` holds only 64 KB – use `MEDIUMBLOB` / `LargeBinary(length=...)`.
5. Production would need a MySQL host outside Render.

## Waiting for a decision

| Topic | Options | Needed by |
|---|---|---|
| Password hashing library (NFR-15 asks for bcrypt/argon2 – not taught) | `bcrypt` / `pwdlib[argon2]` / stdlib `hashlib.scrypt` | F1, week 1 |
| Photo table | separate `photos` table (5 tables) vs. column on `records` (4 tables) | F2, week 1 |
| Timezone for "today / this month / this year" totals | operator local time (which zone?) vs. UTC | F3, F5 |
| Record number format | e.g. `REC-1043` derived from the id | F2 |
| SQL aggregates (`func.sum`, `group_by`) and atomic status update for the 409 rule | allow (part of SQLModel/SQLAlchemy) vs. compute in Python | F3, F4, F5 |
| End-to-end test tool (NFR-12) | Playwright/Cypress (not taught) vs. TestClient flow tests + manual checklist | week 4 |
| Map on the record screen | coordinates + link to a map vs. map library (not taught) | F3 |
| Icons | inline SVG copied from Figma vs. icon library (not taught) | all |
| Login rate limiting (NFR-19, SHOULD) | small hand-written counter vs. library (not taught) vs. skip | F1 |
