# F1 · Accounts & access (frontend)

**Owner:** Wongsathorn Sereephap · **Backend:** `server/app/features/f1_accounts/`

Sign in, request an account, admin approval, user management and the profile page. Also provides the signed-in user (`AuthProvider` / `AuthContext`) for every other feature.

**Status:** all six screens are built and follow Figma. They run on **mock data** (`mockAccounts.js`) because the backend endpoints do not exist yet.

| File | Figma screen | Route | Roles | Spec |
|---|---|---|---|---|
| `pages/SignInPage.jsx` | 01 Sign in | `/signin` | public | FR-1.1, FR-1.2, FR-1.3, BR-8 |
| `pages/RequestAccountPage.jsx` | 02 Request an account ("Create an account") | `/register` | public | FR-1.4, BR-9 |
| `pages/RequestSubmittedPage.jsx` | 03 Request submitted ("Request sent") | `/register/submitted` | public | FR-1.5 |
| `pages/AccountRequestsPage.jsx` | 04 Approve access (Admin: Requests) | `/admin/requests` | ADMIN | FR-1.6 |
| `pages/UsersPage.jsx` (+ `components/UserDetailsDialog.jsx`) | Users (Admin) | `/admin/users` | ADMIN | FR-1.7, BR-7 |
| `pages/ProfilePage.jsx` (+ `components/ChangePasswordDialog.jsx`) | Profile (all roles) | `/profile` | all roles | FR-1.8 |

## Files

| File | Purpose |
|---|---|
| `routes.jsx` | This feature's routes (`App.jsx` picks them up) |
| `api.js` | The only place the pages get data from. Each function names the real endpoint it will call |
| `mockAccounts.js` | **Temporary** in-memory backend with the same rules and `{detail}` errors as the planned API |
| `authContext.js`, `AuthProvider.jsx` | Signed-in user for the whole app (wrapped around `<App />` in `src/main.jsx`) |
| `constants.js` | Registration roles (no ADMIN, BR-9), each role's home page, minimum password length |
| `utils.js` | Initials, "2 hours ago", "March 2026" (built-in `Intl`, no library) |
| `components/` | F1 UI pieces in the Figma style: `AuthLayout`, `BrandMark`, `Button`, `TextField`, `SelectField`, `Avatar`, `AccountStatusBadge`, `PageHeader`, `InfoBanner`, `Alert`, `RequestCard`, the two dialogs, inline SVG `icons.jsx` |

## Try it (mock mode)

`npm run dev`, open http://localhost:5173/signin. Password for every demo account: `password123`.

| Username | Role | Lands on |
|---|---|---|
| `mreyes` | Crew member | `/home` |
| `smendes` | Sponsor / Management | `/fleet` |
| `aosei` | Administrator | `/admin/requests` |
| `tiversen` | Crew member, **suspended** | cannot sign in (BR-8) |
| `evasquez` | Crew member, **pending** | cannot sign in until approved |

Full flow (AC-1): create an account → it cannot sign in yet → sign in as `aosei`, approve it on Requests (optionally change the role) → log out → sign in as the new account. Mock data lives in memory: use the side navigation, not the browser refresh, or everything resets.

## For other features

```jsx
import { useContext } from 'react'
import { AuthContext } from '../f1_accounts/authContext.js'

const { user } = useContext(AuthContext) // null when nobody is signed in; user.name, user.role, ...
```

## Connecting the backend later

1. In `api.js`, replace each function body with the `apiFetch(...)` call written in its comment.
2. Set `USING_MOCK_DATA = false`, then delete `mockAccounts.js` and `components/MockAccountsHint.jsx`.
3. Nothing else changes: `AuthProvider` already asks `GET /api/auth/me` on start, and the pages already show the backend's `detail` messages.

## Still to do for F1 (shared files - agree with the team first)

- `shared/layout/AppLayout.jsx`: show only the signed-in user's menu, their name/role and a log-out button (currently the template shows all three menus).
- `App.jsx`: guard signed-in routes with each route's `roles`, and send `/` to the user's home (`ROLE_HOME`).
- Backend endpoints in `server/app/features/f1_accounts/`.
