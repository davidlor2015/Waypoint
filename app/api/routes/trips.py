from typing import List

from sqlalchemy import select
from fastapi import APIRouter, HTTPException, Response

from app.api.deps import CurrentUser, SessionDep
from app.models.trip import Trip
from app.schemas.trip import TripResponse, TripCreate, TripUpdate


router = APIRouter()

@router.post("/", response_model=TripResponse, status_code=201)
def create_trip(trip_in: TripCreate, db: SessionDep, current_user: CurrentUser):

    trip = Trip(**trip_in.model_dump(), user_id=current_user.id)

    db.add(trip)
    db.commit()
    db.refresh(trip)
    return trip

@router.get("/", response_model=List[TripResponse])
def read_trips(*, db: SessionDep, current_user: CurrentUser, skip: int = 0, limit: int = 100):
    stmt = select(Trip).where(Trip.user_id == current_user.id).offset(skip).limit(limit)
    return db.scalars(stmt).all()


@router.get("/{trip_id}", response_model=TripResponse)
def read_trip(trip_id: int, db: SessionDep, current_user: CurrentUser):
    stmt = select(Trip).where(Trip.id == trip_id, Trip.user_id == current_user.id)
    trip = db.scalar(stmt)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    return trip

@router.patch("/{trip_id}", response_model=TripResponse)
def update_trip(trip_id: int, trip_in: TripUpdate, db: SessionDep, current_user: CurrentUser):
    stmt = select(Trip).where(Trip.id == trip_id, Trip.user_id == current_user.id)
    trip = db.scalar(stmt)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    
    update_data = trip_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(trip, key, value)

    db.commit()
    db.refresh(trip)
    return trip 

@router.delete("/{trip_id}", status_code=204)
def delete_trip(trip_id: int, db: SessionDep, current_user: CurrentUser):
    stmt = select(Trip).where(Trip.id == trip_id, Trip.user_id == current_user.id)
    trip = db.scalar(stmt)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    
    db.delete(trip)
    db.commit()
    return Response(status_code=204)