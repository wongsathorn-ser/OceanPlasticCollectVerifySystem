# Small shared integration review — F2, 27 Nov

CONTRIBUTING asks for shared changes in a small separate PR with team notification. The package provides a dedicated `01-shared-integration.patch` so the PM can review exactly these four files before integration. Local testing of the complete F2 update used both patches; no message, PR or remote merge has been sent automatically.

| Shared file | Reason and scope |
|---|---|
| `client/src/shared/layout/useOfflineCrewSession.js` (new) | Allows a validated cached crew hint only while offline on supported F2/F3 routes; never authorizes a server request or admin page. |
| `client/src/shared/layout/AppLayout.jsx` | Uses the shared offline-aware session view so its unconditional redirect no longer prevents local crew access. |
| `client/src/shared/layout/RequireRole.jsx` | Same narrow offline-aware view in the common role guard; actual role checks remain. |
| `server/app/core/evidence.py` | Clamps haversine rounding to [0,1]; when no active site exists, adds the outside flag without attempting round(infinity) and crashing the upload. |

The second patch owns F2 implementation/tests and its added translation keys/docs. It does not change models, the PM's rule thresholds, F1 auth provider, F3/F4/F5 implementations, seeds, package files or Compose.

Suggested PM message (send manually): "F2 now connects two photos, capture-time GPS/site checks and auto-verification to the existing helpers. A separate small shared patch fixes offline crew routing and the no-site evidence edge case. Full PostgreSQL suite: 100 passed; lint/build passed. Please review the four shared files before merging. Device GPS/camera/offline-reopen verification is still required."
