# F2: Record a collection backend

Owner: Masaaki Kato. Uses the PM's Record / Photo schema and make_record_number unchanged (D9-D11).

| Endpoint | Permission | Purpose |
|---|---|---|
| `GET /api/records/boats` | Crew | DB-backed active boat options while F5's boat endpoint is still a mock |
| `POST /api/records` | Crew | Multipart record + scale photo; 201 for new, 200 for an idempotent retry |
| `GET /api/records/submissions/{client_id}` | Crew, own only | Restore an F2 confirmation without taking over F3's record endpoints |
| `GET /api/photos/{record_id}` | Crew owner or sponsor | Private image bytes, no-store cache policy |

Required multipart fields: client_id (UUID), boat_id, weight_kg (>0 and finite), material (MATERIALS), latitude (-90..90), longitude (-180..180), gps_accuracy_m (>=0 and finite), recorded_at (ISO timestamp with time zone), photo (JPEG/PNG/WebP, at most 5 MiB). Optional: note (500 chars), expected_crew_id (only checks offline ownership). Actual crew_id is always the session's user; posted status/crew_id fields never control the saved record.

New records always start PENDING. Records/photos commit together. Same-owner retries return the original including its current review status, even if the boat is now inactive. UNIQUE client_id plus rollback/re-query handles concurrent retries. Another owner's client_id returns 409. No update/delete endpoints are added.

CHG-004's two photos, SHA-256 and landing-site flags depend on the PM's future coordinated schema update (`docs/CHANGE_REQUESTS.md`). The current one-photo schema remains compatible with F3/F4/F5.
