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

# pool_pre_ping re-checks connections (Render may restart the free database)
engine = create_engine(DATABASE_URL, pool_pre_ping=True)


def get_session():
    """Yield one database session per request; FastAPI closes it afterwards."""
    with Session(engine) as session:
        yield session


SessionDep = Annotated[Session, Depends(get_session)]


def create_db_and_tables() -> None:
    """Create every table that does not exist yet.

    SQLModel only knows about tables whose models have been imported, so each
    feature that owns tables is imported here once. Features 3 and 4 only read
    or update existing tables, so they have no models module.
    """
    from app.features.f1_accounts import models as _f1_models  # noqa: F401  users, sessions
    from app.features.f2_record_collection import models as _f2_models  # noqa: F401  records
    from app.features.f5_fleet_boats import models as _f5_models  # noqa: F401  boats

    SQLModel.metadata.create_all(engine)
