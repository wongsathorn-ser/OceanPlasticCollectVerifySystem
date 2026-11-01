# F4 · Verification (backend)

**Owner:** Hein Thant Si Thu · **Frontend:** `client/src/features/f4_verification/` · **Tests:** `server/tests/f4_verification/`

The core of the system: Sponsor / Management compares each pending record with its photo and verifies it or rejects it with a reason. Owns no table – it updates the status fields of `records` (F2).

| File | Purpose |
|---|---|
| `router.py` | `/api/verify/queue`, `/api/verify/history`, `/api/records/{id}/verify`, `/api/records/{id}/reject` |
| `schemas.py` | Pydantic request/response models |
| `service.py` | Status transitions and the 409 rule |

**Spec:** FR-4.1 – FR-4.5, BR-1, BR-4 · **Figma:** flow 04

Rules to remember: only PENDING → VERIFIED / REJECTED, both final (BR-1) · reject needs a reason (BR-4) · second decision → 409 Conflict (FR-4.4) · queue is oldest first (FR-4.1).
