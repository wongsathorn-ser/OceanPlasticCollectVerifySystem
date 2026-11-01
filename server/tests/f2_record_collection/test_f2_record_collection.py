"""Feature 2 tests - owner: Masaaki Kato.

NFR-12: one test per endpoint and per business rule, e.g.
  create record -> PENDING with record_number (BR-1)
  missing photo / GPS / weight <= 0 / inactive boat -> 400 (BR-5)
  same client_id twice -> one record, second call returns it (BR-10, AC-2)
  crew_id in the body is ignored - taken from the session (BR-11)
"""

from app.features.f2_record_collection.router import router


def test_f2_router_is_importable():
    assert router.prefix == "/api"
