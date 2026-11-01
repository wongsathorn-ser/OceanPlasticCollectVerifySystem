# F3 · Crew home & history (frontend)

**Owner:** Kaung Khant Paing · **Backend:** `server/app/features/f3_crew_history/`

The crew member's home, history and record detail, and the Sponsor / Management crew overview and per-person view. The Collection record page is reused from the verification and fleet flows.

| File | Figma screen | Route | Roles | Spec |
|---|---|---|---|---|
| `pages/CrewHomePage.jsx` | 03 Personal dashboard | `/home` | CREW_MEMBER | FR-3.1, BR-2 |
| `pages/MyHistoryPage.jsx` | 03 My history | `/history` | CREW_MEMBER | FR-3.2 |
| `pages/CollectionRecordPage.jsx` | 03 Collection record (also opened from flows 05 and 06) | `/records/:recordId` | CREW_MEMBER, SPONSOR_MANAGEMENT | FR-3.3 |
| `pages/CrewOverviewPage.jsx` | 05 Crew overview | `/crew` | SPONSOR_MANAGEMENT | FR-3.4, BR-12 |
| `pages/CrewMemberPage.jsx` | 05 Crew member details | `/crew/:crewId` | SPONSOR_MANAGEMENT | FR-3.5 |

Other files: `routes.jsx` (this feature's routes), `api.js` (calls to the backend), `components/` (UI used only by this feature).

Notes:

- Show verified and pending weight separately (BR-2) and the "not a ranking" note on the crew list (BR-12).
- My history must also list records still saved on the phone (data from F2's `offline/`).
