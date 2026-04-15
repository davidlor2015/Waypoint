"""
Integration tests for Phase 2 security features:
  - Rate limiting on /v1/ai/plan and /v1/ai/plan-smart
  - In-memory caching of geocoding and POI fetches in the rule-based service
"""

from datetime import date
from unittest.mock import AsyncMock, patch

import pytest
from fastapi.testclient import TestClient

from app.models.trip import Trip
from app.schemas.ai import DayPlan, ItineraryItem, ItineraryResponse


# ------------------------------------------------------------------
# Shared fixtures / data
# ------------------------------------------------------------------

MOCK_LLM_RESPONSE = """
{
    "title": "Paris Adventure",
    "summary": "A lovely time in Paris.",
    "days": [{"day_number": 1, "items": [{"title": "Eiffel Tower", "cost_estimate": "€29"}]}]
}
"""

MOCK_ITINERARY = ItineraryResponse(
    title="Paris",
    summary="Great trip.",
    days=[DayPlan(day_number=1, items=[ItineraryItem(title="Eiffel Tower", cost_estimate="Free")])],
)

MOCK_POIS = [
    {"name": "Eiffel Tower", "kinds": "historic", "rate": 3, "xid": "N123"},
]


@pytest.fixture()
def paris_trip(db, user_a) -> Trip:
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


# ------------------------------------------------------------------
# Rate limiting
# ------------------------------------------------------------------

class TestRateLimiting:
    """
    AI_RATE_LIMIT is "3/minute" in the test environment (see conftest.py).
    The reset_rate_limiter fixture (autouse) clears the counter before each test.
    """

    def test_plan_allows_request_within_limit(
        self, client: TestClient, auth_headers_user_a, paris_trip: Trip
    ):
        with patch(
            "app.services.llm.ollama_client.OllamaClient.generate_json",
            new_callable=AsyncMock,
            return_value=MOCK_LLM_RESPONSE,
        ):
            r = client.post(
                "/v1/ai/plan",
                json={"trip_id": paris_trip.id},
                headers=auth_headers_user_a,
            )
        assert r.status_code == 200

    def test_plan_returns_429_after_limit_exceeded(
        self, client: TestClient, auth_headers_user_a, paris_trip: Trip
    ):
        """The 4th request in a minute (limit=3) must receive HTTP 429."""
        statuses = []
        with patch(
            "app.services.llm.ollama_client.OllamaClient.generate_json",
            new_callable=AsyncMock,
            return_value=MOCK_LLM_RESPONSE,
        ):
            for _ in range(4):
                r = client.post(
                    "/v1/ai/plan",
                    json={"trip_id": paris_trip.id},
                    headers=auth_headers_user_a,
                )
                statuses.append(r.status_code)

        assert statuses[:3] == [200, 200, 200], f"Expected 3 successes, got {statuses}"
        assert statuses[3] == 429, f"Expected 429 on 4th request, got {statuses[3]}"

    def test_plan_smart_returns_429_after_limit_exceeded(
        self, client: TestClient, auth_headers_user_a, paris_trip: Trip
    ):
        """plan-smart shares the same per-IP rate limit."""
        statuses = []
        with patch(
            "app.services.ai.itinerary_service.generate_rule_based_itinerary",
            new_callable=AsyncMock,
            return_value=MOCK_ITINERARY,
        ):
            for _ in range(4):
                r = client.post(
                    "/v1/ai/plan-smart",
                    json={"trip_id": paris_trip.id},
                    headers=auth_headers_user_a,
                )
                statuses.append(r.status_code)

        assert statuses[:3] == [200, 200, 200], f"Expected 3 successes, got {statuses}"
        assert statuses[3] == 429, f"Expected 429 on 4th request, got {statuses[3]}"

    def test_apply_endpoint_is_not_rate_limited(
        self, client: TestClient, auth_headers_user_a, paris_trip: Trip
    ):
        """/apply is a cheap DB write — it has no rate limit by design."""
        body = {
            "trip_id": paris_trip.id,
            "itinerary": {
                "title": "Paris Adventure",
                "summary": "Great trip.",
                "days": [
                    {
                        "day_number": 1,
                        "items": [{"title": "Eiffel Tower", "cost_estimate": "Free"}],
                    }
                ],
            },
        }
        for i in range(4):
            r = client.post("/v1/ai/apply", json=body, headers=auth_headers_user_a)
            assert r.status_code == 200, f"Request {i + 1} failed: {r.json()}"


# ------------------------------------------------------------------
# Caching
# ------------------------------------------------------------------

class TestRuleBasedCaching:
    """
    The cache is tested at the httpx level (not by patching service functions)
    so the TTLCache lookup inside _geocode / _fetch_pois is preserved.
    """

    @pytest.fixture(autouse=True)
    def clear_caches(self):
        """Flush module-level TTLCaches before and after each test."""
        from app.services.ai import rule_based_service
        rule_based_service._geocode_cache.clear()
        rule_based_service._poi_cache.clear()
        yield
        rule_based_service._geocode_cache.clear()
        rule_based_service._poi_cache.clear()

    def _make_fake_client_class(self, geocode_counter: list, poi_counter: list):
        """
        Factory that returns a fake httpx.AsyncClient class (not instance).

        The class is substituted via patch so that
        `async with httpx.AsyncClient(timeout=N) as client:` uses our fake.
        geocode_counter and poi_counter are appended to on each network hit.

        The radius endpoint returns ENOUGH_POIS (>= min_candidates for a 3-day
        trip: 3 days × 3 acts = 9) so the radius expansion stops at the first
        radius (5 km) and makes exactly one network call per request.
        """
        # min_candidates for paris_trip (3 days) = 3 × ACTS_PER_DAY (3) = 9.
        # Return 12 so _rank_pois has headroom after any filtering.
        enough_pois = [
            {"name": f"Attraction {i}", "kinds": "historic", "rate": 3, "xid": f"X{i:03d}"}
            for i in range(12)
        ]

        class FakeResponse:
            def __init__(self, data):
                self._data = data

            def raise_for_status(self):
                pass

            def json(self):
                return self._data

        class FakeClient:
            # Accept any constructor kwargs (e.g. timeout=) without error.
            def __init__(self, *args, **kwargs):
                pass

            async def __aenter__(self):
                return self

            async def __aexit__(self, *args):
                pass

            async def get(self, url, **kwargs):
                if "nominatim" in url or "search" in url:
                    geocode_counter.append(1)
                    return FakeResponse([{"lat": "48.8566", "lon": "2.3522"}])
                if "radius" in url:
                    poi_counter.append(1)
                    return FakeResponse(enough_pois)
                # POI detail / xid endpoint
                return FakeResponse({"wikipedia_extracts": {"text": "A famous landmark."}})

        return FakeClient

    def test_geocode_cached_on_second_request(
        self, client: TestClient, auth_headers_user_a, paris_trip: Trip
    ):
        """Nominatim is called once; the second request is served from _geocode_cache."""
        geocode_calls: list = []
        poi_calls: list = []
        FakeClient = self._make_fake_client_class(geocode_calls, poi_calls)

        with patch("app.services.ai.rule_based_service.httpx.AsyncClient", FakeClient):
            r1 = client.post(
                "/v1/ai/plan-smart",
                json={"trip_id": paris_trip.id},
                headers=auth_headers_user_a,
            )
            r2 = client.post(
                "/v1/ai/plan-smart",
                json={"trip_id": paris_trip.id},
                headers=auth_headers_user_a,
            )

        assert r1.status_code == 200, r1.json()
        assert r2.status_code == 200, r2.json()
        assert len(geocode_calls) == 1, (
            f"Nominatim should be called exactly once (cached on 2nd request); "
            f"was called {len(geocode_calls)} times"
        )

    def test_poi_fetch_cached_on_second_request(
        self, client: TestClient, auth_headers_user_a, paris_trip: Trip
    ):
        """OpenTripMap radius is called once; the second request is served from _poi_cache."""
        geocode_calls: list = []
        poi_calls: list = []
        FakeClient = self._make_fake_client_class(geocode_calls, poi_calls)

        with patch("app.services.ai.rule_based_service.httpx.AsyncClient", FakeClient):
            r1 = client.post(
                "/v1/ai/plan-smart",
                json={"trip_id": paris_trip.id},
                headers=auth_headers_user_a,
            )
            r2 = client.post(
                "/v1/ai/plan-smart",
                json={"trip_id": paris_trip.id},
                headers=auth_headers_user_a,
            )

        assert r1.status_code == 200, r1.json()
        assert r2.status_code == 200, r2.json()
        assert len(poi_calls) == 1, (
            f"OpenTripMap radius should be called exactly once (cached on 2nd request); "
            f"was called {len(poi_calls)} times"
        )
