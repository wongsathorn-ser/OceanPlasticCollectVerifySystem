# F2 implementation and handoff — 27 November 2026

## Source and scope

Baseline: uploaded main ZIP `97b59ab0f81bd75e3b05c3daaa074353cae3ffa5`. D13 schema and PM helper rules are already present there. This update implements F2's CHG-001 shared-language connection, CHG-003 post-save automatic verification, CHG-004 two-photo capture/checks and the shared offline crew guard fix. No table models, seeds, dependency manifests/locks or Docker configuration are changed.

The supplied package separates `01-shared-integration.patch` (four shared files) from `02-f2-evidence.patch` (F2, translations, feature tests and handoff docs). Both are needed for the tested local version. Review the shared patch with the PM and keep its PR separate under CONTRIBUTING; see F2_SHARED_REVIEW.md. Do not claim this patch is already on GitHub.

## Apply and start

Use `features/record-collections` with a clean tree after merging the uploaded main baseline. Check **both** patches before applying either. If `git apply --check` fails, stop and compare against the newer source; do not overwrite newer files. Start with `docker compose up --build` and wait for backend/frontend readiness.

This patch adds no DB migration. D13 in the underlying main **does** require a one-time local reset if the old schema remains. Follow DATABASE.md and back up the old DB before `docker compose down -v`; that deletes the local volume. Do not repeat a reset if D13 is already installed.

## Classroom demo at actual device coordinates

Seeded real sites are near Phuket. Outside those sites the app must block saving, including on campus. To demonstrate locally elsewhere:

1. Sign in as crew `mreyes` / `password123`, choose a boat, allow location and select a PLASTIC image. The preview displays actual latitude/longitude even if outside the radius.
2. On the local **dev** stack, register a clearly synthetic classroom test site using those exact displayed coordinates:

```
docker compose exec backend python -m app.features.f2_record_collection.demo_site --latitude REAL_LAT --longitude REAL_LON
```

Replace REAL_LAT/REAL_LON with the actual numbers. The helper refuses APP_ENV other than dev. It only upserts `CLASSROOM DEMO (synthetic test site)`; it does not change device coordinates or bypass any check. Never describe this site as a real pier/port. Permanent site administration belongs to the PM/F5.

3. Press the form's Retry button to refresh sites. Capture PLASTIC then SCALE near that real location. For a predictable manual-review demo use 75.123 kg (above the default 50 kg automatic threshold), a material and optional note.
4. Save, wait for the server confirmation and note the real REC number. Check F3 history, F4 queue and PostgreSQL. Both Photo rows must exist with kind/hash/size. Reusing an identical image on a later record should flag it rather than delete the upload.

## Data flow and API

Active boats come from the now DB-backed F5 `/api/boats`. F2 adds `/api/records/landing-sites` (active coordinates + radius) for online/cache use and `/api/records/location-check` for the shared authoritative distance check. The current form computes the same check locally to support offline capture.

POST `/api/records` multipart replaces the old `photo` field with **plastic_photo** and **scale_photo**. Other fields remain client_id, boat_id, weight_kg, material, note, latitude, longitude, gps_accuracy_m, recorded_at and optional expected_crew_id. Owner comes from the session. Response: 201 new, 200 same-owner retry, 400 validation, 413 oversized image, 409 ownership mismatch, 401/403 auth. Confirmation `/api/records/submissions/{client_id}` is owner-only. Photos `/api/photos/{id}?kind=PLASTIC|SCALE` are owner/sponsor-only and no-store.

F2 captures a fresh GPS fix alongside each photo selection and stores both fixes/times in the local draft. SCALE GPS fills the PM's existing Record fields; no per-photo server GPS columns are invented. Gallery original capture time/authenticity is not attested by browser selection. Retaking PLASTIC invalidates SCALE. Both client locations must pass the cached active-site radius, while the server rechecks Record GPS and flags an outside record that still arrives.

The backend commits Record, both hashed Photo rows, site and flags in one transaction. It then calls the PM's auto-verification helper under the record lock used by F4. New records start PENDING, but a valid CHG-003 rule may return VERIFIED immediately. A transient DB failure in that second stage leaves the committed evidence available for manual review. Other feature UIs and automatic rule definitions remain their owners' work.

## Offline and legacy behavior

IndexedDB commit completes before upload/navigation. Each draft has the original owner and UUID; retries validate the current cookie session and keep failures. Receipt acknowledgement checks server identity before deleting local evidence. SCALE has a `photo` alias so F3 local thumbnails still work. Boats/sites are warmed online and cached. The shared guard allows cached crew hints only on supported crew routes while offline; every server action still requires a real session.

Already-uploaded legacy one-photo records remain readable and UUID-retryable. **Unsent** one-photo drafts cannot satisfy the new contract: the queue retains them and explains the missing evidence. No automatic deletion, fake second photo or ownership change is performed. Team review is needed for those legacy drafts.

Shared LanguageContext provides all F2 translations; blank Thai/Burmese entries fall back to English and need translator review. See F2_VERIFICATION.md for actual checks and remaining manual work.
