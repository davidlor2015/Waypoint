from fastapi import APIRouter, Depends, HTTPException, Query

from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.search import FlightSearchResult, InspirationResult
from app.services.travel import amadeus_service

router = APIRouter()


@router.get("/flights", response_model=FlightSearchResult)
async def search_flights(
    origin: str = Query(..., min_length=3, max_length=3, description="Origin IATA code, e.g. LHR"),
    destination: str = Query(..., min_length=3, max_length=3, description="Destination IATA code, e.g. NRT"),
    date: str = Query(..., description="Departure date YYYY-MM-DD"),
    adults: int = Query(1, ge=1, le=9),
    _: User = Depends(get_current_user),
):
    """
    Search flight offers via Amadeus **sandbox** (test data, not real bookings).
    Results are cached for 60 s to stay within sandbox rate limits.
    """
    try:
        return await amadeus_service.search_flights(origin, destination, date, adults)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc))


@router.get("/inspirations", response_model=InspirationResult)
async def get_inspirations(
    origin: str = Query(..., min_length=3, max_length=3, description="Origin IATA code, e.g. MAD"),
    max_price: int | None = Query(None, ge=1, description="Optional max price in USD"),
    _: User = Depends(get_current_user),
):
    """
    Return cheapest reachable destinations from *origin* via Amadeus **sandbox**.
    Useful for "Where can I fly from here?" inspiration on the Explore page.
    """
    try:
        return await amadeus_service.get_inspirations(origin, max_price)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
