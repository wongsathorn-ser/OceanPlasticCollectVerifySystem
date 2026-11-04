"""Feature 1 - seed data.

NOW: seed_memory_store() fills the in-memory store (memory_store.py) when the
     app starts (called at the bottom of router.py).
LATER: seed(session) will write the same users to the database; app/seed.py
     already calls it.

Default admin (FR-1.9): username/email/password come from the environment
(ADMIN_USERNAME, ADMIN_EMAIL, ADMIN_PASSWORD in .env). Without them - for
example `uv run fastapi dev` with no .env - the demo values below are used.
Every other demo account has the password `password123` (NFR-21 demo data).
"""

from datetime import datetime, timedelta, timezone

from sqlmodel import Session

from app.core import config
from app.features.f1_accounts import memory_store
from app.features.f1_accounts.service import hash_password

DEMO_PASSWORD = "password123"


def demo_users() -> list[dict]:
    now = datetime.now(timezone.utc)

    def day(text: str) -> datetime:
        return datetime.fromisoformat(text).replace(tzinfo=timezone.utc)

    rows = [
        # (id, name, username, email, role, status, created_at)
        (1, "Marco Reyes", "mreyes", "m.reyes@opr.org", "CREW_MEMBER", "ACTIVE", day("2026-03-02T08:00")),
        (2, "Lea Novak", "lnovak", "l.novak@opr.org", "CREW_MEMBER", "ACTIVE", day("2026-03-09T08:00")),
        (3, "Jonas Peret", "jperet", "j.peret@opr.org", "CREW_MEMBER", "ACTIVE", day("2026-04-14T08:00")),
        (4, "Tomas Iversen", "tiversen", "t.iversen@opr.org", "CREW_MEMBER", "SUSPENDED", day("2026-04-20T08:00")),
        (6, "Sofia Mendes", "smendes", "s.mendes@opr.org", "SPONSOR_MANAGEMENT", "ACTIVE", day("2026-02-03T08:00")),
        (7, "Elena Vasquez", "evasquez", "e.vasquez@opr.org", "CREW_MEMBER", "PENDING", now - timedelta(hours=2)),
        (8, "Priya Raman", "praman", "p.raman@nordsea.com", "SPONSOR_MANAGEMENT", "PENDING", now - timedelta(hours=48)),
    ]
    demo_hash = hash_password(DEMO_PASSWORD)  # one hash shared by the demo accounts keeps start-up fast
    users = [
        {
            "id": user_id,
            "name": name,
            "email": email,
            "username": username,
            "password_hash": demo_hash,
            "role": role,
            "status": status,
            "created_at": created_at,
        }
        for user_id, name, username, email, role, status, created_at in rows
    ]
    users.append(
        {
            "id": 5,
            "name": "Amara Osei",
            "email": (config.ADMIN_EMAIL or "a.osei@opr.org").lower(),
            "username": (config.ADMIN_USERNAME or "admin").lower(),
            "password_hash": hash_password(config.ADMIN_PASSWORD or DEMO_PASSWORD),
            "role": "ADMIN",
            "status": "ACTIVE",
            "created_at": day("2026-01-12T08:00"),
        }
    )
    return users


def seed_memory_store() -> None:
    """Called once from router.py at import time."""
    memory_store.load(demo_users())


def seed(session: Session) -> None:
    """Database seed - not used while F1 stores data in memory."""
    pass
