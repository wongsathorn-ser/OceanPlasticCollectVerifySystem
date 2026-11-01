# F4 · Verification (frontend)

**Owner:** Hein Thant Si Thu · **Backend:** `server/app/features/f4_verification/`

Sponsor / Management checks each pending record against its photo, then verifies it or rejects it with a reason.

| File | Figma screen | Route | Roles | Spec |
|---|---|---|---|---|
| `pages/VerifyQueuePage.jsx` | 04 Pending queue (To verify tab) | `/verify` | SPONSOR_MANAGEMENT | FR-4.1 |
| `pages/DecisionHistoryPage.jsx` | 04 Decision history (Verified tab) | `/verify/history` | SPONSOR_MANAGEMENT | FR-4.5 |
| `pages/ReviewRecordPage.jsx` | 04 Review record (+ Reject dialog) | `/verify/:recordId` | SPONSOR_MANAGEMENT | FR-4.2, FR-4.3, FR-4.4 |

Other files: `routes.jsx` (this feature's routes), `api.js` (calls to the backend), `components/` (UI used only by this feature).

Notes:

- `components/RejectDialog.jsx` is the reject dialog from Figma (quick reasons + required note).
- Queue is oldest first (FR-4.1) even though Figma shows newest first; history should also show the reviewer (FR-4.5).
- Handle 409 Conflict when another supervisor decided first.
