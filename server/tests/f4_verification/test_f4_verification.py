"""Feature 4 tests - owner: Hein Thant Si Thu.

NFR-12: one test per endpoint and per business rule, e.g.
  verify sets VERIFIED, reviewed_by, reviewed_at (FR-4.4)
  reject without reason -> 400 (BR-4)
  second decision on the same record -> 409 (FR-4.4)
  queue is oldest first and only PENDING (FR-4.1)
"""

from app.features.f4_verification.router import router


def test_f4_router_is_importable():
    assert router.prefix == "/api"
