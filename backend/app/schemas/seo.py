"""
SEO Metadata schemas for API validation
"""
from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class SEOBase(BaseModel):
    page_type: str
    page_slug: Optional[str] = None
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None
    meta_keywords: Optional[str] = None
    canonical_url: Optional[str] = None
    og_title: Optional[str] = None
    og_description: Optional[str] = None
    og_image: Optional[str] = None
    twitter_card: Optional[str] = "summary_large_image"
    twitter_title: Optional[str] = None
    twitter_description: Optional[str] = None
    twitter_image: Optional[str] = None
    robots_index: bool = True
    robots_follow: bool = True
    schema_markup: Optional[str] = None


class SEOCreate(SEOBase):
    pass


class SEOUpdate(BaseModel):
    page_type: Optional[str] = None
    page_slug: Optional[str] = None
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None
    meta_keywords: Optional[str] = None
    canonical_url: Optional[str] = None
    og_title: Optional[str] = None
    og_description: Optional[str] = None
    og_image: Optional[str] = None
    twitter_card: Optional[str] = None
    twitter_title: Optional[str] = None
    twitter_description: Optional[str] = None
    twitter_image: Optional[str] = None
    robots_index: Optional[bool] = None
    robots_follow: Optional[bool] = None
    schema_markup: Optional[str] = None


class SEOResponse(BaseModel):
    id: int
    page_type: str
    page_slug: Optional[str] = None
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None
    meta_keywords: Optional[str] = None
    canonical_url: Optional[str] = None
    og_title: Optional[str] = None
    og_description: Optional[str] = None
    og_image: Optional[str] = None
    twitter_card: Optional[str] = None
    twitter_title: Optional[str] = None
    twitter_description: Optional[str] = None
    twitter_image: Optional[str] = None
    robots_index: bool
    robots_follow: bool
    schema_markup: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
