from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict


class TravelProfileBase(BaseModel):
    travel_style: str
    budget_range: str
    interests: list[str]
    group_size_min: int
    group_size_max: int
    is_discoverable: bool


class TravelProfileUpsert(TravelProfileBase):
    pass


class TravelProfileResponse(TravelProfileBase):
    id: int
    user_id: int

    model_config = ConfigDict(from_attributes=True)


class MatchRequestCreate(BaseModel):
    trip_id: int


class MatchRequestResponse(BaseModel):
    id: int
    trip_id: int
    user_id: int
    status: str
    created_at: datetime


class MatchInteractionUpsert(BaseModel):
    status: str
    note: str | None = None


class MatchInteractionResponse(BaseModel):
    id: int
    request_id: int
    match_result_id: int
    user_id: int
    status: str
    note: str | None
    created_at: datetime
    updated_at: datetime


class MatchResultResponse(BaseModel):
    id: int
    score: float
    breakdown: dict[str, Any]
    matched_trip: dict[str, Any]
    matched_user: dict[str, Any]
    interaction: MatchInteractionResponse | None = None


class OpenMatchRequestResponse(BaseModel):
    request: MatchRequestResponse
    results: list[MatchResultResponse]
