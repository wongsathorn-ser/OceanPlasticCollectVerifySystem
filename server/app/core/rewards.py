"""CHG-002 crew rewards (SHARED FILE).

A reward is CALCULATED, never stored: weight_kg x the rate of the record's
material that is valid on its collection date (Thailand date). Only VERIFIED
records earn, so a REJECTED or reversed record earns nothing automatically.

    from app.core.rewards import crew_earnings, boat_payouts

    crew_earnings(session, user.id)  # {"this_month": .., "to_date": .., "pending": ..}  (F3 crew home)
    boat_payouts(session)            # {boat_id: THB}                                  (F5 fleet overview)
"""

from datetime import date, datetime

from sqlmodel import Session, select

from app.core.clock import thailand_month_start, to_thailand
from app.features.f2_record_collection.models import Record
from app.features.f5_fleet_boats.models import RewardRate


def load_rates(session: Session) -> dict[str, list[RewardRate]]:
    """All rates per material, oldest first. The table is small, so read it once per request."""
    rates: dict[str, list[RewardRate]] = {}
    for rate in session.exec(select(RewardRate).order_by(RewardRate.valid_from)).all():
        rates.setdefault(rate.material, []).append(rate)
    return rates


def collection_date(record: Record) -> date:
    """The day the load was collected, in Thailand."""
    return to_thailand(record.recorded_at).date()


def rate_on(rates: dict[str, list[RewardRate]], material: str, day: date) -> float:
    """THB per kg for `material` on `day`: the newest rate with valid_from <= day (0 if none)."""
    value = 0.0
    for rate in rates.get(material, []):
        if rate.valid_from <= day:
            value = rate.rate_thb_per_kg
    return value


def reward_amount(record: Record, rates: dict[str, list[RewardRate]]) -> float:
    """What the record pays at its collection-date rate, whatever its status."""
    return round(record.weight_kg * rate_on(rates, record.material, collection_date(record)), 2)


def record_reward(record: Record, rates: dict[str, list[RewardRate]]) -> float:
    """The reward actually earned: only VERIFIED records earn (BR: rejected/reversed earn nothing)."""
    return reward_amount(record, rates) if record.status == "VERIFIED" else 0.0


def crew_earnings(session: Session, crew_id: int, now: datetime | None = None) -> dict[str, float]:
    """Crew home (CHG-002): earnings this month, earnings to date, amount pending verification."""
    rates = load_rates(session)
    month_start = thailand_month_start(now)
    records = session.exec(
        select(Record).where(Record.crew_id == crew_id, Record.status.in_(["VERIFIED", "PENDING"]))
    ).all()
    this_month = to_date = pending = 0.0
    for record in records:
        amount = reward_amount(record, rates)
        if record.status == "PENDING":
            pending += amount
        else:
            to_date += amount
            if record.recorded_at >= month_start:
                this_month += amount
    return {"this_month": round(this_month, 2), "to_date": round(to_date, 2), "pending": round(pending, 2)}


def boat_payouts(session: Session, since: datetime | None = None) -> dict[int, float]:
    """Fleet overview (CHG-002): total paid for VERIFIED records per boat (optionally since a date)."""
    rates = load_rates(session)
    statement = select(Record).where(Record.status == "VERIFIED")
    if since is not None:
        statement = statement.where(Record.recorded_at >= since)
    totals: dict[int, float] = {}
    for record in session.exec(statement).all():
        totals[record.boat_id] = round(totals.get(record.boat_id, 0.0) + reward_amount(record, rates), 2)
    return totals
