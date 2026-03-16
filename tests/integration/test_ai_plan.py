import pytest
from unittest.mock import patch, AsyncMock
from datetime import date
from fastapi.testclient import TestClient
from app.models.trip import Trip

MOCK_JSON_RESPONSE = """
{
    "title": "Paris Adventure",
    "summary": "A lovely time in Paris.",
    "days": [
        {
            "day_number": 1,
            "items": [
                {"title": "Eiffel Tower", "time": "09:00", "cost_estimate": "30 EUR"}
            ]
        }
    ],
    "packing_list": ["Scarf", "Camera"]
}
"""


def test_generate_plan_success(client: TestClient, auth_headers_user_a, user_a, db):
    new_trip = Trip(
        title="My Paris Trip",
        destination="Paris",
        user_id=user_a.id,
        start_date=date(2024, 1, 1),
        end_date=date(2024, 1, 5),
    )
    db.add(new_trip)
    db.commit()
    db.refresh(new_trip)

    with patch(
        "app.services.llm.ollama_client.OllamaClient.generate_json",
        new_callable=AsyncMock,
    ) as mock_generate:
        mock_generate.return_value = MOCK_JSON_RESPONSE

        response = client.post(
            "/v1/ai/plan",
            json={"trip_id": new_trip.id},
            headers=auth_headers_user_a,
        )

        if response.status_code != 200:
            print("ERROR DETAILS:", response.json())

    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Paris Adventure"
    assert len(data["days"]) == 1


def test_generate_plan_not_found(client: TestClient, auth_headers_user_a):
    response = client.post(
        "/v1/ai/plan",
        json={"trip_id": 99999},
        headers=auth_headers_user_a,
    )

    if response.status_code != 400:
        print("ERROR DETAILS:", response.json())

    assert response.status_code == 400
