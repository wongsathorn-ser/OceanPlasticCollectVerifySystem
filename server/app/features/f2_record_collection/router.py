"""F2 endpoints: session-owned immutable records and protected scale photos."""
from typing import Annotated
from fastapi import APIRouter, Depends, File, Form, HTTPException, Response, UploadFile
from sqlmodel import select

import math
from app.core.database import SessionDep
from app.core.app_settings import get_setting
from app.core.evidence import within_landing_site, nearest_landing_site
from app.features.f1_accounts.dependencies import CurrentUser, require_role
from app.features.f1_accounts.schemas import UserOut
from app.features.f2_record_collection import service
from app.features.f2_record_collection.models import PHOTO_KINDS, Photo, Record
from app.features.f2_record_collection.schemas import BoatOption, LandingConfig, LocationCheck, RecordOut, SiteOut
from app.features.f5_fleet_boats.models import Boat, LandingSite

router = APIRouter(prefix="/api", tags=["F2 - Record a collection"])
Crew = Annotated[UserOut, Depends(require_role("CREW_MEMBER"))]


@router.get("/records/boats", response_model=list[BoatOption])
def record_boats(user: Crew, db: SessionDep):
    """Legacy F2 picker endpoint; the current UI uses F5's DB-backed /boats."""
    return db.exec(select(Boat).where(Boat.active == True).order_by(Boat.code)).all()  # noqa: E712


@router.get("/records/landing-sites", response_model=LandingConfig)
def landing_sites(user: Crew, db: SessionDep):
    """Cache active sites + the shared radius so offline capture can be checked."""
    sites = db.exec(select(LandingSite).where(LandingSite.active).order_by(LandingSite.name)).all()
    return LandingConfig(sites=[SiteOut.model_validate(site, from_attributes=True) for site in sites],
                         radius_m=get_setting(db, "landing_site_radius_m"))


@router.get("/records/location-check", response_model=LocationCheck)
def location_check(user: Crew, db: SessionDep, latitude: str | None = None, longitude: str | None = None):
    lat = service.number(latitude, "Latitude", -90, 90)
    lon = service.number(longitude, "Longitude", -180, 180)
    allowed, distance = within_landing_site(db, lat, lon)
    nearest = allowed or nearest_landing_site(db, lat, lon)[0]
    return LocationCheck(within_radius=allowed is not None,
                         distance_m=distance if math.isfinite(distance) else None,
                         radius_m=get_setting(db, "landing_site_radius_m"),
                         site=SiteOut.model_validate(nearest, from_attributes=True) if nearest else None)


@router.post("/records", response_model=RecordOut, status_code=201)
def post_record(
    response: Response, user: Crew, db: SessionDep,
    client_id: str | None = Form(None),
    boat_id: str | None = Form(None), weight_kg: str | None = Form(None),
    material: str | None = Form(None), note: str | None = Form(None),
    latitude: str | None = Form(None), longitude: str | None = Form(None),
    gps_accuracy_m: str | None = Form(None), recorded_at: str | None = Form(None),
    expected_crew_id: str | None = Form(None),
    plastic_photo: UploadFile | None = File(None), scale_photo: UploadFile | None = File(None),
):
    # expected_crew_id guards offline account switches. The actual crew_id
    # always comes from the session, regardless of any posted crew_id (BR-11).
    if expected_crew_id is not None and expected_crew_id != str(user.id):
        raise HTTPException(409, "Sign in with the crew account that saved this record.")
    client_id = service.canonical_client_id(client_id)
    existing = service.existing_record(db, client_id, user.id)
    if existing:
        response.status_code = 200
        return service.record_out(db, existing)
    if plastic_photo is None or scale_photo is None:
        raise HTTPException(400, "Both plastic and scale photos are required.")
    photos = {kind: (upload.file.read(service.MAX_PHOTO_BYTES + 1), upload.content_type)
              for kind, upload in (("PLASTIC", plastic_photo), ("SCALE", scale_photo))}
    fields = dict(boat_id=boat_id, weight_kg=weight_kg, material=material, note=note,
                  latitude=latitude, longitude=longitude, gps_accuracy_m=gps_accuracy_m, recorded_at=recorded_at)
    record, created = service.create_record(db, user.id, client_id, fields, photos)
    response.status_code = 201 if created else 200
    return service.record_out(db, record)


@router.get("/records/submissions/{client_id}", response_model=RecordOut)
def submission(client_id: str, user: Crew, db: SessionDep):
    """Recover the F2 confirmation after a reload."""
    record = db.exec(select(Record).where(
        Record.client_id == service.canonical_client_id(client_id), Record.crew_id == user.id,
    )).first()
    if not record:
        raise HTTPException(404, "Record not found.")
    return service.record_out(db, record)


@router.get("/photos/{record_id}")
def get_photo(record_id: int, user: CurrentUser, db: SessionDep, kind: str = "SCALE"):
    # CHG-004: ?kind=SCALE (default) or ?kind=PLASTIC.
    if kind.upper() not in PHOTO_KINDS:
        raise HTTPException(400, "Choose PLASTIC or SCALE photo kind.")
    if user.role not in ("CREW_MEMBER", "SPONSOR_MANAGEMENT"):
        raise HTTPException(403, "You do not have permission to do this.")
    record = db.get(Record, record_id)
    if not record or (user.role == "CREW_MEMBER" and record.crew_id != user.id):
        raise HTTPException(404, "Record not found.")
    photo = db.exec(select(Photo).where(Photo.record_id == record_id, Photo.kind == kind.upper())).first()
    if not photo:
        raise HTTPException(404, "Photo not found.")
    return Response(photo.data, media_type=photo.content_type, headers={
        "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'; sandbox",
    })
