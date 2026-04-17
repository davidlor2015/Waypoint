from typing import List

from fastapi import APIRouter, HTTPException, Response

from app.api.deps import CurrentUser, SessionDep
from app.models.packing_item import PackingItem
from app.models.trip import Trip
from app.schemas.packing import PackingItemCreate, PackingItemUpdate, PackingItemResponse

router = APIRouter()


def _get_trip(trip_id: int, user_id: int, db: SessionDep) -> Trip:
    trip = db.get(Trip, trip_id)
    if not trip or trip.user_id != user_id:
        raise HTTPException(status_code=404, detail="Trip not found")
    return trip


@router.get("/", response_model=List[PackingItemResponse])
def list_packing_items(trip_id: int, db: SessionDep, current_user: CurrentUser):
    _get_trip(trip_id, current_user.id, db)
    return db.query(PackingItem).filter(PackingItem.trip_id == trip_id).all()


@router.post("/", response_model=PackingItemResponse, status_code=201)
def create_packing_item(
    trip_id: int, item_in: PackingItemCreate, db: SessionDep, current_user: CurrentUser
):
    _get_trip(trip_id, current_user.id, db)
    item = PackingItem(trip_id=trip_id, label=item_in.label)
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.patch("/{item_id}", response_model=PackingItemResponse)
def update_packing_item(
    trip_id: int,
    item_id: int,
    item_in: PackingItemUpdate,
    db: SessionDep,
    current_user: CurrentUser,
):
    _get_trip(trip_id, current_user.id, db)
    item = db.get(PackingItem, item_id)
    if not item or item.trip_id != trip_id:
        raise HTTPException(status_code=404, detail="Packing item not found")
    if item_in.label is not None:
        item.label = item_in.label
    if item_in.checked is not None:
        item.checked = item_in.checked
    db.commit()
    db.refresh(item)
    return item


@router.delete("/{item_id}", status_code=204)
def delete_packing_item(
    trip_id: int, item_id: int, db: SessionDep, current_user: CurrentUser
):
    _get_trip(trip_id, current_user.id, db)
    item = db.get(PackingItem, item_id)
    if not item or item.trip_id != trip_id:
        raise HTTPException(status_code=404, detail="Packing item not found")
    db.delete(item)
    db.commit()
    return Response(status_code=204)
