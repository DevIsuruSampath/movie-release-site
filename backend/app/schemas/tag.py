"""
Tag schemas for API validation
"""
from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List


class TagBase(BaseModel):
    name: str
    slug: str


class TagCreate(TagBase):
    pass


class TagUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None


class TagResponse(BaseModel):
    id: int
    name: str
    slug: str
    created_at: datetime

    class Config:
        from_attributes = True


class TagListResponse(BaseModel):
    items: List[TagResponse]
    total: int
