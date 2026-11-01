"""Feature 4 - Verification: API routes.

Owner : Hein Thant Si Thu
Figma : flow 04 (Pending queue, Review record, Reject record, Decision history)
Spec  : FR-4.1 - FR-4.5, BR-1, BR-4
"""

from fastapi import APIRouter

router = APIRouter(prefix="/api", tags=["F4 - Verification"])

# TODO(F4) planned endpoints (spec section 7). Paths below are relative to /api.
# All of them are SPONSOR_MANAGEMENT only.
#
#   GET  /verify/queue                 FR-4.1  PENDING records, oldest first, + weight waiting
#   GET  /verify/history               FR-4.5  VERIFIED + REJECTED with reviewer, date, reason
#   POST /records/{record_id}/verify   FR-4.4  sets reviewed_by / reviewed_at
#   POST /records/{record_id}/reject   FR-4.3  body: {reason} (required, BR-4)
#
# Only PENDING records can be decided; a second decision returns 409 Conflict (FR-4.4).
