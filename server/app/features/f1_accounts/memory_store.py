"""Feature 1 - TEMPORARY in-memory storage (plain Python dictionaries).

The team has no database yet, so F1 keeps its two "tables" here:

    USERS     users.id            -> user row (dict)        DM-1 users
    SESSIONS  sha256(session id)  -> session row (dict)     DM-4 sessions

Everything lives in the server process: restarting the backend (or the
auto-reload of `fastapi dev`) puts the demo data from seed.py back.

When the database arrives, service.py is the only file that reads or writes
these dictionaries, so only service.py has to change to SQLModel queries
(models.py already lists the planned tables).
"""

import copy

USERS: dict[int, dict] = {}
SESSIONS: dict[str, dict] = {}

_next_user_id = 1
_snapshot: dict[int, dict] = {}


def new_user_id() -> int:
    """Like an auto-increment primary key."""
    global _next_user_id
    user_id = _next_user_id
    _next_user_id += 1
    return user_id


def load(users: list[dict]) -> None:
    """Replace all data with `users` and remember them for reset()."""
    global _snapshot
    _snapshot = {user["id"]: copy.deepcopy(user) for user in users}
    reset()


def reset() -> None:
    """Back to the seeded data, no sessions (used by the tests)."""
    global _next_user_id
    USERS.clear()
    USERS.update(copy.deepcopy(_snapshot))
    SESSIONS.clear()
    _next_user_id = max(USERS, default=0) + 1
