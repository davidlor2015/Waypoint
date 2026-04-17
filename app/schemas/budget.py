from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict


class BudgetExpenseCreate(BaseModel):
    label: str
    amount: float
    category: str


class BudgetExpenseUpdate(BaseModel):
    label: str | None = None
    amount: float | None = None
    category: str | None = None


class BudgetExpenseResponse(BaseModel):
    id: int
    trip_id: int
    label: str
    amount: float
    category: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class BudgetResponse(BaseModel):
    limit: float | None
    expenses: list[BudgetExpenseResponse]
