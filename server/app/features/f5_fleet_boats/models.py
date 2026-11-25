"""Feature 5 - SQLModel table: DM-2 boats.

Written by the project lead in the shared schema PR (team decision D11) -
owner please review. Feature 2 links every record to a boat
(records.boat_id -> boats.id).

Deactivating a boat (active = False) must not break records already linked
to it (BR-6), so boats are never deleted.

Schema update for the change requests (decision D13, docs/CHANGE_REQUESTS.md):
- CHG-002 RewardRate: admin-managed THB per kg for each material, with history.
- CHG-004 LandingSite: admin-managed piers and ports; records must be made
  within 100 m of an active one.
- CHG-003 Boat.auto_verify_blocked_until: a spot-check rejection blocks
  auto-verification for that boat for 30 days.
These admin tables live here because F5 already owns the admin Boats screens.
"""

from datetime import date, datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime
from sqlmodel import Field, Relationship, SQLModel

from app.core.clock import utc_now

if TYPE_CHECKING:
    from app.features.f2_record_collection.models import Record


class Boat(SQLModel, table=True):
    __tablename__ = "boats"

    id: int | None = Field(default=None, primary_key=True)
    code: str = Field(max_length=20, unique=True, index=True)  # e.g. "HC-14"
    name: str = Field(max_length=120)  # e.g. "Harbor Cleaner"
    capacity_kg: float  # required and > 0 (DM-2) - check it in the service
    active: bool = Field(default=True, index=True)  # True = crews can choose it
    created_at: datetime = Field(default_factory=utc_now, sa_type=DateTime(timezone=True))

    # CHG-003: set to (rejection time + 30 days) when a spot-check rejects one of its records
    auto_verify_blocked_until: datetime | None = Field(default=None, sa_type=DateTime(timezone=True))

    # one boat -> many records
    records: list["Record"] = Relationship(back_populates="boat")


class RewardRate(SQLModel, table=True):
    """CHG-002: price paid to crews per verified kg of one material.

    A new rate never edits an old one: add a row with a later valid_from.
    A record is paid at the newest rate of its material whose valid_from is on
    or before the record's collection date (Thailand date, app/core/clock.py).
    """

    __tablename__ = "reward_rates"

    id: int | None = Field(default=None, primary_key=True)
    material: str = Field(max_length=30, index=True)  # one of MATERIALS (F2 models)
    rate_thb_per_kg: float  # > 0, checked in the service
    valid_from: date = Field(index=True)  # first collection date (Thailand) this rate applies to
    created_by: int | None = Field(default=None, foreign_key="users.id")  # the admin who set it
    created_at: datetime = Field(default_factory=utc_now, sa_type=DateTime(timezone=True))


class LandingSite(SQLModel, table=True):
    """CHG-004: a registered pier or port where crews may record collections."""

    __tablename__ = "landing_sites"

    id: int | None = Field(default=None, primary_key=True)
    name: str = Field(max_length=120, unique=True)  # e.g. "Chalong Pier"
    kind: str = Field(max_length=10)  # PIER | PORT
    latitude: float
    longitude: float
    active: bool = Field(default=True, index=True)  # only active sites count for the 100 m check
    created_at: datetime = Field(default_factory=utc_now, sa_type=DateTime(timezone=True))
