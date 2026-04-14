"""
Thin async wrapper around the synchronous Amadeus Python SDK.

All network calls are executed in a thread pool via asyncio.to_thread so they
don't block FastAPI's event loop.  Results are cached for 60 s with a simple
TTLCache to stay within sandbox rate limits.
"""
from __future__ import annotations

import asyncio
import logging
from threading import Lock

from cachetools import TTLCache

from app.core.config import settings
from app.schemas.search import (
    FlightInspiration,
    FlightOffer,
    FlightSearchResult,
    InspirationResult,
    Itinerary,
    Segment,
)

logger = logging.getLogger(__name__)

_cache: TTLCache = TTLCache(maxsize=256, ttl=60)
_cache_lock = Lock()


# ── Client factory ─────────────────────────────────────────────────────────────

def _client():
    """Lazily import + instantiate the Amadeus client.

    Using hostname='test' pins us to the sandbox environment permanently.
    """
    from amadeus import Client  # noqa: PLC0415 — intentional lazy import

    if not settings.AMADEUS_CLIENT_ID or not settings.AMADEUS_CLIENT_SECRET:
        raise RuntimeError(
            "Amadeus credentials not configured — add AMADEUS_CLIENT_ID and "
            "AMADEUS_CLIENT_SECRET to your .env file."
        )
    return Client(
        client_id=settings.AMADEUS_CLIENT_ID,
        client_secret=settings.AMADEUS_CLIENT_SECRET,
        hostname="test",  # sandbox — never switches to production
    )


# ── Response parsers ───────────────────────────────────────────────────────────

def _parse_offer(raw: dict) -> FlightOffer:
    itineraries: list[Itinerary] = []
    for itin in raw.get("itineraries", []):
        segments: list[Segment] = []
        for seg in itin.get("segments", []):
            dep = seg["departure"]
            arr = seg["arrival"]
            segments.append(
                Segment(
                    departure_iata=dep["iataCode"],
                    departure_at=dep["at"],
                    arrival_iata=arr["iataCode"],
                    arrival_at=arr["at"],
                    carrier_code=seg["carrierCode"],
                    number=seg["number"],
                    duration=seg["duration"],
                )
            )
        itineraries.append(Itinerary(duration=itin["duration"], segments=segments))

    price = raw.get("price", {})
    return FlightOffer(
        id=raw["id"],
        price=price.get("grandTotal") or price.get("total") or "N/A",
        currency=price.get("currency", "USD"),
        itineraries=itineraries,
    )


# ── Public async API ───────────────────────────────────────────────────────────

async def search_flights(
    origin: str,
    destination: str,
    date: str,
    adults: int = 1,
) -> FlightSearchResult:
    """Return up to 5 flight offers for a given route and date."""
    key = f"fl:{origin}:{destination}:{date}:{adults}"
    with _cache_lock:
        if key in _cache:
            return _cache[key]

    def _sync() -> FlightSearchResult:
        from amadeus import ResponseError  # noqa: PLC0415

        try:
            resp = _client().shopping.flight_offers_search.get(
                originLocationCode=origin.upper(),
                destinationLocationCode=destination.upper(),
                departureDate=date,
                adults=adults,
                max=5,
            )
            offers = [_parse_offer(o) for o in resp.data]
            return FlightSearchResult(offers=offers, count=len(offers))
        except ResponseError as exc:
            logger.error("Amadeus flight search failed: %s", exc)
            raise RuntimeError(
                f"Amadeus API returned {exc.response.status_code}. "
                "Check that your IATA codes and date are valid."
            ) from exc

    result = await asyncio.to_thread(_sync)
    with _cache_lock:
        _cache[key] = result
    return result


async def get_inspirations(
    origin: str,
    max_price: int | None = None,
) -> InspirationResult:
    """Return cheapest destinations reachable from *origin* (Amadeus inspiration)."""
    key = f"insp:{origin}:{max_price}"
    with _cache_lock:
        if key in _cache:
            return _cache[key]

    def _sync() -> InspirationResult:
        from amadeus import ResponseError  # noqa: PLC0415

        params: dict = {"origin": origin.upper()}
        if max_price:
            params["maxPrice"] = max_price
        try:
            resp = _client().shopping.flight_destinations.get(**params)
            suggestions = [
                FlightInspiration(
                    destination=item["destination"],
                    departure_date=item["departureDate"],
                    return_date=item.get("returnDate"),
                    price=str(item.get("price", {}).get("total", "N/A")),
                )
                for item in resp.data
            ]
            return InspirationResult(origin=origin.upper(), suggestions=suggestions)
        except ResponseError as exc:
            logger.error("Amadeus inspirations failed: %s", exc)
            raise RuntimeError(
                f"Amadeus API returned {exc.response.status_code}. "
                "Check that your origin IATA code is valid."
            ) from exc

    result = await asyncio.to_thread(_sync)
    with _cache_lock:
        _cache[key] = result
    return result
