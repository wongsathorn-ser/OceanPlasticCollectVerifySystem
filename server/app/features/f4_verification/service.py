"""Verification queue reads and guarded decisions over F2's records table."""

from datetime import datetime

from fastapi import HTTPException, status
from sqlalchemy.orm import selectinload
from sqlmodel import Session, select

from app.core.clock import utc_now
from app.features.f1_accounts.models import User
from app.features.f2_record_collection.models import Record, make_record_number
from app.features.f4_verification.schemas import VerificationRecordOut
from app.features.f5_fleet_boats.models import Boat

MATERIAL_LABELS = {
    "PET_BOTTLES": "PET bottles",
    "HDPE_RIGID": "HDPE rigid",
    "FISHING_NET_ROPE": "Fishing net / rope",
    "LDPE_FILM": "LDPE film",
    "MIXED": "Mixed",
}


def _record_out(db: Session, record: Record, crew: User | None = None) -> VerificationRecordOut:
    boat = db.get(Boat, record.boat_id)
    if crew is None:
        crew = db.get(User, record.crew_id)
    reviewer = db.get(User, record.reviewed_by) if record.reviewed_by is not None else None
    return VerificationRecordOut(
        id=record.id,
        record_number=record.record_number or make_record_number(record.id),
        crew=crew.name if crew else "Unknown crew",
        boat=f"{boat.code} {boat.name}" if boat else "Unknown boat",
        material=MATERIAL_LABELS.get(record.material, record.material),
        weight_kg=record.weight_kg,
        recorded_at=record.recorded_at,
        photo_url=f"/api/photos/{record.id}?kind=SCALE",
        note=record.note,
        latitude=record.latitude,
        longitude=record.longitude,
        gps_accuracy_m=record.gps_accuracy_m,
        status=record.status,
        reason=record.reason,
        reviewed_by=reviewer.name if reviewer else ("Auto verification" if record.auto_verified else None),
        reviewed_at=record.reviewed_at,
    )


def _records_with_crews(db: Session, statement) -> list[VerificationRecordOut]:
    records = db.exec(statement.options(selectinload(Record.boat))).all()
    if not records:
        return []
    crew_ids = {record.crew_id for record in records}
    crews = {
        crew.id: crew
        for crew in db.exec(select(User).where(User.id.in_(crew_ids))).all()
    }
    return [_record_out(db, record, crews.get(record.crew_id)) for record in records]


def get_queue(db: Session) -> list[VerificationRecordOut]:
    """Pending verification queue, oldest collection first (FR-4.1)."""
    statement = (
        select(Record)
        .where(Record.status == "PENDING")
        .order_by(Record.recorded_at.asc(), Record.id.asc())
    )
    return _records_with_crews(db, statement)


def get_history(db: Session) -> list[VerificationRecordOut]:
    """Final decisions newest first, including reviewer and reason (FR-4.5)."""
    statement = (
        select(Record)
        .where(Record.status.in_(("VERIFIED", "REJECTED")))
        .order_by(Record.reviewed_at.desc(), Record.id.desc())
    )
    return _records_with_crews(db, statement)


def get_record(db: Session, record_id: int) -> VerificationRecordOut:
    record = db.exec(
        select(Record)
        .options(selectinload(Record.boat))
        .where(Record.id == record_id)
    ).first()
    if record is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Record not found.")
    return _record_out(db, record)


def decide(
    db: Session,
    record_id: int,
    reviewer_id: int,
    decision: str,
    reason: str | None = None,
    now: datetime | None = None,
) -> VerificationRecordOut:
    """Lock and decide one pending row; only the first concurrent decision wins."""
    normalized_reason = reason.strip() if reason is not None else ""
    if decision == "REJECTED" and not normalized_reason:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="A rejection reason is required.")

    record = db.exec(
        select(Record).where(Record.id == record_id).with_for_update()
    ).first()
    if record is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Record not found.")
    if record.status != "PENDING":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This record was already decided by another supervisor.",
        )

    record.status = decision
    record.reviewed_by = reviewer_id
    record.reviewed_at = now or utc_now()
    record.reason = normalized_reason if decision == "REJECTED" else None
    db.add(record)
    db.commit()
    db.refresh(record)
    return _record_out(db, record)
