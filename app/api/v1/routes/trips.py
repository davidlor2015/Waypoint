from typing import List
from fastapi import APIRouter, Response

from app.api.deps import CurrentUser, SessionDep
from app.schemas.trip import TripResponse, TripCreate, TripUpdate, TripSummaryResponse
from app.services.trip_service import TripService

router = APIRouter()


@router.post("/", response_model=TripResponse, status_code=201)
def create_trip(trip_in: TripCreate, db: SessionDep, current_user: CurrentUser):
    return TripService(db).create(trip_in, current_user.id)


@router.get("/", response_model=List[TripResponse])
def read_trips(*, db: SessionDep, current_user: CurrentUser, skip: int = 0, limit: int = 100):
    return TripService(db).get_all(current_user.id, skip, limit)


@router.get("/summaries", response_model=List[TripSummaryResponse])
def read_trip_summaries(*, db: SessionDep, current_user: CurrentUser, skip: int = 0, limit: int = 100):
    return TripService(db).get_summaries(current_user.id, skip, limit)


@router.get("/{trip_id}", response_model=TripResponse)
def read_trip(trip_id: int, db: SessionDep, current_user: CurrentUser):
    return TripService(db).get_one(trip_id, current_user.id)


@router.patch("/{trip_id}", response_model=TripResponse)
def update_trip(trip_id: int, trip_in: TripUpdate, db: SessionDep, current_user: CurrentUser):
    return TripService(db).update(trip_id, current_user.id, trip_in)


@router.delete("/{trip_id}", status_code=204)
def delete_trip(trip_id: int, db: SessionDep, current_user: CurrentUser):
    TripService(db).delete(trip_id, current_user.id)
    return Response(status_code=204)
