"""F2 validation and atomic record/photo storage using the PM's existing schema."""
import math
import logging
from datetime import datetime, timezone
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlmodel import Session, select

from app.core.evidence import add_photo, check_evidence
from app.core.auto_verify import apply_auto_verify
from app.features.f2_record_collection.models import MATERIALS, PHOTO_KINDS, Photo, Record, RecordFlag, make_record_number
from app.features.f2_record_collection.schemas import FlagOut, PhotoOut, RecordOut
from app.features.f5_fleet_boats.models import Boat, LandingSite

logger = logging.getLogger(__name__)

MAX_PHOTO_BYTES = 5 * 1024 * 1024
PHOTO_TYPES = {"image/jpeg", "image/png", "image/webp"}


def canonical_client_id(value: str | None) -> str:
    try:
        return str(UUID(value or ""))
    except (ValueError, AttributeError):
        raise HTTPException(400, "A valid client_id UUID is required.")


def existing_record(db: Session, client_id: str, crew_id: int) -> Record | None:
    record = db.exec(select(Record).where(Record.client_id == client_id)).first()
    if record and record.crew_id != crew_id:
        raise HTTPException(409, "This client_id belongs to another crew member.")
    return record


def record_out(db: Session, record: Record) -> RecordOut:
    boat = db.get(Boat, record.boat_id)
    values = {key: getattr(record, key) for key in RecordOut.model_fields if hasattr(record, key) and key != "flags"}
    for key in ('recorded_at', 'created_at'):
        values[key] = values[key].astimezone(timezone.utc)
    site = db.get(LandingSite, record.landing_site_id) if record.landing_site_id else None
    photos = db.exec(select(Photo.kind, Photo.size_bytes).where(Photo.record_id == record.id).order_by(Photo.kind)).all()
    flags = db.exec(select(RecordFlag).where(RecordFlag.record_id == record.id).order_by(RecordFlag.id)).all()
    return RecordOut(
        **values,
        boat_code=boat.code, boat_name=boat.name, photo_url=f"/api/photos/{record.id}?kind=SCALE",
        landing_site_name=site.name if site else None,
        photos=[PhotoOut(kind=kind, size_bytes=size, url=f"/api/photos/{record.id}?kind={kind}") for kind, size in photos],
        flags=[FlagOut(flag=f.flag, detail=f.detail) for f in flags],
    )


def number(value: str | None, label: str, minimum=None, maximum=None, positive=False) -> float:
    try:
        result = float(value)
    except (TypeError, ValueError, OverflowError):
        raise HTTPException(400, f"{label} is required and must be a number.")
    if not math.isfinite(result):
        raise HTTPException(400, f"{label} must be finite.")
    if positive and result <= 0:
        raise HTTPException(400, f"{label} must be greater than 0.")
    if (minimum is not None and result < minimum) or (maximum is not None and result > maximum):
        raise HTTPException(400, f"{label} is out of range.")
    return result


def validate_photo(data: bytes, content_type: str | None) -> str:
    if not data:
        raise HTTPException(400, "A scale photo is required.")
    if len(data) > MAX_PHOTO_BYTES:
        raise HTTPException(413, "The photo must be 5 MB or smaller.")
    if content_type not in PHOTO_TYPES:
        raise HTTPException(400, "Use a JPEG, PNG or WebP photo.")
    detected = None
    if data.startswith(b"\xff\xd8\xff") and data.endswith(b"\xff\xd9"):
        detected = "image/jpeg"
    elif data.startswith(b"\x89PNG\r\n\x1a\n") and data[12:16] == b"IHDR":
        detected = "image/png"
    elif data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        detected = "image/webp"
    if detected != content_type:
        raise HTTPException(400, "The photo contents do not match its image type.")
    return detected


def create_record(db: Session, crew_id: int, client_id: str, fields: dict, photos: dict[str, tuple[bytes, str]]) -> tuple[Record, bool]:
    """Commit both photos and evidence flags atomically, then invoke the PM auto-verify rule."""
    existing = existing_record(db, client_id, crew_id)
    if existing:
        return existing, False
    try:
        boat_id = int(fields.get("boat_id") or "")
    except ValueError:
        raise HTTPException(400, "Choose an active boat.")
    boat = db.get(Boat, boat_id)
    if not boat or not boat.active:
        raise HTTPException(400, "Choose an active boat.")
    weight = number(fields.get("weight_kg"), "Weight", positive=True)
    material = fields.get("material")
    if material not in MATERIALS:
        raise HTTPException(400, "Choose one valid material.")
    latitude = number(fields.get("latitude"), "Latitude", -90, 90)
    longitude = number(fields.get("longitude"), "Longitude", -180, 180)
    accuracy = number(fields.get("gps_accuracy_m"), "GPS accuracy", minimum=0)
    note = (fields.get("note") or "").strip()
    if len(note) > 500:
        raise HTTPException(400, "The note must be 500 characters or fewer.")
    try:
        recorded_at = datetime.fromisoformat(fields.get("recorded_at") or "")
        if recorded_at.tzinfo is None:
            raise ValueError
        recorded_at = recorded_at.astimezone(timezone.utc)
    except ValueError:
        raise HTTPException(400, "recorded_at must include a date, time and time zone.")
    if set(photos) != set(PHOTO_KINDS):
        raise HTTPException(400, "Both plastic and scale photos are required.")
    for data, content_type in photos.values():
        validate_photo(data, content_type)
    record = Record(
        client_id=client_id, boat_id=boat_id, crew_id=crew_id,
        weight_kg=weight, material=material, note=note or None,
        latitude=latitude, longitude=longitude, gps_accuracy_m=accuracy,
        recorded_at=recorded_at, status="PENDING",
    )
    try:
        db.add(record)
        db.flush()
        record.record_number = make_record_number(record.id)
        for kind in PHOTO_KINDS:
            data, content_type = photos[kind]
            add_photo(db, record, kind, data, content_type)
        check_evidence(db, record)
        db.commit()
        db.refresh(record)
    except IntegrityError:
        db.rollback()
        existing = existing_record(db, client_id, crew_id)
        if existing:
            return existing, False
        raise
    # Match F4's row lock, so a manual decision and auto-verification cannot
    # overwrite one another. The helper commits on success; commit also
    # releases the lock when its rule does not pass.
    try:
        db.refresh(record, with_for_update=True)
        apply_auto_verify(db, record)
        db.commit()
        db.refresh(record)
    except SQLAlchemyError:
        # The complete evidence transaction has already committed. A transient
        # auto-check DB failure leaves a normal PENDING record for manual review.
        db.rollback()
        db.refresh(record)
        logger.exception("F2 auto-verification failed for record %s; evidence is saved", record.id)
    return record, True
