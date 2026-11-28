# F2 verification — 27 November 2026

Source: uploaded main `97b59ab` plus the two review patches in this package.

## Passed

- **100 backend tests**, the complete suite, against actual PostgreSQL **16.2**. Includes previous F1/F3/F4/shared rules and F2 session identity, atomic two-photo persistence, hash storage, idempotency/concurrent UUID retry, validation/access controls, legacy server retries, automatic verification/spot selection, duplicate/outside flags, no-active-site handling and the dev-only synthetic-site helper.
- **Live HTTP flow** with real cookies and PostgreSQL: crew upload two images → F3 history → protected images → same-UUID retry → F4 pending queue → sponsor verify → F3 record detail. The created PLASTIC and SCALE rows both had non-null SHA-256. Test images/coordinates were synthetic test input, not physical GPS verification.
- **15 isolated JavaScript checks** using real F2 modules, an in-memory IndexedDB implementation, mocked network/cache objects and SSR. Covers Blob transaction completion, reopen/read, failed sends/lost acknowledgement, account/session protection, acknowledgement identity, overlapping triggers, interrupted sends, service-worker cache exclusions, offline crew guards, exact radius boundary and preservation of legacy queued evidence. These checks are simulations, not an actual device/browser test.
- **3 repository-reproducible Node checks**: cached-crew SSR routes, denied online/admin hint access, full-precision location boundary. Run from repo root: `node client/src/features/f2_record_collection/tests/verify-offline.mjs`. These overlap the isolated guard/math checks; they are not three additional browser scenarios.
- Frontend `npm run lint` passed with no new F2 warnings. The existing F5 BoatsPage immutability warning remains. `npm run build` passed (Vite 8.3.5).

Environment: Python 3.12.14, FastAPI 0.141.1, SQLModel 0.0.50, Node 24.22.3, PostgreSQL 16.2. Project CI uses Python 3.13 / Node 22; run its normal checks. No dependency files changed. Docker image builds were not executed here.

## Owner's device checklist (not yet claimed as passed)

1. Apply both patches on the latest compatible branch. Start the Docker stack; install D13 once if necessary, with a verified DB backup before destructive reset.
2. Crew sign-in → DB boat → two photo previews and actual GPS → within configured site radius → save → real REC number and both images on confirmation/history/detail.
3. Outside-radius capture must block save. Denied location must show a recovery message. On campus use only the explicitly labelled synthetic local demo site at actual GPS, never fake device coordinates.
4. Choose PLASTIC, then SCALE; retaking PLASTIC must clear SCALE. Test camera and gallery behavior on the target phone. Check narrow screen layout and language switching; missing translations should fall back to English.
5. With app/reference data warmed online, prepare evidence. Stop backend only, save, confirm it remains on the phone, start backend and Send all. Check exactly one DB record and two photos.
6. Separately test **actual offline reopening**: load online/reload to warm service worker, disconnect device, close/reopen the crew route, capture/save if GPS hardware can supply a fix, reopen receipt, reconnect and send. SSR/storage tests do not establish this behavior.
7. Expire session/switch account during pending send. Original draft must remain and another user must not upload it. Legacy one-photo local drafts must remain with their explanatory error.
8. Restart the stack without `-v` and verify the same persisted record/photos. Save actual Web screenshots and PR/checks screenshots for the report.

A new browser/service-worker installation may need an online reload before updated resources are available. Never clear IndexedDB to refresh the app while unsent evidence is present.
