"""CHG-004 evidence checks (SHARED FILE) - used by F2 when a record is saved.

    from app.core.evidence import add_photo, check_evidence

    record = Record(...); db.add(record); db.flush()
    add_photo(db, record, "PLASTIC", plastic_bytes, "image/jpeg")
    add_photo(db, record, "SCALE", scale_bytes, "image/jpeg")
    check_evidence(db, record)   # sets landing_site_id, adds flags
    db.commit()

Distance: haversine formula with Python's math module (no library).
Photo hash: SHA-256 from Python's hashlib (exact copies only).
"""

import hashlib
import math

from sqlmodel import Session, select

from app.core.app_settings import get_setting
from app.features.f2_record_collection.models import Photo, Record, RecordFlag
from app.features.f5_fleet_boats.models import LandingSite

EARTH_RADIUS_M = 6_371_000


def distance_m(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Distance in metres between two GPS points (haversine)."""
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp, dl = p2 - p1, math.radians(lon2 - lon1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * EARTH_RADIUS_M * math.asin(math.sqrt(min(1.0, max(0.0, a))))


def nearest_landing_site(session: Session, latitude: float, longitude: float) -> tuple[LandingSite | None, float]:
    """The closest ACTIVE landing site and its distance in metres (None, inf if there are none)."""
    best, best_distance = None, math.inf
    for site in session.exec(select(LandingSite).where(LandingSite.active)).all():
        d = distance_m(latitude, longitude, site.latitude, site.longitude)
        if d < best_distance:
            best, best_distance = site, d
    return best, best_distance


def within_landing_site(session: Session, latitude: float, longitude: float) -> tuple[LandingSite | None, float]:
    """(site, distance) when within the allowed radius (100 m by default), else (None, distance)."""
    site, d = nearest_landing_site(session, latitude, longitude)
    if site is None or d > get_setting(session, "landing_site_radius_m"):
        return None, d
    return site, d


def photo_sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def add_photo(session: Session, record: Record, kind: str, data: bytes, content_type: str) -> Photo:
    """Add one photo (kind PLASTIC or SCALE) with its hash. The record must already have an id."""
    photo = Photo(
        record_id=record.id, kind=kind, sha256=photo_sha256(data),
        content_type=content_type, size_bytes=len(data), data=data,
    )
    session.add(photo)
    return photo


def check_evidence(session: Session, record: Record) -> list[RecordFlag]:
    """Set record.landing_site_id and add flags. Call after add_photo + flush, before commit.

    - OUTSIDE_LANDING_SITE: GPS is not within the radius of an active landing site.
    - DUPLICATE_PHOTO: a photo of this record has the same hash as a photo of an earlier record.
    """
    session.flush()
    flags: list[RecordFlag] = []
    site, d = within_landing_site(session, record.latitude, record.longitude)
    if site is not None:
        record.landing_site_id = site.id
    else:
        flags.append(RecordFlag(record_id=record.id, flag="OUTSIDE_LANDING_SITE",
                                detail=(f"{round(d)} m from the nearest landing site" if math.isfinite(d) else "No active landing site is configured.")))

    for photo in session.exec(select(Photo).where(Photo.record_id == record.id)).all():
        earlier = session.exec(
            select(Photo).where(Photo.sha256 == photo.sha256, Photo.record_id != record.id).order_by(Photo.record_id)
        ).first()
        if earlier is not None:
            other = session.get(Record, earlier.record_id)
            flags.append(RecordFlag(record_id=record.id, flag="DUPLICATE_PHOTO",
                                    detail=f"Same {photo.kind.lower()} photo as {other.record_number}"))
    for flag in flags:
        session.add(flag)
    session.add(record)
    return flags
