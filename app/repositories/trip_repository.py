from typing import Optional, List
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import select

from app.models.trip import Trip
from app.repositories.base import BaseRepository


class TripRepository(BaseRepository[Trip]):
    def __init__(self, db: Session):
        super().__init__(Trip, db)

    def get_by_id_and_user(self, trip_id: int, user_id: int) -> Optional[Trip]:
        return self.db.scalar(
            select(Trip).where(Trip.id == trip_id, Trip.user_id == user_id)
        )

    def get_all_by_user(self, user_id: int, skip: int = 0, limit: int = 100) -> List[Trip]:
        return list(
            self.db.scalars(
                select(Trip).where(Trip.user_id == user_id).offset(skip).limit(limit)
            ).all()
        )

    def get_all_by_user_with_planning(self, user_id: int, skip: int = 0, limit: int = 100) -> List[Trip]:
        return list(
            self.db.scalars(
                select(Trip)
                .options(
                    selectinload(Trip.packing_items),
                    selectinload(Trip.budget_expenses),
                )
                .where(Trip.user_id == user_id)
                .offset(skip)
                .limit(limit)
            ).all()
        )

    def update(self, trip: Trip, update_data: dict) -> Trip:
        for key, value in update_data.items():
            setattr(trip, key, value)
        self.db.commit()
        self.db.refresh(trip)
        return trip

    def set_discoverable_for_user(self, user_id: int, is_discoverable: bool) -> None:
        trips = list(
            self.db.scalars(
                select(Trip).where(Trip.user_id == user_id)
            ).all()
        )
        for trip in trips:
            trip.is_discoverable = is_discoverable
        self.db.commit()
