"""Feature 2 - SQLModel tables: DM-3 records and photos.

Written by the project lead in the shared schema PR (team decision D11) -
owner please review. Features 3, 4 and 5 read the records table and Feature 4
updates its status, so announce any change in the team chat.

Photos (team decision D9): the image bytes live in their own `photos` table.
CHG-004: two photos per record - kind PLASTIC (before weighing) and kind SCALE
(the scale display). List queries on `records` never load images, so the
history, queue and dashboard stay fast. Load one photo only for the photo
endpoint:
    session.exec(select(Photo).where(Photo.record_id == record_id, Photo.kind == "SCALE")).first()

Records are immutable after saving (BR-3): no update/delete endpoints, except
Feature 4 setting status / reviewed_by / reviewed_at / reason, the CHG-003
auto-verify and spot-check fields, and the CHG-002/CHG-003 reversal fields.
Schema update for CHG-002/003/004: docs/CHANGE_REQUESTS.md, decision D13.
"""

from datetime import datetime
from uuid import uuid4

from sqlalchemy import DateTime, UniqueConstraint
from sqlmodel import Field, Relationship, SQLModel

from app.core.clock import utc_now
from app.features.f5_fleet_boats.models import Boat

MATERIALS = ("PET_BOTTLES", "HDPE_RIGID", "FISHING_NET_ROPE", "LDPE_FILM", "MIXED")
STATUSES = ("PENDING", "VERIFIED", "REJECTED")
PHOTO_KINDS = ("PLASTIC", "SCALE")  # CHG-004: plastic before weighing, scale display
FLAGS = ("DUPLICATE_PHOTO", "OUTSIDE_LANDING_SITE")  # CHG-004; any flag stops auto-verify (CHG-003)


def make_record_number(record_id: int) -> str:
    """Record number shown to users (team decision D10): id 43 -> "REC-1043"."""
    return f"REC-{1000 + record_id}"


class Record(SQLModel, table=True):
    __tablename__ = "records"

    id: int | None = Field(default=None, primary_key=True)
    # made by the phone when the crew saves the record; the same client_id sent
    # twice (offline sync retry) must not create a second record (BR-10)
    client_id: str = Field(default_factory=lambda: str(uuid4()), max_length=36, unique=True, index=True)
    # set right after the first flush, when the id is known: make_record_number(id)
    record_number: str | None = Field(default=None, max_length=20, unique=True, index=True)

    boat_id: int = Field(foreign_key="boats.id", index=True)
    crew_id: int = Field(foreign_key="users.id", index=True)  # taken from the session (BR-11)
    weight_kg: float  # > 0, checked in the service
    material: str = Field(max_length=30)  # one of MATERIALS
    note: str | None = Field(default=None, max_length=500)
    latitude: float | None = None
    longitude: float | None = None
    gps_accuracy_m: float | None = None
    recorded_at: datetime = Field(sa_type=DateTime(timezone=True), index=True)  # when the crew weighed it

    status: str = Field(default="PENDING", max_length=20, index=True)  # one of STATUSES
    reviewed_by: int | None = Field(default=None, foreign_key="users.id")  # Feature 4
    reviewed_at: datetime | None = Field(default=None, sa_type=DateTime(timezone=True))
    reason: str | None = Field(default=None, max_length=500)  # required when REJECTED (BR-4)
    created_at: datetime = Field(default_factory=utc_now, sa_type=DateTime(timezone=True))

    # CHG-004: nearest registered landing site when the record was made (within 100 m)
    landing_site_id: int | None = Field(default=None, foreign_key="landing_sites.id", index=True)

    # CHG-003: auto-verification
    auto_verified: bool = Field(default=False, index=True)  # True = verified by the rule, not a person
    verified_rule: str | None = Field(default=None, max_length=300)  # the rule that passed, shown to users
    spot_check: bool = Field(default=False, index=True)  # randomly picked for a manual spot-check
    spot_checked_by: int | None = Field(default=None, foreign_key="users.id")  # set when the check is done
    spot_checked_at: datetime | None = Field(default=None, sa_type=DateTime(timezone=True))

    # CHG-002 / CHG-003: a VERIFIED record can be reversed (status -> REJECTED);
    # its reward is then reversed automatically (rewards are calculated from status)
    reversed_by: int | None = Field(default=None, foreign_key="users.id")
    reversed_at: datetime | None = Field(default=None, sa_type=DateTime(timezone=True))
    reversal_reason: str | None = Field(default=None, max_length=500)

    # many records -> one boat (record.boat.code, record.boat.name)
    boat: Boat = Relationship(back_populates="records")
    # one record -> many flags (CHG-004); deleting a record deletes its flags
    flags: list["RecordFlag"] = Relationship(back_populates="record", cascade_delete=True)


class Photo(SQLModel, table=True):
    """One photo of a record, kept out of the records table for speed.

    CHG-004: each record has two photos, one per kind (PLASTIC, SCALE).
    sha256 is the hash of `data`; the same hash on an earlier record means a
    reused photo -> add a DUPLICATE_PHOTO flag to the new record.
    """

    __tablename__ = "photos"
    __table_args__ = (UniqueConstraint("record_id", "kind"),)  # one photo of each kind per record

    id: int | None = Field(default=None, primary_key=True)
    record_id: int = Field(foreign_key="records.id", index=True)
    kind: str = Field(default="SCALE", max_length=10)  # one of PHOTO_KINDS
    sha256: str | None = Field(default=None, max_length=64, index=True)  # hashlib.sha256(data).hexdigest()
    content_type: str = Field(max_length=50)  # e.g. "image/jpeg"
    size_bytes: int
    data: bytes  # the image itself (BYTEA in PostgreSQL)
    created_at: datetime = Field(default_factory=utc_now, sa_type=DateTime(timezone=True))


class RecordFlag(SQLModel, table=True):
    """CHG-004: a problem found on a record. Any flag stops auto-verification (CHG-003)."""

    __tablename__ = "record_flags"

    id: int | None = Field(default=None, primary_key=True)
    record_id: int = Field(foreign_key="records.id", index=True)
    flag: str = Field(max_length=30)  # one of FLAGS
    detail: str | None = Field(default=None, max_length=300)  # e.g. "Same photo as REC-1012"
    created_at: datetime = Field(default_factory=utc_now, sa_type=DateTime(timezone=True))

    record: Record = Relationship(back_populates="flags")
