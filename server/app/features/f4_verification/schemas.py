"""Feature 4 response and request schemas (FR-4.1 - FR-4.5)."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


def _to_camel(name: str) -> str:
    first, *rest = name.split("_")
    return first + "".join(part.capitalize() for part in rest)


class VerificationRecordOut(BaseModel):
    """Record details consumed by the F4 verification screens."""

    model_config = ConfigDict(alias_generator=_to_camel, populate_by_name=True)

    id: int
    record_number: str
    crew: str
    boat: str
    material: str
    weight_kg: float
    recorded_at: datetime
    photo_url: str
    note: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    gps_accuracy_m: float | None = None
    status: str
    reason: str | None = None
    reviewed_by: str | None = None
    reviewed_at: datetime | None = None


class RejectIn(BaseModel):
    """Rejection reason; whitespace-only/missing reasons return HTTP 400."""

    reason: str | None = Field(default=None, max_length=500)
