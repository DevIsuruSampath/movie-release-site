from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel


class SubtitleBase(BaseModel):
    language: str
    label: str
    file_url: str
    format: str = "srt"
    is_default: bool = False
    sort_order: int = 0


class SubtitleCreate(SubtitleBase):
    pass


class SubtitleUpdate(BaseModel):
    language: Optional[str] = None
    label: Optional[str] = None
    file_url: Optional[str] = None
    format: Optional[str] = None
    is_default: Optional[bool] = None
    sort_order: Optional[int] = None


class SubtitleResponse(SubtitleBase):
    id: int
    movie_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class SubtitleListResponse(BaseModel):
    items: List[SubtitleResponse]
    total: int
