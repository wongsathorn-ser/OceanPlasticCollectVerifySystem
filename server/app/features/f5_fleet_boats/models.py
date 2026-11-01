"""Feature 5 - SQLModel table: DM-2 boats.

Feature 2 links every record to a boat (records.boat_id -> boats.id).

TODO(F5):
- class Boat(SQLModel, table=True) with __tablename__ = "boats"
    id, code (unique, e.g. "HC-14"), name (e.g. "Harbor Cleaner"),
    capacity_kg (> 0), active (True = crews can choose it)
- Deactivating a boat must not break records already linked to it (BR-6).
"""
