# Deployment (CD) on Render

Follows the professor's "Software Deployment on Render" lab (W14). Three Render services, all deployed from this one GitHub repository:

| Render service | What | Settings |
|---|---|---|
| **Postgres** (Free) | Database | Region: Singapore (closest to Thailand) – same region as the backend |
| **Web Service** (Free, Docker) | FastAPI backend | Root directory `server` · Runtime **Docker** · Branch `main` |
| **Static Site** (Free) | React frontend | Root directory `client` · Build `npm ci && npm run build` · Publish directory `dist` · Branch `main` |

## Step by step

1. **GitHub** – push this repository and add all members as collaborators.
2. **Render Postgres** – New → Postgres → Free. Copy the **Internal Database URL**.
   Free databases expire **30 days after creation** (then 14 days grace) and hold 1 GB with no backups. The final presentation is on 5 Dec 2026, so create the database you will present with **after about 8 Nov**, or re-create it and run the seed script again.
3. **Backend Web Service** – New → Web Service → this repo, root directory `server`, runtime Docker, Free. Environment variables:

   | Name | Value |
   |---|---|
   | `DATABASE_URL` | the Internal Database URL from step 2 |
   | `APP_ENV` | `prod` |
   | `COOKIE_SECURE` | `true` |
   | `CORS_ORIGINS` | empty (same origin via the rewrite in step 4) |
   | `ADMIN_USERNAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` | real values for the default admin (FR-1.9) |

   Check `https://<backend>.onrender.com/api/health` and `/api/health/db`. Free web services sleep after 15 minutes without traffic and need about a minute to wake up.
4. **Frontend Static Site** – New → Static Site → this repo, root directory `client`, build `npm ci && npm run build`, publish `dist`. Then **Redirects/Rewrites**, in this order:

   | Source | Destination | Action |
   |---|---|---|
   | `/api/*` | `https://<backend>.onrender.com/api/*` | Rewrite |
   | `/*` | `/index.html` | Rewrite |

   The first rule makes the API look like the same origin as the frontend, so the HttpOnly session cookie is first-party. This matters because `*.onrender.com` addresses count as different sites and Safari (iPhones) blocks third-party cookies. The second rule lets React Router handle page URLs.
   **Week-1 spike:** confirm that POST requests, multipart photo uploads and `Set-Cookie` work through this rewrite. If they do not, the fallback is a custom domain with `app.` and `api.` subdomains.
5. **Protect `main`** (GitHub → Settings → Branches → Add classic branch protection rule, branch name pattern `main`):
   - Require a pull request before merging, required approvals: 1
   - Require status checks to pass: `backend (pytest)`, `frontend (lint + build)`, `docker (build images)`
   - Optional: Require review from Code Owners (after filling `.github/CODEOWNERS`)
6. **Seed** – run the seed script once against the Render database from your computer:

   ```bash
   cd server
   DATABASE_URL="<External Database URL>" uv run python -m app.seed
   ```

   (PowerShell: `$env:DATABASE_URL="<External Database URL>"; uv run python -m app.seed`.) Free web services have no shell, so the seed runs from a laptop with the **External** URL.

## How CD works

Render auto-deploys both services whenever `main` changes. Because `main` only accepts reviewed PRs with green CI, every deploy has passed the tests first. Photos are stored in the database because the Render filesystem is wiped on every restart or deploy.
