"""Feature 3 tests - owner: Kaung Khant Paing.

NFR-12: one test per endpoint and per business rule. Data comes from the
demo seed data in the test database (app/seed.py), recreated before every
test (tests/conftest.py).
Run: docker compose exec backend python -m pytest tests/f3_crew_history -vv
"""

from datetime import timezone

import pytest
from fastapi.testclient import TestClient
from sqlmodel import select

from app.core.clock import thailand_day_start, thailand_month_start
from app.features.f1_accounts.models import User
from app.features.f2_record_collection.models import Record
from app.features.f3_crew_history.router import router
from app.main import app


@pytest.fixture
def f3_client():
    # https base URL: the session cookie is Secure when COOKIE_SECURE=true
    return TestClient(app, base_url="https://testserver")


def sign_in(client: TestClient, username: str, password: str = "password123"):
    return client.post("/api/auth/login", json={"username": username, "password": password})


def test_f3_router_is_importable():
    assert router.prefix == "/api"


def test_summary_separates_verified_and_pending_weight(f3_client, db):
    sign_in(f3_client, "mreyes")
    res = f3_client.get("/api/me/summary")
    assert res.status_code == 200
    data = res.json()

    marco = db.exec(select(User).where(User.username == "mreyes")).one()
    records = db.exec(select(Record).where(Record.crew_id == marco.id)).all()
    today_start = thailand_day_start()
    month_start = thailand_month_start()

    def _utc(dt):
        return dt.replace(tzinfo=timezone.utc) if dt.tzinfo is None else dt

    assert data["today_verified_kg"] == sum(
        r.weight_kg for r in records if r.status == "VERIFIED" and _utc(r.recorded_at) >= today_start
    )
    assert data["today_pending_kg"] == sum(
        r.weight_kg for r in records if r.status == "PENDING" and _utc(r.recorded_at) >= today_start
    )
    assert data["month_verified_kg"] == sum(
        r.weight_kg for r in records if r.status == "VERIFIED" and _utc(r.recorded_at) >= month_start
    )
    assert data["month_pending_kg"] == sum(
        r.weight_kg for r in records if r.status == "PENDING" and _utc(r.recorded_at) >= month_start
    )
    assert data["pending_count"] == sum(1 for r in records if r.status == "PENDING")
    assert data["pending_count"] >= 2


def test_history_filter_by_status_newest_first(f3_client):
    sign_in(f3_client, "mreyes")

    res_all = f3_client.get("/api/records/mine")
    assert res_all.status_code == 200
    items = res_all.json()
    assert len(items) > 0
    timestamps = [item["recorded_at"] for item in items]
    assert timestamps == sorted(timestamps, reverse=True)

    res_pending = f3_client.get("/api/records/mine", params={"status": "PENDING"})
    assert res_pending.status_code == 200
    pending = res_pending.json()
    assert len(pending) >= 2
    assert all(item["status"] == "PENDING" for item in pending)


def test_crew_cannot_read_another_crew_record(f3_client, db):
    sign_in(f3_client, "mreyes")
    lea = db.exec(select(User).where(User.username == "lnovak")).one()
    lea_record = db.exec(select(Record).where(Record.crew_id == lea.id)).first()
    assert lea_record is not None

    res = f3_client.get(f"/api/records/{lea_record.id}")
    assert res.status_code == 403


def test_rejected_record_detail_shows_reviewer_and_reason(f3_client, db):
    rejected = db.exec(select(Record).where(Record.status == "REJECTED")).first()
    assert rejected is not None

    crew = db.get(User, rejected.crew_id)
    # If the seeded rejected record belongs to a suspended user, check as sponsor/management.
    if crew.status == "ACTIVE":
        sign_in(f3_client, crew.username)
    else:
        sign_in(f3_client, "smendes")

    res = f3_client.get(f"/api/records/{rejected.id}")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "REJECTED"
    assert data["reviewed_by_name"] == "Sofia Mendes"
    assert data["reason"]
    assert data["photo_url"] == f"/api/photos/{rejected.id}"


def test_sponsor_crew_overview_and_member_detail(f3_client, db):
    sign_in(f3_client, "smendes")

    res_list = f3_client.get("/api/crew")
    assert res_list.status_code == 200
    crew_list = res_list.json()
    names = [c["name"] for c in crew_list]
    assert names == sorted(names)  # BR-12: alphabetical, not ranked by weight
    assert "Elena Vasquez" not in names  # PENDING request is excluded

    res_search = f3_client.get("/api/crew", params={"search": "Marco"})
    assert res_search.status_code == 200
    assert [c["name"] for c in res_search.json()] == ["Marco Reyes"]

    marco = db.exec(select(User).where(User.username == "mreyes")).one()
    res_detail = f3_client.get(f"/api/crew/{marco.id}")
    assert res_detail.status_code == 200
    detail = res_detail.json()
    assert detail["name"] == "Marco Reyes"
    assert detail["records_count"] >= 2
    assert len(detail["recent_records"]) <= 10
    assert len(detail["boats_worked"]) >= 1


def test_auth_and_role_permissions(f3_client, db):
    marco = db.exec(select(User).where(User.username == "mreyes")).one()
    rec = db.exec(select(Record)).first()
    assert rec is not None

    # Unauthenticated requests -> 401
    for path in ("/api/me/summary", "/api/records/mine", f"/api/records/{rec.id}", "/api/crew", f"/api/crew/{marco.id}"):
        assert f3_client.get(path).status_code == 401

    # CREW_MEMBER cannot access sponsor endpoints -> 403
    sign_in(f3_client, "mreyes")
    assert f3_client.get("/api/crew").status_code == 403
    assert f3_client.get(f"/api/crew/{marco.id}").status_code == 403

    # SPONSOR_MANAGEMENT cannot access crew-only endpoints -> 403
    f3_client.post("/api/auth/logout")
    sign_in(f3_client, "smendes")
    assert f3_client.get("/api/me/summary").status_code == 403
    assert f3_client.get("/api/records/mine").status_code == 403

    # ADMIN is blocked from F3 endpoints -> 403
    f3_client.post("/api/auth/logout")
    sign_in(f3_client, "admin")
    for path in ("/api/me/summary", "/api/records/mine", f"/api/records/{rec.id}", "/api/crew", f"/api/crew/{marco.id}"):
        assert f3_client.get(path).status_code == 403


def test_validation_and_not_found_errors(f3_client, db):
    sign_in(f3_client, "mreyes")
    assert f3_client.get("/api/records/mine", params={"status": "INVALID"}).status_code == 400
    assert f3_client.get("/api/records/999999").status_code == 404

    f3_client.post("/api/auth/logout")
    sign_in(f3_client, "smendes")
    assert f3_client.get("/api/crew", params={"period": "invalid"}).status_code == 400
    assert f3_client.get("/api/crew/999999").status_code == 404

    pending_user = db.exec(select(User).where(User.username == "evasquez")).one()
    assert f3_client.get(f"/api/crew/{pending_user.id}").status_code == 404


def test_crew_overview_period_and_boat_search(f3_client, db):
    sign_in(f3_client, "smendes")

    today_res = f3_client.get("/api/crew", params={"period": "today"})
    assert today_res.status_code == 200
    today_marco = next(c for c in today_res.json() if c["name"] == "Marco Reyes")
    assert today_marco["records_count"] >= 2

    month_res = f3_client.get("/api/crew", params={"period": "month"})
    assert month_res.status_code == 200
    assert len(month_res.json()) >= 1

    marco = db.exec(select(User).where(User.username == "mreyes")).one()
    marco_rec = db.exec(select(Record).where(Record.crew_id == marco.id)).first()
    assert marco_rec is not None
    boat_code = marco_rec.boat.code

    boat_search = f3_client.get("/api/crew", params={"search": boat_code})
    assert boat_search.status_code == 200
    assert any(c["name"] == "Marco Reyes" and boat_code in c["boats"] for c in boat_search.json())


def test_sponsor_can_read_any_crew_record(f3_client, db):
    sign_in(f3_client, "smendes")
    marco = db.exec(select(User).where(User.username == "mreyes")).one()
    rec = db.exec(select(Record).where(Record.crew_id == marco.id)).first()
    assert rec is not None

    res = f3_client.get(f"/api/records/{rec.id}")
    assert res.status_code == 200
    data = res.json()
    assert data["id"] == rec.id
    assert data["crew_id"] == marco.id
    assert data["crew_name"] == "Marco Reyes"


def test_summary_rounds_decimal_weights_cleanly(f3_client, db):
    from app.core.clock import utc_now
    from app.features.f5_fleet_boats.models import Boat

    jonas = db.exec(select(User).where(User.username == "jperet")).one()
    boat = db.exec(select(Boat)).first()
    now = utc_now()
    for w in (12.1, 12.2, 12.3):
        db.add(
            Record(
                boat_id=boat.id,
                crew_id=jonas.id,
                weight_kg=w,
                material="MIXED",
                recorded_at=now,
                status="VERIFIED",
            )
        )
    db.commit()

    sign_in(f3_client, "jperet")
    res = f3_client.get("/api/me/summary")
    assert res.status_code == 200
    assert res.json()["today_verified_kg"] == 36.6


