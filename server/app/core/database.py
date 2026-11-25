"""Database engine and session dependency (pattern from the ORM lecture).

SHARED FILE. Use it in any feature like this:

    from app.core.database import SessionDep

    @router.get("/boats")
    def list_boats(session: SessionDep):
        return session.exec(select(Boat)).all()
"""

from typing import Annotated

from fastapi import Depends
from sqlmodel import Session, SQLModel, create_engine

from app.core.config import DATABASE_URL

# Import every table model once, so SQLModel knows all tables (and the links
# between them) before create_all() runs or the first query is made.
# Features 3 and 4 only read or update existing tables, so they have no models.
from app.core.app_settings import AppSetting  # noqa: E402,F401  app_settings (CHG-003/004)
from app.features.f1_accounts.models import User, UserSession  # noqa: E402,F401  users, sessions
from app.features.f2_record_collection.models import Photo, Record, RecordFlag  # noqa: E402,F401  records, photos, record_flags
from app.features.f5_fleet_boats.models import Boat, LandingSite, RewardRate  # noqa: E402,F401  boats, landing_sites, reward_rates

# pool_pre_ping re-checks connections (Render may restart the free database)
engine = create_engine(DATABASE_URL, pool_pre_ping=True)


def get_session():
    """Yield one database session per request; FastAPI closes it afterwards."""
    with Session(engine) as session:
        yield session


SessionDep = Annotated[Session, Depends(get_session)]


def create_db_and_tables() -> None:
    """Create every table that does not exist yet (ORM lecture: create_all).

    create_all never changes a table that already exists. After changing a
    model, recreate the database:  docker compose down -v  then  up --build
    (the seed data comes back automatically on the next start).
    """
    SQLModel.metadata.create_all(engine)
