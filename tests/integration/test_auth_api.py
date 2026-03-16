"""
Auth API integration tests.

Hit real FastAPI endpoints via TestClient against an in-memory SQLite DB.
Tests verify the full request path: router → deps → service → DB → response.
"""


def test_register_user(client):
    response = client.post(
        "/v1/auth/register",
        json={"email": "testuser@example.com", "password": "testme1"},
    )

    assert response.status_code == 200, response.text
    data = response.json()

    assert data["email"] == "testuser@example.com"
    assert "id" in data
    assert "password" not in data
    assert "hashed_password" not in data


def test_login_user(client):
    client.post(
        "/v1/auth/register",
        json={"email": "login@example.com", "password": "password1"},
    )

    response = client.post(
        "/v1/auth/login",
        data={"username": "login@example.com", "password": "password1"},
    )

    assert response.status_code == 200, response.text
    data = response.json()

    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_login_wrong_password(client):
    client.post(
        "/v1/auth/register",
        json={"email": "beap@example.com", "password": "password111"},
    )

    response = client.post(
        "/v1/auth/login",
        data={"username": "beap@example.com", "password": "wrongpassword"},
    )

    assert response.status_code == 401


def test_read_users_me(client):
    client.post(
        "/v1/auth/register",
        json={"email": "me@example.com", "password": "password111"},
    )

    login_res = client.post(
        "/v1/auth/login",
        data={"username": "me@example.com", "password": "password111"},
    )
    assert login_res.status_code == 200, login_res.text

    token = login_res.json()["access_token"]

    response = client.get(
        "/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200, response.text
    assert response.json()["email"] == "me@example.com"
