"""Feature 5 - seed data, called by app/seed.py (after users, before records).

TODO(F5): demo boats from NFR-21 - HC-14 Harbor Cleaner, SH-02 Sea Harvest,
RM-07 River Mouth, SL-03 Shoreline Team A. Skip boats that already exist.
"""

from sqlmodel import Session


def seed(session: Session) -> None:
    pass
