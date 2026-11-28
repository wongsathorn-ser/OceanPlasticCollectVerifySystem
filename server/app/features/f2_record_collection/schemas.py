"""F2 responses; image bytes are fetched from protected photo endpoints."""
from datetime import datetime
from pydantic import BaseModel


class BoatOption(BaseModel):
    id: int
    code: str
    name: str
    capacity_kg: float
    active: bool


class SiteOut(BaseModel):
    id: int
    name: str
    kind: str
    latitude: float
    longitude: float


class LandingConfig(BaseModel):
    sites: list[SiteOut]
    radius_m: float


class LocationCheck(BaseModel):
    within_radius: bool
    distance_m: float | None
    radius_m: float
    site: SiteOut | None


class FlagOut(BaseModel):
    flag: str
    detail: str | None


class PhotoOut(BaseModel):
    kind: str
    size_bytes: int
    url: str


class RecordOut(BaseModel):
    id: int
    client_id: str
    record_number: str
    boat_id: int
    boat_code: str
    boat_name: str
    crew_id: int
    weight_kg: float
    material: str
    note: str | None
    latitude: float
    longitude: float
    gps_accuracy_m: float
    recorded_at: datetime
    status: str
    created_at: datetime
    photo_url: str
    photos: list[PhotoOut]
    landing_site_id: int | None
    landing_site_name: str | None
    flags: list[FlagOut]
    auto_verified: bool
    verified_rule: str | None
    spot_check: bool
