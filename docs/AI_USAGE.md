# AI usage log

ITCS525 runs at AI Usage Level 4, and the final project rubric has a criterion "Ethical & Responsible AI Use" (AI tools used meaningfully and ethically, with clear justification). Keep a short, honest record here – one row per meaningful use. Add your rows at the bottom of your own feature's section to avoid merge conflicts.

How to fill a row: what you asked (short prompt summary, no secrets), what you kept or changed, and how you checked it (tests, manual run, reading the docs).

## Shared / project setup

| Date | Member | Tool | What I asked | What I used | How I verified |
|---|---|---|---|---|---|
| 2026-11-01 | Wongsathorn | Claude (Cowork) | Generate the repository template in the course's style: folders per feature, FastAPI/SQLModel/PostgreSQL backend, React/Tailwind/React Router frontend, Docker compose, GitHub Actions CI, docs | Whole template (placeholders only, no feature logic) | Backend tests against PostgreSQL, frontend lint + build, `docker compose config`; reviewed by the team |

## F1 · Accounts & access (Wongsathorn Sereephap)

| Date | Tool | What I asked | What I used | How I verified |
|---|---|---|---|---|
| 2026-11-01 | Claude (Cowork) | Build the F1 frontend screens from Figma (Sign in, Create an account, Request sent, Account requests, Users, Profile) with mock data, no backend yet | All F1 frontend files (pages, components, `api.js` + `mockAccounts.js`, `AuthProvider`) and the `AuthProvider` line in `main.jsx` | `npm run lint` + `npm run build`; clicked through the flows in a browser (validation, register → approve → sign in, suspend/reactivate, change password, log out) on desktop and phone width |
| 2026-11-04 | Claude (Cowork) | Build the F1 backend with in-memory storage (no database yet) and connect the F1 screens to it; rename the demo admin to `admin`; match the Figma colours | F1 router, schemas, service, dependencies (`get_current_user`, `require_role`), `memory_store.py`, seed, tests; `api.js` now calls the API; `main.py` starts without a database | `pytest` (14 F1 tests), `npm run lint` + `npm run build`, browser test of every flow against the running backend |

## F2 · Record a collection (Masaaki Kato)

| Date | Tool | What I asked | What I used | How I verified |
|---|---|---|---|---|

## F3 · Crew home & history (Kaung Khant Paing)

| Date | Tool | What I asked | What I used | How I verified |
|---|---|---|---|---|

## F4 · Verification (Hein Thant Si Thu)

| Date | Tool | What I asked | What I used | How I verified |
|---|---|---|---|---|

## F5 · Fleet & boats (Natthachaimongkol Chayopathum)

| Date | Tool | What I asked | What I used | How I verified |
|---|---|---|---|---|
