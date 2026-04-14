from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

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
    """
    Generates a draft itinerary using local AI.
    Does NOT save to DB yet.
    """
    service = ItineraryService(db)
    try:
        itinerary = await service.generate_itinerary(
            trip_id=request.trip_id,
            user_id=current_user.id,
            interests_override=request.interests_override, 
            budget_override=request.budget_override
        )
        return itinerary
    except ValueError as e:
        # Business logic errors (not found, invalid json)
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        # catches typos and prints them to logs
        print(f"SERVER ERROR: {e}") 
        raise HTTPException(status_code=503, detail=str(e))

@router.get("/stream/{trip_id}")
async def stream_trip_plan(
    trip_id: int,
    interests_override: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> StreamingResponse:
    """
    Streams an AI-generated itinerary as Server-Sent Events.

    Event types:
      token    — raw LLM text chunk for live display
      complete — validated ItineraryResponse JSON; signals generation is done
      error    — human-readable failure message
    """
    service = ItineraryService(db)
    return StreamingResponse(
        service.stream_itinerary(
            trip_id=trip_id,
            user_id=current_user.id,
            interests_override=interests_override,
        ),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


@router.post("/apply", status_code=200)
async def apply_trip_plan(
    request: AIApplyRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Saves the generated itinerary to the Trip's description.
    """
    service = ItineraryService(db)
    try:
        updated_trip = service.apply_itinerary_to_db(
            trip_id=request.trip_id,
            user_id=current_user.id,
            itinerary=request.itinerary
        )
        return {"message": "Itinerary applied successfully", "trip_id": updated_trip.id}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))