# How we work (team rules)

Goal: five people working in parallel with **no merge conflicts**, and a history that shows the professor who built what.

## 1. Stay in your own folders

| Feature | Owner | Your folders |
|---|---|---|
| F1 Accounts & access | Wongsathorn Sereephap | `server/app/features/f1_accounts/`, `server/tests/f1_accounts/`, `client/src/features/f1_accounts/` |
| F2 Record a collection | Masaaki Kato | `server/app/features/f2_record_collection/`, `server/tests/f2_record_collection/`, `client/src/features/f2_record_collection/` |
| F3 Crew home & history | Kaung Khant Paing | `server/app/features/f3_crew_history/`, `server/tests/f3_crew_history/`, `client/src/features/f3_crew_history/` |
| F4 Verification | Hein Thant Si Thu | `server/app/features/f4_verification/`, `server/tests/f4_verification/`, `client/src/features/f4_verification/` |
| F5 Fleet & boats | Natthachaimongkol Chayopathum | `server/app/features/f5_fleet_boats/`, `server/tests/f5_fleet_boats/`, `client/src/features/f5_fleet_boats/` |

**Shared files** – change them only in a small, separate PR and tell the team first:
`server/app/main.py`, `server/app/core/*`, `server/app/seed.py`, `server/tests/conftest.py`, `client/src/main.jsx`, `client/src/App.jsx`, `client/src/index.css`, `client/src/shared/*`, `client/vite.config.js`, `compose.yaml`, `.github/*`, dependency files (`pyproject.toml`, `uv.lock`, `requirements.txt`, `package.json`, `package-lock.json`).

The template already wires all five routers (`main.py`) and all five route lists (`App.jsx`), so normally you never touch them. Using another feature's code is fine (e.g. F3 imports the `Record` model from F2, everyone imports `require_role` from F1) – changing it is the owner's job.

## 2. Branches

- `main` is protected: no direct pushes, merge only through pull requests.
- Name branches after your feature: `f1/login-endpoint`, `f2/offline-queue`, `f5/boat-form`, shared work: `shared/<topic>`.
- Keep branches short-lived (1–3 days). Update yours from main often:

```bash
git checkout main
git pull
git checkout f1/login-endpoint
git merge main
```

## 3. Commits

Small commits, feature prefix and requirement ID in the message:

```
F1: add POST /api/auth/login with session cookie (FR-1.1)
F4: return 409 when record is already decided (FR-4.4)
shared: add status colours to ui/status.js (NFR-14)
```

## 4. Pull requests (NFR-11)

1. Push your branch and open a PR into `main` – the template asks for feature, requirement IDs and a checklist.
2. CI must be green: backend tests, frontend lint + build, Docker images build.
3. At least one other member reviews and approves.
4. Merge. Render then redeploys main automatically (docs/DEPLOYMENT.md).

## 5. Before you push

```bash
# backend (with docker compose running)
docker compose exec backend python -m pytest -vv
# frontend
cd client && npm run lint && npm run build
```

## 6. Dependencies

Only technology taught in ITCS525 unless the team agrees (docs/DECISIONS.md). Lock files conflict easily, so announce dependency changes in the team chat and let one person do them at a time. If `package-lock.json` or `uv.lock` conflicts, take main's version and re-run `npm install <package>` / `uv add <package>`.

## 7. AI tools

Allowed (AI Usage Level 4) but log what you used in `docs/AI_USAGE.md` – the final rubric grades "Ethical & Responsible AI Use". You must understand and be able to explain every line you commit.
