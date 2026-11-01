"""Feature 5 tests - owner: Natthachaimongkol Chayopathum.

NFR-12: one test per endpoint and per business rule, e.g.
  crews only receive active boats (BR-6)
  duplicate boat code -> 400/409; capacity_kg must be > 0 (DM-2)
  fleet totals grow only by VERIFIED weight (BR-2, AC-4)
  non-admin cannot create or edit boats (403)
"""

from app.features.f5_fleet_boats.router import router


def test_f5_router_is_importable():
    assert router.prefix == "/api"
