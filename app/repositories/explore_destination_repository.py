from sqlalchemy import Select, select
from sqlalchemy.orm import Session

from app.models.explore_destination import ExploreDestination


class ExploreDestinationRepository:
    def __init__(self, db: Session):
        self.db = db

    def count_all(self) -> int:
        return self.db.query(ExploreDestination).count()

    def create_many(self, rows: list[ExploreDestination]) -> None:
        self.db.add_all(rows)
        self.db.commit()

    def list_active(self, region: str | None = None) -> list[ExploreDestination]:
        stmt: Select[tuple[ExploreDestination]] = select(ExploreDestination).where(ExploreDestination.is_active.is_(True))
        if region:
            stmt = stmt.where(ExploreDestination.region == region)
        stmt = stmt.order_by(ExploreDestination.region.asc(), ExploreDestination.sort_order.asc(), ExploreDestination.city.asc())
        return list(self.db.scalars(stmt).all())

    def get_by_slug(self, slug: str) -> ExploreDestination | None:
        return self.db.scalar(select(ExploreDestination).where(ExploreDestination.slug == slug))

    def create(self, row: ExploreDestination) -> ExploreDestination:
        self.db.add(row)
        self.db.commit()
        self.db.refresh(row)
        return row

    def delete(self, row: ExploreDestination) -> None:
        self.db.delete(row)
        self.db.commit()

    def commit(self) -> None:
        self.db.commit()
