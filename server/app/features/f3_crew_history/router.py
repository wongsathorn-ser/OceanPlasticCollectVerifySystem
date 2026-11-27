"""Feature 3 - Crew home & history: API routes.

Owner : Kaung Khant Paing
Figma : flow 03 (Personal dashboard, My history, Collection record)
        flow 05 (Crew overview, Crew member details, Collection evidence)
Spec  : FR-3.1 - FR-3.5, BR-2, BR-12
"""

from fastapi import APIRouter, Depends, Query

from app.core.database import SessionDep
from app.features.f1_accounts.dependencies import CurrentUser, require_role
from app.features.f3_crew_history import service
from app.features.f3_crew_history.schemas import (
    CrewEarningsOut,
    CrewMemberDetailOut,
    CrewOverviewItemOut,
    CrewSummaryOut,
    RecordDetailOut,
    RecordListItemOut,
)

router = APIRouter(prefix="/api", tags=["F3 - Crew home & history"])


@router.get(
    "/me/summary",
    dependencies=[Depends(require_role("CREW_MEMBER"))],
)
def get_me_summary(user: CurrentUser, db: SessionDep) -> CrewSummaryOut:
    """FR-3.1: Personal dashboard totals with verified and pending separated (BR-2)."""
    return service.get_my_summary(db, user.id)


@router.get(
    "/me/earnings",
    dependencies=[Depends(require_role("CREW_MEMBER"))],
)
def get_me_earnings(user: CurrentUser, db: SessionDep) -> CrewEarningsOut:
    """CHG-002: earnings this month, earnings to date, and the amount pending verification (THB)."""
    return service.get_my_earnings(db, user.id)


@router.get(
    "/records/mine",
    dependencies=[Depends(require_role("CREW_MEMBER"))],
)
def get_my_records(
    user: CurrentUser,
    db: SessionDep,
    status: str | None = Query(default=None, description="Filter by PENDING, VERIFIED, or REJECTED"),
) -> list[RecordListItemOut]:
    """FR-3.2: All of the signed-in crew member's records, newest first."""
    return service.get_my_records(db, user.id, record_status=status)


@router.get(
    "/records/{record_id}",
    dependencies=[Depends(require_role("CREW_MEMBER", "SPONSOR_MANAGEMENT"))],
)
def get_record_detail(record_id: int, user: CurrentUser, db: SessionDep) -> RecordDetailOut:
    """FR-3.3: Read-only collection record detail (crew: own only; sponsor/mgmt: any)."""
    return service.get_record_detail(db, record_id, user.id, user.role)


@router.get(
    "/crew",
    dependencies=[Depends(require_role("SPONSOR_MANAGEMENT"))],
)
def get_crew_overview(
    db: SessionDep,
    search: str | None = Query(default=None, description="Search crew members by name or boat code"),
    period: str | None = Query(default="all", description="Period filter: today | month | all"),
) -> list[CrewOverviewItemOut]:
    """FR-3.4: Crew overview for Sponsor / Management (not a ranking, BR-12)."""
    return service.get_crew_overview(db, search=search, period=period)


@router.get(
    "/crew/{crew_id}",
    dependencies=[Depends(require_role("SPONSOR_MANAGEMENT"))],
)
def get_crew_member_detail(crew_id: int, db: SessionDep) -> CrewMemberDetailOut:
    """FR-3.5: Detailed stats, boats worked on, and recent records for a crew member."""
    return service.get_crew_member_detail(db, crew_id)
