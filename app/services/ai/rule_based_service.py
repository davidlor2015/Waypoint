import asyncio
import logging
from datetime import timedelta

import httpx

from app.core.config import settings
from app.models.trip import Trip
from app.schemas.ai import DayPlan, ItineraryItem, ItineraryResponse

logger = logging.getLogger(__name__)

NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
OPENTRIPMAP_BASE = "https://api.opentripmap.com/0.1/en/places"

# Maps interest keywords the user can pass → OpenTripMap category strings
INTEREST_KINDS: dict[str, str] = {
    "food":      "foods",
    "history":   "historic",
    "nature":    "natural",
    "art":       "museums,art_galleries",
    "shopping":  "shops",
    "religion":  "religion",
    "beach":     "beaches",
    "sport":     "sport",
    "nightlife": "bars,clubs",
}
DEFAULT_KINDS = "interesting_places"

# Time slots assigned to activities in order throughout the day
DAY_TIMES = ["09:00 AM", "12:00 PM", "03:00 PM", "06:00 PM"]

# How many activities to request from the API (fetch more, then rank down to what we need)
FETCH_LIMIT = 50


async def _geocode(destination: str) -> tuple[float, float]:
    """Resolve a city/destination string to lat/lon using Nominatim (OpenStreetMap)."""
    async with httpx.AsyncClient(timeout=10) as client:
        response = await client.get(
            NOMINATIM_URL,
            params={"q": destination, "format": "json", "limit": 1},
            headers={"User-Agent": "travel-planner-portfolio-app"},
        )
        response.raise_for_status()
        data = response.json()

    if not data:
        raise ValueError(f"Could not find location: '{destination}'. Try a more specific city name.")

    return float(data[0]["lat"]), float(data[0]["lon"])


async def _fetch_pois(lat: float, lon: float, kinds: str) -> list[dict]:
    """Fetch POIs from OpenTripMap within a 5km radius, sorted by rating."""
    async with httpx.AsyncClient(timeout=15) as client:
        response = await client.get(
            f"{OPENTRIPMAP_BASE}/radius",
            params={
                "radius": 5000,
                "lon": lon,
                "lat": lat,
                "kinds": kinds,
                "limit": FETCH_LIMIT,
                "rate": 2,        # minimum rating (0–3 scale); 2 = notable places only
                "format": "json",
                "apikey": settings.OPENTRIPMAP_API_KEY,
            },
        )
        response.raise_for_status()
        data = response.json()
        pois = data if isinstance(data, list) else data.get("features", [])
        logger.info(f"OpenTripMap returned {len(pois)} POIs for kinds={kinds}")
        for poi in pois[:5]:
            props = poi.get("properties") or poi
            logger.info(f"  POI sample: name={props.get('name')!r} rate={props.get('rate')} kinds={props.get('kinds')!r}")
        return pois


async def _fetch_poi_description(xid: str) -> str:
    """Fetch a brief description for a POI from its OpenTripMap detail page."""
    try:
        async with httpx.AsyncClient(timeout=8) as client:
            response = await client.get(
                f"{OPENTRIPMAP_BASE}/xid/{xid}",
                params={"apikey": settings.OPENTRIPMAP_API_KEY},
            )
            response.raise_for_status()
            data = response.json()
            extract = (data.get("wikipedia_extracts") or {}).get("text") or ""
            if extract:
                # Trim to a readable length
                return extract[:300].rsplit(" ", 1)[0] + "…" if len(extract) > 300 else extract
            return (data.get("info") or {}).get("descr") or ""
    except Exception:
        return ""


async def _enrich_with_descriptions(pois: list[dict]) -> dict[str, str]:
    """Fetch descriptions for a list of POIs in parallel. Returns {xid: description}."""
    xids = [_props(p).get("xid") for p in pois]
    results = await asyncio.gather(*[_fetch_poi_description(xid) for xid in xids if xid])
    return {xid: desc for xid, desc in zip((x for x in xids if x), results)}


def _resolve_kinds(interests: list[str]) -> str:
    """Map user interest strings to OpenTripMap category kinds."""
    kinds = [INTEREST_KINDS[i] for i in interests if i in INTEREST_KINDS]
    return ",".join(kinds) if kinds else DEFAULT_KINDS


def _props(poi: dict) -> dict:
    """Normalise GeoJSON ({properties: {...}}) and flat-list responses to a single dict."""
    return poi.get("properties") or poi


def _score_poi(poi: dict) -> int:
    """Score a POI by its OpenTripMap rating (0–3 scale → 0–30)."""
    return _props(poi).get("rate", 0) * 10


def _cost_label(budget: str) -> str:
    if budget == "budget":
        return "Free–$10"
    if budget == "luxury":
        return "$30–$100+"
    return "$10–$30"


def _rank_pois(pois: list[dict], limit: int) -> list[dict]:
    """Sort POIs by score, deduplicate by name, return top `limit`."""
    seen_names: set[str] = set()
    ranked: list[dict] = []
    for poi in sorted(pois, key=_score_poi, reverse=True):
        name: str = _props(poi).get("name") or ""
        if name and name not in seen_names:
            seen_names.add(name)
            ranked.append(poi)
        if len(ranked) >= limit:
            break
    return ranked


def _assemble_itinerary(
    trip: Trip,
    ranked: list[dict],
    interests: list[str],
    budget: str,
    descriptions: dict[str, str] | None = None,
) -> ItineraryResponse:
    start = trip.start_date
    end = trip.end_date
    num_days = min((end - start).days + 1, 7)
    acts_per_day = min(len(DAY_TIMES), 3)

    logger.info(f"Assembling itinerary: {len(ranked)} ranked POIs for {num_days} days x {acts_per_day} acts")
    cost = _cost_label(budget)
    days: list[DayPlan] = []

    for day_idx in range(num_days):
        slice_ = ranked[day_idx * acts_per_day : (day_idx + 1) * acts_per_day]
        items: list[ItineraryItem] = []

        for i, poi in enumerate(slice_):
            props = _props(poi)
            raw_kinds: str = props.get("kinds", "")
            category = raw_kinds.split(",")[0].replace("_", " ").title() if raw_kinds else "Attraction"
            xid = props.get("xid")
            description = (descriptions or {}).get(xid) if xid else ""

            items.append(ItineraryItem(
                time=DAY_TIMES[i],
                title=props.get("name") or "Local Attraction",
                location=trip.destination,
                notes=description or f"Type: {category}",
                cost_estimate=cost,
            ))

        days.append(DayPlan(
            day_number=day_idx + 1,
            date=str(start + timedelta(days=day_idx)),
            items=items,
        ))

    interest_label = ", ".join(interests) if interests else "general sightseeing"

    dest = trip.destination.title()
    return ItineraryResponse(
        title=f"{num_days}-Day {dest} Trip",
        summary=(
            f"A {budget} {num_days}-day itinerary in {dest} "
            f"focused on {interest_label}. Activities sourced from OpenStreetMap."
        ),
        days=days,
    )


async def generate_rule_based_itinerary(
    trip: Trip,
    interests_override: str | None,
    budget_override: str | None,
) -> ItineraryResponse:
    """
    Main entry point. Geocodes the destination, fetches real POIs,
    scores them, and assembles an ItineraryResponse without using an LLM.
    """
    budget = (budget_override or "moderate").strip().lower()
    raw_interests = interests_override or ""
    interests = [i.strip().lower() for i in raw_interests.split(",") if i.strip()]

    kinds = _resolve_kinds(interests)
    logger.info(f"Rule-based plan: dest={trip.destination!r} budget={budget} kinds={kinds}")

    lat, lon = await _geocode(trip.destination)
    pois = await _fetch_pois(lat, lon, kinds)

    if not pois:
        # Fall back to broader category if specific interests returned nothing
        logger.warning(f"No POIs found for kinds={kinds}, retrying with default")
        pois = await _fetch_pois(lat, lon, DEFAULT_KINDS)

    if not pois:
        raise ValueError(
            f"No attractions found near '{trip.destination}'. "
            "Try a larger or better-known city."
        )

    num_days = min((trip.end_date - trip.start_date).days + 1, 7)
    acts_per_day = min(len(DAY_TIMES), 3)
    ranked = _rank_pois(pois, limit=num_days * acts_per_day)
    logger.info(f"Ranked {len(ranked)} unique named POIs")

    descriptions = await _enrich_with_descriptions(ranked)

    return _assemble_itinerary(trip, ranked, interests, budget, descriptions)
