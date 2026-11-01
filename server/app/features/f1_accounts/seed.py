"""Feature 1 - seed data, called by app/seed.py.

TODO(F1): create the default ADMIN from config.ADMIN_USERNAME / ADMIN_EMAIL /
ADMIN_PASSWORD (FR-1.9 - never hard-code credentials) and demo users of each
role (NFR-21). Make it safe to run twice (skip users that already exist).
"""

from sqlmodel import Session


def seed(session: Session) -> None:
    pass
