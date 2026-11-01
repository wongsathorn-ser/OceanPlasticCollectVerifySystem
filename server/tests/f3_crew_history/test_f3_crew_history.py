"""Feature 3 tests - owner: Kaung Khant Paing.

NFR-12: one test per endpoint and per business rule, e.g.
  summary separates verified and pending weight (BR-2)
  history filter by status, newest first (FR-3.2)
  crew cannot read another crew member's record (403/404)
  rejected record detail shows reviewer and reason (FR-3.3, AC-3)
"""

from app.features.f3_crew_history.router import router


def test_f3_router_is_importable():
    assert router.prefix == "/api"
