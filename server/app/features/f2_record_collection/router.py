"""F2 endpoints: session-owned immutable records and protected scale photos."""
from typing import Annotated
from fastapi import APIRouter, Depends, File, Form, HTTPException, Response, UploadFile
from sqlmodel import select

from app.core.database import SessionDep
from app.features.f1_accounts.dependencies import CurrentUser, require_role
from app.features.f1_accounts.schemas import UserOut
from app.features.f2_record_collection import service
from app.features.f2_record_collection.models import Photo, Record
from app.features.f2_record_collection.schemas import BoatOption, RecordOut
from app.features.f5_fleet_boats.models import Boat

router = APIRouter(prefix="/api", tags=["F2 - Record a collection"])
Crew = Annotated[UserOut, Depends(require_role("CREW_MEMBER"))]


@router.get("/records/boats", response_model=list[BoatOption])
def record_boats(user: Crew, db: SessionDep):
    """DB-backed picker until F5 replaces its mock /boats service (FR-2.1)."""
    return db.exec(select(Boat).where(Boat.active == True).order_by(Boat.code)).all()  # noqa: E712


@router.post("/records", response_model=RecordOut, status_code=201)
def post_record(
    response: Response, user: Crew, db: SessionDep,
    client_id: str | None = Form(None),
    boat_id: str | None = Form(None), weight_kg: str | None = Form(None),
    material: str | None = Form(None), note: str | None = Form(None),
    latitude: str | None = Form(None), longitude: str | None = Form(None),
    gps_accuracy_m: str | None = Form(None), recorded_at: str | None = Form(None),
    expected_crew_id: str | None = Form(None), photo: UploadFile | None = File(None),
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
    if photo is None:
        raise HTTPException(400, "A scale photo is required.")
    data = photo.file.read(service.MAX_PHOTO_BYTES + 1)
    fields = dict(boat_id=boat_id, weight_kg=weight_kg, material=material, note=note,
                  latitude=latitude, longitude=longitude, gps_accuracy_m=gps_accuracy_m, recorded_at=recorded_at)
    record, created = service.create_record(db, user.id, client_id, fields, data, photo.content_type)
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
    # CHG-004: ?kind=SCALE (default, same as before) or ?kind=PLASTIC
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
