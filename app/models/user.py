from __future__ import annotations

from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Integer, Boolean
from app.db.base_class import Base

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    trips: Mapped[list["Trip"]] = relationship(
        "Trip",
        back_populates="owner",
        cascade="all, delete-orphan",
    )
    sent_match_requests: Mapped[list["MatchRequest"]] = relationship(
        "MatchRequest",
        back_populates="sender",
        foreign_keys="MatchRequest.sender_id",
    )
    received_match_requests: Mapped[list["MatchRequest"]] = relationship(
        "MatchRequest",
        back_populates="receiver",
        foreign_keys="MatchRequest.receiver_id",
    )
    match_interactions: Mapped[list["MatchInteraction"]] = relationship(
        "MatchInteraction",
        back_populates="user",
        cascade="all, delete-orphan",
    )
    travel_profile: Mapped["TravelProfile"] = relationship(
        "TravelProfile",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
        single_parent=True,
    )
