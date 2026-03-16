# app/api/deps.py
from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import get_db
from app.models.user import User


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/v1/auth/login")


SessionDep = Annotated[Session, Depends(get_db)]
TokenDep = Annotated[str, Depends(oauth2_scheme)]

def get_current_user(token: TokenDep, db: SessionDep) -> User:
    """
    Validates the JWT and returns the matching User from the database.

    Important security idea:
    - We do NOT trust any client to tell us who they are.
    - We trust ONLY the JWT signature + expiration, which is verified by jwt.decode().
    - We then look up the user in our own DB.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    # 1) Decode the token (this verifies signature and checks 'exp' automatically)
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALG])
        email: str | None = payload.get("sub") 
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    # 2) Look up the user
    user = db.scalar(select(User).where(User.email == email))
    if user is None:
        raise credentials_exception

    return user

CurrentUser = Annotated[User, Depends(get_current_user)]
