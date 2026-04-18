from typing import List

from sqlalchemy import delete, or_, select
from sqlalchemy.orm import Session

from app.models.match_request import MatchRequest
from app.models.match_result import MatchResult
from app.models.match_interaction import MatchInteraction
from app.repositories.base import BaseRepository


class MatchInteractionRepository(BaseRepository[MatchInteraction]):
    def __init__(self, db: Session):
        super().__init__(MatchInteraction, db)

    def get_by_user_request_result(
        self,
        *,
        user_id: int,
        request_id: int,
        match_result_id: int,
    ) -> MatchInteraction | None:
        return self.db.scalar(
            select(MatchInteraction).where(
                MatchInteraction.user_id == user_id,
                MatchInteraction.request_id == request_id,
                MatchInteraction.match_result_id == match_result_id,
            )
        )

    def list_by_user_and_request(self, *, user_id: int, request_id: int) -> List[MatchInteraction]:
        return list(
            self.db.scalars(
                select(MatchInteraction).where(
                    MatchInteraction.user_id == user_id,
                    MatchInteraction.request_id == request_id,
                )
            ).all()
        )

    def delete_by_request(self, request_id: int) -> None:
        result_ids = select(MatchResult.id).where(
            or_(
                MatchResult.request_a_id == request_id,
                MatchResult.request_b_id == request_id,
            )
        )
        self.db.execute(
            delete(MatchInteraction).where(
                or_(
                    MatchInteraction.request_id == request_id,
                    MatchInteraction.match_result_id.in_(result_ids),
                )
            )
        )
        self.db.commit()

    def delete_by_user(self, user_id: int) -> None:
        request_ids = select(MatchRequest.id).where(
            or_(
                MatchRequest.sender_id == user_id,
                MatchRequest.receiver_id == user_id,
            )
        )
        result_ids = select(MatchResult.id).where(
            or_(
                MatchResult.request_a_id.in_(request_ids),
                MatchResult.request_b_id.in_(request_ids),
            )
        )
        self.db.execute(
            delete(MatchInteraction).where(
                or_(
                    MatchInteraction.user_id == user_id,
                    MatchInteraction.request_id.in_(request_ids),
                    MatchInteraction.match_result_id.in_(result_ids),
                )
            )
        )
        self.db.commit()
