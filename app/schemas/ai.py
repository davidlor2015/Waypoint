
from pydantic import BaseModel, Field, ConfigDict, field_validator
from typing import List, Optional, Any

class ItineraryItem(BaseModel):
    model_config = ConfigDict(extra="ignore")

    time: Optional[str] = Field(None, description="Approximate time, e.g., '09:00AM' or 'Morning'")
    title: str = Field(..., description="Name of the activity")
    location: Optional[str] = None
    notes: Optional[str] = Field(None, description="Short description or tip")
    cost_estimate: Optional[str] = Field(None, description="e.g. '$20' or 'Free'")

    @field_validator("cost_estimate", mode="before")
    @classmethod
    def coerce_cost_to_str(cls, v: Any) -> Optional[str]:
        if v is None:
            return None
        return str(v) if not isinstance(v, str) else v

class DayPlan(BaseModel):
    model_config = ConfigDict(extra="ignore")

    day_number: int
    date: Optional[str] = None
    items: List[ItineraryItem] = []

class ItineraryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, extra="ignore")

    title: str = Field(..., description="A catchy title for this itinerary")
    summary: str = Field(..., description="A brief overview of the trip")
    days: List[DayPlan]

    @field_validator("days", mode="before")
    @classmethod
    def filter_invalid_days(cls, v: Any) -> List[Any]:
        if not isinstance(v, list):
            return v
        return [item for item in v if isinstance(item, dict) and "day_number" in item]
    budget_breakdown: Optional[dict[str, str]] = Field(None, description="Key-value pairs of budget categories")
    packing_list: Optional[List[str]] = None
    tips: Optional[List[str]] = None

    @field_validator("tips", mode="before")
    @classmethod
    def coerce_tips_to_list(cls, v: Any) -> Optional[List[str]]:
        if v is None:
            return None
        if isinstance(v, str):
            return [v]
        return v

    @field_validator("budget_breakdown", mode="before")
    @classmethod
    def coerce_budget_values_to_str(cls, v: Any) -> Optional[dict]:
        if v is None:
            return None
        if isinstance(v, dict):
            return {k: str(val) for k, val in v.items()}
        return v

class AIPlanRequest(BaseModel):

    trip_id: int

    interests_override: Optional[str] = None
    budget_override: Optional[str] = None

class AIApplyRequest(BaseModel):

    trip_id: int

    itinerary: ItineraryResponse


