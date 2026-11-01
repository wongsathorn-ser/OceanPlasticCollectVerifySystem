"""Feature 2 - SQLModel table: DM-3 records.

Features 3, 4 and 5 read this table, and Feature 4 updates its status, so
agree on field names early and announce changes in the team chat.

TODO(F2):
- class Record(SQLModel, table=True) with __tablename__ = "records"
    id, client_id (UUID, unique), record_number (unique), boat_id -> boats.id,
    crew_id -> users.id, weight_kg (> 0), material (PET_BOTTLES | HDPE_RIGID |
    FISHING_NET_ROPE | LDPE_FILM | MIXED), photo_url, note, latitude,
    longitude, gps_accuracy_m, recorded_at, status (PENDING | VERIFIED |
    REJECTED), reviewed_by -> users.id, reviewed_at, reason, created_at
- Photo storage: binary in the database (team decision). Pending decision:
  separate photo table vs. column on records (docs/DECISIONS.md).
- Records are immutable after saving (BR-3): no update/delete endpoints.
"""
