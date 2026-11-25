# Database guide (PostgreSQL + SQLModel)

How our database works, for every team member. Patterns come from the ITCS525 lectures *Database Management and ORM Part 1 & 2* and *Lab 12 – Implement ORM in Backend APIs*. Decisions: `docs/DECISIONS.md` D1, D5, D8–D12.

## 1. What you need to install

Only **Docker Desktop** (with WSL 2) and Git. You do **not** install PostgreSQL: it runs in a Docker container, the same as in class.

```powershell
git pull
copy .env.example .env        # first time only
docker compose up --build
```

On the first start the backend creates all tables and adds the demo data. Open http://localhost:5173 and sign in as `admin` / `password123` (every demo account uses `password123`).

## 2. Where the data lives – and who sees it

```
your laptop
└── Docker
    ├── database container  (PostgreSQL 16)
    │     └── volume "dbdata"   <- the data is stored here, on YOUR laptop
    ├── backend container   (FastAPI)
    └── frontend container  (React)
```

| You do | Your data |
|---|---|
| Stop the app (`Ctrl+C`, `docker compose down`), restart, reboot the laptop | **kept** (it is in the `dbdata` volume) |
| `docker compose down -v` | **deleted**; the next start seeds the demo data again |
| A teammate runs the app on their laptop | they get **their own** database with the **same demo data**, not the rows you created |

Every laptop has its own database. Your teammates see the same *starting* data because the seed code is in Git, but a user you register or a record you add stays on your laptop. Data shared by everyone comes later from the **Render PostgreSQL** database (docs/DEPLOYMENT.md): the deployed app is the one place where everybody works on the same data.

If you need a row for everyone (for example a new demo boat), add it to your feature's `seed.py` and commit it.

## 3. Tables

All models are imported in `server/app/core/database.py`; `create_all` creates missing tables when the backend starts.

| Table | Model (file) | Owner | Key columns |
|---|---|---|---|
| `users` | `User` (f1_accounts/models.py) | F1 | `id`, `name`, `email` (unique), `username` (unique), `password` (plain text, D8), `role`, `status`, `created_at` |
| `sessions` | `UserSession` (f1_accounts/models.py) | F1 | `id` (SHA-256 of the cookie), `user_id` → users, `created_at`, `expires_at` |
| `boats` | `Boat` (f5_fleet_boats/models.py) | F5 | `id`, `code` (unique), `name`, `capacity_kg`, `active`, `auto_verify_blocked_until` (CHG-003), `created_at` |
| `records` | `Record` (f2_record_collection/models.py) | F2 (F3/F4/F5 read; F4 decides) | `id`, `client_id` (unique, offline retry), `record_number` (`REC-1043`), `boat_id` → boats, `crew_id` → users, `weight_kg`, `material`, `note`, `latitude`, `longitude`, `gps_accuracy_m`, `recorded_at`, `status`, `reviewed_by` → users, `reviewed_at`, `reason`, `created_at`; CHG-004 `landing_site_id` → landing_sites; CHG-003 `auto_verified`, `verified_rule`, `spot_check`, `spot_checked_by` → users, `spot_checked_at`; CHG-002/003 `reversed_by` → users, `reversed_at`, `reversal_reason` |
| `photos` | `Photo` (f2_record_collection/models.py) | F2 | `id`, `record_id` → records, `kind` (`PLASTIC` or `SCALE`, unique per record – CHG-004), `sha256` (indexed, duplicate check), `content_type`, `size_bytes`, `data` (bytes) |
| `record_flags` | `RecordFlag` (f2_record_collection/models.py) | F2 (F4 reads) | `id`, `record_id` → records, `flag` (`DUPLICATE_PHOTO`, `OUTSIDE_LANDING_SITE`), `detail`, `created_at` – CHG-004; any flag stops auto-verify (CHG-003) |
| `landing_sites` | `LandingSite` (f5_fleet_boats/models.py) | F5 (admin) | `id`, `name` (unique), `kind` (`PIER` or `PORT`), `latitude`, `longitude`, `active` – CHG-004 |
| `reward_rates` | `RewardRate` (f5_fleet_boats/models.py) | F5 (admin) | `id`, `material`, `rate_thb_per_kg`, `valid_from` (date), `created_by` → users – CHG-002; a new rate is a new row, never an edit |
| `app_settings` | `AppSetting` (core/app_settings.py) | shared | `key`, `value`, `description` – CHG-003/004 numbers: `auto_verify_max_kg` 50, `auto_verify_min_verified` 10, `auto_verify_window_days` 30, `spot_check_percent` 10, `auto_verify_block_days` 30, `landing_site_radius_m` 100. Read with `get_setting(session, key)` |

Relationships (`Relationship(back_populates=...)`, ORM Part 2): `User.sessions` ↔ `UserSession.user` (cascade delete), `Boat.records` ↔ `Record.boat`, `Record.flags` ↔ `RecordFlag.record` (cascade delete).

Demo data for the changes: 3 active landing sites (+1 inactive) around Phuket, reward rates for all materials (PET 7 → 8 THB/kg 14 days ago, to show the rate history), two photos on every record, 3 auto-verified records (one waiting for a spot-check), one record flagged `DUPLICATE_PHOTO` and one `OUTSIDE_LANDING_SITE`.

Speed: columns used in `where`/`order_by` are indexed (`status`, `crew_id`, `boat_id`, `recorded_at`, …). Photos are in their own table, so `select(Record)` never loads images (D9).

Values used everywhere:

- roles: `CREW_MEMBER`, `SPONSOR_MANAGEMENT`, `ADMIN`
- user status: `PENDING`, `ACTIVE`, `REJECTED`, `SUSPENDED`
- record status: `PENDING`, `VERIFIED`, `REJECTED` (`STATUSES` in F2 models)
- materials: `PET_BOTTLES`, `HDPE_RIGID`, `FISHING_NET_ROPE`, `LDPE_FILM`, `MIXED` (`MATERIALS` in F2 models)
- photo kinds: `PLASTIC`, `SCALE` (`PHOTO_KINDS`); flags: `DUPLICATE_PHOTO`, `OUTSIDE_LANDING_SITE` (`FLAGS`); landing site kinds: `PIER`, `PORT`
- times are stored in **UTC**; "today / this month / this year" use **Thailand time** (D10)

## 4. Use the database in your feature

```python
from sqlmodel import select

from app.core.clock import thailand_month_start
from app.core.database import SessionDep
from app.features.f1_accounts.dependencies import CurrentUser
from app.features.f2_record_collection.models import Record


@router.get("/home/summary")
def summary(user: CurrentUser, session: SessionDep):
    records = session.exec(
        select(Record)
        .where(Record.crew_id == user.id, Record.recorded_at >= thailand_month_start())
        .order_by(Record.recorded_at.desc())
    ).all()
    verified = sum(r.weight_kg for r in records if r.status == "VERIFIED")  # BR-2
    return {"verified_kg": verified, "records": len(records)}
```

- Create: `session.add(obj)` → `session.commit()` → `session.refresh(obj)`.
- Read: `session.get(Model, id)`, `session.exec(select(Model).where(...)).all() / .first()`.
- Update: change the fields → `session.add(obj)` → `session.commit()`.
- New record number: `session.add(record)` → `session.flush()` → `record.record_number = make_record_number(record.id)` → add the `Photo` → `session.commit()` (one transaction).
- Photo for one record only: `session.exec(select(Photo).where(Photo.record_id == record_id)).first()`.
- Keep `service.py` free of mock lists: replace `MOCK_...` data with queries.

## 5. Changing a table (no migrations, D5)

`create_all` only creates **missing** tables; it never changes an existing one. When you change a model:

1. Announce it in the team chat (other features may read that table) and update this file.
2. Update the seed data if needed.
3. Everyone recreates their local database:

   ```powershell
   docker compose down -v
   docker compose up --build
   ```

## 6. Tests

```powershell
docker compose exec backend python -m pytest -vv
```

Tests run on a second database, `appdb_test`, created automatically next to `appdb`. Before every test the tables are dropped, created and seeded again (`server/tests/conftest.py`), so tests never change your demo data. Use the `db` fixture to check rows directly:

```python
def test_something(client, db):
    ...
    assert db.exec(select(Record).where(Record.status == "VERIFIED")).first() is not None
```

## 7. Look inside the database (optional)

```powershell
docker compose exec database psql -U appuser -d appdb
```

Then for example `\dt` (list tables), `SELECT username, role, status FROM users;`, `\q` to quit. A GUI client (pgAdmin, DBeaver) can connect to `localhost:54242` with the user and password from `.env` – optional, not taught in class.
