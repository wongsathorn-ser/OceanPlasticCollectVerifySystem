"""Feature 5 - seed data, called by app/seed.py (after users, before records).

Demo boats from NFR-21 - the same four boats as the F5 mock data, plus the
change-request admin data (decision D13): landing sites (CHG-004) and reward
rates with one rate change, so the rate history can be shown (CHG-002).
Written in the shared schema PR (team decision D11) - owner please review.
"""

from datetime import date, timedelta

from sqlmodel import Session, select

from app.core.clock import to_thailand, utc_now
from app.features.f1_accounts.models import User
from app.features.f5_fleet_boats.models import Boat, LandingSite, RewardRate

DEMO_BOATS = [
    # (code, name, capacity_kg)
    ("HC-14", "Harbor Cleaner", 1800),
    ("SH-02", "Sea Harvest", 2400),
    ("RM-07", "River Mouth", 900),
    ("SL-03", "Shoreline Team A", 400),
]

# Demo coordinates around Phuket (not surveyed positions).
DEMO_LANDING_SITES = [
    # (name, kind, latitude, longitude, active)
    ("Chalong Pier", "PIER", 7.8216, 98.3415, True),
    ("Rassada Pier", "PIER", 7.8763, 98.4013, True),
    ("Ao Po Marina", "PORT", 8.0670, 98.4430, True),
    ("Old Fish Market Pier", "PIER", 7.8890, 98.3990, False),  # inactive: no longer counts
]

# THB per kg (CHG-002 examples: PET 8, fishing net 12)
DEMO_RATES = {
    "PET_BOTTLES": 8,
    "HDPE_RIGID": 10,
    "FISHING_NET_ROPE": 12,
    "LDPE_FILM": 5,
    "MIXED": 4,
}
FIRST_RATE_DATE = date(2026, 1, 1)
OLD_PET_RATE = 7  # PET was 7 THB/kg until 14 days ago -> shows "rate valid on the collection date"


def seed(session: Session) -> None:
    for code, name, capacity_kg in DEMO_BOATS:
        session.add(Boat(code=code, name=name, capacity_kg=capacity_kg, active=True))
    for name, kind, latitude, longitude, active in DEMO_LANDING_SITES:
        session.add(LandingSite(name=name, kind=kind, latitude=latitude, longitude=longitude, active=active))

    admin = session.exec(select(User).where(User.username == "admin")).one()
    today = to_thailand(utc_now()).date()
    pet_change = today - timedelta(days=14)
    for material, rate in DEMO_RATES.items():
        first = OLD_PET_RATE if material == "PET_BOTTLES" else rate
        session.add(RewardRate(material=material, rate_thb_per_kg=first, valid_from=FIRST_RATE_DATE, created_by=admin.id))
    session.add(RewardRate(material="PET_BOTTLES", rate_thb_per_kg=DEMO_RATES["PET_BOTTLES"], valid_from=pet_change, created_by=admin.id))
    session.flush()
