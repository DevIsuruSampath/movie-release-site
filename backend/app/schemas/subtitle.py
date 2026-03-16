"""
Subtitle schemas for API validation
"""
from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List


class SubtitleBase(BaseModel):
    language: str
    language_code: str
    url: str
    format: str = "srt"
    is_default: bool = False
    sort_order: int = 0


class SubtitleCreate(SubtitleBase):
    movie_id: int


class SubtitleUpdate(BaseModel):
    language: Optional[str] = None
    language_code: Optional[str] = None
    url: Optional[str] = None
    format: Optional[str] = None
    is_default: Optional[bool] = None
    sort_order: Optional[int] = None


class SubtitleResponse(BaseModel):
    id: int
    movie_id: int
    language: str
    language_code: str
    url: str
    format: str
    is_default: bool
    sort_order: int
    created_at: datetime

    class Config:
        from_attributes = True
