"""Shared schema and seed checks (SHARED FILE) - tables from the schema PR (D11)."""

from sqlmodel import select

from datetime import timedelta

from app.core.app_settings import get_setting
from app.core.clock import THAILAND, thailand_day_start, thailand_month_start, utc_now
from app.features.f1_accounts.models import User
from app.features.f2_record_collection.models import Photo, Record, RecordFlag, make_record_number
from app.features.f5_fleet_boats.models import Boat, LandingSite, RewardRate
from app.seed import seed_if_empty


def test_seed_creates_demo_data(db):
    assert len(db.exec(select(User)).all()) == 8
    assert [b.code for b in db.exec(select(Boat).order_by(Boat.id)).all()] == ["HC-14", "SH-02", "RM-07", "SL-03"]
    records = db.exec(select(Record)).all()
    assert {r.status for r in records} == {"PENDING", "VERIFIED", "REJECTED"}
    assert all(r.reason for r in records if r.status == "REJECTED")  # BR-4
    assert len(db.exec(select(Photo)).all()) == 2 * len(records)  # PLASTIC + SCALE (CHG-004)


def test_seed_runs_only_once(db):
    users_before = len(db.exec(select(User)).all())
    assert seed_if_empty() is False  # data exists -> nothing added
    assert len(db.exec(select(User)).all()) == users_before


def test_record_number_and_boat_relationship(db):
    record = db.exec(select(Record).order_by(Record.id)).first()
    assert record.record_number == make_record_number(record.id) == f"REC-{1000 + record.id}"
    assert record.boat.code in {"HC-14", "SH-02", "RM-07", "SL-03"}
    assert record in record.boat.records


def test_thailand_day_and_month_start():
    start = thailand_day_start()
    local = start.astimezone(THAILAND)
    assert (local.hour, local.minute) == (0, 0)
    assert start <= utc_now()
    assert thailand_month_start().astimezone(THAILAND).day == 1


def test_records_today_in_thailand(db):
    today = db.exec(select(Record).where(Record.recorded_at >= thailand_day_start())).all()
    assert len(today) >= 2  # two pending records for Marco today


# ---------- schema update for CHG-002 / CHG-003 / CHG-004 (D13) ----------

def test_settings_have_defaults(db):
    assert get_setting(db, "auto_verify_max_kg") == 50
    assert get_setting(db, "spot_check_percent") == 10
    assert get_setting(db, "landing_site_radius_m") == 100


def test_two_photos_per_record_with_hash(db):
    record = db.exec(select(Record).order_by(Record.id)).first()
    photos = db.exec(select(Photo).where(Photo.record_id == record.id)).all()
    assert sorted(p.kind for p in photos) == ["PLASTIC", "SCALE"]
    assert all(len(p.sha256) == 64 for p in photos)


def test_demo_flags_and_duplicate_hash(db):
    flags = {f.flag: f for f in db.exec(select(RecordFlag)).all()}
    assert set(flags) == {"DUPLICATE_PHOTO", "OUTSIDE_LANDING_SITE"}
    duplicate = flags["DUPLICATE_PHOTO"].record
    assert duplicate.status == "PENDING" and duplicate.flags
    scale = db.exec(select(Photo).where(Photo.record_id == duplicate.id, Photo.kind == "SCALE")).one()
    same_hash = db.exec(select(Photo).where(Photo.sha256 == scale.sha256)).all()
    assert len(same_hash) == 2  # the earlier record has the same scale photo


def test_auto_verified_demo_records(db):
    auto = db.exec(select(Record).where(Record.auto_verified)).all()
    assert len(auto) == 3
    assert all(r.status == "VERIFIED" and r.weight_kg <= 50 and r.verified_rule for r in auto)
    assert len([r for r in auto if r.spot_check]) == 1


def test_records_are_near_an_active_landing_site(db):
    sites = {s.id: s for s in db.exec(select(LandingSite).where(LandingSite.active)).all()}
    assert len(sites) == 3
    for record in db.exec(select(Record).where(Record.landing_site_id != None)).all():  # noqa: E711
        site = sites[record.landing_site_id]
        assert abs(record.latitude - site.latitude) < 0.001 and abs(record.longitude - site.longitude) < 0.001


def test_reward_rates_have_history(db):
    pet = db.exec(select(RewardRate).where(RewardRate.material == "PET_BOTTLES").order_by(RewardRate.valid_from)).all()
    assert [r.rate_thb_per_kg for r in pet] == [7, 8]
    assert pet[1].valid_from - pet[0].valid_from > timedelta(days=1)
    assert len(db.exec(select(RewardRate)).all()) == 6
