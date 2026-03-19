from __future__ import annotations

from datetime import date, datetime
from typing import List, Optional

from pydantic import BaseModel

from app.schemas.category import CategoryResponse
from app.schemas.tag import TagResponse


class MovieStatus(str):
    DRAFT = "draft"
    PUBLISHED = "published"


class MovieGalleryResponse(BaseModel):
    id: int
    movie_id: int
    image_url: str
    image_type: str
    sort_order: int

    class Config:
        from_attributes = True


class StreamLinkBase(BaseModel):
    server_name: str
    url: str
    quality: Optional[str] = None
    language: Optional[str] = None
    is_active: bool = True
    is_primary: bool = False
    sort_order: int = 0


class StreamLinkCreate(StreamLinkBase):
    pass


class StreamLinkUpdate(BaseModel):
    server_name: Optional[str] = None
    url: Optional[str] = None
    quality: Optional[str] = None
    language: Optional[str] = None
    is_active: Optional[bool] = None
    is_primary: Optional[bool] = None
    sort_order: Optional[int] = None


class StreamLinkResponse(StreamLinkBase):
    id: int
    movie_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class DownloadLinkBase(BaseModel):
    provider: str
    url: str
    quality: Optional[str] = None
    size: Optional[str] = None
    language: Optional[str] = None
    is_active: bool = True
    sort_order: int = 0


class DownloadLinkCreate(DownloadLinkBase):
    pass


class DownloadLinkUpdate(BaseModel):
    provider: Optional[str] = None
    url: Optional[str] = None
    quality: Optional[str] = None
    size: Optional[str] = None
    language: Optional[str] = None
    is_active: Optional[bool] = None
    sort_order: Optional[int] = None


class DownloadLinkResponse(DownloadLinkBase):
    id: int
    movie_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class SubtitleInline(BaseModel):
    id: Optional[int] = None
    language: str
    label: str
    file_url: str
    format: str = "srt"
    is_default: bool = False
    sort_order: int = 0


class StreamLinkInline(StreamLinkBase):
    id: Optional[int] = None


class DownloadLinkInline(DownloadLinkBase):
    id: Optional[int] = None


class MovieBase(BaseModel):
    title: str
    slug: Optional[str] = None
    original_title: Optional[str] = None
    description: Optional[str] = None
    short_description: Optional[str] = None
    release_year: Optional[int] = None
    release_date: Optional[date] = None
    duration_minutes: Optional[int] = None
    language: Optional[str] = None
    country: Optional[str] = None
    imdb_rating: Optional[float] = None
    quality: Optional[str] = None
    trailer_url: Optional[str] = None
    poster_url: Optional[str] = None
    backdrop_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    age_rating: Optional[str] = None
    content_warning: Optional[str] = None
    visibility: str = "public"
    featured: bool = False
    stream_enabled: bool = True
    download_enabled: bool = True
    is_published: bool = False
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None
    meta_keywords: Optional[str] = None
    canonical_url: Optional[str] = None
    open_graph_image: Optional[str] = None
    robots: Optional[str] = "index,follow"
    schema_markup: Optional[str] = None


class MovieCreate(MovieBase):
    category_ids: List[int] = []
    tag_ids: List[int] = []
    subtitles: List[SubtitleInline] = []
    stream_links: List[StreamLinkInline] = []
    download_links: List[DownloadLinkInline] = []


class MovieUpdate(BaseModel):
    title: Optional[str] = None
    slug: Optional[str] = None
    original_title: Optional[str] = None
    description: Optional[str] = None
    short_description: Optional[str] = None
    release_year: Optional[int] = None
    release_date: Optional[date] = None
    duration_minutes: Optional[int] = None
    language: Optional[str] = None
    country: Optional[str] = None
    imdb_rating: Optional[float] = None
    quality: Optional[str] = None
    trailer_url: Optional[str] = None
    poster_url: Optional[str] = None
    backdrop_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    age_rating: Optional[str] = None
    content_warning: Optional[str] = None
    visibility: Optional[str] = None
    featured: Optional[bool] = None
    stream_enabled: Optional[bool] = None
    download_enabled: Optional[bool] = None
    is_published: Optional[bool] = None
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None
    meta_keywords: Optional[str] = None
    canonical_url: Optional[str] = None
    open_graph_image: Optional[str] = None
    robots: Optional[str] = None
    schema_markup: Optional[str] = None
    category_ids: Optional[List[int]] = None
    tag_ids: Optional[List[int]] = None
    subtitles: Optional[List[SubtitleInline]] = None
    stream_links: Optional[List[StreamLinkInline]] = None
    download_links: Optional[List[DownloadLinkInline]] = None


class MovieResponse(MovieBase):
    id: int
    slug: str
    status: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    published_at: Optional[datetime] = None
    categories: List[CategoryResponse] = []
    tags: List[TagResponse] = []
    subtitles: List["SubtitleResponseLight"] = []
    stream_links: List[StreamLinkResponse] = []
    download_links: List[DownloadLinkResponse] = []
    gallery: List[MovieGalleryResponse] = []

    class Config:
        from_attributes = True


class SubtitleResponseLight(BaseModel):
    id: int
    movie_id: int
    language: str
    label: str
    file_url: str
    format: str
    is_default: bool
    sort_order: int

    class Config:
        from_attributes = True


class MovieListResponse(BaseModel):
    items: List[MovieResponse]
    total: int
    page: int
    pages: int


class MovieDashboardItem(BaseModel):
    id: int
    title: str
    slug: str
    poster_url: Optional[str] = None
    status: str
    is_published: bool
    created_at: datetime

    class Config:
        from_attributes = True


MovieResponse.model_rebuild()
