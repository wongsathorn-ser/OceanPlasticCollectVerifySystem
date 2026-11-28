"""F2 integration tests use the shared throwaway PostgreSQL test database."""
import base64
import hashlib
from datetime import timedelta
from concurrent.futures import ThreadPoolExecutor
from uuid import uuid4
from datetime import timezone

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, select

from app.core.database import engine
from app.features.f1_accounts.models import User
from app.features.f2_record_collection.models import Photo, Record, RecordFlag, make_record_number
from app.core.clock import utc_now
from app.features.f2_record_collection import service
from app.features.f5_fleet_boats.models import Boat, LandingSite
from app.main import app

PNG = base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6qSAAAAAASUVORK5CYII=')

PLASTIC = PNG + b'plastic-test-photo'


@pytest.fixture
def crew():
    with TestClient(app, base_url='https://testserver') as client:
        assert client.post('/api/auth/login', json={'username':'mreyes','password':'password123'}).status_code == 200
        yield client


def payload(**changes):
    fields = dict(client_id=str(uuid4()), boat_id='1', weight_kg='42.5', material='PET_BOTTLES',
                  latitude='13.75', longitude='100.5', gps_accuracy_m='8', recorded_at='2026-11-20T10:00:00+07:00')
    fields.update(changes)
    return fields


def post(crew, fields=None, **options):
    return crew.post('/api/records', data=fields or payload(), files={'scale_photo':('scale.png',PNG,'image/png'), 'plastic_photo':('plastic.png',PLASTIC,'image/png')}, **options)


def test_create_persists_photo_and_uses_session(crew, db):
    response = post(crew, payload(crew_id='999', status='VERIFIED', note='  evidence  '))
    assert response.status_code == 201, response.text
    body = response.json()
    row = db.get(Record, body['id'])
    photo = db.exec(select(Photo).where(Photo.record_id == row.id, Photo.kind == "SCALE")).one()
    owner = db.exec(select(User).where(User.username == 'mreyes')).one()
    assert row.crew_id == body['crew_id'] == owner.id
    assert row.status == 'PENDING' and row.note == 'evidence'
    assert row.record_number == make_record_number(row.id)
    assert row.recorded_at.astimezone(timezone.utc).hour == 3  # +07:00 is stored as UTC
    assert photo.data == PNG and photo.size_bytes == len(PNG)
    assert photo.sha256 == hashlib.sha256(PNG).hexdigest()
    assert len(body['photos']) == 2
    assert {p['kind'] for p in body['photos']} == {'PLASTIC', 'SCALE'}
    assert body['auto_verified'] is False
    assert any(f['flag'] == 'OUTSIDE_LANDING_SITE' for f in body['flags'])
    assert 'data' not in body
    image = crew.get(body['photo_url'])
    assert image.content == PNG and image.headers['cache-control'] == 'no-store'
    saved = crew.get(f"/api/records/submissions/{body['client_id']}")
    assert saved.status_code == 200 and saved.json()['id'] == row.id


def test_retry_returns_existing_even_if_boat_deactivated_or_reviewed(crew, db):
    fields = payload()
    first = post(crew, fields).json()
    record = db.get(Record, first['id']); record.status = 'VERIFIED'
    boat = db.get(Boat, 1); boat.active = False
    db.add(record); db.add(boat); db.commit()
    # Even an incomplete retry returns the original; it cannot overwrite it.
    retry = crew.post('/api/records', data={'client_id': fields['client_id']})
    assert retry.status_code == 200
    assert retry.json()['id'] == first['id'] and retry.json()['status'] == 'VERIFIED'
    assert len(db.exec(select(Record).where(Record.client_id == fields['client_id'])).all()) == 1
    assert len(db.exec(select(Photo).where(Photo.record_id == first['id'])).all()) == 2


@pytest.mark.parametrize('changes', [
    {'weight_kg':'0'}, {'weight_kg':'-1'}, {'weight_kg':'nan'}, {'weight_kg':'inf'},
    {'material':'OTHER'}, {'boat_id':'99999'}, {'latitude':'91'}, {'longitude':'-181'},
    {'latitude':''}, {'gps_accuracy_m':'-1'}, {'gps_accuracy_m':''},
    {'recorded_at':'2026-11-20T10:00:00'}, {'recorded_at':'wrong'},
    {'note':'x'*501}, {'client_id':'not-a-uuid'},
])
def test_invalid_input_creates_nothing(crew, db, changes):
    before = len(db.exec(select(Record)).all())
    response = post(crew, payload(**changes))
    assert response.status_code == 400, response.text
    assert len(db.exec(select(Record)).all()) == before


def test_missing_photo_and_inactive_boat(crew, db):
    assert crew.post('/api/records', data=payload()).status_code == 400
    boat = db.get(Boat, 1); boat.active = False; db.add(boat); db.commit()
    assert post(crew).status_code == 400
    assert all(b['id'] != 1 for b in crew.get('/api/records/boats').json())


@pytest.mark.parametrize('kind,data,status', [
    ('image/svg+xml',b'<svg/>',400), ('image/png',b'<script>bad</script>',400),
    ('image/jpeg',PNG,400), ('image/png',b'',400),
    ('image/png',b'x'*(service.MAX_PHOTO_BYTES+1),413),
])
def test_photo_limits(crew, kind, data, status):
    response = crew.post('/api/records',data=payload(),files={'scale_photo':('image',data,kind), 'plastic_photo':('plastic.png',PLASTIC,'image/png')})
    assert response.status_code == status


def test_auth_roles_and_photo_ownership(crew):
    body = post(crew).json()
    assert crew.post('/api/auth/login',json={'username':'lnovak','password':'password123'}).status_code == 200
    assert crew.get(body['photo_url']).status_code == 404
    assert crew.get(f"/api/records/submissions/{body['client_id']}").status_code == 404
    assert post(crew, payload(client_id=body['client_id'])).status_code == 409
    assert crew.post('/api/auth/login',json={'username':'admin','password':'password123'}).status_code == 200
    assert post(crew).status_code == 403
    assert crew.get(body['photo_url']).status_code == 403
    assert crew.post('/api/auth/login',json={'username':'smendes','password':'password123'}).status_code == 200
    assert crew.get(body['photo_url']).status_code == 200
    assert post(crew).status_code == 403
    crew.post('/api/auth/logout')
    assert post(crew).status_code == 401
    assert crew.get(body['photo_url']).status_code == 401


def test_expected_owner_prevents_offline_account_switch(crew):
    assert post(crew,payload(expected_crew_id='999')).status_code == 409


def test_no_edit_or_delete_endpoints(crew):
    body=post(crew).json()
    assert crew.patch(f"/api/records/{body['id']}",json={'weight_kg':5}).status_code in (404,405)
    assert crew.delete(f"/api/records/{body['id']}").status_code in (404,405)


def test_concurrent_retry_commits_one_record_and_photo(crew, db):
    fields=payload()
    user=db.exec(select(User).where(User.username == 'mreyes')).one()
    def create():
        with Session(engine) as session:
            record, _ = service.create_record(session,user.id,fields['client_id'],fields,{'SCALE':(PNG,'image/png'),'PLASTIC':(PLASTIC,'image/png')})
            return record.id
    with ThreadPoolExecutor(max_workers=2) as pool:
        ids=list(pool.map(lambda _:create(),range(2)))
    assert ids[0] == ids[1]
    assert len(db.exec(select(Photo).where(Photo.record_id == ids[0])).all()) == 2


@pytest.fixture
def trusted_boat(db):
    boat = Boat(code="F2-TRUST", name="F2 trusted test boat", capacity_kg=500)
    db.add(boat); db.commit(); db.refresh(boat)
    owner = db.exec(select(User).where(User.username == "mreyes")).one()
    for day in range(1, 11):
        row = Record(boat_id=boat.id, crew_id=owner.id, weight_kg=100, material="PET_BOTTLES",
                     recorded_at=utc_now()-timedelta(days=day), status="VERIFIED")
        db.add(row); db.flush(); row.record_number=make_record_number(row.id)
    db.commit()
    return boat


def at_site(db, **changes):
    site=db.exec(select(LandingSite).where(LandingSite.active).order_by(LandingSite.id)).first()
    return payload(latitude=str(site.latitude),longitude=str(site.longitude),**changes)


def test_both_kinds_required_and_invalid_plastic_is_atomic(crew,db):
    for field in ('plastic_photo','scale_photo'):
        response=crew.post('/api/records',data=payload(),files={field:('photo.png',PNG,'image/png')})
        assert response.status_code==400
    fields=payload()
    result=crew.post('/api/records',data=fields,files={
        'plastic_photo':('fake.png',b'not a photo','image/png'),
        'scale_photo':('scale.png',PNG,'image/png'),
    })
    assert result.status_code==400
    assert db.exec(select(Record).where(Record.client_id==fields['client_id'])).first() is None


def test_shared_auto_verify_runs_after_evidence(crew,db,trusted_boat,monkeypatch):
    monkeypatch.setattr('app.core.auto_verify.random.random',lambda:0)
    response=post(crew,at_site(db,boat_id=str(trusted_boat.id)))
    assert response.status_code==201,response.text
    body=response.json()
    assert body['status']=='VERIFIED' and body['auto_verified'] is True
    assert body['verified_rule'] and body['spot_check'] is True
    assert body['landing_site_id'] and body['flags']==[]
    for photo in body['photos']:
        result=crew.get(photo['url']);assert result.status_code==200
        assert result.content==(PLASTIC if photo['kind']=='PLASTIC' else PNG)
    db.expire_all()
    row=db.get(Record,body['id']);assert row.status=='VERIFIED' and row.reviewed_by is None


def test_duplicate_evidence_is_saved_flagged_and_not_auto_verified(crew,db,trusted_boat):
    first=post(crew,at_site(db,boat_id=str(trusted_boat.id)));assert first.status_code==201
    second=post(crew,at_site(db,boat_id=str(trusted_boat.id)))
    assert second.status_code==201,second.text
    body=second.json()
    assert body['status']=='PENDING' and body['auto_verified'] is False
    assert sum(f['flag']=='DUPLICATE_PHOTO' for f in body['flags'])==2
    assert len(db.exec(select(Photo).where(Photo.record_id==body['id'])).all())==2


def test_outside_old_phone_record_is_saved_with_flag(crew,db,trusted_boat):
    result=post(crew,payload(boat_id=str(trusted_boat.id)))
    assert result.status_code==201,result.text
    body=result.json()
    assert body['status']=='PENDING' and body['landing_site_id'] is None
    assert any(f['flag']=='OUTSIDE_LANDING_SITE' for f in body['flags'])


def test_no_active_landing_sites_still_flags_and_preserves_upload(crew,db):
    for site in db.exec(select(LandingSite)).all():site.active=False;db.add(site)
    db.commit()
    check=crew.get('/api/records/location-check',params={'latitude':'13.75','longitude':'100.5'})
    assert check.status_code==200,check.text
    assert check.json()['within_radius'] is False and check.json()['distance_m'] is None
    result=post(crew)
    assert result.status_code==201,result.text
    assert any(f['flag']=='OUTSIDE_LANDING_SITE' for f in result.json()['flags'])


def test_landing_config_and_check_use_active_sites_and_shared_radius(crew,db):
    config=crew.get('/api/records/landing-sites');assert config.status_code==200
    body=config.json();assert body['radius_m']==100
    site=body['sites'][0]
    assert all(db.get(LandingSite,s['id']).active for s in body['sites'])
    check=crew.get('/api/records/location-check',params={'latitude':site['latitude'],'longitude':site['longitude']})
    assert check.json()['within_radius'] is True and check.json()['distance_m']==0
    assert crew.get('/api/records/location-check',params={'latitude':91,'longitude':0}).status_code==400


def test_legacy_server_record_remains_idempotent_without_new_photos(crew,db):
    owner=db.exec(select(User).where(User.username=='mreyes')).one()
    row=Record(client_id=str(uuid4()),boat_id=1,crew_id=owner.id,weight_kg=10,material='MIXED',
               latitude=13.75,longitude=100.5,gps_accuracy_m=8,recorded_at=utc_now())
    db.add(row);db.flush();row.record_number=make_record_number(row.id)
    db.add(Photo(record_id=row.id,kind='SCALE',data=PNG,content_type='image/png',size_bytes=len(PNG)));db.commit()
    result=crew.post('/api/records',data={'client_id':row.client_id})
    assert result.status_code==200,result.text
    assert len(result.json()['photos'])==1 and result.json()['photos'][0]['kind']=='SCALE'


def test_invalid_photo_kind(crew):
    body=post(crew).json()
    assert crew.get(f"/api/photos/{body['id']}?kind=OTHER").status_code==400
