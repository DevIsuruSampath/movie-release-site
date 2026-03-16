from pydantic import BaseModel, HttpUrl
from datetime import datetime, date
from typing import Optional, List
from enum import Enum

class MovieStatus(str, Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    SCHEDULED = "scheduled"

class MovieBase(BaseModel):
    title: str
    slug: str
    original_title: Optional[str] = None
    description: Optional[str] = None
    short_description: Optional[str] = None
    release_year: Optional[int] = None
    release_date: Optional[date] = None
    duration_minutes: Optional[int] = None
    language: Optional[str] = None
    country: Optional[str] = None
    imdb_rating: Optional[float] = None
    trailer_url: Optional[str] = None
    age_rating: Optional[str] = None
    content_warning: Optional[str] = None
    visibility: str = "public"
    featured: bool = False
    stream_enabled: bool = True
    download_enabled: bool = True
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None
    meta_keywords: Optional[str] = None
    canonical_url: Optional[str] = None
    open_graph_image: Optional[str] = None

class MovieCreate(MovieBase):
    category_ids: List[int] = []
    tag_ids: List[int] = []

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
    trailer_url: Optional[str] = None
    age_rating: Optional[str] = None
    content_warning: Optional[str] = None
    visibility: Optional[str] = None
    featured: Optional[bool] = None
    stream_enabled: Optional[bool] = None
    download_enabled: Optional[bool] = None
    poster_url: Optional[str] = None
    backdrop_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None
    meta_keywords: Optional[str] = None
    canonical_url: Optional[str] = None
    open_graph_image: Optional[str] = None
    status: Optional[str] = None

class MovieResponse(BaseModel):
    id: int
    title: str
    slug: str
    original_title: Optional[str] = None
    description: Optional[str] = None
    short_description: Optional[str] = None
    release_year: Optional[int] = None
    release_date: Optional[date] = None
    duration_minutes: Optional[int] = None
    language: Optional[str] = None
    country: Optional[str] = None
    imdb_rating: Optional[float] = None
    trailer_url: Optional[str] = None
    poster_url: Optional[str] = None
    backdrop_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    age_rating: Optional[str] = None
    content_warning: Optional[str] = None
    visibility: str
    featured: bool
    stream_enabled: bool
    download_enabled: bool
    status: str
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None
    meta_keywords: Optional[str] = None
    canonical_url: Optional[str] = None
    open_graph_image: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    published_at: Optional[datetime] = None
    categories: List["CategoryResponse"] = []

    class Config:
        from_attributes = True

class MovieListResponse(BaseModel):
    items: List[MovieResponse]
    total: int
    page: int
    pages: int

class StreamLinkBase(BaseModel):
    title: str
    url: str
    is_primary: bool = False
    is_active: bool = True
    sort_order: int = 0
    region_note: Optional[str] = None

class StreamLinkCreate(StreamLinkBase):
    movie_id: int

class StreamLinkUpdate(BaseModel):
    title: Optional[str] = None
    url: Optional[str] = None
    is_primary: Optional[bool] = None
    is_active: Optional[bool] = None
    sort_order: Optional[int] = None
    region_note: Optional[str] = None

class StreamLinkResponse(BaseModel):
    id: int
    movie_id: int
    title: str
    url: str
    is_primary: bool
    is_active: bool
    sort_order: int
    region_note: Optional[str] = None

    class Config:
        from_attributes = True

class DownloadLinkBase(BaseModel):
    title: str
    url: str
    quality: str = "1080p"
    file_size: Optional[str] = None
    is_active: bool = True
    sort_order: int = 0

class DownloadLinkCreate(DownloadLinkBase):
    movie_id: int

class DownloadLinkUpdate(BaseModel):
    title: Optional[str] = None
    url: Optional[str] = None
    quality: Optional[str] = None
    file_size: Optional[str] = None
    is_active: Optional[bool] = None
    sort_order: Optional[int] = None

class DownloadLinkResponse(BaseModel):
    id: int
    movie_id: int
    title: str
    url: str
    quality: str
    file_size: Optional[str] = None
    is_active: bool
    sort_order: int

    class Config:
        from_attributes = True

class MovieGalleryCreate(BaseModel):
    movie_id: int
    image_url: str
    image_type: str = "gallery"
    sort_order: int = 0

class MovieGalleryResponse(BaseModel):
    id: int
    movie_id: int
    image_url: str
    image_type: str
    sort_order: int

    class Config:
        from_attributes = True
