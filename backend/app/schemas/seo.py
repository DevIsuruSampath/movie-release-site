from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class SEOBase(BaseModel):
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None
    meta_keywords: Optional[str] = None
    canonical_url: Optional[str] = None
    og_title: Optional[str] = None
    og_description: Optional[str] = None
    og_image: Optional[str] = None
    robots: Optional[str] = "index,follow"
    schema_markup: Optional[str] = None


class SEOCreate(SEOBase):
    page_type: str
    page_slug: Optional[str] = None


class SEOUpdate(SEOBase):
    page_type: Optional[str] = None
    page_slug: Optional[str] = None
    is_active: Optional[bool] = None


class SEOResponse(SEOBase):
    id: int
    page_type: str
    page_slug: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
