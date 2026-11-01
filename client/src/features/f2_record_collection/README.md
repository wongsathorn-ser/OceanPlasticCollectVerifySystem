# F2 · Record a collection (frontend)

**Owner:** Masaaki Kato · **Backend:** `server/app/features/f2_record_collection/`

Two-step recording of a load (boat, weight, material, photo of the scale, GPS) that works offline: saved on the phone first and sent when there is signal.

| File | Figma screen | Route | Roles | Spec |
|---|---|---|---|---|
| `pages/ChooseBoatPage.jsx` | 02 Choose the boat (step 1 of 2) | `/record` | CREW_MEMBER | FR-2.1 |
| `pages/NewCollectionPage.jsx` | 02 Enter collection & evidence (step 2 of 2) | `/record/details` | CREW_MEMBER | FR-2.2, BR-5 |
| `pages/CollectionSavedPage.jsx` | 02 Collection saved | `/record/saved` | CREW_MEMBER | FR-2.3 |
| `pages/SendPage.jsx` | Not drawn in Figma yet (Saved on this phone / Send) | `/send` | CREW_MEMBER | FR-2.4 - FR-2.7 |

Other files: `routes.jsx` (this feature's routes), `api.js` (calls to the backend), `components/` (UI used only by this feature).

Notes:

- `offline/` holds the offline-first code (IndexedDB queue, sync, photo compression, GPS) - see `offline/README.md`.
- Figma does not show the GPS block, the location-permission message or the "Saved on this phone" states yet.
