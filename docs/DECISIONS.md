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
| D8 | 2026-11-18 | **Usernames and passwords are stored in the `users` table, passwords as plain text.** No accounts or passwords in `.env`. | Project lead's decision to keep the course project simple. Replaces NFR-15 (hashing) for this course. The API never returns the password. Change the seeded `admin` password after deploying. |
| D9 | 2026-11-18 | Photos in a **separate `photos` table** (one row per record), not a column on `records` | List queries on `records` (history, queue, dashboards) never load image bytes, so they stay fast. |
| D10 | 2026-11-18 | **Thailand time (UTC+7)** for "today / this month / this year"; database stores UTC. Record number = `REC-` + (1000 + id), e.g. `REC-1043` | Operator works in Thailand. Helpers in `app/core/clock.py`; `make_record_number()` in F2 `models.py`. |
| D11 | 2026-11-18 | The project lead writes **all table models in one shared schema PR** (users, sessions, boats, records, photos) plus the demo seed data; each owner reviews their tables | `records` blocks F3, F4 and F5; one PR avoids waiting and conflicts. |
| D12 | 2026-11-18 | Demo data is **seeded automatically once**, when the database is empty; data persists in the Docker volume. Tests use their own `<db>_test` database. SQL aggregates (`func.sum`, `group_by`) only where plain `select` + Python is not enough | Data survives restarts (Lab 12 check "backend restart keeps history"); tests never wipe demo data; stay with what was taught where possible. |
| D13 | 2026-11-25 | **Schema update for CHG-002/003/004** in one PR: tables `reward_rates`, `landing_sites` (F5 admin), `record_flags` (F2), `app_settings` (shared); records get landing site, auto-verify, spot-check and reversal columns; photos get `kind` + `sha256` (one photo per kind); boats get `auto_verify_blocked_until`. Rewards are calculated, not stored | One `docker compose down -v` for everyone; rules use settings from the database, so they can change without code; a reversed record earns nothing automatically. |

### Switching to MySQL later (D1)

1. `uv add mysql-connector-python` (and `uv remove psycopg2-binary` if Postgres is dropped), re-export `requirements.txt`.
2. `DATABASE_URL=mysql+mysqlconnector://user:password@database:3306/appdb`.
3. In `compose.yaml` use `mysql:8.4` (port 3306, volume `/var/lib/mysql`, health check from the W9 Docker lab); same in the CI service container.
4. Photos: a plain MySQL `BLOB` holds only 64 KB – use `MEDIUMBLOB` / `LargeBinary(length=...)`.
5. Production would need a MySQL host outside Render.

## Waiting for a decision

Sponsor change requests CHG-001 – CHG-004 (18 Nov): analysis and technical preparation in [`CHANGE_REQUESTS.md`](CHANGE_REQUESTS.md), waiting for the team's (CCB) decision.

| Topic | Options | Needed by |
|---|---|---|
| Atomic status update for the 409 rule (two sponsors deciding at once) | re-check `status == "PENDING"` before commit (taught) vs. conditional `UPDATE ... WHERE status = 'PENDING'` | F4 |
| End-to-end test tool (NFR-12) | Playwright/Cypress (not taught) vs. TestClient flow tests + manual checklist | week 4 |
| Map on the record screen | coordinates + link to a map vs. map library (not taught) | F3 |
| Icons | inline SVG copied from Figma vs. icon library (not taught) | all |
| Login rate limiting (NFR-19, SHOULD) | small hand-written counter vs. library (not taught) vs. skip | F1 |
