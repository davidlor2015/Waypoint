"""
Integration tests for the /v1/ai/apply endpoint and the ItineraryRepository.

Verifies that:
- Applying an itinerary saves relational rows (ItineraryDay / ItineraryEvent).
- Re-applying replaces (not duplicates) the previous rows.
- The trip title and description are still updated for backward compatibility.
- A user cannot apply an itinerary to another user's trip.
"""

from datetime import date

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.itinerary import ItineraryDay, ItineraryEvent
from app.models.trip import Trip
from app.repositories.itinerary_repository import ItineraryRepository
from app.schemas.ai import DayPlan, ItineraryItem, ItineraryResponse


# ---------------------------------------------------------------------------
# Shared fixtures
# ---------------------------------------------------------------------------

@pytest.fixture()
def paris_trip(db: Session, user_a) -> Trip:
    trip = Trip(
        title="Paris Trip",
        destination="Paris",
        user_id=user_a.id,
        start_date=date(2025, 6, 1),
        end_date=date(2025, 6, 3),
    )
    db.add(trip)
    db.commit()
    db.refresh(trip)
    return trip


SAMPLE_ITINERARY = {
    "title": "Paris Adventure",
    "summary": "Three days in the city of light.",
    "days": [
        {
            "day_number": 1,
            "date": "2025-06-01",
            "items": [
                {
                    "time": "09:00",
                    "title": "Eiffel Tower",
                    "location": "Champ de Mars",
                    "lat": 48.8584,
                    "lon": 2.2945,
                    "notes": "Arrive early to beat the crowds.",
                    "cost_estimate": "€29",
                },
                {
                    "time": "14:00",
                    "title": "Louvre Museum",
                    "location": "Rue de Rivoli",
                    "cost_estimate": "€17",
                },
            ],
        },
        {
            "day_number": 2,
            "date": "2025-06-02",
            "items": [
                {
                    "time": "10:00",
                    "title": "Montmartre",
                    "cost_estimate": "Free",
                }
            ],
        },
    ],
}


# ---------------------------------------------------------------------------
# Repository unit tests (bypass HTTP layer)
# ---------------------------------------------------------------------------

class TestItineraryRepository:
    def test_save_creates_days_and_events(self, db: Session, paris_trip: Trip):
        itinerary = ItineraryResponse(**SAMPLE_ITINERARY)
        repo = ItineraryRepository(db)

        days = repo.save_itinerary(paris_trip.id, itinerary)

        assert len(days) == 2
        assert days[0].day_number == 1
        assert days[0].day_date == "2025-06-01"
        assert len(days[0].events) == 2

        first_event = days[0].events[0]
        assert first_event.title == "Eiffel Tower"
        assert first_event.lat == pytest.approx(48.8584)
        assert first_event.lon == pytest.approx(2.2945)
        assert first_event.sort_order == 0

        assert days[1].day_number == 2
        assert len(days[1].events) == 1

    def test_save_replaces_existing_rows(self, db: Session, paris_trip: Trip):
        itinerary = ItineraryResponse(**SAMPLE_ITINERARY)
        repo = ItineraryRepository(db)

        repo.save_itinerary(paris_trip.id, itinerary)

        # Apply a different itinerary with only one day.
        slim_itinerary = ItineraryResponse(
            title="Quick Paris",
            summary="One day only.",
            days=[
                DayPlan(
                    day_number=1,
                    date="2025-06-01",
                    items=[ItineraryItem(title="Seine River Walk", cost_estimate="Free")],
                )
            ],
        )
        days = repo.save_itinerary(paris_trip.id, slim_itinerary)

        assert len(days) == 1
        # Confirm old rows are gone from the DB.
        all_days = db.query(ItineraryDay).filter_by(trip_id=paris_trip.id).all()
        assert len(all_days) == 1
        all_events = db.query(ItineraryEvent).filter_by(day_id=all_days[0].id).all()
        assert len(all_events) == 1

    def test_get_days_by_trip_returns_ordered(self, db: Session, paris_trip: Trip):
        itinerary = ItineraryResponse(**SAMPLE_ITINERARY)
        repo = ItineraryRepository(db)
        repo.save_itinerary(paris_trip.id, itinerary)

        days = repo.get_days_by_trip(paris_trip.id)
        assert [d.day_number for d in days] == [1, 2]

    def test_get_days_by_trip_empty(self, db: Session, paris_trip: Trip):
        repo = ItineraryRepository(db)
        assert repo.get_days_by_trip(paris_trip.id) == []


# ---------------------------------------------------------------------------
# HTTP integration tests (apply endpoint)
# ---------------------------------------------------------------------------

class TestApplyEndpoint:
    def test_apply_saves_relational_rows(
        self, client: TestClient, auth_headers_user_a, paris_trip: Trip, db: Session
    ):
        response = client.post(
            "/v1/ai/apply",
            json={"trip_id": paris_trip.id, "itinerary": SAMPLE_ITINERARY},
            headers=auth_headers_user_a,
        )

        assert response.status_code == 200, response.json()

        days = db.query(ItineraryDay).filter_by(trip_id=paris_trip.id).all()
        assert len(days) == 2

        events = (
            db.query(ItineraryEvent)
            .join(ItineraryDay)
            .filter(ItineraryDay.trip_id == paris_trip.id)
            .all()
        )
        assert len(events) == 3  # 2 on day 1, 1 on day 2

    def test_apply_updates_trip_title_and_description(
        self, client: TestClient, auth_headers_user_a, paris_trip: Trip, db: Session
    ):
        client.post(
            "/v1/ai/apply",
            json={"trip_id": paris_trip.id, "itinerary": SAMPLE_ITINERARY},
            headers=auth_headers_user_a,
        )

        db.refresh(paris_trip)
        assert paris_trip.title == "Paris Adventure"
        assert "SUMMARY:" in paris_trip.description
        assert "DETAILS (JSON):" in paris_trip.description

    def test_apply_reapply_replaces_rows(
        self, client: TestClient, auth_headers_user_a, paris_trip: Trip, db: Session
    ):
        client.post(
            "/v1/ai/apply",
            json={"trip_id": paris_trip.id, "itinerary": SAMPLE_ITINERARY},
            headers=auth_headers_user_a,
        )

        slim = {
            "title": "Quick Paris",
            "summary": "One day.",
            "days": [
                {
                    "day_number": 1,
                    "items": [{"title": "Sacré-Cœur", "cost_estimate": "Free"}],
                }
            ],
        }
        client.post(
            "/v1/ai/apply",
            json={"trip_id": paris_trip.id, "itinerary": slim},
            headers=auth_headers_user_a,
        )

        days = db.query(ItineraryDay).filter_by(trip_id=paris_trip.id).all()
        assert len(days) == 1

    def test_apply_wrong_owner_returns_404(
        self, client: TestClient, auth_headers_user_b, paris_trip: Trip
    ):
        response = client.post(
            "/v1/ai/apply",
            json={"trip_id": paris_trip.id, "itinerary": SAMPLE_ITINERARY},
            headers=auth_headers_user_b,
        )
        assert response.status_code == 404
