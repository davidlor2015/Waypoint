from __future__ import annotations

from datetime import date, datetime
from sqlalchemy.sql import func
from sqlalchemy import Float, String, Date, ForeignKey, Text, Integer, DateTime, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base_class import Base



class Trip(Base):
    __tablename__ = "trips"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)

    title: Mapped[str] = mapped_column(String(255), nullable=False)
    destination: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    notes: Mapped[str] = mapped_column(Text, nullable=True)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)
    is_discoverable: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    budget_limit: Mapped[float | None] = mapped_column(Float, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    
    owner: Mapped["User"] = relationship("User", back_populates="trips")
    match_requests: Mapped[list["MatchRequest"]] = relationship(
        "MatchRequest",
        back_populates="trip",
    )
    itinerary_days: Mapped[list["ItineraryDay"]] = relationship(
        "ItineraryDay",
        back_populates="trip",
        cascade="all, delete-orphan",
        order_by="ItineraryDay.day_number",
    )
    packing_items: Mapped[list["PackingItem"]] = relationship(
        "PackingItem",
        back_populates="trip",
        cascade="all, delete-orphan",
        order_by="PackingItem.created_at",
    )
    budget_expenses: Mapped[list["BudgetExpense"]] = relationship(
        "BudgetExpense",
        back_populates="trip",
        cascade="all, delete-orphan",
        order_by="BudgetExpense.created_at",
    )
