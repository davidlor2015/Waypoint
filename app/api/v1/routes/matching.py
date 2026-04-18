from typing import List

from fastapi import APIRouter, Response

from app.api.deps import CurrentUser, SessionDep
from app.schemas.matching import (
    MatchInteractionUpsert,
    MatchRequestCreate,
    MatchRequestResponse,
    MatchResultResponse,
    OpenMatchRequestResponse,
    TravelProfileResponse,
    TravelProfileUpsert,
)
from app.services.matching_service import MatchingService
from app.services.travel_profile_service import TravelProfileService

router = APIRouter()


@router.post("/profile", response_model=TravelProfileResponse, status_code=201)
def upsert_profile(profile_in: TravelProfileUpsert, db: SessionDep, current_user: CurrentUser):
    return TravelProfileService(db).upsert(current_user.id, profile_in.model_dump())


@router.get("/profile", response_model=TravelProfileResponse)
def read_profile(db: SessionDep, current_user: CurrentUser):
    return TravelProfileService(db).get_one(current_user.id)


@router.post("/requests", response_model=OpenMatchRequestResponse, status_code=201)
def create_match_request(request_in: MatchRequestCreate, db: SessionDep, current_user: CurrentUser):
    return MatchingService(db).open_request(current_user.id, request_in.trip_id)


@router.get("/requests", response_model=List[MatchRequestResponse])
def read_match_requests(db: SessionDep, current_user: CurrentUser):
    return MatchingService(db).list_requests(current_user.id)


@router.delete("/requests/{id}", status_code=204)
def delete_match_request(id: int, db: SessionDep, current_user: CurrentUser):
    MatchingService(db).delete_request(current_user.id, id)
    return Response(status_code=204)


@router.get("/requests/{id}/matches", response_model=List[MatchResultResponse])
def read_match_results(
    id: int,
    db: SessionDep,
    current_user: CurrentUser,
    min_score: float = 0.0,
    limit: int = 100,
    offset: int = 0,
):
    return MatchingService(db).get_matches(
        user_id=current_user.id,
        request_id=id,
        min_score=min_score,
        limit=limit,
        offset=offset,
    )


@router.put("/requests/{id}/matches/{match_result_id}/interaction", response_model=MatchResultResponse)
def update_match_interaction(
    id: int,
    match_result_id: int,
    interaction_in: MatchInteractionUpsert,
    db: SessionDep,
    current_user: CurrentUser,
):
    return MatchingService(db).upsert_match_interaction(
        user_id=current_user.id,
        request_id=id,
        match_result_id=match_result_id,
        status=interaction_in.status,
        note=interaction_in.note,
    )
