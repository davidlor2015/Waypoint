from typing import Generic, TypeVar, Type, Optional
from sqlalchemy.orm import Session
from sqlalchemy import select

ModelType = TypeVar("ModelType")


class BaseRepository(Generic[ModelType]):
    """
    Generic base repository providing common DB operations for any ORM model.

    Subclasses call super().__init__(ModelClass, db) and inherit
    get_by_id, add, and delete without repeating boilerplate.
    """

    def __init__(self, model: Type[ModelType], db: Session):
        self.model = model
        self.db = db


    def get_by_id(self, id: int) -> Optional[ModelType]:
        return self.db.get(self.model, id)

    def add(self, obj: ModelType) -> ModelType:
        self.db.add(obj)
        self.db.commit()
        self.db.refresh(obj)
        return obj

    def delete(self, obj: ModelType) -> None:
        self.db.delete(obj)
        self.db.commit()
        
