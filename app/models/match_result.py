from __future__ import annotations

from sqlalchemy import Float, ForeignKey, Integer, JSON, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base


class MatchResult(Base):
    __tablename__ = "match_results"
    __table_args__ = (
        UniqueConstraint("request_a_id", "request_b_id"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    request_a_id: Mapped[int] = mapped_column(ForeignKey("match_requests.id"), nullable=False)
    request_b_id: Mapped[int] = mapped_column(ForeignKey("match_requests.id"), nullable=False)
    score: Mapped[float] = mapped_column(Float, nullable=False)
    breakdown: Mapped[dict] = mapped_column(JSON, nullable=False)

    request_a: Mapped["MatchRequest"] = relationship(
        "MatchRequest",
        back_populates="results_as_request_a",
        foreign_keys=[request_a_id],
    )
    request_b: Mapped["MatchRequest"] = relationship(
        "MatchRequest",
        back_populates="results_as_request_b",
        foreign_keys=[request_b_id],
    )
    interactions: Mapped[list["MatchInteraction"]] = relationship(
        "MatchInteraction",
        back_populates="match_result",
        cascade="all, delete-orphan",
    )
