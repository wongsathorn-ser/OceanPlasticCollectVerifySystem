"""Feature 2 - seed data, called by app/seed.py (after users, boats and landing sites).

Demo records in all three statuses (NFR-21), updated for the change requests
(decision D13):
- CHG-004: two photos per record (PLASTIC + SCALE) with their sha256, GPS
  within ~40 m of an active landing site, one record with a DUPLICATE_PHOTO
  flag and one with an OUTSIDE_LANDING_SITE flag.
- CHG-003: three small auto-verified records; one is waiting for a spot-check.
Written in the shared schema PR (team decision D11) - owner please review.

The records are spread over the last 60 days in Thailand time, so "today",
"this month" and "this year" totals all show something. A fixed random seed
gives the same demo data on every computer.
"""

import hashlib
import random
from datetime import timedelta

from sqlmodel import Session, select

from app.core.clock import THAILAND, thailand_day_start, utc_now
from app.features.f1_accounts.models import User
from app.features.f2_record_collection.models import MATERIALS, Photo, Record, RecordFlag, make_record_number
from app.features.f5_fleet_boats.models import Boat, LandingSite

REJECT_REASONS = [
    "The scale reading is not visible in the photo.",
    "The weight does not match the photo.",
    "The photo shows a different boat.",
]
AUTO_VERIFY_RULE = "≤ 50 kg, no flags, boat has 10+ verified records and no rejections in the last 30 days"


def demo_photo(kind: str, weight_kg: float, label: str) -> bytes:
    """A small SVG picture used as a demo photo. `label` makes every photo unique."""
    if kind == "SCALE":
        middle = f'<text x="320" y="275" fill="#7ee0b0" font-family="Courier New, monospace" font-size="84" font-weight="bold" text-anchor="middle">{weight_kg:g}</text>'
        title = "DEMO SCALE PHOTO"
        caption = "kg recorded"
    else:
        middle = '<circle cx="250" cy="250" r="60" fill="#3b82a0"/><rect x="300" y="200" width="110" height="100" rx="10" fill="#5fa8c4"/>'
        title = "DEMO PLASTIC PHOTO"
        caption = "load before weighing"
    svg = f"""<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480" viewBox="0 0 640 480">
<rect width="640" height="480" fill="#0f2a33"/>
<rect x="120" y="140" width="400" height="200" rx="16" fill="#09181d" stroke="#2c4a54" stroke-width="4"/>
<text x="320" y="185" fill="#7fa3ad" font-family="Arial" font-size="18" text-anchor="middle" letter-spacing="3">{title}</text>
{middle}
<text x="320" y="315" fill="#7fa3ad" font-family="Arial" font-size="22" text-anchor="middle">{caption}</text>
<text x="320" y="420" fill="#4d6b74" font-family="Arial" font-size="14" text-anchor="middle">{label}</text>
</svg>"""
    return svg.encode()


def add_photo(session: Session, record: Record, kind: str, data: bytes) -> None:
    session.add(
        Photo(
            record_id=record.id,
            kind=kind,
            sha256=hashlib.sha256(data).hexdigest(),
            content_type="image/svg+xml",
            size_bytes=len(data),
            data=data,
        )
    )


def seed(session: Session) -> None:
    rng = random.Random(525)
    crews = session.exec(
        select(User).where(User.username.in_(["mreyes", "lnovak", "jperet", "tiversen"])).order_by(User.id)
    ).all()
    reviewer = session.exec(select(User).where(User.username == "smendes")).one()
    boats = session.exec(select(Boat).order_by(Boat.id)).all()
    sites = session.exec(select(LandingSite).where(LandingSite.active).order_by(LandingSite.id)).all()
    marco = next(c for c in crews if c.username == "mreyes")
    lea = next(c for c in crews if c.username == "lnovak")
    harbor_cleaner = boats[0]

    now = utc_now()
    # Thailand 09:00 today, as UTC
    today_9am = now.astimezone(THAILAND).replace(hour=9, minute=0, second=0, microsecond=0)

    def when(days_ago: int) -> object:
        recorded_at = today_9am - timedelta(days=days_ago) + timedelta(minutes=rng.randint(0, 8 * 60))
        if recorded_at > now:  # early morning: keep today's records inside today
            recorded_at = max(thailand_day_start(now), now - timedelta(minutes=rng.randint(5, 60)))
        return recorded_at

    def new_record(days_ago: int, crew: User, boat: Boat, weight: float, at_site: bool = True) -> Record:
        recorded_at = when(days_ago)
        site = rng.choice(sites)
        if at_site:  # within about 40 m of the landing site (CHG-004)
            latitude = round(site.latitude + rng.uniform(-0.0003, 0.0003), 6)
            longitude = round(site.longitude + rng.uniform(-0.0003, 0.0003), 6)
        else:  # about 2 km away
            latitude, longitude = round(site.latitude + 0.018, 6), round(site.longitude + 0.004, 6)
        return Record(
            boat_id=boat.id,
            crew_id=crew.id,
            weight_kg=weight,
            material=rng.choice(MATERIALS),
            latitude=latitude,
            longitude=longitude,
            gps_accuracy_m=round(rng.uniform(3, 12), 1),
            landing_site_id=site.id if at_site else None,
            recorded_at=recorded_at,
            created_at=recorded_at + timedelta(minutes=rng.randint(1, 30)),
        )

    def save(record: Record, scale_data: bytes | None = None) -> bytes:
        """Insert the record and its two photos; returns the scale photo bytes."""
        session.add(record)
        session.flush()  # the id exists now
        record.record_number = make_record_number(record.id)
        add_photo(session, record, "PLASTIC", demo_photo("PLASTIC", record.weight_kg, record.record_number))
        scale_data = scale_data or demo_photo("SCALE", record.weight_kg, record.record_number)
        add_photo(session, record, "SCALE", scale_data)
        session.flush()
        return scale_data

    # 1. regular history: decided by the sponsor when older than 6 days
    plans = [(days_ago, rng.choice(crews)) for days_ago in range(60, 0, -2)]
    plans += [(0, marco), (0, marco)]  # two pending records today for the crew home screen
    scale_photos = []
    for days_ago, crew in plans:
        record = new_record(days_ago, crew, rng.choice(boats), float(rng.choice(range(55, 600, 5))))
        if days_ago >= 6:
            record.status = "REJECTED" if rng.random() < 0.15 else "VERIFIED"
            record.reviewed_by = reviewer.id
            record.reviewed_at = record.recorded_at + timedelta(hours=rng.randint(2, 30))
            if record.status == "REJECTED":
                record.reason = rng.choice(REJECT_REASONS)
        scale_photos.append((record, save(record)))

    # 2. CHG-003: small records verified by the rule; the last one waits for a spot-check
    for days_ago, weight, spot in [(5, 25.0, False), (4, 40.0, False), (3, 48.0, True)]:
        record = new_record(days_ago, marco, harbor_cleaner, weight)
        record.status = "VERIFIED"
        record.auto_verified = True
        record.verified_rule = AUTO_VERIFY_RULE
        record.reviewed_at = record.recorded_at + timedelta(minutes=1)
        record.spot_check = spot
        save(record)

    # 3. CHG-004 flags on two pending records
    earlier, earlier_scale = scale_photos[-5]
    duplicate = new_record(1, lea, rng.choice(boats), earlier.weight_kg)
    save(duplicate, scale_data=earlier_scale)  # same scale photo as an earlier record
    session.add(RecordFlag(record_id=duplicate.id, flag="DUPLICATE_PHOTO", detail=f"Same scale photo as {earlier.record_number}"))

    outside = new_record(1, lea, rng.choice(boats), 120.0, at_site=False)
    save(outside)
    session.add(RecordFlag(record_id=outside.id, flag="OUTSIDE_LANDING_SITE", detail="About 2 km from the nearest landing site"))
    session.flush()
