from __future__ import annotations

from datetime import datetime
from enum import Enum

from sqlalchemy import DateTime, Enum as SQLEnum, ForeignKey, Integer, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.db.base_class import Base


class MatchInteractionStatus(str, Enum):
    INTERESTED = "interested"
    INTRO_SAVED = "intro_saved"
    PASSED = "passed"
    ACCEPTED = "accepted"
    DECLINED = "declined"


class MatchInteraction(Base):
    __tablename__ = "match_interactions"
    __table_args__ = (
        UniqueConstraint("user_id", "request_id", "match_result_id", name="uq_match_interaction_user_request_result"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    request_id: Mapped[int] = mapped_column(ForeignKey("match_requests.id"), nullable=False)
    match_result_id: Mapped[int] = mapped_column(ForeignKey("match_results.id"), nullable=False)
    status: Mapped[MatchInteractionStatus] = mapped_column(
        SQLEnum(MatchInteractionStatus, name="match_interaction_status_enum", native_enum=False),
        nullable=False,
    )
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    user: Mapped["User"] = relationship("User", back_populates="match_interactions")
    request: Mapped["MatchRequest"] = relationship("MatchRequest", back_populates="interactions")
    match_result: Mapped["MatchResult"] = relationship("MatchResult", back_populates="interactions")
