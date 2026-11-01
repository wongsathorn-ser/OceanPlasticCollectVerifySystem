# F3 · Crew home & history (backend)

**Owner:** Kaung Khant Paing · **Frontend:** `client/src/features/f3_crew_history/` · **Tests:** `server/tests/f3_crew_history/`

Read side for people: the crew member's dashboard, history and record detail, plus the Sponsor / Management crew overview and per-person view. Owns no table – it reads `records` (F2), `users` (F1) and `boats` (F5).

| File | Purpose |
|---|---|
| `router.py` | `/api/me/summary`, `/api/records/mine`, `/api/records/{id}`, `/api/crew`, `/api/crew/{id}` |
| `schemas.py` | Pydantic response models |
| `service.py` | Queries and totals |

**Spec:** FR-3.1 – FR-3.5, BR-2, BR-12 · **Figma:** flows 03 and 05

Rules to remember: verified and pending are always separate (BR-2) · the crew list is not a ranking and shows the "depends on where and when they work" note (BR-12) · a crew member can only read their own records.
