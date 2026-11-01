"""Feature 1 - SQLModel tables: DM-1 users and DM-4 sessions.

Other features import User from here (records.crew_id and records.reviewed_by
point to users.id).

TODO(F1):
- class User(SQLModel, table=True) with __tablename__ = "users"
    id, name, email (unique), username (unique), password_hash,
    role (CREW_MEMBER | SPONSOR_MANAGEMENT | ADMIN),
    status (PENDING | ACTIVE | REJECTED | SUSPENDED), created_at
- class UserSession(SQLModel, table=True) with __tablename__ = "sessions"
    id (random, unguessable; store it hashed), user_id -> users.id,
    created_at, expires_at
  Do not name the class `Session`: it would clash with sqlmodel.Session.
- Keep column types portable (no PostgreSQL-only types) - the team may
  switch databases later (docs/DECISIONS.md D1).
"""
