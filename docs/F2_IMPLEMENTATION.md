# F2 implementation and handoff

## Current milestone

The original three Figma screens now use actual cookie authentication, PostgreSQL boats, and real record/photo persistence. Offline drafts are written first, retried safely, and recoverable after reload. This change uses the latest uploaded main snapshot (ad696a2); it does not use the earlier CHG-004 mock GPS ZIP.

No table model, seed, shared app entry point, dependency lock file, Docker configuration, or other feature implementation is modified. Existing local databases do not need to be reset for this patch.

## Apply on the Mac

Stay in `features/record-collections`. Start with a clean working tree and the main update already merged. Apply the patch with `git apply --check` followed by `git apply`. If the check fails, keep the error and compare against newer changes instead of overwriting files. Start the app with `docker compose up --build`.

The public additions (`client/public/f2-sw.js`, `client/public/f2-manifest.webmanifest`) are the F2-owned PWA items listed in the offline README. Translation additions append only new `f2.*` keys; existing translations are preserved.

## Try the actual save

1. Open `http://localhost:5173/signin`; use crew `mreyes` / `password123`.
2. Open `/record`, choose a boat from the DB, continue, and allow location access.
3. Enter a positive weight, select one material, attach a scale photo, and save.
4. The result initially confirms local storage. With a valid session and signal it then shows **Saved to the server** and a real `REC-...` number. Reloading this URL retrieves the same record, and the photo comes from the protected photo endpoint.
5. Offline: after opening online and reloading once to warm the app cache, disconnect, reopen `/record`, capture/save, and reload the confirmation. It must remain **Saved on this phone**. Reconnect and use `/send` if needed.
6. Clear the session or switch to another account while a draft is waiting. The draft must remain for the original account; sign back in as that crew to send it.

An admin cannot create crew records. F3 history/home and F4 verification may still show their own mock lists in this main snapshot; coordinate their DB integration with the feature owners. F2's confirmation and the DB provide actual save verification.

## Existing API contract

- `GET /api/records/boats`: active Boat rows. Added under F2 because F5's existing `/boats` service is still a mock; replace the frontend call once F5 delivers its DB version.
- `POST /api/records`: required multipart UUID client_id, boat_id, weight_kg, material, photo, latitude, longitude, gps_accuracy_m, recorded_at; optional note and expected_crew_id. User identity comes from the session. 201 new, 200 replay; validation 400, photo too large 413, account/client-id ownership mismatch 409, auth 401/403.
- `GET /api/records/submissions/{client_id}`: current crew's own confirmation only. This avoids defining F3's `/records/{id}` route.
- `GET /api/photos/{record_id}`: owner or sponsor only; image bytes never appear in record metadata.

POST commits the immutable Record and Photo atomically, uses `make_record_number(id)`, and returns PENDING for new records. Duplicate IDs are checked before payload validation so a legitimate retry still works after the boat was deactivated. DB uniqueness protects simultaneous retries. Confirmation validates server id, record_number, client_id and crew_id before deleting the local Blob.

## Next coordinated change

Latest `docs/CHANGE_REQUESTS.md` says CHG-001–004 await the team's decision and the PM owns one schema update. CHG-004 needs Photo.kind / sha256 and a composite uniqueness constraint, LandingSite and RecordFlag; F3/F4 also need the resulting evidence contract. When those models land, extend this real upload/queue path with two Blobs and GPS captured for that evidence, nearest-site checks and server flags. Do not enable the older sample-GPS frontend against this one-photo schema.

CHG-001: F2 already reads the central translations file, with English fallback. Its temporary feature-local language adapter can be replaced by the PM's shared context. Empty translations and raw validation-message translations still need the translators/PM.

## Checks

See `docs/F2_VERIFICATION.md` for exact automated checks and environment limits. Standard team commands remain:

```
docker compose exec backend python -m pytest -vv
cd client
npm ci
npm run lint
npm run build
```
