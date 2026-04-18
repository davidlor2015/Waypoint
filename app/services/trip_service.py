from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.repositories.trip_repository import TripRepository
from app.repositories.travel_profile_repository import TravelProfileRepository
from app.models.trip import Trip
from app.schemas.trip import TripCreate, TripUpdate
from app.services.matching_service import MatchingService


class TripService:
    def __init__(self, db: Session):
        self.repo = TripRepository(db)
        self.profile_repo = TravelProfileRepository(db)
        self.matching_service = MatchingService(db)

    def create(self, trip_in: TripCreate, user_id: int) -> Trip:
        profile = self.profile_repo.get_by_user(user_id)
        trip = Trip(
            **trip_in.model_dump(),
            user_id=user_id,
            is_discoverable=profile.is_discoverable if profile else True,
        )
        return self.repo.add(trip)

    def get_all(self, user_id: int, skip: int = 0, limit: int = 100) -> list[Trip]:
        return self.repo.get_all_by_user(user_id, skip, limit)

    def get_summaries(self, user_id: int, skip: int = 0, limit: int = 100) -> list[dict[str, object]]:
        trips = self.repo.get_all_by_user_with_planning(user_id, skip, limit)
        summaries: list[dict[str, object]] = []
        for trip in trips:
            packing_total = len(trip.packing_items)
            packing_checked = sum(1 for item in trip.packing_items if item.checked)
            packing_progress_pct = 0 if packing_total == 0 else round((packing_checked / packing_total) * 100)

            budget_total_spent = float(sum(expense.amount for expense in trip.budget_expenses))
            budget_remaining = (
                float(trip.budget_limit - budget_total_spent)
                if trip.budget_limit is not None
                else None
            )
            summaries.append({
                "trip_id": trip.id,
                "packing_total": packing_total,
                "packing_checked": packing_checked,
                "packing_progress_pct": packing_progress_pct,
                "budget_limit": float(trip.budget_limit) if trip.budget_limit is not None else None,
                "budget_total_spent": budget_total_spent,
                "budget_remaining": budget_remaining,
                "budget_is_over": budget_remaining is not None and budget_remaining < 0,
                "budget_expense_count": len(trip.budget_expenses),
            })
        return summaries

    def get_one(self, trip_id: int, user_id: int) -> Trip:
        trip = self.repo.get_by_id_and_user(trip_id, user_id)
        if not trip:
            raise HTTPException(status_code=404, detail="Trip not found")
        return trip

    def update(self, trip_id: int, user_id: int, trip_in: TripUpdate) -> Trip:
        trip = self.get_one(trip_id, user_id)
        updated_trip = self.repo.update(trip, trip_in.model_dump(exclude_unset=True))
        self.matching_service._invalidate(user_id)
        return updated_trip

    def delete(self, trip_id: int, user_id: int) -> None:
        trip = self.get_one(trip_id, user_id)
        self.repo.delete(trip)
        self.matching_service._invalidate(user_id)
