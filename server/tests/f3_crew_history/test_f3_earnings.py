"""CHG-002 crew earnings endpoint (GET /api/me/earnings) - Feature 3 crew home."""

from datetime import timedelta

import pytest
from fastapi.testclient import TestClient
from sqlmodel import select

from app.core.clock import utc_now
from app.features.f1_accounts.models import User
from app.features.f2_record_collection.models import Record, make_record_number
from app.features.f5_fleet_boats.models import Boat
from app.main import app


@pytest.fixture
def client():
    return TestClient(app, base_url="https://testserver")


def sign_in(client, username):
    return client.post("/api/auth/login", json={"username": username, "password": "password123"})


def new_crew_with_records(db):
    crew = User(name="Pay Test", email="pay@t.org", username="paytest", password="password123",
                role="CREW_MEMBER", status="ACTIVE")
    db.add(crew)
    db.commit()
    boat = db.exec(select(Boat)).first()
    rows = [  # (weight, material, status, days ago)
        (10, "FISHING_NET_ROPE", "VERIFIED", 0),   # 120 THB, this month
        (5, "FISHING_NET_ROPE", "PENDING", 0),     # 60 THB pending
        (20, "LDPE_FILM", "REJECTED", 0),          # earns nothing
        (10, "MIXED", "VERIFIED", 45),             # 40 THB, an earlier month
    ]
    for weight, material, status, days in rows:
        record = Record(boat_id=boat.id, crew_id=crew.id, weight_kg=weight, material=material, status=status,
                        latitude=7.8216, longitude=98.3415, recorded_at=utc_now() - timedelta(days=days))
        db.add(record)
        db.flush()
        record.record_number = make_record_number(record.id)
    db.commit()
    return crew


def test_earnings_this_month_to_date_and_pending(client, db):
    new_crew_with_records(db)
    sign_in(client, "paytest")
    response = client.get("/api/me/earnings")
    assert response.status_code == 200
    assert response.json() == {"this_month": 120.0, "to_date": 160.0, "pending": 60.0, "currency": "THB"}


def test_reversed_record_drops_out_of_earnings(client, db):
    crew = new_crew_with_records(db)
    sign_in(client, "paytest")
    verified = db.exec(select(Record).where(Record.crew_id == crew.id, Record.material == "FISHING_NET_ROPE",
                                            Record.status == "VERIFIED")).one()
    verified.status = "REJECTED"  # a reversal, as F4 will do it
    db.add(verified)
    db.commit()
    assert client.get("/api/me/earnings").json()["to_date"] == 40.0


def test_earnings_are_crew_only(client):
    assert client.get("/api/me/earnings").status_code == 401
    sign_in(client, "smendes")
    assert client.get("/api/me/earnings").status_code == 403
