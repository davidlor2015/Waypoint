from jose import jwt
from app.core.config import settings
from app.core import security


def test_hash_password():
    password = "secret_password"
    hashed = security.get_password_hash(password)

    assert hashed != password
    assert security.verify_password(password, hashed)


def test_create_access_token():
    email = "test@example.com"
    data = {"sub": email}
    token = security.create_access_token(data)
    payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALG])

    assert payload["sub"] == email
    assert "exp" in payload
