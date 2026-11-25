# F1 · Accounts & access (frontend)

**Owner:** Wongsathorn Sereephap · **Backend:** `server/app/features/f1_accounts/`

Sign in, request an account, admin approval, user management and the profile page. Also provides the signed-in user (`AuthProvider` / `AuthContext`) for every other feature.

**Status:** all six screens are built, follow Figma and talk to the real F1 backend (`/api/auth/*`, `/api/admin/*`). The backend stores the accounts in PostgreSQL, seeded with demo accounts on the first start.

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
| `api.js` | The only place the pages get data from. Each function calls one backend endpoint with the shared `apiFetch` |
| `authContext.js`, `AuthProvider.jsx` | Signed-in user for the whole app (wrapped around `<App />` in `src/main.jsx`) |
| `constants.js` | Registration roles (no ADMIN, BR-9), each role's home page, minimum password length |
| `utils.js` | Initials, "2 hours ago", "March 2026" (built-in `Intl`, no library) |
| `components/` | F1 UI pieces in the Figma style: `AuthLayout`, `BrandMark`, `Button`, `TextField`, `SelectField`, `Avatar`, `AccountStatusBadge`, `PageHeader`, `InfoBanner`, `Alert`, `RequestCard`, the two dialogs, inline SVG `icons.jsx` |

## Try it

From the repository root: `docker compose up --build`, then open http://localhost:5173/signin. API docs: http://localhost:34242/docs.

Password for every demo account: `password123`.

| Username | Role | Lands on |
|---|---|---|
| `mreyes` | Crew member | `/home` |
| `smendes` | Sponsor / Management | `/fleet` |
| `admin` | Administrator | `/admin/requests` |
| `tiversen` | Crew member, **suspended** | cannot sign in (BR-8) |
| `evasquez` | Crew member, **pending** | cannot sign in until approved |

Full flow (AC-1): create an account → it cannot sign in yet → sign in as `admin`, approve it on Requests (optionally change the role) → log out → sign in as the new account. The data is kept in the database volume when you restart; `docker compose down -v` resets it to the demo data.

Running the backend with plain `uv run` (no `.env`) makes the cookie `Secure`. Chrome, Edge and Firefox accept that on `http://localhost`; if your browser does not keep you signed in, set `COOKIE_SECURE=false` in the environment.

## For other features

```jsx
import { useContext } from 'react'
import { AuthContext } from '../f1_accounts/authContext.js'

const { user } = useContext(AuthContext) // null when nobody is signed in; user.name, user.role, ...
```

## Demo accounts hint

`components/MockAccountsHint.jsx` lists the seeded demo accounts on the sign-in page. Set `SHOW_DEMO_ACCOUNTS = false` in `api.js` before a real launch.

## Still to do for F1 (shared files - agree with the team first)

- Done (26 Nov): `AppLayout.jsx` shows only the signed-in user's menu, name, role and a log-out button; `App.jsx` guards every signed-in route with its `roles` (`shared/layout/RequireRole.jsx`) and sends `/` to the user's home; F1 public screens are in English, Thai and Burmese (CHG-001).
