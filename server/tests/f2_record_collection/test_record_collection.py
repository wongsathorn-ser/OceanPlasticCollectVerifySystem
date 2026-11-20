"""F2 integration tests use the shared throwaway PostgreSQL test database."""
import base64
from concurrent.futures import ThreadPoolExecutor
from uuid import uuid4
from datetime import timezone

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, select

from app.core.database import engine
from app.features.f1_accounts.models import User
from app.features.f2_record_collection.models import Photo, Record, make_record_number
from app.features.f2_record_collection import service
from app.features.f5_fleet_boats.models import Boat
from app.main import app

PNG = base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6qSAAAAAASUVORK5CYII=')


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
    return crew.post('/api/records', data=fields or payload(), files={'photo':('scale.png',PNG,'image/png')}, **options)


def test_create_persists_photo_and_uses_session(crew, db):
    response = post(crew, payload(crew_id='999', status='VERIFIED', note='  evidence  '))
    assert response.status_code == 201, response.text
    body = response.json()
    row = db.get(Record, body['id'])
    photo = db.exec(select(Photo).where(Photo.record_id == row.id)).one()
    owner = db.exec(select(User).where(User.username == 'mreyes')).one()
    assert row.crew_id == body['crew_id'] == owner.id
    assert row.status == 'PENDING' and row.note == 'evidence'
    assert row.record_number == make_record_number(row.id)
    assert row.recorded_at.astimezone(timezone.utc).hour == 3  # +07:00 is stored as UTC
    assert photo.data == PNG and photo.size_bytes == len(PNG)
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
    assert len(db.exec(select(Photo).where(Photo.record_id == first['id'])).all()) == 1


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
    response = crew.post('/api/records',data=payload(),files={'photo':('image',data,kind)})
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
            record, _ = service.create_record(session,user.id,fields['client_id'],fields,PNG,'image/png')
            return record.id
    with ThreadPoolExecutor(max_workers=2) as pool:
        ids=list(pool.map(lambda _:create(),range(2)))
    assert ids[0] == ids[1]
    assert len(db.exec(select(Photo).where(Photo.record_id == ids[0])).all()) == 1
