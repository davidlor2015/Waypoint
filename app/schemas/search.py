from __future__ import annotations

from pydantic import BaseModel


# ── Flight search ──────────────────────────────────────────────────────────────

class Segment(BaseModel):
    departure_iata: str
    departure_at: str       # ISO-8601 datetime string from Amadeus
    arrival_iata: str
    arrival_at: str
    carrier_code: str
    number: str
    duration: str           # ISO-8601 duration, e.g. "PT2H10M"


class Itinerary(BaseModel):
    duration: str
    segments: list[Segment]


class FlightOffer(BaseModel):
    id: str
    price: str
    currency: str
    itineraries: list[Itinerary]


class FlightSearchResult(BaseModel):
    offers: list[FlightOffer]
    count: int
    test_env: bool = True   # always True — we only expose the sandbox


# ── Inspiration ("Where can I fly cheaply from X?") ───────────────────────────

class FlightInspiration(BaseModel):
    destination: str        # IATA code e.g. "CDG"
    departure_date: str
    return_date: str | None = None
    price: str


class InspirationResult(BaseModel):
    origin: str
    suggestions: list[FlightInspiration]
    test_env: bool = True


# ── Explore destinations ──────────────────────────────────────────────────────

class ExploreDestination(BaseModel):
    id: str
    city: str
    country: str = ""
    tag: str | None = None
    description: str | None = None


class ExploreDestinationsResult(BaseModel):
    popular: list[ExploreDestination]
    regions: dict[str, list[ExploreDestination]]
