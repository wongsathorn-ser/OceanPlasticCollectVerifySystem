# F2: Record a collection backend

Owner: Masaaki Kato. Uses the PM's D13 Record / Photo / RecordFlag / LandingSite models unchanged and calls the shared evidence and automatic-verification rules.

| Endpoint | Permission | Purpose |
|---|---|---|
| `GET /api/records/boats` | Crew | Legacy active-boat picker; current UI uses F5 `/api/boats` |
| `GET /api/records/landing-sites` | Crew | Active sites plus configured radius for offline cache |
| `GET /api/records/location-check?latitude=...&longitude=...` | Crew | Shared server nearest-site check |
| `POST /api/records` | Crew | Record + PLASTIC and SCALE photos; 201 new, 200 retry |
| `GET /api/records/submissions/{client_id}` | Crew, own | F2 confirmation without taking over F3 endpoints |
| `GET /api/photos/{record_id}?kind=SCALE` | Owner or sponsor | Protected binary photo; kind PLASTIC also supported |

Multipart: UUID client_id, boat_id, finite positive weight_kg, material from MATERIALS, latitude (-90..90), longitude (-180..180), finite gps_accuracy_m >=0, timezone-aware recorded_at, **plastic_photo and scale_photo** (JPEG/PNG/WebP, <=5 MiB each). Optional note <=500 chars, expected_crew_id for queued-owner protection. crew_id always comes from the session; posted status/crew_id cannot override it.

Record starts PENDING. One evidence transaction: add Record, flush for its ID/number, add both photos with SHA-256 via `add_photo`, run `check_evidence`, commit. Outside-site and duplicate-photo flags preserve the upload and prevent auto-verification. Then lock/refresh the record and call `apply_auto_verify`; eligible records become VERIFIED and may be selected for spot-check. F4 owns manual decisions/spot-check UI. If this second DB stage fails, complete evidence remains for manual review.

Same-owner UUID retries return the existing record before new-body validation, including legacy one-photo records and changed status. A DB unique constraint + rollback/requery covers simultaneous retries. Cross-owner UUID returns 409; no update/delete endpoints are added. The response includes photo metadata/URLs, site, flags, auto-verification rule and spot-check state, never image bytes.

Development-only classroom setup: `python -m app.features.f2_record_collection.demo_site --latitude REAL_LAT --longitude REAL_LON`. Refuses non-dev environments and labels the site synthetic. It changes local test reference data, not device GPS or production rules.
