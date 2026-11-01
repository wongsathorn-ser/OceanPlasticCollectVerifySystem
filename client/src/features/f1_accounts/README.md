# F1 · Accounts & access (frontend)

**Owner:** Wongsathorn Sereephap · **Backend:** `server/app/features/f1_accounts/`

Sign in, request an account, admin approval, user management and the profile page. Also provides the signed-in user (AuthProvider) and role checks for every other feature.

| File | Figma screen | Route | Roles | Spec |
|---|---|---|---|---|
| `pages/SignInPage.jsx` | 01 Sign in | `/signin` | public | FR-1.1, FR-1.2, FR-1.3 |
| `pages/RequestAccountPage.jsx` | 02 Request an account (Create an account) | `/register` | public | FR-1.4, BR-9 |
| `pages/RequestSubmittedPage.jsx` | 03 Request submitted | `/register/submitted` | public | FR-1.5 |
| `pages/AccountRequestsPage.jsx` | 04 Approve access (Admin: Requests) | `/admin/requests` | ADMIN | FR-1.6 |
| `pages/UsersPage.jsx` | Users (Admin) | `/admin/users` | ADMIN | FR-1.7, BR-7 |
| `pages/ProfilePage.jsx` | Profile (all roles) | `/profile` | CREW_MEMBER, SPONSOR_MANAGEMENT, ADMIN | FR-1.8 |

Other files: `routes.jsx` (this feature's routes), `api.js` (calls to the backend), `components/` (UI used only by this feature).

Notes:

- `authContext.js` + `AuthProvider.jsx`: who is signed in (from `GET /api/auth/me`) - wrap `<App />` in `main.jsx` once ready.
- Then guard the signed-in routes in `App.jsx` with each route's `roles` and show only the user's menu in `AppLayout`.
- Change password has no Figma screen yet (Profile only shows the row).
