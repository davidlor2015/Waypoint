from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Any

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.ai import AIPlanRequest, ItineraryResponse, AIApplyRequest
from app.services.ai.itinerary_service import ItineraryService

router = APIRouter()


@router.post("/plan", response_model=ItineraryResponse)
async def generate_trip_plan(
    request: AIPlanRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Generates a draft itinerary using local AI. Does NOT save to DB."""
    service = ItineraryService(db)
    try:
        return await service.generate_itinerary(
            trip_id=request.trip_id,
            user_id=current_user.id,
            interests_override=request.interests_override,
            budget_override=request.budget_override,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/apply", status_code=200)
async def apply_trip_plan(
    request: AIApplyRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Saves the approved itinerary to the trip record."""
    service = ItineraryService(db)
    try:
        updated_trip = service.apply_itinerary_to_db(
            trip_id=request.trip_id,
            user_id=current_user.id,
            itinerary=request.itinerary,
        )
        return {"message": "Itinerary applied successfully", "trip_id": updated_trip.id}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
