"""Local classroom demo setup. Adds a clearly labelled synthetic site at REAL GPS.

Never changes the device coordinates or bypasses the landing-site rule.
    docker compose exec backend python -m app.features.f2_record_collection.demo_site \
      --latitude REAL_LAT --longitude REAL_LON
This helper is refused in production; deployed site administration remains F5's job.
"""
import argparse
import math
from sqlmodel import Session, select
from app.core.config import APP_ENV
from app.core.database import engine
from app.features.f5_fleet_boats.models import LandingSite


def main():
    if APP_ENV != 'dev':
        raise SystemExit('Classroom demo setup is allowed only with APP_ENV=dev.')
    parser = argparse.ArgumentParser(description='Register a synthetic classroom demo site using actual device GPS.')
    parser.add_argument('--latitude', type=float, required=True)
    parser.add_argument('--longitude', type=float, required=True)
    args = parser.parse_args()
    if not math.isfinite(args.latitude) or not -90 <= args.latitude <= 90 or not math.isfinite(args.longitude) or not -180 <= args.longitude <= 180:
        parser.error('Coordinates must be finite and in range.')
    with Session(engine) as db:
        name = 'CLASSROOM DEMO (synthetic test site)'
        site = db.exec(select(LandingSite).where(LandingSite.name == name)).first()
        if site is None:
            site = LandingSite(name=name, kind='PIER', latitude=args.latitude, longitude=args.longitude)
        site.latitude, site.longitude, site.active = args.latitude, args.longitude, True
        db.add(site); db.commit(); db.refresh(site)
        print(f'Local synthetic demo site {site.id}: {site.latitude}, {site.longitude}. Real GPS is still required.')


if __name__ == '__main__':
    main()
