# F2: Record a collection

Owner: Masaaki Kato. Built against the uploaded latest main snapshot (ad696a2), using the PM's existing Record and Photo tables without schema changes.

| Screen | Route | Behavior |
|---|---|---|
| Boat picker | `/record` | Active boats from PostgreSQL, cached in IndexedDB for offline use |
| New collection | `/record/details` | Weight, material, note (500 chars), one scale photo, device GPS; local commit before upload |
| Confirmation | `/record/saved?client_id=UUID` | Distinguishes Saved on this phone from Saved to the server; recoverable after reload |
| Send | `/send` | Current crew's queue, Send all, sending state, failures retained, per-record results |

Sign in as `mreyes` / `password123` to try recording. Admins and sponsors cannot create records. GPS requires localhost or HTTPS; allow location in the browser. The photo is decoded, resized to at most 1600px, and converted to JPEG on the device. There is no sample-location bypass.

All records and photo Blobs are committed to IndexedDB first. Sync uses the actual cookie session and each draft's original owner. Network/session failures preserve drafts. Concurrent tabs use Web Locks when available; the server's unique client_id also prevents duplicates. Acknowledgement moves server metadata to a receipt and deletes the draft/photo in one local transaction. The server creates a PENDING record and its Photo in one SQL transaction.

The F2 route module starts sync on app opening and the online event; saving, confirmation, and Send all also trigger it. `client/public/f2-sw.js` caches the app shell and resources, never API responses. Open the app online and reload once before trying a completely offline restart so its resources are cached. GPS hardware/location permissions are still required offline.

F5's `/api/boats` is still backed by mock lists in this snapshot. F2 therefore reads the shared Boat table through `/api/records/boats`; coordinate with F5 before switching to its endpoint. F3 home/history and F4 queue remain their owners' integration work; they may still display their own mock data even though F2 really saved to PostgreSQL.

Translations use existing keys in `client/translations.json` plus new `f2.*` keys. The feature-local adapter falls back to English for empty Thai/Burmese values. It can be replaced by the PM's shared LanguageContext when that is merged. New translations still require translator review.

CHG-004 (two photos, landing sites and flags) and the auto-verification hook are not enabled: latest `docs/CHANGE_REQUESTS.md` assigns their coordinated schema update to the PM. No shared tables or other features were changed in this implementation. See `docs/F2_IMPLEMENTATION.md` for the API and handoff.
