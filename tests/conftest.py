# tests/conftest.py
"""
Global pytest fixtures for the FastAPI app.

What this file gives every test:
- Safe test-only database (SQLite)
- Transaction rollback after each test
- JWT env vars configured
- TestClient that uses the test DB
- Helper fixtures for authenticated users

This keeps API tests realistic but isolated.
"""

import os

# ---- Ensure settings exist before any app modules are imported ----
os.environ.setdefault("JWT_SECRET", "test-secret-not-for-production")
os.environ.setdefault("JWT_ALG", "HS256")
os.environ.setdefault("ACCESS_TOKEN_EXPIRE_MINUTES", "60")
# Low limit so the rate-limit test only needs a few requests to trigger a 429.
os.environ.setdefault("AI_RATE_LIMIT", "3/minute")

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app as fastapi_app
from app.db.base_class import Base

# Import app.db.base so all models are registered (User, Trip, ...)
import app.db.base  # noqa: F401

from app.db.session import get_db
from app.core import security
from app.models.user import User


# ---------------------------
# Test Database Setup
# ---------------------------

TEST_DATABASE_URL = "sqlite+pysqlite:///:memory:"

engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
)

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session", autouse=True)
def setup_db():
    """
    Create all tables once per test session.

    We then isolate each test with transactions.
    """
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function", autouse=True)
def reset_rate_limiter():
    """
    Reset the slowapi in-memory counter before and after every test.

    Without this, rate limit hits from one test would bleed into the next,
    causing sporadic 429 failures on perfectly normal requests.
    """
    from app.core.limiter import limiter
    limiter._storage.reset()
    yield
    limiter._storage.reset()


@pytest.fixture(scope="function")
def db():
    """
    DB session wrapped in a transaction.

    Each test:
    - begins a transaction
    - runs freely
    - rolls back afterward
    """
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    try:
        yield session
    finally:
        session.close()
        transaction.rollback()
        connection.close()



@pytest.fixture(scope="function")
def client(db):
    def override_get_db():
        yield db

    fastapi_app.dependency_overrides[get_db] = override_get_db

    with TestClient(fastapi_app) as c:
        yield c

    fastapi_app.dependency_overrides.clear()



# ---------------------------
# Auth Helper Fixtures
# ---------------------------

@pytest.fixture(scope="function")
def user_a(db):
    """
    Create a test user.

    Password is hashed using the real hashing logic so auth behaves normally.
    """
    u = User(
        email="usera@example.com",
        hashed_password=security.get_password_hash("password123"),
        is_active=True,
    )
    db.add(u)
    db.commit()
    db.refresh(u)
    return u


@pytest.fixture(scope="function")
def user_b(db):
    """Second user for ownership tests."""
    u = User(
        email="userb@example.com",
        hashed_password=security.get_password_hash("password456"),
        is_active=True,
    )
    db.add(u)
    db.commit()
    db.refresh(u)
    return u


@pytest.fixture(scope="function")
def auth_headers_user_a(user_a):
    """
    Authorization header for user_a.

    Token payload uses {"sub": email}, which your get_current_user() depends on.
    """
    token = security.create_access_token(data={"sub": user_a.email})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(scope="function")
def auth_headers_user_b(user_b):
    token = security.create_access_token(data={"sub": user_b.email})
    return {"Authorization": f"Bearer {token}"}
