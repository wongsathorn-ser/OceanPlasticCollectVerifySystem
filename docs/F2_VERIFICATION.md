# F2 verification - 20 November 2026

Source baseline: the uploaded latest ZIP, main snapshot ad696a2, after the original F2 preview was merged.

## Passed

- **54 backend tests** (the complete existing suite plus new F2 tests) against actual PostgreSQL **16.2**. Includes real session login, DB boat selection, atomic Record/Photo persistence, status PENDING and session-derived crew_id, UTC-equivalent timestamp, UUID retries after deactivation/review, simultaneous retries, validation, MIME/signature/size checks, photo access permissions, offline-owner mismatch, and absence of edit/delete endpoints.
- **11 isolated JavaScript checks** using the real F2 modules, an in-memory IndexedDB implementation and mocked network responses. Covers local Blob commit before upload, reopening local storage, failed sends, lost acknowledgements, session expiry, account separation, server validation errors, acknowledgement validation, overlapping triggers, interrupted SENDING recovery, and service-worker cache/exclusion/fallback logic. These checks are logic verification, not a browser/device simulation.
- **Live HTTP persistence check**: start FastAPI, log in, upload, fetch photo, stop/restart the backend process, retrieve the same record/photo with the same persisted session, retry the UUID and confirm only one DB record. PostgreSQL remains running through the backend restart.
- **Frontend lint** completed with no new F2 warnings. One pre-existing F5 `BoatsPage.jsx` immutability warning remains untouched.
- **Frontend production build** passed with Vite 8.3.5.

## Environment and limits

Checks ran with Python 3.12.14, FastAPI 0.141.1, SQLModel 0.0.50, Node 24.22.3 and PostgreSQL 16.2. The project CI uses Python 3.13 and Node 22 with its lock files; rerun the normal CI commands there. No dependency files were changed.

Chromium could not launch in this execution environment because its local socket operation was denied. The browser flow was therefore **not** verified end to end. Actual browser GPS permission, camera behavior, mobile layout, installation and completely offline app reopening still need the manual checks in F2_IMPLEMENTATION.md. Mock/sample GPS is not added to the app.

Docker image builds were not run in this environment. The DB schema is unchanged, so this patch does not require deleting the local volume.
