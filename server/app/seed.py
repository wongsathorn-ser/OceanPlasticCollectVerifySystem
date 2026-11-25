"""Seed the database: default admin (FR-1.9) + demo data (NFR-21).

SHARED RUNNER - each owner fills in the seed() function in their own
feature folder, so nobody has to edit this file.

The backend calls seed_if_empty() every time it starts (app/main.py). It only
adds data when the users table is empty, i.e. the very first start or after
`docker compose down -v`. Your data stays when you stop and start the app,
because PostgreSQL keeps it in the `dbdata` Docker volume.

Run by hand (same rule - does nothing if data exists):
    docker compose exec backend python -m app.seed
Start again from the demo data:
    docker compose down -v      (deletes the database volume)
    docker compose up --build   (creates the tables and seeds them again)

Order matters: users -> settings -> boats, landing sites, rates -> records.
"""

from sqlmodel import Session, select

from app.core import app_settings
from app.core.database import create_db_and_tables, engine
from app.features.f1_accounts.models import User
from app.features.f1_accounts.seed import seed as seed_accounts
from app.features.f2_record_collection.seed import seed as seed_records
from app.features.f5_fleet_boats.seed import seed as seed_boats


def seed_all(session: Session) -> None:
    """Add all demo data in one transaction (all or nothing)."""
    seed_accounts(session)       # F1: default admin + demo users of each role
    app_settings.seed(session)   # CHG-003/004 settings (50 kg, 10 records, 30 days, 10 %, 100 m)
    seed_boats(session)          # F5: 4 boats, landing sites (CHG-004), reward rates (CHG-002)
    seed_records(session)        # F2: records in all statuses, 2 photos each, flags, auto-verified
    session.commit()


def seed_if_empty() -> bool:
    """Seed only when the database has no users yet. Returns True if it seeded."""
    with Session(engine) as session:
        if session.exec(select(User)).first() is not None:
            return False
        seed_all(session)
        return True


def main() -> None:
    create_db_and_tables()
    if seed_if_empty():
        print("Seed finished.")
    else:
        print("Database already has data - nothing to seed.")


if __name__ == "__main__":
    main()
