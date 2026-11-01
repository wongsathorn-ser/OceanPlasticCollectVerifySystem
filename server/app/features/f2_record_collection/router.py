"""Feature 2 - Record a collection: API routes.

Owner : Masaaki Kato
Figma : flow 02 (Choose the boat, Enter collection & evidence, Collection saved)
        + Send / "Saved on this phone" state
Spec  : FR-2.1 - FR-2.8, BR-1, BR-3, BR-5, BR-10, BR-11, NFR-16, NFR-19
"""

from fastapi import APIRouter

router = APIRouter(prefix="/api", tags=["F2 - Record a collection"])

# TODO(F2) planned endpoints (spec section 7). Paths below are relative to /api.
#
#   POST /records             CREW         FR-2.3  multipart: photo + fields incl. client_id
#                                                  idempotent by client_id (BR-10),
#                                                  crew_id from the session (BR-11)
#   GET  /photos/{record_id}  signed in    FR-3.3  photo bytes; same permission check
#                                                  as the record (crew: own, sponsor: all)
#
# The boat list used by the boat picker is GET /api/boats (Feature 5).
