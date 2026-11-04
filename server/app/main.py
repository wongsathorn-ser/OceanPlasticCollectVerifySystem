"""FastAPI application entry point.

SHARED FILE - owned by the whole team, changes reviewed by the project lead.
All five feature routers are already included below, so feature owners
normally never need to edit this file: add your endpoints in
app/features/<your feature>/router.py instead.

Run locally:   uv run fastapi dev app/main.py --port 34242
Run in Docker: docker compose up --build      (see the root README)
API docs:      http://localhost:34242/docs
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.exc import OperationalError
from sqlmodel import text

from app.core import config
from app.core.database import create_db_and_tables, engine
from app.features.f1_accounts.router import router as f1_accounts_router
from app.features.f2_record_collection.router import router as f2_record_collection_router
from app.features.f3_crew_history.router import router as f3_crew_history_router
from app.features.f4_verification.router import router as f4_verification_router
from app.features.f5_fleet_boats.router import router as f5_fleet_boats_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # start up: create any missing tables (same approach as the ORM lecture)
    try:
        create_db_and_tables()
    except OperationalError:
        # No database running yet: keep the API up so features that store data
        # in memory for now (F1) still work. /api/health/db shows the DB status.
        print("WARNING: database not reachable - starting without it.")
    yield
    # shutdown: nothing to clean up yet


app = FastAPI(
    title="Ocean Plastic Collection Verification System API",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS is only needed when the frontend runs on a different origin.
# Locally the Vite dev server proxies /api, and in production the Render
# static site rewrites /api, so CORS_ORIGINS normally stays empty.
# Never use ["*"] together with cookies (allow_credentials=True).
if config.CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=config.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )


@app.get("/api/health", tags=["health"])
def health():
    """Liveness check used by Docker, CI and the first cloud deployment."""
    return {"status": "ok", "env": config.APP_ENV}


@app.get("/api/health/db", tags=["health"])
def health_db():
    """Database connectivity check (same idea as /test-db in the Docker lab)."""
    with engine.connect() as conn:
        return {"db_result": conn.execute(text("SELECT 1")).scalar_one()}


# Feature routers - one per team member (see README "Team & ownership").
app.include_router(f1_accounts_router)            # F1 Accounts & access
app.include_router(f2_record_collection_router)   # F2 Record a collection
app.include_router(f3_crew_history_router)        # F3 Crew home & history
app.include_router(f4_verification_router)        # F4 Verification
app.include_router(f5_fleet_boats_router)         # F5 Fleet & boats
