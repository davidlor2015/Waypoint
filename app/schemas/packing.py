from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict


class PackingItemCreate(BaseModel):
    label: str


class PackingItemUpdate(BaseModel):
    label: str | None = None
    checked: bool | None = None


class PackingItemResponse(BaseModel):
    id: int
    trip_id: int
    label: str
    checked: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
