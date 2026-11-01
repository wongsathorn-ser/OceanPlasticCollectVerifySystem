"""Feature 5 - Fleet & boats: API routes.

Owner : Natthachaimongkol Chayopathum
Figma : flow 06 (Fleet overview, Boat performance, Supporting evidence)
        + Boats, Add a boat
Spec  : FR-5.1 - FR-5.5, BR-2, BR-6
"""

from fastapi import APIRouter

router = APIRouter(prefix="/api", tags=["F5 - Fleet & boats"])

# TODO(F5) planned endpoints (spec section 7). Paths below are relative to /api.
#
#   GET   /boats?active=true          any signed in  FR-2.1  crews only see active boats (BR-6)
#   POST  /boats                      ADMIN          FR-5.4  code unique, capacity_kg > 0
#   PATCH /boats/{boat_id}            ADMIN          FR-5.3  edit, activate / deactivate
#   GET   /fleet/summary?period=      SPONSOR_MGMT   FR-5.1  month | year, verified only (BR-2)
#   GET   /fleet/boats/{boat_id}      SPONSOR_MGMT   FR-5.2  boat performance + recent records
