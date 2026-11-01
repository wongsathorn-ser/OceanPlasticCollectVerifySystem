"""Seed the database: default admin (FR-1.9) + demo data (NFR-21).

SHARED RUNNER - each owner fills in the seed() function in their own
feature folder, so nobody has to edit this file.

Run inside Docker:   docker compose exec backend python -m app.seed
Run locally:         uv run python -m app.seed
Order matters: users -> boats -> records (records point to both).
"""

from sqlmodel import Session

from app.core.database import create_db_and_tables, engine
from app.features.f1_accounts.seed import seed as seed_accounts
from app.features.f2_record_collection.seed import seed as seed_records
from app.features.f5_fleet_boats.seed import seed as seed_boats


def main() -> None:
    create_db_and_tables()
    with Session(engine) as session:
        seed_accounts(session)  # F1: default admin + demo users of each role
        seed_boats(session)     # F5: HC-14, SH-02, RM-07, SL-03
        seed_records(session)   # F2: demo records in all three statuses
        session.commit()
    print("Seed finished.")


if __name__ == "__main__":
    main()
