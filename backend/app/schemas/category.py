from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List

class CategoryBase(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None

class CategoryCreate(CategoryBase):
    pass

class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None

class CategoryResponse(BaseModel):
    id: int
    name: str
    slug: str
    description: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class CategoryListResponse(BaseModel):
    items: List[CategoryResponse]
    total: int
