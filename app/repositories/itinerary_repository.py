from typing import List

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.models.itinerary import ItineraryDay, ItineraryEvent
from app.schemas.ai import ItineraryResponse


class ItineraryRepository:
    """Handles all DB reads/writes for itinerary days and events."""

    def __init__(self, db: Session):
        self.db = db

    def save_itinerary(self, trip_id: int, itinerary: ItineraryResponse) -> List[ItineraryDay]:
        """
        Atomically replace all itinerary days/events for a trip.

        Deletes existing rows first, then bulk-inserts the new structure.
        Uses flush() to obtain PKs for child rows without an intermediate commit,
        so the entire operation lands in one transaction.

        Events are deleted explicitly before days because bulk DELETE bypasses
        SQLAlchemy's ORM cascade, and SQLite does not enforce FK CASCADE by
        default (unlike MySQL).  Explicit ordering keeps the repository portable.
        """
        existing_day_ids = select(ItineraryDay.id).where(ItineraryDay.trip_id == trip_id)
        self.db.execute(delete(ItineraryEvent).where(ItineraryEvent.day_id.in_(existing_day_ids)))
        self.db.execute(delete(ItineraryDay).where(ItineraryDay.trip_id == trip_id))

        saved_days: List[ItineraryDay] = []
        for day_plan in itinerary.days:
            day = ItineraryDay(
                trip_id=trip_id,
                day_number=day_plan.day_number,
                day_date=day_plan.date,
            )
            self.db.add(day)
            self.db.flush()  # Populate day.id so child events can reference it.

            for order, item in enumerate(day_plan.items):
                self.db.add(
                    ItineraryEvent(
                        day_id=day.id,
                        sort_order=order,
                        time=item.time,
                        title=item.title,
                        location=item.location,
                        lat=item.lat,
                        lon=item.lon,
                        notes=item.notes,
                        cost_estimate=item.cost_estimate,
                    )
                )

            saved_days.append(day)

        self.db.commit()
        for day in saved_days:
            self.db.refresh(day)
        return saved_days

    def get_days_by_trip(self, trip_id: int) -> List[ItineraryDay]:
        """Return all days for a trip ordered by day_number. Events are lazy-loaded."""
        return list(
            self.db.scalars(
                select(ItineraryDay)
                .where(ItineraryDay.trip_id == trip_id)
                .order_by(ItineraryDay.day_number)
            ).all()
        )
