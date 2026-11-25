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
| 2026-11-18 | Claude (Cowork) | Connect the project to PostgreSQL following the ORM lectures and Lab 12: design all tables (users, sessions, boats, records, photos), move F1 from in-memory dictionaries to the database, seed demo data once, keep tests on a separate test database | Shared schema PR (D8–D12): all `models.py`, `app/core/clock.py`, `app/seed.py`, seed data for F1/F2/F5, F1 `service.py`/`router.py`/`dependencies.py`, `tests/conftest.py`, `docs/DATABASE.md` | `pytest` (27 tests) on PostgreSQL 16; started the backend twice to confirm data and sign-in survive a restart and the seed runs only once; frontend lint + build |
| 2026-11-04 | Claude (Cowork) | Build the F1 backend with in-memory storage (no database yet) and connect the F1 screens to it; rename the demo admin to `admin`; match the Figma colours | F1 router, schemas, service, dependencies (`get_current_user`, `require_role`), `memory_store.py`, seed, tests; `api.js` now calls the API; `main.py` starts without a database | `pytest` (14 F1 tests), `npm run lint` + `npm run build`, browser test of every flow against the running backend |

## F2 · Record a collection (Masaaki Kato)

| Date | Tool | What I asked | What I used | How I verified |
|---|---|---|---|---|
| 2026-11-09 | ChatGPT | Build a first F2 UI preview from the provided Figma screenshots | F2 preview pages with sample boats and route-based preview data; API, GPS and offline behavior deferred | Compared the screens with the supplied Figma frames; frontend lint, build, and browser checks remain to be run by the owner |
| 2026-11-20 | ChatGPT (Codex) | Continue F2 from latest main and connect the UI to the PM database and cookie authentication | F2 record/photo API, ownership and idempotency checks, real boat picker, GPS/photo capture, IndexedDB drafts and retry, protected confirmation/photo loading, translation-key adapter; table models unchanged | 54 PostgreSQL backend tests passed; 11 isolated IndexedDB/sync/service-worker checks passed; live HTTP persistence checked across a backend restart; frontend lint/build passed (existing F5 warning); browser/device checks remain because Chromium could not launch here |

## F3 · Crew home & history (Kaung Khant Paing)

| Date | Tool | What I asked | What I used | How I verified |
|---|---|---|---|---|
| 2026-11-04 | Antigravity (Gemini) | Build the F3 frontend screens from Figma (`features/crew-and-home-history`): Crew Home, My History, Collection Record detail, Sponsor Crew Overview, and Crew Member | F3 pages (`CrewHomePage`, `MyHistoryPage`, `CollectionRecordPage`, `CrewOverviewPage`, `CrewMemberPage`) and components (`RecordCard`, `StatusBadge`, `DigitalScaleThumbnail`) | `npm run lint`, `npm run build`, and browser UI checks across crew and sponsor views |
| 2026-11-20 | Antigravity (Gemini) | Build the F3 backend API (`features/crew-and-home-history-backend`) for crew totals, personal history, record details, and sponsor crew overview following `BR-2` and `BR-12` | `f3_crew_history/{router.py,schemas.py,service.py}` (`/api/me/summary`, `/api/records/mine`, `/api/records/{id}`, `/api/crew`, `/api/crew/{id}`) and `test_f3_crew_history.py` | `python -m pytest tests/f3_crew_history` and API checks against PostgreSQL |
| 2026-11-26 | Antigravity (Gemini) | Add `CHG-001` English/Thai/Burmese language switcher in F3, integrate F2 IndexedDB offline drafts (`SAVED_ON_PHONE`), and review/fix F3 frontend and backend | `i18n.js`, `LanguageSwitcher.jsx`, `offlineQueue.js`, updated F3 pages/components, `service.py` (`selectinload`, `round(..., 2)`), new tests in `test_f3_crew_history.py` | `pytest tests/f3_crew_history` (11 passed), `npm run lint`, `npm run build`, and JSON key/placeholder check |

## F4 · Verification (Hein Thant Si Thu)

| Date | Tool | What I asked | What I used | How I verified |
|---|---|---|---|---|

## F5 · Fleet & boats (Natthachaimongkol Chayopathum)

| Date | Tool | What I asked | What I used | How I verified |
|---|---|---|---|---|
