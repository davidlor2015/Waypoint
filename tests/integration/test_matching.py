"""
Matching system integration tests.

1. Opening a request requires a travel profile
2. Duplicate open requests are rejected
3. Overlapping discoverable trips create matches
4. Non-overlapping trips do not create matches
5. Undiscoverable trips are excluded from matching
6. Deleted requests are not reused for future matches
"""

from datetime import date

from app.models.match_request import MatchRequest
from app.models.match_result import MatchResult
from app.models.travel_profile import BudgetRange, TravelProfile, TravelStyle
from app.models.trip import Trip


def _create_profile(
    db,
    user_id: int,
    *,
    travel_style: TravelStyle = TravelStyle.RELAXED,
    budget_range: BudgetRange = BudgetRange.MID_RANGE,
    interests: list[str] | None = None,
    group_size_min: int = 1,
    group_size_max: int = 4,
    is_discoverable: bool = True,
) -> TravelProfile:
    profile = TravelProfile(
        user_id=user_id,
        travel_style=travel_style,
        budget_range=budget_range,
        interests=interests or ["food", "art"],
        group_size_min=group_size_min,
        group_size_max=group_size_max,
        is_discoverable=is_discoverable,
    )
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile


def _create_trip(
    db,
    user_id: int,
    *,
    title: str,
    destination: str,
    start_date: date,
    end_date: date,
    is_discoverable: bool = True,
) -> Trip:
    trip = Trip(
        user_id=user_id,
        title=title,
        destination=destination,
        description=None,
        notes=None,
        start_date=start_date,
        end_date=end_date,
        is_discoverable=is_discoverable,
    )
    db.add(trip)
    db.commit()
    db.refresh(trip)
    return trip


def test_missing_profile_returns_422(client, db, user_a, auth_headers_user_a):
    trip = _create_trip(
        db,
        user_a.id,
        title="Solo Trip",
        destination="Paris",
        start_date=date(2026, 6, 1),
        end_date=date(2026, 6, 5),
    )

    res = client.post(
        "/v1/matching/requests",
        json={"trip_id": trip.id},
        headers=auth_headers_user_a,
    )

    assert res.status_code == 422
    assert res.json()["detail"] == "Travel profile required"


def test_duplicate_request_returns_409(client, db, user_a, auth_headers_user_a):
    _create_profile(db, user_a.id)
    trip = _create_trip(
        db,
        user_a.id,
        title="Paris Trip",
        destination="Paris",
        start_date=date(2026, 6, 1),
        end_date=date(2026, 6, 5),
    )

    first_res = client.post(
        "/v1/matching/requests",
        json={"trip_id": trip.id},
        headers=auth_headers_user_a,
    )
    second_res = client.post(
        "/v1/matching/requests",
        json={"trip_id": trip.id},
        headers=auth_headers_user_a,
    )

    assert first_res.status_code == 201, first_res.text
    assert second_res.status_code == 409
    assert second_res.json()["detail"] == "Open match request already exists for trip"


def test_overlapping_trips_create_match(client, db, user_a, user_b, auth_headers_user_a):
    _create_profile(db, user_a.id, interests=["food", "art"], group_size_min=2, group_size_max=4)
    _create_profile(db, user_b.id, interests=["food", "art"], group_size_min=2, group_size_max=5)

    trip_a = _create_trip(
        db,
        user_a.id,
        title="Paris A",
        destination="Paris",
        start_date=date(2026, 6, 1),
        end_date=date(2026, 6, 5),
    )
    _create_trip(
        db,
        user_b.id,
        title="Paris B",
        destination="paris",
        start_date=date(2026, 6, 3),
        end_date=date(2026, 6, 6),
    )

    res = client.post(
        "/v1/matching/requests",
        json={"trip_id": trip_a.id},
        headers=auth_headers_user_a,
    )

    assert res.status_code == 201, res.text
    data = res.json()
    assert len(data["results"]) == 1
    assert data["results"][0]["score"] >= 0.20


def test_non_overlapping_trips_create_no_match(client, db, user_a, user_b, auth_headers_user_a):
    _create_profile(db, user_a.id)
    _create_profile(db, user_b.id)

    trip_a = _create_trip(
        db,
        user_a.id,
        title="Paris A",
        destination="Paris",
        start_date=date(2026, 6, 1),
        end_date=date(2026, 6, 3),
    )
    _create_trip(
        db,
        user_b.id,
        title="Paris B",
        destination="Paris",
        start_date=date(2026, 6, 10),
        end_date=date(2026, 6, 12),
    )

    res = client.post(
        "/v1/matching/requests",
        json={"trip_id": trip_a.id},
        headers=auth_headers_user_a,
    )

    assert res.status_code == 201, res.text
    assert res.json()["results"] == []


def test_is_discoverable_false_excludes_candidate(client, db, user_a, user_b, auth_headers_user_a):
    _create_profile(db, user_a.id)
    _create_profile(db, user_b.id)

    trip_a = _create_trip(
        db,
        user_a.id,
        title="Rome A",
        destination="Rome",
        start_date=date(2026, 7, 1),
        end_date=date(2026, 7, 5),
    )
    _create_trip(
        db,
        user_b.id,
        title="Rome B",
        destination="Rome",
        start_date=date(2026, 7, 2),
        end_date=date(2026, 7, 4),
        is_discoverable=False,
    )

    res = client.post(
        "/v1/matching/requests",
        json={"trip_id": trip_a.id},
        headers=auth_headers_user_a,
    )

    assert res.status_code == 201, res.text
    assert res.json()["results"] == []


def test_deleted_request_is_not_reused_for_future_match(client, db, user_a, user_b, auth_headers_user_a, auth_headers_user_b):
    _create_profile(db, user_a.id)
    _create_profile(db, user_b.id)

    first_trip_a = _create_trip(
        db,
        user_a.id,
        title="Paris A1",
        destination="Paris",
        start_date=date(2026, 8, 1),
        end_date=date(2026, 8, 5),
    )
    second_trip_a = _create_trip(
        db,
        user_a.id,
        title="Paris A2",
        destination="Paris",
        start_date=date(2026, 8, 2),
        end_date=date(2026, 8, 6),
    )
    _create_trip(
        db,
        user_b.id,
        title="Paris B",
        destination="Paris",
        start_date=date(2026, 8, 3),
        end_date=date(2026, 8, 7),
    )

    first_res = client.post(
        "/v1/matching/requests",
        json={"trip_id": first_trip_a.id},
        headers=auth_headers_user_a,
    )
    assert first_res.status_code == 201, first_res.text

    old_candidate_request = db.query(MatchRequest).filter(
        MatchRequest.sender_id == user_b.id,
        MatchRequest.receiver_id == user_b.id,
        MatchRequest.trip_id.isnot(None),
    ).order_by(MatchRequest.id.desc()).first()
    assert old_candidate_request is not None
    old_candidate_request_id = old_candidate_request.id

    delete_res = client.delete(
        f"/v1/matching/requests/{old_candidate_request_id}",
        headers=auth_headers_user_b,
    )
    assert delete_res.status_code == 204

    second_res = client.post(
        "/v1/matching/requests",
        json={"trip_id": second_trip_a.id},
        headers=auth_headers_user_a,
    )
    assert second_res.status_code == 201, second_res.text

    second_data = second_res.json()
    assert len(second_data["results"]) == 1
    new_candidate_request = db.query(MatchRequest).filter(
        MatchRequest.sender_id == user_b.id,
        MatchRequest.receiver_id == user_b.id,
        MatchRequest.trip_id.isnot(None),
        MatchRequest.id != old_candidate_request_id,
    ).order_by(MatchRequest.id.desc()).first()
    assert new_candidate_request is not None
    assert new_candidate_request.id != old_candidate_request_id

    remaining_old = db.query(MatchResult).filter(MatchResult.request_b_id == old_candidate_request_id).all()
    assert remaining_old == []


def test_match_interaction_is_persisted_and_returned(client, db, user_a, user_b, auth_headers_user_a):
    _create_profile(db, user_a.id, interests=["food", "art"], group_size_min=2, group_size_max=4)
    _create_profile(db, user_b.id, interests=["food", "art"], group_size_min=2, group_size_max=5)

    trip_a = _create_trip(
        db,
        user_a.id,
        title="Rome A",
        destination="Rome",
        start_date=date(2026, 9, 1),
        end_date=date(2026, 9, 5),
    )
    _create_trip(
        db,
        user_b.id,
        title="Rome B",
        destination="Rome",
        start_date=date(2026, 9, 2),
        end_date=date(2026, 9, 6),
    )

    open_res = client.post(
        "/v1/matching/requests",
        json={"trip_id": trip_a.id},
        headers=auth_headers_user_a,
    )
    assert open_res.status_code == 201, open_res.text

    payload = open_res.json()
    request_id = payload["request"]["id"]
    match_result_id = payload["results"][0]["id"]

    interaction_res = client.put(
        f"/v1/matching/requests/{request_id}/matches/{match_result_id}/interaction",
        json={"status": "intro_saved", "note": "Want to compare Paris museum plans?"},
        headers=auth_headers_user_a,
    )
    assert interaction_res.status_code == 200, interaction_res.text
    interaction_payload = interaction_res.json()
    assert interaction_payload["interaction"]["status"] == "intro_saved"
    assert interaction_payload["interaction"]["note"] == "Want to compare Paris museum plans?"

    matches_res = client.get(
        f"/v1/matching/requests/{request_id}/matches",
        headers=auth_headers_user_a,
    )
    assert matches_res.status_code == 200, matches_res.text
    matches_payload = matches_res.json()
    assert matches_payload[0]["interaction"]["status"] == "intro_saved"
    assert matches_payload[0]["interaction"]["note"] == "Want to compare Paris museum plans?"
