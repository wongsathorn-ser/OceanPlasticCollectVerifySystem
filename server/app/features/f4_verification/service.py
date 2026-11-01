"""Feature 4 - decision logic on the records table (owned by F2).

TODO(F4): PENDING -> VERIFIED or REJECTED only (BR-1); VERIFIED and REJECTED
are final; reject needs a non-empty reason (BR-4); set reviewed_by and
reviewed_at on every decision; return 409 if the record is no longer PENDING
(protects against two supervisors deciding at the same time).
"""
