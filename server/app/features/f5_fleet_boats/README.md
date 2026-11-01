# F5 · Fleet & boats (backend)

**Owner:** Natthachaimongkol Chayopathum · **Frontend:** `client/src/features/f5_fleet_boats/` · **Tests:** `server/tests/f5_fleet_boats/`

The boat register (admin) and the fleet dashboard (Sponsor / Management): verified totals per boat, material breakdown, and boat performance traced back to its records.

| File | Purpose |
|---|---|
| `router.py` | `/api/boats`, `/api/fleet/summary`, `/api/fleet/boats/{id}` |
| `schemas.py` | Pydantic request/response models |
| `models.py` | SQLModel table `boats` (DM-2) – used by F2 |
| `service.py` | Boat CRUD and dashboard queries |
| `seed.py` | Demo boats (HC-14, SH-02, RM-07, SL-03) |

**Spec:** FR-5.1 – FR-5.5, BR-2, BR-6 · **Figma:** flow 06, Boats, Add a boat

Rules to remember: only VERIFIED weight in totals, pending shown separately (BR-2) · only active boats are offered to crews, old records stay valid (BR-6) · capacity is required and > 0 (DM-2) even though the Figma form says "Optional".
