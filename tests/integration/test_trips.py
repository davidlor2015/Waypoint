"""
Trip CRUD integration tests.

1. Authentication is required
2. Users can create trips
3. Users only see their own trips
4. Users cannot access others' trips (404)
5. Updates only provided fields (partial PATCH)
6. Delete removes the trip
"""
from datetime import date
from app.models.trip import Trip


def test_requires_auth(client):
    res = client.get("/v1/trips/")
    assert res.status_code == 401


def test_create_trip(client, auth_headers_user_a):
    payload = {
        "title": "Disneyland Trip",
        "destination": "Tokyo",
        "description": "sushi + anime",
        "start_date": "2026-02-25",
        "end_date": "2026-03-05",
        "notes": "Book hotel early",
    }

    res = client.post("/v1/trips/", json=payload, headers=auth_headers_user_a)
    assert res.status_code == 201, res.text

    data = res.json()
    assert data["id"] > 0
    assert data["title"] == "Disneyland Trip"
    assert data["destination"] == "Tokyo"
    assert "user_id" in data
    assert "created_at" in data


def test_read_trips_only_returns_current_users_trips(client, db, user_a, user_b, auth_headers_user_a):
    t1 = Trip(
        user_id=user_a.id,
        title="A Trip",
        destination="Paris",
        description=None,
        notes=None,
        start_date=date(2026, 3, 1),
        end_date=date(2026, 4, 1),
    )
    t2 = Trip(
        user_id=user_b.id,
        title="B Trip",
        destination="United Kingdom",
        description=None,
        notes=None,
        start_date=date(2026, 5, 6),
        end_date=date(2026, 6, 3),
    )

    db.add_all([t1, t2])
    db.commit()

    res = client.get("/v1/trips/", headers=auth_headers_user_a)
    assert res.status_code == 200, res.text

    trips = res.json()
    assert len(trips) == 1
    assert trips[0]["title"] == "A Trip"
    assert trips[0]["destination"] == "Paris"


def test_read_trip_returns_404_if_not_owned(client, db, user_b, auth_headers_user_a):
    t = Trip(
        user_id=user_b.id,
        title="Secret Trip",
        destination="Rome",
        description=None,
        notes=None,
        start_date=date(2026, 6, 1),
        end_date=date(2026, 6, 2),
    )
    db.add(t)
    db.commit()
    db.refresh(t)

    res = client.get(f"/v1/trips/{t.id}", headers=auth_headers_user_a)
    assert res.status_code == 404
    assert res.json()["detail"] == "Trip not found"


def test_update_trip_partial(client, auth_headers_user_a):
    create_payload = {
        "title": "Someone's Trip",
        "destination": "SF",
        "description": None,
        "start_date": "2026-02-25",
        "end_date": "2026-03-05",
        "notes": None,
    }

    create_res = client.post("/v1/trips/", json=create_payload, headers=auth_headers_user_a)
    assert create_res.status_code == 201, create_res.text

    trip_id = create_res.json()["id"]

    patch_res = client.patch(
        f"/v1/trips/{trip_id}",
        json={"title": "Updated Trip", "notes": "A note"},
        headers=auth_headers_user_a,
    )

    assert patch_res.status_code == 200, patch_res.text

    data = patch_res.json()
    assert data["title"] == "Updated Trip"
    assert data["notes"] == "A note"
    assert data["destination"] == "SF"


def test_delete_trip_204(client, auth_headers_user_a):
    create_res = client.post(
        "/v1/trips/",
        json={
            "title": "Delete me",
            "destination": "NYC",
            "description": None,
            "start_date": "2026-02-25",
            "end_date": "2026-03-05",
            "notes": None,
        },
        headers=auth_headers_user_a,
    )
    assert create_res.status_code == 201, create_res.text

    trip_id = create_res.json()["id"]

    del_res = client.delete(f"/v1/trips/{trip_id}", headers=auth_headers_user_a)
    assert del_res.status_code == 204

    get_res = client.get(f"/v1/trips/{trip_id}", headers=auth_headers_user_a)
    assert get_res.status_code == 404
