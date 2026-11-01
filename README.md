# Ocean Plastic Collection Verification System

ITCS525 Software and Application Development (× ITCS514) · Group 5 – Ocean · Mahidol University ICT

Crews record each plastic load (boat, weight, material, a photo of the scale, GPS and time) on their phones – even with no signal at sea. Sponsor / Management verifies or rejects every record against its photo, and dashboards count **only verified weight**.

> **Status:** project template. Structure, configuration, Docker, CI/CD and placeholder screens are in place; the features are not implemented yet.

- Specification: [`docs/requirements/system_requirements.txt`](docs/requirements/system_requirements.txt) (requirement IDs like FR-1.1, BR-2 are used in code, commits and PRs)
- UI design: [Figma – Verification system flow](https://www.figma.com/design/if70Iuf4DTrCEf8p8hjbiR/Verification-system-flow?node-id=0-1)
- Team rules: [`docs/CONTRIBUTING.md`](docs/CONTRIBUTING.md) · Deployment: [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) · Decisions: [`docs/DECISIONS.md`](docs/DECISIONS.md) · AI log: [`docs/AI_USAGE.md`](docs/AI_USAGE.md)

## Team & ownership

Each member owns one feature end to end: React screens, FastAPI endpoints and the tables/queries behind it.

| Feature | Owner | Backend | Frontend | Tests | Figma |
|---|---|---|---|---|---|
| F1 Accounts & access (+ repo, Docker, auth setup) | Wongsathorn Sereephap | [`server/app/features/f1_accounts`](server/app/features/f1_accounts) | [`client/src/features/f1_accounts`](client/src/features/f1_accounts) | `server/tests/f1_accounts` | Flow 01, Users, Profile |
| F2 Record a collection (offline + GPS) | Masaaki Kato | [`server/app/features/f2_record_collection`](server/app/features/f2_record_collection) | [`client/src/features/f2_record_collection`](client/src/features/f2_record_collection) | `server/tests/f2_record_collection` | Flow 02 |
| F3 Crew home & history | Kaung Khant Paing | [`server/app/features/f3_crew_history`](server/app/features/f3_crew_history) | [`client/src/features/f3_crew_history`](client/src/features/f3_crew_history) | `server/tests/f3_crew_history` | Flows 03, 05 |
| F4 Verification | Hein Thant Si Thu | [`server/app/features/f4_verification`](server/app/features/f4_verification) | [`client/src/features/f4_verification`](client/src/features/f4_verification) | `server/tests/f4_verification` | Flow 04 |
| F5 Fleet & boats | Natthachaimongkol Chayopathum | [`server/app/features/f5_fleet_boats`](server/app/features/f5_fleet_boats) | [`client/src/features/f5_fleet_boats`](client/src/features/f5_fleet_boats) | `server/tests/f5_fleet_boats` | Flow 06, Boats, Add a boat |

Every feature folder has its own `README.md` listing its screens, endpoints, tables and rules.

## Tech stack (as taught in ITCS525)

| Layer | Technology |
|---|---|
| Frontend | React 19 (Vite, JavaScript), Tailwind CSS v4, React Router (declarative mode), `fetch` |
| Backend | Python 3.13, FastAPI, Pydantic, SQLModel, uv |
| Database | PostgreSQL 16 (psycopg2) – see docs/DECISIONS.md D1 |
| Testing | pytest + FastAPI TestClient, oxlint |
| DevOps | Docker + Docker Compose, GitHub Actions CI, Render (CD) |

## Repository layout

```
OceanPlasticCollectVerifySystem/
├── client/                 React app            (client/README.md)
│   └── src/
│       ├── shared/         shared layout, API client, UI helpers
│       └── features/       f1_accounts · f2_record_collection · f3_crew_history · f4_verification · f5_fleet_boats
├── server/                 FastAPI app          (server/README.md)
│   ├── app/
│   │   ├── core/           config + database (shared)
│   │   └── features/       same five feature folders
│   └── tests/              same five feature folders
├── docs/                   requirements, team rules, deployment, decisions, AI log
├── .github/                CI workflow, PR template, CODEOWNERS
├── compose.yaml            local stack: database + backend + frontend
└── .env.example            copy to .env
```

## Getting started

Prerequisites: Git, Docker Desktop. For working outside Docker: Node.js 22 and uv (Python 3.13).

```bash
git clone <repository-url>
cd OceanPlasticCollectVerifySystem
cp .env.example .env          # PowerShell: copy .env.example .env
docker compose up --build
```

| URL | What |
|---|---|
| http://localhost:5173 | Frontend (React, hot reload) |
| http://localhost:34242/docs | Backend API docs (Swagger) |
| http://localhost:34242/api/health/db | Backend ↔ database check |
| `127.0.0.1:54242` | PostgreSQL for a DB client (user/password from `.env`) |

Useful commands:

```bash
docker compose exec backend python -m pytest -vv   # backend tests
docker compose exec backend python -m app.seed     # default admin + demo data
docker compose down                                # stop (keeps data)
docker compose down -v                             # stop and wipe the database
```

Faster hot reload on Windows: keep the database in Docker (`docker compose up -d database`) and run the backend (`cd server && uv sync && uv run fastapi dev app/main.py --port 34242`) and the frontend (`cd client && npm install && npm run dev`) directly.

## Workflow in one minute

1. `git checkout -b f1/<what-you-build>` (use your feature number)
2. Work only in your feature folders; commit as `F1: ... (FR-1.1)`
3. Push, open a pull request, wait for green CI and one approval
4. Merge – Render redeploys `main` automatically

Details in [`docs/CONTRIBUTING.md`](docs/CONTRIBUTING.md).
