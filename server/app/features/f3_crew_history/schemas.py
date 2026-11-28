"""Feature 3 - Pydantic response models (FR-3.1 - FR-3.5, BR-2, BR-12)."""

from datetime import datetime

from pydantic import BaseModel


class CrewSummaryOut(BaseModel):
    """Personal dashboard totals for the signed-in crew member (BR-2)."""

    today_verified_kg: float
    today_pending_kg: float
    month_verified_kg: float
    month_pending_kg: float
    pending_count: int


class CrewEarningsOut(BaseModel):
    """CHG-002: the signed-in crew member's rewards in THB (app/core/rewards.py)."""

    this_month: float  # VERIFIED records collected this month (Thailand time)
    to_date: float  # all VERIFIED records
    pending: float  # PENDING records, at their collection-date rate, not paid yet
    currency: str = "THB"


class RecordListItemOut(BaseModel):
    """Summary row for a collection record in My history / recent records."""

    id: int
    client_id: str | None = None
    record_number: str
    weight_kg: float
    material: str
    boat_id: int
    boat_code: str
    boat_name: str
    recorded_at: datetime
    reviewed_at: datetime | None = None
    reviewed_by_name: str | None = None
    status: str
    reason: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    gps_accuracy_m: float | None = None
    photo_url: str
    note: str | None = None


class RecordDetailOut(RecordListItemOut):
    """Read-only collection record detail (FR-3.3)."""

    crew_id: int
    crew_name: str | None = None
    created_at: datetime | None = None


class CrewBoatWorkOut(BaseModel):
    """Verified weight and record count per boat for a crew member (FR-3.5)."""

    code: str
    name: str
    records: int
    verified_kg: float
    weight_display: str


class CrewOverviewItemOut(BaseModel):
    """Crew overview card data for Sponsor / Management (FR-3.4, BR-12)."""

    id: int
    user_id: int
    name: str
    initials: str
    boats: list[str]
    verified_kg: float
    pending_kg: float
    verified_percentage: int
    records_count: int
    pending_records_count: int
    last_record_at: datetime | None = None
    last_record_boat: str | None = None


class CrewMemberDetailOut(BaseModel):
    """Detailed crew member view for Sponsor / Management (FR-3.5)."""

    id: int
    user_id: int
    name: str
    initials: str
    joined_at: datetime | None = None
    verified_kg: float
    pending_kg: float
    verified_percentage: int
    records_count: int
    records_this_month: int
    pending_records_count: int
    last_record_at: datetime | None = None
    last_record_boat: str | None = None
    boats_worked: list[CrewBoatWorkOut]
    recent_records: list[RecordListItemOut]
