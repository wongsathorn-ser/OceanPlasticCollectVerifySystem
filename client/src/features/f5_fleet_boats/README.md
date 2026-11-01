# F5 · Fleet & boats (frontend)

**Owner:** Natthachaimongkol Chayopathum · **Backend:** `server/app/features/f5_fleet_boats/`

Fleet dashboard and boat performance for Sponsor / Management (verified weight only), and the boat register for admins.

| File | Figma screen | Route | Roles | Spec |
|---|---|---|---|---|
| `pages/FleetOverviewPage.jsx` | 06 Fleet overview | `/fleet` | SPONSOR_MANAGEMENT | FR-5.1, FR-5.5 |
| `pages/BoatPerformancePage.jsx` | 06 Boat performance | `/fleet/boats/:boatId` | SPONSOR_MANAGEMENT | FR-5.2 |
| `pages/BoatsPage.jsx` | Boats (Admin) | `/admin/boats` | ADMIN | FR-5.3 |
| `pages/AddBoatPage.jsx` | Add a boat (Admin) | `/admin/boats/new` | ADMIN | FR-5.4 |

Other files: `routes.jsx` (this feature's routes), `api.js` (calls to the backend), `components/` (UI used only by this feature).

Notes:

- Material breakdown bars can be plain Tailwind `div`s - no chart library needed (charts beyond these bars are out of scope).
- Boat records open the shared Collection record page (`/records/:recordId`, F3).
- Edit boat has no Figma screen yet; capacity is required (> 0) even though Figma says "Optional".
