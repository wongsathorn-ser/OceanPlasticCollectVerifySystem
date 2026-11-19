"""Feature 5 - Fleet & boats: API routes.

Fleet & boats API backed by PostgreSQL through SQLModel.

Owner: Natthachaimongkol Chayopathum
"""

from fastapi import APIRouter, HTTPException, Query

from app.core.database import SessionDep

from .schemas import (
    BoatCreate,
    BoatOut,
    BoatUpdate,
    BoatPerformanceOut,
    FleetSummaryOut,
)

from .service import (
    get_boats,
    create_boat,
    update_boat,
    get_fleet_summary,
    get_boat_performance,
)


router = APIRouter(
    prefix="/api",
    tags=["F5 - Fleet & boats"],
)


@router.get("/boats", response_model=list[BoatOut])
def list_boats(db: SessionDep):
    """Return all boats."""
    return get_boats(db)


@router.post("/boats", response_model=BoatOut, status_code=201)
def add_boat(boat: BoatCreate, db: SessionDep):
    """Create a new boat."""
    created = create_boat(
        db,
        boat.model_dump(),
    )

    if created is None:
        raise HTTPException(
            status_code=409,
            detail="Boat code already exists.",
        )

    return created


@router.patch("/boats/{boat_id}", response_model=BoatOut)
def edit_boat(
    boat_id: int,
    boat: BoatUpdate,
    db: SessionDep,
):
    """Update an existing boat."""
    updated = update_boat(
        db,
        boat_id,
        boat.model_dump(exclude_unset=True),
    )

    if updated is None:
        raise HTTPException(
            status_code=404,
            detail="Boat not found.",
        )

    return updated


@router.get("/fleet/summary", response_model=FleetSummaryOut)
def fleet_summary(
    db: SessionDep,
    period: str = Query(default="month"),
):
    """Return fleet summary for the selected period."""

    if period not in {"month", "year"}:
        raise HTTPException(
            status_code=400,
            detail="Period must be 'month' or 'year'.",
        )

    summary = get_fleet_summary(
        db,
        period,
    )

    if summary is None:
        raise HTTPException(
            status_code=404,
            detail="Fleet summary not found.",
        )

    return summary


@router.get(
    "/fleet/boats/{boat_id}",
    response_model=BoatPerformanceOut,
)
def fleet_boat(
    boat_id: int,
    db: SessionDep,
    period: str = Query(default="month"),
):
    """Return performance information for one boat."""

    if period not in {"month", "year"}:
        raise HTTPException(
            status_code=400,
            detail="Period must be 'month' or 'year'.",
        )

    performance = get_boat_performance(
        db,
        boat_id,
        period,
    )

    if performance is None:
        raise HTTPException(
            status_code=404,
            detail="Boat performance not found.",
        )

    return performance
