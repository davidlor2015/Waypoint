from typing import Optional

from fastapi import APIRouter, HTTPException, Response
from pydantic import BaseModel

from app.api.deps import CurrentUser, SessionDep
from app.models.budget_expense import BudgetExpense
from app.models.trip import Trip
from app.schemas.budget import BudgetExpenseCreate, BudgetExpenseUpdate, BudgetExpenseResponse, BudgetResponse

router = APIRouter()


class BudgetLimitUpdate(BaseModel):
    limit: Optional[float] = None


def _get_trip(trip_id: int, user_id: int, db: SessionDep) -> Trip:
    trip = db.get(Trip, trip_id)
    if not trip or trip.user_id != user_id:
        raise HTTPException(status_code=404, detail="Trip not found")
    return trip


@router.get("/", response_model=BudgetResponse)
def get_budget(trip_id: int, db: SessionDep, current_user: CurrentUser):
    trip = _get_trip(trip_id, current_user.id, db)
    expenses = db.query(BudgetExpense).filter(BudgetExpense.trip_id == trip_id).all()
    return BudgetResponse(limit=trip.budget_limit, expenses=expenses)


@router.patch("/limit", response_model=BudgetResponse)
def update_budget_limit(
    trip_id: int, body: BudgetLimitUpdate, db: SessionDep, current_user: CurrentUser
):
    trip = _get_trip(trip_id, current_user.id, db)
    trip.budget_limit = body.limit
    db.commit()
    db.refresh(trip)
    expenses = db.query(BudgetExpense).filter(BudgetExpense.trip_id == trip_id).all()
    return BudgetResponse(limit=trip.budget_limit, expenses=expenses)


@router.post("/expenses", response_model=BudgetExpenseResponse, status_code=201)
def create_expense(
    trip_id: int, expense_in: BudgetExpenseCreate, db: SessionDep, current_user: CurrentUser
):
    _get_trip(trip_id, current_user.id, db)
    expense = BudgetExpense(
        trip_id=trip_id,
        label=expense_in.label,
        amount=expense_in.amount,
        category=expense_in.category,
    )
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return expense


@router.patch("/expenses/{expense_id}", response_model=BudgetExpenseResponse)
def update_expense(
    trip_id: int,
    expense_id: int,
    expense_in: BudgetExpenseUpdate,
    db: SessionDep,
    current_user: CurrentUser,
):
    _get_trip(trip_id, current_user.id, db)
    expense = db.get(BudgetExpense, expense_id)
    if not expense or expense.trip_id != trip_id:
        raise HTTPException(status_code=404, detail="Expense not found")
    if expense_in.label is not None:
        expense.label = expense_in.label
    if expense_in.amount is not None:
        expense.amount = expense_in.amount
    if expense_in.category is not None:
        expense.category = expense_in.category
    db.commit()
    db.refresh(expense)
    return expense


@router.delete("/expenses/{expense_id}", status_code=204)
def delete_expense(
    trip_id: int, expense_id: int, db: SessionDep, current_user: CurrentUser
):
    _get_trip(trip_id, current_user.id, db)
    expense = db.get(BudgetExpense, expense_id)
    if not expense or expense.trip_id != trip_id:
        raise HTTPException(status_code=404, detail="Expense not found")
    db.delete(expense)
    db.commit()
    return Response(status_code=204)
