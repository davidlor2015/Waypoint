from __future__ import annotations

from sqlalchemy import Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base


class ItineraryDay(Base):
    __tablename__ = "itinerary_days"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    trip_id: Mapped[int] = mapped_column(
        ForeignKey("trips.id", ondelete="CASCADE"), nullable=False, index=True
    )
    day_number: Mapped[int] = mapped_column(Integer, nullable=False)
    # Stored as a string so the AI's free-form date ("2024-01-01", "Day 1", etc.) survives.
    day_date: Mapped[str | None] = mapped_column(String(50), nullable=True)

    trip: Mapped["Trip"] = relationship("Trip", back_populates="itinerary_days")
    events: Mapped[list["ItineraryEvent"]] = relationship(
        "ItineraryEvent",
        back_populates="day",
        cascade="all, delete-orphan",
        order_by="ItineraryEvent.sort_order",
    )


class ItineraryEvent(Base):
    __tablename__ = "itinerary_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    day_id: Mapped[int] = mapped_column(
        ForeignKey("itinerary_days.id", ondelete="CASCADE"), nullable=False, index=True
    )
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    time: Mapped[str | None] = mapped_column(String(50), nullable=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    location: Mapped[str | None] = mapped_column(String(255), nullable=True)
    lat: Mapped[float | None] = mapped_column(Float, nullable=True)
    lon: Mapped[float | None] = mapped_column(Float, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    cost_estimate: Mapped[str | None] = mapped_column(String(100), nullable=True)

    day: Mapped["ItineraryDay"] = relationship("ItineraryDay", back_populates="events")
