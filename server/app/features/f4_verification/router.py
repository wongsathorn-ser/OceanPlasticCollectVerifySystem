"""Feature 4 - Sponsor / Management verification endpoints.

Spec: FR-4.1 - FR-4.5, BR-1 and BR-4.
"""

from typing import Annotated

from fastapi import APIRouter, Depends

from app.core.database import SessionDep
from app.features.f1_accounts.dependencies import CurrentUser, require_role
from app.features.f1_accounts.schemas import UserOut
from app.features.f4_verification import service
from app.features.f4_verification.schemas import RejectIn, VerificationRecordOut

router = APIRouter(prefix="/api", tags=["F4 - Verification"])
Supervisor = Annotated[UserOut, Depends(require_role("SPONSOR_MANAGEMENT"))]


@router.get("/verify/queue", response_model=list[VerificationRecordOut])
def verification_queue(_user: Supervisor, db: SessionDep):
    """FR-4.1: pending records in oldest-first order."""
    return service.get_queue(db)


@router.get("/verify/history", response_model=list[VerificationRecordOut])
def decision_history(_user: Supervisor, db: SessionDep):
    """FR-4.5: verified and rejected records, with reviewer and decision date."""
    return service.get_history(db)


@router.get("/verify/records/{record_id}", response_model=VerificationRecordOut)
def verification_record(record_id: int, _user: Supervisor, db: SessionDep):
    """FR-4.2: details and protected scale-photo URL for review."""
    return service.get_record(db, record_id)


@router.post("/records/{record_id}/verify", response_model=VerificationRecordOut)
def verify_record(record_id: int, user: CurrentUser, _role: Supervisor, db: SessionDep):
    """FR-4.4: mark a pending record verified exactly once."""
    return service.decide(db, record_id, user.id, "VERIFIED")


@router.post("/records/{record_id}/reject", response_model=VerificationRecordOut)
def reject_record(record_id: int, payload: RejectIn, user: CurrentUser, _role: Supervisor, db: SessionDep):
    """FR-4.3/BR-4: reject a pending record with a non-empty reason."""
    return service.decide(db, record_id, user.id, "REJECTED", payload.reason)
