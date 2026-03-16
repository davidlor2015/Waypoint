from datetime import timedelta
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.core import security
from app.core.config import settings
from app.repositories.user_repository import UserRepository
from app.models.user import User
from app.schemas.user import UserCreate


class AuthService:
    def __init__(self, db: Session):
        self.repo = UserRepository(db)

    def register(self, user_in: UserCreate) -> User:
        if self.repo.get_by_email(user_in.email):
            raise HTTPException(status_code=400, detail="Email already registered")
        new_user = User(
            email=user_in.email,
            hashed_password=security.get_password_hash(user_in.password),
        )
        return self.repo.add(new_user)

    def login(self, email: str, password: str) -> str:
        user = self.repo.get_by_email(email)
        if not user or not security.verify_password(password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        return security.create_access_token(data={"sub": user.email}, expires_delta=expires)
