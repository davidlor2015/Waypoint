from __future__ import annotations

from datetime import datetime
from enum import Enum

from sqlalchemy import DateTime, Enum as SQLEnum, ForeignKey, Index, Integer, text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.db.base_class import Base


class MatchRequestStatus(str, Enum):
    OPEN = "open"
    ACCEPTED = "accepted"
    CLOSED = "closed"


class MatchRequest(Base):
    __tablename__ = "match_requests"
    __table_args__ = (
        Index(
            "uq_match_requests_open_per_trip",
            "sender_id",
            "receiver_id",
            "trip_id",
            unique=True,
            postgresql_where=text("status = 'open'"),
            sqlite_where=text("status = 'open'"),
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    sender_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    receiver_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    trip_id: Mapped[int] = mapped_column(ForeignKey("trips.id"), nullable=False)
    status: Mapped[MatchRequestStatus] = mapped_column(
        SQLEnum(MatchRequestStatus, name="match_request_status_enum", native_enum=False),
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    sender: Mapped["User"] = relationship(
        "User",
        back_populates="sent_match_requests",
        foreign_keys=[sender_id],
    )
    receiver: Mapped["User"] = relationship(
        "User",
        back_populates="received_match_requests",
        foreign_keys=[receiver_id],
    )
    trip: Mapped["Trip"] = relationship("Trip", back_populates="match_requests")
    results_as_request_a: Mapped[list["MatchResult"]] = relationship(
        "MatchResult",
        back_populates="request_a",
        foreign_keys="MatchResult.request_a_id",
    )
    results_as_request_b: Mapped[list["MatchResult"]] = relationship(
        "MatchResult",
        back_populates="request_b",
        foreign_keys="MatchResult.request_b_id",
    )
    interactions: Mapped[list["MatchInteraction"]] = relationship(
        "MatchInteraction",
        back_populates="request",
        cascade="all, delete-orphan",
    )
