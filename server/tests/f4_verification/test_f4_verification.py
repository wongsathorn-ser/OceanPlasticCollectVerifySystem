"""F4 API and decision-rule tests (FR-4.1 - FR-4.5, BR-1, BR-4)."""

from datetime import datetime, timedelta, timezone

from sqlmodel import select

from app.features.f1_accounts.models import User
from app.features.f2_record_collection.models import Record
from app.features.f4_verification.router import router


def sign_in(client, username: str):
    return client.post("/api/auth/login", json={"username": username, "password": "password123"})


def test_f4_router_is_importable():
    assert router.prefix == "/api"


def test_verification_routes_require_sponsor_role(f4_client):
    assert f4_client.get("/api/verify/queue").status_code == 401
    assert sign_in(f4_client, "mreyes").status_code == 200
    assert f4_client.get("/api/verify/queue").status_code == 403
    assert f4_client.get("/api/verify/history").status_code == 403
    assert f4_client.get("/api/verify/records/1").status_code == 403
    assert f4_client.post("/api/records/1/verify").status_code == 403


def test_queue_contains_only_pending_records_oldest_first_and_summary_fields(f4_client, db):
    assert sign_in(f4_client, "smendes").status_code == 200
    response = f4_client.get("/api/verify/queue")
    assert response.status_code == 200
    rows = response.json()
    assert rows
    assert all(row["status"] == "PENDING" for row in rows)
    assert [(row["recordedAt"], row["id"]) for row in rows] == sorted(
        (row["recordedAt"], row["id"]) for row in rows
    )
    assert {"recordNumber", "crew", "boat", "material", "weightKg", "recordedAt", "photoUrl"} <= rows[0].keys()
    assert sum(row["weightKg"] for row in rows) > 0


def test_review_detail_returns_protected_scale_photo_url(f4_client):
    assert sign_in(f4_client, "smendes").status_code == 200
    queue = f4_client.get("/api/verify/queue").json()
    record = f4_client.get(f"/api/verify/records/{queue[0]['id']}")
    assert record.status_code == 200
    data = record.json()
    assert data["recordNumber"] == queue[0]["recordNumber"]
    assert data["photoUrl"].endswith(f"/api/photos/{data['id']}?kind=SCALE")
    photo = f4_client.get(data["photoUrl"])
    assert photo.status_code == 200
    assert photo.headers["content-type"].startswith("image/")


def test_verify_sets_final_status_reviewer_and_utc_timestamp(f4_client, db):
    assert sign_in(f4_client, "smendes").status_code == 200
    before = datetime.now(timezone.utc) - timedelta(seconds=1)
    record_id = db.exec(select(Record.id).where(Record.status == "PENDING").order_by(Record.id)).first()
    reviewer_id = db.exec(select(User.id).where(User.username == "smendes")).one()

    response = f4_client.post(f"/api/records/{record_id}/verify")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "VERIFIED"
    assert data["reviewedBy"] == "Sofia Mendes"
    reviewed_at = datetime.fromisoformat(data["reviewedAt"])
    assert reviewed_at.tzinfo is not None and reviewed_at >= before

    db.refresh(db.get(Record, record_id))
    saved = db.get(Record, record_id)
    assert saved.status == "VERIFIED"
    assert saved.reviewed_by == reviewer_id
    assert saved.reason is None


def test_reject_requires_non_whitespace_reason_and_persists_it(f4_client, db):
    assert sign_in(f4_client, "smendes").status_code == 200
    record_id = db.exec(select(Record.id).where(Record.status == "PENDING").order_by(Record.id)).first()

    missing = f4_client.post(f"/api/records/{record_id}/reject", json={})
    blank = f4_client.post(f"/api/records/{record_id}/reject", json={"reason": "   "})
    assert missing.status_code == blank.status_code == 400
    assert db.get(Record, record_id).status == "PENDING"

    response = f4_client.post(
        f"/api/records/{record_id}/reject",
        json={"reason": "  Scale reading is not clear: the display is blurred.  "},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "REJECTED"
    assert data["reason"] == "Scale reading is not clear: the display is blurred."
    assert data["reviewedBy"] == "Sofia Mendes"
    saved = db.get(Record, record_id)
    db.refresh(saved)
    assert saved.status == "REJECTED" and saved.reason == data["reason"]


def test_second_decision_returns_409_and_preserves_first_decision(f4_client, db):
    assert sign_in(f4_client, "smendes").status_code == 200
    record_id = db.exec(select(Record.id).where(Record.status == "PENDING").order_by(Record.id)).first()

    first = f4_client.post(f"/api/records/{record_id}/verify")
    second = f4_client.post(f"/api/records/{record_id}/reject", json={"reason": "Not clear"})
    assert first.status_code == 200
    assert second.status_code == 409
    saved = db.get(Record, record_id)
    db.refresh(saved)
    assert saved.status == "VERIFIED" and saved.reason is None


def test_decision_history_includes_final_records_reviewer_and_reason(f4_client):
    assert sign_in(f4_client, "smendes").status_code == 200
    queue = f4_client.get("/api/verify/queue").json()
    record_id = queue[0]["id"]
    assert f4_client.post(f"/api/records/{record_id}/reject", json={"reason": "Evidence does not match."}).status_code == 200

    response = f4_client.get("/api/verify/history")
    assert response.status_code == 200
    rows = response.json()
    decided = next(row for row in rows if row["id"] == record_id)
    assert decided["status"] == "REJECTED"
    assert decided["reviewedBy"] == "Sofia Mendes"
    assert decided["reviewedAt"]
    assert decided["reason"] == "Evidence does not match."
    assert all(row["status"] in ("VERIFIED", "REJECTED") for row in rows)


def test_unknown_record_returns_404(f4_client):
    assert sign_in(f4_client, "smendes").status_code == 200
    assert f4_client.get("/api/verify/records/999999").status_code == 404
    assert f4_client.post("/api/records/999999/verify").status_code == 404
