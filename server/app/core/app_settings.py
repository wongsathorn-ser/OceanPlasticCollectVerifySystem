"""CHG-003 / CHG-004 settings stored in the database (SHARED FILE).

Admins can change these values without a code change. If a key is missing
from the table, the default below is used.

    from app.core.app_settings import get_setting
    max_kg = get_setting(session, "auto_verify_max_kg")      # -> 50.0
"""

from sqlmodel import Field, Session, SQLModel

# key -> (default value, description)
DEFAULT_SETTINGS: dict[str, tuple[float, str]] = {
    "auto_verify_max_kg": (50, "CHG-003: records up to this weight (kg) can be auto-verified"),
    "auto_verify_min_verified": (10, "CHG-003: verified records the boat needs in the window"),
    "auto_verify_window_days": (30, "CHG-003: window for the boat history (no rejections allowed)"),
    "spot_check_percent": (10, "CHG-003: percent of auto-verified records sent to a manual spot-check"),
    "auto_verify_block_days": (30, "CHG-003: days a boat loses auto-verify after a spot-check rejection"),
    "landing_site_radius_m": (100, "CHG-004: a record must be within this distance (m) of a landing site"),
}


class AppSetting(SQLModel, table=True):
    __tablename__ = "app_settings"

    key: str = Field(primary_key=True, max_length=50)
    value: float
    description: str = Field(default="", max_length=200)


def get_setting(session: Session, key: str) -> float:
    """The value from the app_settings table, or the default when the row is missing."""
    row = session.get(AppSetting, key)
    if row is not None:
        return row.value
    return float(DEFAULT_SETTINGS[key][0])


def seed(session: Session) -> None:
    """Add every default setting (called by app/seed.py)."""
    for key, (value, description) in DEFAULT_SETTINGS.items():
        session.add(AppSetting(key=key, value=value, description=description))
    session.flush()
