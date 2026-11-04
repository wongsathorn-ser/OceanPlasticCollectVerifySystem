# F1 · Accounts & access (frontend)

**Owner:** Wongsathorn Sereephap · **Backend:** `server/app/features/f1_accounts/`

Sign in, request an account, admin approval, user management and the profile page. Also provides the signed-in user (`AuthProvider` / `AuthContext`) for every other feature.

**Status:** all six screens are built, follow Figma and talk to the real F1 backend (`/api/auth/*`, `/api/admin/*`). The backend keeps data **in memory** for now (no database yet), seeded with demo accounts.

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

Run both apps (two terminals):

```
cd server && uv sync && uv run fastapi dev app/main.py --port 34242
cd client && npm install && npm run dev
```

Open http://localhost:5173/signin. No database is needed: the backend prints `WARNING: database not reachable - starting without it.` and F1 uses its in-memory demo data. API docs: http://localhost:34242/docs.

Password for every demo account: `password123` (for `admin`: `ADMIN_PASSWORD` from `.env` when it is set, e.g. with docker compose).

| Username | Role | Lands on |
|---|---|---|
| `mreyes` | Crew member | `/home` |
| `smendes` | Sponsor / Management | `/fleet` |
| `admin` | Administrator | `/admin/requests` |
| `tiversen` | Crew member, **suspended** | cannot sign in (BR-8) |
| `evasquez` | Crew member, **pending** | cannot sign in until approved |

Full flow (AC-1): create an account → it cannot sign in yet → sign in as `admin`, approve it on Requests (optionally change the role) → log out → sign in as the new account. Data lives in the backend process: restarting the backend (or its auto-reload after a code change) resets everything.

Running the backend with plain `uv run` (no `.env`) makes the cookie `Secure`. Chrome, Edge and Firefox accept that on `http://localhost`; if your browser does not keep you signed in, set `COOKIE_SECURE=false` in the environment.

## For other features

```jsx
import { useContext } from 'react'
import { AuthContext } from '../f1_accounts/authContext.js'

const { user } = useContext(AuthContext) // null when nobody is signed in; user.name, user.role, ...
```

## When the database arrives

Only `server/app/features/f1_accounts/service.py` (and `models.py`, `seed.py`) change. The frontend and the API stay the same. Remove `components/MockAccountsHint.jsx` and `SHOW_DEMO_ACCOUNTS` once there are real accounts.

## Still to do for F1 (shared files - agree with the team first)

- `shared/layout/AppLayout.jsx`: show only the signed-in user's menu, their name/role and a log-out button (currently the template shows all three menus).
- `App.jsx`: guard signed-in routes with each route's `roles`, and send `/` to the user's home (`ROLE_HOME`).
- Backend: move the in-memory store to the `users` / `sessions` tables, and swap the stdlib PBKDF2 password hash for bcrypt or argon2 (NFR-15, needs approval).
