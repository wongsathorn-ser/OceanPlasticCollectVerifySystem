# F4 · Verification (backend)

**Owner:** Hein Thant Si Thu · **Frontend:** `client/src/features/f4_verification/` · **Tests:** `server/tests/f4_verification/`

Sponsor / Management compares each pending collection with its scale photo, then verifies it or rejects it with a reason. F4 owns no database table: it reads and updates the shared `records` table from F2. The scale image is served by F2's authenticated `/api/photos/{record_id}?kind=SCALE` endpoint.

| File | Purpose |
|---|---|
| `router.py` | Protected `/api/verify/queue`, `/api/verify/history`, `/api/verify/records/{id}`, `/api/records/{id}/verify`, and `/api/records/{id}/reject` endpoints |
| `schemas.py` | Camel-case F4 response model and rejection request |
| `service.py` | Queue/history queries and locked status transition logic |
| `client/src/features/f4_verification/api.js` | Frontend calls through the shared cookie-aware API client |

**Spec:** FR-4.1 – FR-4.5, BR-1, BR-4 · **Figma:** flow 04.

Rules: only Sponsor / Management can use these endpoints · only PENDING records can be decided · VERIFIED and REJECTED are final · rejection needs a non-empty reason · every manual decision records the reviewer and UTC timestamp · a later/concurrent decision returns 409 · queue oldest first, decision history newest first.
