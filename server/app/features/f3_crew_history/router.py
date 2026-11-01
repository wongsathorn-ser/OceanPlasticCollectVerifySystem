"""Feature 3 - Crew home & history: API routes.

Owner : Kaung Khant Paing
Figma : flow 03 (Personal dashboard, My history, Collection record)
        flow 05 (Crew overview, Crew member details, Collection evidence)
Spec  : FR-3.1 - FR-3.5, BR-2, BR-12
"""

from fastapi import APIRouter

router = APIRouter(prefix="/api", tags=["F3 - Crew home & history"])

# TODO(F3) planned endpoints (spec section 7). Paths below are relative to /api.
# Declare /records/mine BEFORE /records/{record_id} so "mine" is not read as an id.
#
#   GET /me/summary                 CREW           FR-3.1  today / month / pending (BR-2)
#   GET /records/mine?status=       CREW           FR-3.2  newest first
#   GET /records/{record_id}        CREW (own) /   FR-3.3  detail incl. reviewer + reason
#                                   SPONSOR_MGMT
#   GET /crew?search=&period=       SPONSOR_MGMT   FR-3.4  not a ranking (BR-12)
#   GET /crew/{crew_id}             SPONSOR_MGMT   FR-3.5
