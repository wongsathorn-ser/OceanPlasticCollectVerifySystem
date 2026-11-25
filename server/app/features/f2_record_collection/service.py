"""F2 validation and atomic record/photo storage using the PM's existing schema."""
import math
from datetime import datetime, timezone
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError
from sqlmodel import Session, select

from app.features.f2_record_collection.models import MATERIALS, Photo, Record, make_record_number
from app.features.f2_record_collection.schemas import RecordOut
from app.features.f5_fleet_boats.models import Boat

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
    values = {key: getattr(record, key) for key in RecordOut.model_fields if hasattr(record, key)}
    for key in ('recorded_at', 'created_at'):
        values[key] = values[key].astimezone(timezone.utc)
    return RecordOut(
        **values,
        boat_code=boat.code, boat_name=boat.name, photo_url=f"/api/photos/{record.id}",
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


def create_record(db: Session, crew_id: int, client_id: str, fields: dict, data: bytes, content_type: str) -> tuple[Record, bool]:
    """Record and photo commit together; UNIQUE client_id also covers concurrent retries."""
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
    content_type = validate_photo(data, content_type)
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
        db.add(Photo(record_id=record.id, content_type=content_type, size_bytes=len(data), data=data))
        db.commit()
        db.refresh(record)
    except IntegrityError:
        db.rollback()
        existing = existing_record(db, client_id, crew_id)
        if existing:
            return existing, False
        raise
    return record, True
