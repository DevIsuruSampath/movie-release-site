"""
Pydantic schemas for API validation
"""
from app.schemas.user import UserBase, UserCreate, UserLogin, UserResponse, TokenResponse
from app.schemas.category import CategoryBase, CategoryCreate, CategoryUpdate, CategoryResponse, CategoryListResponse
from app.schemas.movie import (
    MovieBase, MovieCreate, MovieUpdate, MovieResponse, MovieListResponse,
    StreamLinkBase, StreamLinkCreate, StreamLinkUpdate, StreamLinkResponse,
    DownloadLinkBase, DownloadLinkCreate, DownloadLinkUpdate, DownloadLinkResponse,
    MovieGalleryResponse
)
from app.schemas.tag import TagBase, TagCreate, TagUpdate, TagResponse, TagListResponse
from app.schemas.seo import SEOBase, SEOCreate, SEOUpdate, SEOResponse

__all__ = [
    # User schemas
    "UserBase", "UserCreate", "UserLogin", "UserResponse", "TokenResponse",
    # Category schemas
    "CategoryBase", "CategoryCreate", "CategoryUpdate", "CategoryResponse", "CategoryListResponse",
    # Movie schemas
    "MovieBase", "MovieCreate", "MovieUpdate", "MovieResponse", "MovieListResponse",
    "StreamLinkBase", "StreamLinkCreate", "StreamLinkUpdate", "StreamLinkResponse",
    "DownloadLinkBase", "DownloadLinkCreate", "DownloadLinkUpdate", "DownloadLinkResponse",
    "MovieGalleryResponse",
    # Tag schemas
    "TagBase", "TagCreate", "TagUpdate", "TagResponse", "TagListResponse",
    # SEO schemas
    "SEOBase", "SEOCreate", "SEOUpdate", "SEOResponse",
]
