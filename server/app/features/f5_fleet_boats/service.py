"""Feature 5 - Fleet & boats service.

Fleet and boat data is stored in PostgreSQL through SQLModel.

Owner: Natthachaimongkol Chayopathum
"""

from sqlmodel import Session, select

from app.core.clock import thailand_month_start, thailand_year_start
from app.features.f2_record_collection.models import Record
from app.features.f5_fleet_boats.models import Boat


def _period_start(period: str):
    """Return the UTC start datetime for the selected Thailand period."""
    if period == "month":
        return thailand_month_start()

    if period == "year":
        return thailand_year_start()

    return None


def get_boats(db: Session):
    """Return all boats with their number of records."""

    boats = db.exec(
        select(Boat).order_by(Boat.code)
    ).all()

    result = []

    for boat in boats:
        record_count = len(
            db.exec(
                select(Record).where(Record.boat_id == boat.id)
            ).all()
        )

        result.append(
            {
                "id": boat.id,
                "code": boat.code,
                "name": boat.name,
                "capacity_kg": boat.capacity_kg,
                "active": boat.active,
                "records": record_count,
            }
        )

    return result


def create_boat(db: Session, boat_data):
    """Create a new boat in PostgreSQL."""

    existing = db.exec(
        select(Boat).where(Boat.code == boat_data["code"])
    ).first()

    if existing is not None:
        return None

    boat = Boat(
        code=boat_data["code"].strip(),
        name=boat_data["name"].strip(),
        capacity_kg=boat_data["capacity_kg"],
        active=boat_data.get("active", True),
    )

    db.add(boat)
    db.commit()
    db.refresh(boat)

    return {
        "id": boat.id,
        "code": boat.code,
        "name": boat.name,
        "capacity_kg": boat.capacity_kg,
        "active": boat.active,
        "records": 0,
    }


def update_boat(db: Session, boat_id: int, boat_data):
    """Update an existing boat in PostgreSQL."""

    boat = db.get(Boat, boat_id)

    if boat is None:
        return None

    if "code" in boat_data and boat_data["code"] is not None:
        boat.code = boat_data["code"].strip()

    if "name" in boat_data and boat_data["name"] is not None:
        boat.name = boat_data["name"].strip()

    if "capacity_kg" in boat_data and boat_data["capacity_kg"] is not None:
        boat.capacity_kg = boat_data["capacity_kg"]

    if "active" in boat_data and boat_data["active"] is not None:
        boat.active = boat_data["active"]

    db.add(boat)
    db.commit()
    db.refresh(boat)

    record_count = len(
        db.exec(
            select(Record).where(Record.boat_id == boat.id)
        ).all()
    )

    return {
        "id": boat.id,
        "code": boat.code,
        "name": boat.name,
        "capacity_kg": boat.capacity_kg,
        "active": boat.active,
        "records": record_count,
    }


def get_fleet_summary(db: Session, period: str = "month"):
    """Return fleet summary calculated from PostgreSQL records."""

    start = _period_start(period)

    if start is None:
        return None

    boats = db.exec(
        select(Boat).order_by(Boat.code)
    ).all()

    records = db.exec(
        select(Record).where(Record.recorded_at >= start)
    ).all()

    verified_records = [
        record
        for record in records
        if record.status == "VERIFIED"
    ]

    pending_records = [
        record
        for record in records
        if record.status == "PENDING"
    ]

    verified_kg = sum(
        record.weight_kg
        for record in verified_records
    )

    pending_kg = sum(
        record.weight_kg
        for record in pending_records
    )

    boats_by_verified = []

    for boat in boats:
        boat_verified_kg = sum(
            record.weight_kg
            for record in verified_records
            if record.boat_id == boat.id
        )

        boats_by_verified.append(
            {
                "id": boat.id,
                "code": boat.code,
                "name": boat.name,
                "verified_kg": boat_verified_kg,
            }
        )

    boats_by_verified.sort(
        key=lambda item: item["verified_kg"],
        reverse=True,
    )

    material_totals = {}

    for record in verified_records:
        material_totals[record.material] = (
            material_totals.get(record.material, 0)
            + record.weight_kg
        )

    material_breakdown = [
        {
            "material": material,
            "verified_kg": weight,
        }
        for material, weight in material_totals.items()
    ]

    material_breakdown.sort(
        key=lambda item: item["verified_kg"],
        reverse=True,
    )

    return {
        "period": period,
        "verified_kg": verified_kg,
        "pending_kg": pending_kg,
        "records": len(records),
        "boats": len(boats),
        "pending_records": len(pending_records),
        "boats_by_verified": boats_by_verified,
        "material_breakdown": material_breakdown,
    }


def get_boat_performance(
    db: Session,
    boat_id: int,
    period: str = "month",
):
    """Return performance information for one boat."""

    start = _period_start(period)

    if start is None:
        return None

    boat = db.get(Boat, boat_id)

    if boat is None:
        return None

    records = db.exec(
        select(Record)
        .where(
            Record.boat_id == boat_id,
            Record.recorded_at >= start,
        )
        .order_by(Record.recorded_at.desc())
    ).all()

    verified_records = [
        record
        for record in records
        if record.status == "VERIFIED"
    ]

    pending_records = [
        record
        for record in records
        if record.status == "PENDING"
    ]

    verified_kg = sum(
        record.weight_kg
        for record in verified_records
    )

    pending_kg = sum(
        record.weight_kg
        for record in pending_records
    )

    crew_ids = {
        record.crew_id
        for record in records
    }

    material_totals = {}

    for record in verified_records:
        material_totals[record.material] = (
            material_totals.get(record.material, 0)
            + record.weight_kg
        )

    material_breakdown = [
        {
            "material": material,
            "verified_kg": weight,
        }
        for material, weight in material_totals.items()
    ]

    material_breakdown.sort(
        key=lambda item: item["verified_kg"],
        reverse=True,
    )

    recent_records = []

    for record in records[:10]:
        recent_records.append(
            {
                "id": record.id,
                "record_number": record.record_number,
                "weight_kg": record.weight_kg,
                "material": record.material,
                "status": record.status,
                "recorded_at": record.recorded_at.isoformat(),
            }
        )

    return {
        "id": boat.id,
        "code": boat.code,
        "name": boat.name,
        "capacity_kg": boat.capacity_kg,
        "active": boat.active,
        "verified_kg": verified_kg,
        "records": len(records),
        "pending_kg": pending_kg,
        "crew": len(crew_ids),
        "material_breakdown": material_breakdown,
        "recent_records": recent_records,
    }
