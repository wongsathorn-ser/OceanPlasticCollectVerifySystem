"""Tests for the shared change-request rules (SHARED FILE).

CHG-002 app/core/rewards.py · CHG-003 app/core/auto_verify.py · CHG-004 app/core/evidence.py
Each test builds its own small scenario on top of the seed data.
"""

from datetime import timedelta

import pytest
from fastapi import HTTPException
from sqlmodel import select

from app.core.auto_verify import apply_auto_verify, check_auto_verify, reject_spot_check, reverse_record
from app.core.clock import utc_now
from app.core.evidence import add_photo, check_evidence, distance_m
from app.core.rewards import boat_payouts, crew_earnings, load_rates, record_reward, reward_amount
from app.features.f1_accounts.models import User
from app.features.f2_record_collection.models import Record, RecordFlag, make_record_number
from app.features.f5_fleet_boats.models import Boat, LandingSite


def user(db, username):
    return db.exec(select(User).where(User.username == username)).one()


def site(db, name="Chalong Pier"):
    return db.exec(select(LandingSite).where(LandingSite.name == name)).one()


def make_record(db, crew, boat, weight=30.0, material="PET_BOTTLES", status="PENDING", days_ago=0, lat=None, lon=None):
    pier = site(db)
    record = Record(
        boat_id=boat.id, crew_id=crew.id, weight_kg=weight, material=material, status=status,
        latitude=pier.latitude if lat is None else lat, longitude=pier.longitude if lon is None else lon,
        gps_accuracy_m=5, recorded_at=utc_now() - timedelta(days=days_ago),
    )
    db.add(record)
    db.flush()
    record.record_number = make_record_number(record.id)
    db.commit()
    db.refresh(record)
    return record


@pytest.fixture
def trusted_boat(db):
    """A new boat with 10 verified records in the last 30 days and no rejections."""
    boat = Boat(code="TB-01", name="Trusted Boat", capacity_kg=500)
    db.add(boat)
    db.commit()
    db.refresh(boat)
    crew = user(db, "jperet")
    for day in range(1, 11):
        make_record(db, crew, boat, weight=100, status="VERIFIED", days_ago=day)
    return boat


# ---------- CHG-002 rewards ----------

def test_reward_uses_rate_valid_on_collection_date(db):
    crew, boat = user(db, "jperet"), db.exec(select(Boat)).first()
    old = make_record(db, crew, boat, weight=10, material="PET_BOTTLES", status="VERIFIED", days_ago=20)
    new = make_record(db, crew, boat, weight=10, material="PET_BOTTLES", status="VERIFIED", days_ago=0)
    rates = load_rates(db)
    assert record_reward(old, rates) == 70  # 7 THB/kg before the change 14 days ago
    assert record_reward(new, rates) == 80  # 8 THB/kg now


def test_rejected_and_pending_records_earn_nothing(db):
    crew, boat = user(db, "jperet"), db.exec(select(Boat)).first()
    rates = load_rates(db)
    rejected = make_record(db, crew, boat, weight=10, material="FISHING_NET_ROPE", status="REJECTED")
    pending = make_record(db, crew, boat, weight=10, material="FISHING_NET_ROPE", status="PENDING")
    assert record_reward(rejected, rates) == 0 and record_reward(pending, rates) == 0
    assert reward_amount(pending, rates) == 120  # what it will pay once verified


def test_crew_earnings_and_reversal(db):
    crew = User(name="New Crew", email="n@c.org", username="newcrew", password="password123",
                role="CREW_MEMBER", status="ACTIVE")
    db.add(crew)
    db.commit()
    boat = db.exec(select(Boat)).first()
    verified = make_record(db, crew, boat, weight=10, material="FISHING_NET_ROPE", status="VERIFIED")
    make_record(db, crew, boat, weight=5, material="FISHING_NET_ROPE", status="PENDING")
    assert crew_earnings(db, crew.id) == {"this_month": 120, "to_date": 120, "pending": 60}
    reverse_record(db, verified.id, user(db, "smendes").id, "Wrong weight")
    assert crew_earnings(db, crew.id)["to_date"] == 0  # reward reversed with the record


def test_boat_payouts_only_count_verified(db, trusted_boat):
    payouts = boat_payouts(db)
    assert payouts[trusted_boat.id] == 10 * 100 * 8  # 10 verified PET records of 100 kg at 8 THB/kg


# ---------- CHG-003 auto-verification ----------

def test_small_record_on_trusted_boat_is_auto_verified(db, trusted_boat):
    record = make_record(db, user(db, "mreyes"), trusted_boat, weight=50)  # exactly 50 kg passes
    assert apply_auto_verify(db, record, random_value=0.5) is True
    assert record.status == "VERIFIED" and record.auto_verified and "50 kg" in record.verified_rule
    assert record.spot_check is False  # 0.5 -> not in the 10 %


def test_auto_verify_rules_block(db, trusted_boat):
    crew = user(db, "mreyes")
    heavy = make_record(db, crew, trusted_boat, weight=50.5)
    assert "Weight is above the auto-verify limit." in check_auto_verify(db, heavy)
    flagged = make_record(db, crew, trusted_boat, weight=20)
    db.add(RecordFlag(record_id=flagged.id, flag="DUPLICATE_PHOTO"))
    db.commit()
    assert apply_auto_verify(db, flagged) is False
    new_boat = Boat(code="NB-01", name="New Boat", capacity_kg=300)
    db.add(new_boat)
    db.commit()
    untrusted = make_record(db, crew, new_boat, weight=20)
    assert "Boat has too few verified records in the window." in check_auto_verify(db, untrusted)


def test_rejection_in_window_blocks_auto_verify(db, trusted_boat):
    make_record(db, user(db, "jperet"), trusted_boat, status="REJECTED", days_ago=29)
    record = make_record(db, user(db, "mreyes"), trusted_boat, weight=20)
    assert "Boat had a rejected record in the window." in check_auto_verify(db, record)


def test_spot_check_reject_blocks_boat_for_30_days(db, trusted_boat):
    record = make_record(db, user(db, "mreyes"), trusted_boat, weight=20)
    assert apply_auto_verify(db, record, random_value=0.05) is True  # 0.05 -> in the 10 %
    assert record.spot_check is True
    sponsor = user(db, "smendes")
    reject_spot_check(db, record.id, sponsor.id, "Scale not visible")
    db.refresh(trusted_boat)
    assert record.status == "REJECTED" and record.reversed_by == sponsor.id
    assert trusted_boat.auto_verify_blocked_until > utc_now() + timedelta(days=29)
    later = make_record(db, user(db, "mreyes"), trusted_boat, weight=20)
    assert "Boat lost auto-verification after a spot-check rejection." in check_auto_verify(db, later)
    with pytest.raises(HTTPException):
        reject_spot_check(db, record.id, sponsor.id, "again")  # already checked


# ---------- CHG-004 evidence ----------

def test_distance_m():
    assert distance_m(7.8216, 98.3415, 7.8216, 98.3415) == 0
    assert 105 < distance_m(7.8216, 98.3415, 7.8226, 98.3415) < 115  # 0.001 degree latitude ~ 111 m


def test_record_near_landing_site_gets_site_and_no_flag(db):
    pier = site(db)
    record = make_record(db, user(db, "mreyes"), db.exec(select(Boat)).first(), lat=pier.latitude + 0.0005)  # ~55 m
    add_photo(db, record, "PLASTIC", b"unique plastic photo", "image/jpeg")
    add_photo(db, record, "SCALE", b"unique scale photo", "image/jpeg")
    assert check_evidence(db, record) == []
    db.commit()
    assert record.landing_site_id == pier.id


def test_far_record_and_duplicate_photo_are_flagged(db):
    pier, boat, crew = site(db), db.exec(select(Boat)).first(), user(db, "mreyes")
    first = make_record(db, crew, boat)
    add_photo(db, first, "SCALE", b"same bytes", "image/jpeg")
    check_evidence(db, first)
    db.commit()
    second = make_record(db, crew, boat, lat=pier.latitude + 0.002)  # ~220 m away
    add_photo(db, second, "SCALE", b"same bytes", "image/jpeg")
    flags = {f.flag for f in check_evidence(db, second)}
    db.commit()
    assert flags == {"OUTSIDE_LANDING_SITE", "DUPLICATE_PHOTO"}
    assert apply_auto_verify(db, second) is False  # flags stop auto-verify (CHG-003)
