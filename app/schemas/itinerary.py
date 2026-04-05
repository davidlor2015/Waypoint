from __future__ import annotations

from typing import Optional
from pydantic import BaseModel, ConfigDict


class ItineraryEventRead(BaseModel):
    """Serialises an ItineraryEvent ORM row for API responses."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    day_id: int
    sort_order: int
    time: Optional[str] = None
    title: str
    location: Optional[str] = None
    lat: Optional[float] = None
    lon: Optional[float] = None
    notes: Optional[str] = None
    cost_estimate: Optional[str] = None


class ItineraryDayRead(BaseModel):
    """Serialises an ItineraryDay ORM row (with nested events) for API responses."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    trip_id: int
    day_number: int
    day_date: Optional[str] = None
    events: list[ItineraryEventRead] = []
