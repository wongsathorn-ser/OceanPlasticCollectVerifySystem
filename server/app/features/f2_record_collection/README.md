# F2 · Record a collection (backend)

**Owner:** Masaaki Kato · **Frontend:** `client/src/features/f2_record_collection/` · **Tests:** `server/tests/f2_record_collection/`

Creates the evidence: a crew member's record with boat, weight, material, one photo of the scale and GPS. Upload is idempotent so offline sync can safely retry.

| File | Purpose |
|---|---|
| `router.py` | `POST /api/records` (multipart), `GET /api/photos/{record_id}` |
| `schemas.py` | Pydantic response models |
| `models.py` | SQLModel table `records` (DM-3) – read by F3, F4, F5 |
| `service.py` | Validation, photo storage, record number, idempotency |
| `seed.py` | Demo records in all statuses |

**Spec:** FR-2.1 – FR-2.8, BR-1, BR-3, BR-5, BR-10, BR-11, NFR-16, NFR-19 · **Figma:** flow 02

Rules to remember: every record arrives as PENDING (BR-1) · records are immutable (BR-3) · same `client_id` twice returns the existing record (BR-10) · `crew_id` comes from the session, never from the request body (BR-11).
