# F2 offline implementation

- `localDb.js`: IndexedDB drafts (including photo Blob) and metadata/receipts. Writes resolve only after transaction completion. Original owner_id separates accounts.
- `syncQueue.js`: actual session check, owner-scoped sends, SENDING state, failure recovery, acknowledgement validation and deletion only after confirmation. `expected_crew_id` lets the server reject a switched account.
- `photo.js`: image decode, max 1600px JPEG conversion; 5 MiB ceiling.
- `location.js`: browser Geolocation, permission errors, capture timestamp.
- `bootstrap.js`: app-open/online sync, service worker registration, manifest link. Imported through the existing F2 route module, without editing shared app files.
- `client/public/f2-sw.js`: network-first app shell/resources with offline fallback; no API or private photo caching.

A successful IndexedDB write is required to leave the form. Session expiry or an offline server does not remove a draft. Reopening the app offline uses the last known crew identity for local capture only; the server still authenticates every upload. Sign in as the original crew member to send their drafts.
