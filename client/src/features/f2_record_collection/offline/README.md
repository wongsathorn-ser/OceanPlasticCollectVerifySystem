# F2 offline implementation

- `localDb.js`: IndexedDB drafts, two image Blobs, capture locations/times and metadata/receipts. Writes resolve on transaction completion. `owner_id` separates accounts; acknowledgement validates server ID, UUID and owner before removing local evidence.
- `syncQueue.js`: actual cookie session check, owner-scoped sends, SENDING state, error recovery, retry and concurrent-trigger protection. No network failure silently removes a draft.
- `photo.js`: decode, max 1600 px JPEG conversion, max 5 MiB per photo.
- `location.js`: fresh browser Geolocation call at photo selection (maximumAge 0), permission errors and capture timestamp. Upload never recaptures GPS.
- `landingSite.js`: client haversine check against cached active sites/radius. Full precision is used at the boundary. Server rechecks Record GPS through the shared evidence helper.
- `bootstrap.js`: on opening/online, cache boats/sites and retry. F2Access warms reference data after crew sign-in. The service worker caches app resources, **never** API/private-photo responses.
- `shared/layout/useOfflineCrewSession.js`: narrow shared integration for F2/F3 crew routes. A valid cached crew hint can open supported pages only while offline. It does not create a server session or authorize any API. Online guest/admin access is unchanged.

Prepare online first: sign in, open `/record`, load boats/sites, then reload once so the service worker can cache application resources. GPS hardware and browser permission must work independently of network access. Completely offline first use cannot work without those resources/reference data.

A complete draft stores PLASTIC then SCALE, a SCALE `photo` alias for F3, per-photo GPS/times locally, and SCALE GPS in the existing Record contract. No schema migration is introduced here. Existing one-photo queued drafts remain visible with an explicit review message; no missing evidence is invented or deleted. Sign in as the original owner to send that owner's complete drafts.

Automated storage/sync/SSR tests are not proof of actual device cold-start behavior. Run the manual checklist in `docs/F2_VERIFICATION.md` before presenting offline reopening as verified.
