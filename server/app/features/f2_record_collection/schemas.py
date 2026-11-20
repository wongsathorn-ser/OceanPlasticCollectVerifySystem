"""F2 responses. Photo bytes are served separately from record metadata."""
from datetime import datetime
from pydantic import BaseModel

class BoatOption(BaseModel):
    id: int
    code: str
    name: str
    capacity_kg: float
    active: bool

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
