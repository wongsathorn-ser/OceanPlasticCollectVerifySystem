"""Feature 1 tests - owner: Wongsathorn Sereephap.

NFR-12: one test per endpoint and per business rule, e.g.
  register -> PENDING user cannot sign in (BR-8) -> admin approves -> sign in works
  login sets an HttpOnly cookie; wrong password gives a generic error (FR-1.1)
  suspended user is signed out and blocked (BR-7)
  crew calling an admin endpoint gets 403 (AC-6)
Keep file names unique across folders (test_f1_*.py) so pytest does not mix them up.
"""

from app.features.f1_accounts.router import router


def test_f1_router_is_importable():
    assert router.prefix == "/api"
