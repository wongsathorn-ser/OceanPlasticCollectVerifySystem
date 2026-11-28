"""The classroom helper labels synthetic local data and refuses production use."""
import sys
import pytest
from sqlmodel import select
from app.features.f2_record_collection import demo_site
from app.features.f5_fleet_boats.models import LandingSite


def test_demo_setup_is_refused_in_production(monkeypatch):
    monkeypatch.setattr(demo_site, 'APP_ENV', 'prod')
    with pytest.raises(SystemExit, match='only with APP_ENV=dev'):
        demo_site.main()


def test_demo_setup_is_idempotent_and_uses_supplied_real_coordinates(db, monkeypatch):
    monkeypatch.setattr(demo_site, 'APP_ENV', 'dev')
    monkeypatch.setattr(sys, 'argv', ['demo_site', '--latitude', '13.7563', '--longitude', '100.5018'])
    demo_site.main(); demo_site.main()
    rows = db.exec(select(LandingSite).where(LandingSite.name == 'CLASSROOM DEMO (synthetic test site)')).all()
    assert len(rows) == 1 and rows[0].active
    assert rows[0].latitude == 13.7563 and rows[0].longitude == 100.5018


def test_invalid_demo_coordinates_are_rejected(monkeypatch):
    monkeypatch.setattr(demo_site, 'APP_ENV', 'dev')
    monkeypatch.setattr(sys, 'argv', ['demo_site', '--latitude', 'nan', '--longitude', '0'])
    with pytest.raises(SystemExit): demo_site.main()
