from pydantic import BaseModel, Field


class BoatCreate(BaseModel):
    code: str
    name: str
    capacity_kg: float = Field(gt=0)
    active: bool = True


class BoatUpdate(BaseModel):
    code: str | None = None
    name: str | None = None
    capacity_kg: float | None = Field(default=None, gt=0)
    active: bool | None = None


class BoatOut(BaseModel):
    id: int
    code: str
    name: str
    capacity_kg: float
    active: bool
    records: int


class MaterialBreakdownItem(BaseModel):
    material: str
    verified_kg: float


class FleetBoatSummary(BaseModel):
    id: int
    code: str
    name: str
    verified_kg: float


class FleetSummaryOut(BaseModel):
    period: str
    verified_kg: float
    pending_kg: float
    records: int
    boats: int
    boats_by_verified: list[FleetBoatSummary]
    material_breakdown: list[MaterialBreakdownItem]
    pending_records: int


class RecentRecordOut(BaseModel):
    id: int
    record_number: str
    weight_kg: float
    material: str
    status: str
    recorded_at: str


class BoatPerformanceOut(BaseModel):
    id: int
    code: str
    name: str
    capacity_kg: float
    active: bool
    verified_kg: float
    records: int
    pending_kg: float
    crew: int
    material_breakdown: list[MaterialBreakdownItem]
    recent_records: list[RecentRecordOut]
