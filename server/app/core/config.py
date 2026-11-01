"""Application settings read from environment variables (NFR-20).

SHARED FILE. Values come from the root .env file (docker compose) or from
the Render dashboard in production. Never hard-code secrets here.
"""

import os


def _as_bool(value: str) -> bool:
    return value.strip().lower() in {"1", "true", "yes", "on"}


# "dev" (hot reload), "test" (CI) or "prod" (Render)
APP_ENV = os.getenv("APP_ENV", "dev")

# PostgreSQL for now (docs/DECISIONS.md D1). Default = the compose database
# seen from your own machine; inside Docker compose overrides this value.
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://appuser:password@localhost:54242/appdb",
)
# SQLAlchemy 2.1 picks the newer "psycopg" (v3) driver for postgresql:// URLs.
# We use psycopg2-binary like the Render lab, so name that driver explicitly.
# (Render's DATABASE_URL starts with postgresql:// - this keeps it working.)
if DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg2://", 1)

# Comma-separated list of allowed frontend origins. Leave empty when the
# frontend and the API are served from the same origin.
CORS_ORIGINS = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", "").split(",")
    if origin.strip()
]

# Session cookie settings (Feature 1: FR-1.1 - FR-1.3)
SESSION_COOKIE_NAME = os.getenv("SESSION_COOKIE_NAME", "ocean_session")
SESSION_TTL_DAYS = int(os.getenv("SESSION_TTL_DAYS", "7"))
COOKIE_SECURE = _as_bool(os.getenv("COOKIE_SECURE", "true"))

# Default admin created by the seed script (FR-1.9)
ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "")
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "")
