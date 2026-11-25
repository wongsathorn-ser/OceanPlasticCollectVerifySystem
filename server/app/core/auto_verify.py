"""CHG-003 auto-verification, spot-checks and reversals (SHARED FILE).

F2 calls apply_auto_verify() right after a record is saved and committed.
F4 uses confirm_spot_check(), reject_spot_check() and reverse_record().
The numbers (50 kg, 10 records, 30 days, 10 %) come from app_settings.

    from app.core.auto_verify import apply_auto_verify
    apply_auto_verify(db, record)          # commits; returns True if auto-verified

Tests pass `random_value` (0-1) and `now` so the result is predictable.
"""

import random
from datetime import datetime, timedelta

from fastapi import HTTPException
from sqlmodel import Session, select

from app.core.app_settings import get_setting
from app.core.clock import utc_now
from app.features.f2_record_collection.models import Record, RecordFlag
from app.features.f5_fleet_boats.models import Boat


def rule_text(session: Session) -> str:
    """The rule shown as 'Auto-verified - <rule>' on the record."""
    max_kg = get_setting(session, "auto_verify_max_kg")
    count = get_setting(session, "auto_verify_min_verified")
    days = get_setting(session, "auto_verify_window_days")
    return (f"≤ {max_kg:g} kg, no flags, boat has {count:g}+ verified records "
            f"and no rejections in the last {days:g} days")


def check_auto_verify(session: Session, record: Record, now: datetime | None = None) -> list[str]:
    """Reasons why the record can NOT be auto-verified. An empty list means it can."""
    now = now or utc_now()
    reasons = []
    if record.status != "PENDING":
        reasons.append("Record is not pending.")
    if record.weight_kg > get_setting(session, "auto_verify_max_kg"):
        reasons.append("Weight is above the auto-verify limit.")
    if session.exec(select(RecordFlag).where(RecordFlag.record_id == record.id)).first():
        reasons.append("Record has flags.")
    boat = session.get(Boat, record.boat_id)
    if boat.auto_verify_blocked_until and boat.auto_verify_blocked_until > now:
        reasons.append("Boat lost auto-verification after a spot-check rejection.")
    since = now - timedelta(days=get_setting(session, "auto_verify_window_days"))
    history = session.exec(
        select(Record).where(Record.boat_id == record.boat_id, Record.id != record.id, Record.recorded_at >= since)
    ).all()
    if any(r.status == "REJECTED" for r in history):
        reasons.append("Boat had a rejected record in the window.")
    if sum(1 for r in history if r.status == "VERIFIED") < get_setting(session, "auto_verify_min_verified"):
        reasons.append("Boat has too few verified records in the window.")
    return reasons


def apply_auto_verify(session: Session, record: Record, random_value: float | None = None,
                      now: datetime | None = None) -> bool:
    """Auto-verify the record if every rule passes, maybe pick it for a spot-check. Commits."""
    now = now or utc_now()
    if check_auto_verify(session, record, now):
        return False
    record.status = "VERIFIED"
    record.auto_verified = True
    record.verified_rule = rule_text(session)
    record.reviewed_at = now
    value = random.random() if random_value is None else random_value
    record.spot_check = value * 100 < get_setting(session, "spot_check_percent")
    session.add(record)
    session.commit()
    session.refresh(record)
    return True


def _spot_check_record(session: Session, record_id: int) -> Record:
    record = session.get(Record, record_id)
    if record is None:
        raise HTTPException(404, "Record not found.")
    if not record.spot_check or record.spot_checked_at is not None:
        raise HTTPException(409, "This record is not waiting for a spot-check.")
    return record


def confirm_spot_check(session: Session, record_id: int, reviewer_id: int, now: datetime | None = None) -> Record:
    """The spot-check agrees: the record stays VERIFIED."""
    record = _spot_check_record(session, record_id)
    record.spot_checked_by, record.spot_checked_at = reviewer_id, now or utc_now()
    session.add(record)
    session.commit()
    session.refresh(record)
    return record


def reverse_record(session: Session, record_id: int, user_id: int, reason: str,
                   now: datetime | None = None) -> Record:
    """VERIFIED -> REJECTED with who, when and why (CHG-002: its reward is reversed too)."""
    record = session.get(Record, record_id)
    if record is None:
        raise HTTPException(404, "Record not found.")
    if record.status != "VERIFIED":
        raise HTTPException(409, "Only verified records can be reversed.")
    if not reason.strip():
        raise HTTPException(400, "Give a reason.")
    now = now or utc_now()
    record.status = "REJECTED"
    record.reason = reason.strip()
    record.reversed_by, record.reversed_at, record.reversal_reason = user_id, now, reason.strip()
    session.add(record)
    session.commit()
    session.refresh(record)
    return record


def reject_spot_check(session: Session, record_id: int, reviewer_id: int, reason: str,
                      now: datetime | None = None) -> Record:
    """The spot-check rejects: reverse the record and block the boat's auto-verify for 30 days."""
    now = now or utc_now()
    record = _spot_check_record(session, record_id)
    record.spot_checked_by, record.spot_checked_at = reviewer_id, now
    session.add(record)
    boat = session.get(Boat, record.boat_id)
    boat.auto_verify_blocked_until = now + timedelta(days=get_setting(session, "auto_verify_block_days"))
    session.add(boat)
    return reverse_record(session, record_id, reviewer_id, reason, now)
