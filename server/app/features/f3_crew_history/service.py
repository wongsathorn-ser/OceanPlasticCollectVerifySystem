"""Feature 3 - read queries and totals over the records table (owned by F2).

Uses the shared SQLModel tables (`User`, `Record`, `Boat`) and Thailand time
helpers (`app/core/clock.py`). Only VERIFIED weight counts as verified; pending
is always reported separately (BR-2).
"""

from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import selectinload
from sqlmodel import Session, select

from app.core.clock import thailand_day_start, thailand_month_start
from app.features.f1_accounts.models import User
from app.features.f2_record_collection.models import STATUSES, Record, make_record_number
from app.features.f3_crew_history.schemas import (
    CrewBoatWorkOut,
    CrewMemberDetailOut,
    CrewOverviewItemOut,
    CrewSummaryOut,
    RecordDetailOut,
    RecordListItemOut,
)

VALID_PERIODS = {"today", "month", "all"}
VISIBLE_CREW_STATUSES = ("ACTIVE", "SUSPENDED")


def _as_utc(dt: datetime) -> datetime:
    """Ensure a datetime is timezone-aware UTC before comparing."""
    return dt.replace(tzinfo=timezone.utc) if dt.tzinfo is None else dt


def _period_start(period: str) -> datetime | None:
    """Return the UTC start timestamp for a Thailand period filter, or None for 'all'."""
    if period == "today":
        return thailand_day_start()
    if period == "month":
        return thailand_month_start()
    return None


def _initials(name: str) -> str:
    """Compute up to 2 uppercase initials from a person's full name."""
    parts = [p for p in (name or "").strip().split() if p]
    if not parts:
        return "?"
    if len(parts) == 1:
        return parts[0][:2].upper()
    return (parts[0][0] + parts[-1][0]).upper()


def _format_weight_display(kg: float) -> str:
    """Format kilograms as tonnes (e.g. '18.2 t') or rounded kg for smaller totals."""
    if kg >= 1000:
        return f"{kg / 1000:.1f} t"
    return f"{round(kg)} kg"


def _crew_stats(records: list[Record]) -> dict:
    """Compute verified/pending totals, verification %, count, and latest record info (BR-2)."""
    verified_kg = round(sum(r.weight_kg for r in records if r.status == "VERIFIED"), 2)
    pending_kg = round(sum(r.weight_kg for r in records if r.status == "PENDING"), 2)
    total_kg = round(sum(r.weight_kg for r in records), 2)
    last_rec = records[0] if records else None
    return {
        "verified_kg": verified_kg,
        "pending_kg": pending_kg,
        "verified_percentage": round((verified_kg / total_kg) * 100) if total_kg > 0 else 0,
        "records_count": len(records),
        "pending_records_count": sum(1 for r in records if r.status == "PENDING"),
        "last_record_at": last_rec.recorded_at if last_rec else None,
        "last_record_boat": last_rec.boat.code if last_rec else None,
    }


def _to_record_item(db: Session, record: Record) -> RecordListItemOut:
    """Map a Record SQLModel row to RecordListItemOut."""
    reviewer = db.get(User, record.reviewed_by) if record.reviewed_by else None
    return RecordListItemOut(
        id=record.id,
        client_id=record.client_id,
        record_number=record.record_number or make_record_number(record.id),
        weight_kg=float(record.weight_kg),
        material=record.material,
        boat_id=record.boat_id,
        boat_code=record.boat.code,
        boat_name=record.boat.name,
        recorded_at=record.recorded_at,
        reviewed_at=record.reviewed_at,
        reviewed_by_name=reviewer.name if reviewer else None,
        status=record.status,
        reason=record.reason,
        latitude=record.latitude,
        longitude=record.longitude,
        gps_accuracy_m=record.gps_accuracy_m,
        photo_url=f"/api/photos/{record.id}",
        note=record.note,
    )


def get_my_summary(db: Session, crew_id: int) -> CrewSummaryOut:
    """Compute today/month verified and pending totals for a crew member (FR-3.1, BR-2)."""
    records = db.exec(select(Record).where(Record.crew_id == crew_id)).all()
    today_start = thailand_day_start()
    month_start = thailand_month_start()

    today_records = [r for r in records if _as_utc(r.recorded_at) >= today_start]
    month_records = [r for r in records if _as_utc(r.recorded_at) >= month_start]

    return CrewSummaryOut(
        today_verified_kg=round(sum(r.weight_kg for r in today_records if r.status == "VERIFIED"), 2),
        today_pending_kg=round(sum(r.weight_kg for r in today_records if r.status == "PENDING"), 2),
        month_verified_kg=round(sum(r.weight_kg for r in month_records if r.status == "VERIFIED"), 2),
        month_pending_kg=round(sum(r.weight_kg for r in month_records if r.status == "PENDING"), 2),
        pending_count=sum(1 for r in records if r.status == "PENDING"),
    )


def get_my_records(
    db: Session,
    crew_id: int,
    record_status: str | None = None,
) -> list[RecordListItemOut]:
    """Return all records for a crew member, newest first, optionally filtered by status (FR-3.2)."""
    statement = select(Record).options(selectinload(Record.boat)).where(Record.crew_id == crew_id)

    if record_status:
        normalized = record_status.strip().upper()
        if normalized not in STATUSES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status '{record_status}'. Must be one of: PENDING, VERIFIED, REJECTED.",
            )
        statement = statement.where(Record.status == normalized)

    records = db.exec(statement.order_by(Record.recorded_at.desc(), Record.id.desc())).all()
    return [_to_record_item(db, r) for r in records]


def get_record_detail(
    db: Session,
    record_id: int,
    user_id: int,
    user_role: str,
) -> RecordDetailOut:
    """Return read-only detail for a single record, enforcing crew ownership (FR-3.3)."""
    record = db.get(Record, record_id)
    if record is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Collection record not found.",
        )

    if user_role == "CREW_MEMBER" and record.crew_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view your own collection records.",
        )

    crew = db.get(User, record.crew_id)
    base = _to_record_item(db, record)
    return RecordDetailOut(
        **base.model_dump(),
        crew_id=record.crew_id,
        crew_name=crew.name if crew else None,
        created_at=record.created_at,
    )


def get_crew_overview(
    db: Session,
    search: str | None = None,
    period: str | None = None,
) -> list[CrewOverviewItemOut]:
    """Return crew overview for Sponsor / Management, ordered alphabetically (FR-3.4, BR-12)."""
    normalized_period = (period or "all").strip().lower()
    if normalized_period not in VALID_PERIODS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid period '{period}'. Must be one of: today, month, all.",
        )

    statement = select(User).where(
        User.role == "CREW_MEMBER",
        User.status.in_(VISIBLE_CREW_STATUSES),
    )
    crew_users = db.exec(statement.order_by(User.name)).all()
    if not crew_users:
        return []

    start_at = _period_start(normalized_period)
    rec_stmt = (
        select(Record)
        .options(selectinload(Record.boat))
        .where(Record.crew_id.in_([u.id for u in crew_users]))
        .order_by(Record.recorded_at.desc(), Record.id.desc())
    )
    if start_at is not None:
        rec_stmt = rec_stmt.where(Record.recorded_at >= start_at)

    by_crew: dict[int, list[Record]] = {u.id: [] for u in crew_users}
    for rec in db.exec(rec_stmt).all():
        by_crew[rec.crew_id].append(rec)

    term = search.strip().lower() if search and search.strip() else ""
    result: list[CrewOverviewItemOut] = []
    for u in crew_users:
        recs = by_crew[u.id]
        boats = sorted({r.boat.code for r in recs})
        if term and term not in u.name.lower() and not any(term in b.lower() for b in boats):
            continue

        result.append(
            CrewOverviewItemOut(
                id=u.id,
                user_id=u.id,
                name=u.name,
                initials=_initials(u.name),
                boats=boats,
                **_crew_stats(recs),
            )
        )
    return result


def get_crew_member_detail(db: Session, crew_id: int) -> CrewMemberDetailOut:
    """Return detailed stats, boats worked on, and recent records for one crew member (FR-3.5)."""
    user = db.get(User, crew_id)
    if user is None or user.role != "CREW_MEMBER" or user.status not in VISIBLE_CREW_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Crew member not found.",
        )

    all_records = list(
        db.exec(
            select(Record)
            .options(selectinload(Record.boat))
            .where(Record.crew_id == crew_id)
            .order_by(Record.recorded_at.desc(), Record.id.desc())
        ).all()
    )

    month_start = thailand_month_start()
    records_this_month = sum(1 for r in all_records if _as_utc(r.recorded_at) >= month_start)

    # Aggregate verified kg and record count per boat (BR-2: only VERIFIED weight in boat totals).
    boat_agg: dict[str, dict] = {}
    for r in all_records:
        code = r.boat.code
        entry = boat_agg.setdefault(
            code,
            {"code": code, "name": r.boat.name, "records": 0, "verified_kg": 0.0},
        )
        entry["records"] += 1
        if r.status == "VERIFIED":
            entry["verified_kg"] = round(entry["verified_kg"] + float(r.weight_kg), 2)

    boats_worked = [
        CrewBoatWorkOut(
            code=b["code"],
            name=b["name"],
            records=b["records"],
            verified_kg=b["verified_kg"],
            weight_display=_format_weight_display(b["verified_kg"]),
        )
        for b in sorted(boat_agg.values(), key=lambda x: x["code"])
    ]

    return CrewMemberDetailOut(
        id=user.id,
        user_id=user.id,
        name=user.name,
        initials=_initials(user.name),
        joined_at=user.created_at,
        records_this_month=records_this_month,
        boats_worked=boats_worked,
        recent_records=[_to_record_item(db, r) for r in all_records[:10]],
        **_crew_stats(all_records),
    )
