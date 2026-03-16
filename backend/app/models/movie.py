"""
Movie-related models
"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Date, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.models import Base


class Movie(Base):
    __tablename__ = "movies"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False, index=True)
    slug = Column(String(255), unique=True, nullable=False, index=True)
    original_title = Column(String(255))
    description = Column(Text)
    short_description = Column(String(500))
    release_year = Column(Integer, index=True)
    release_date = Column(Date)
    duration_minutes = Column(Integer)
    language = Column(String(100), index=True)
    country = Column(String(100))
    imdb_rating = Column(Float)
    
    # Media URLs
    poster_url = Column(String(500))
    backdrop_url = Column(String(500))
    thumbnail_url = Column(String(500))
    trailer_url = Column(String(500))
    
    # Classification
    age_rating = Column(String(10), index=True)
    content_warning = Column(String(255))
    
    # Status and visibility
    visibility = Column(String(20), default="public", index=True)  # public, private, draft
    featured = Column(Boolean, default=False, index=True)
    stream_enabled = Column(Boolean, default=True)
    download_enabled = Column(Boolean, default=True)
    status = Column(String(20), default="draft", index=True)  # draft, published, scheduled
    published_at = Column(DateTime(timezone=True))
    
    # SEO fields
    meta_title = Column(String(255))
    meta_description = Column(String(500))
    meta_keywords = Column(String(500))
    canonical_url = Column(String(500))
    open_graph_image = Column(String(500))
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    stream_links = relationship("StreamLink", back_populates="movie", cascade="all, delete-orphan", order_by="StreamLink.sort_order")
    download_links = relationship("DownloadLink", back_populates="movie", cascade="all, delete-orphan", order_by="DownloadLink.sort_order")
    gallery = relationship("MovieGallery", back_populates="movie", cascade="all, delete-orphan", order_by="MovieGallery.sort_order")
    categories = relationship("Category", secondary="movie_categories", back_populates="movies")
    tags = relationship("Tag", secondary="movie_tags", back_populates="movies")
    subtitles = relationship("Subtitle", back_populates="movie", cascade="all, delete-orphan")


class StreamLink(Base):
    __tablename__ = "stream_links"
    
    id = Column(Integer, primary_key=True, index=True)
    movie_id = Column(Integer, ForeignKey("movies.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(100))
    url = Column(String(500), nullable=False)
    is_primary = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    sort_order = Column(Integer, default=0)
    region_note = Column(String(255))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    movie = relationship("Movie", back_populates="stream_links")


class DownloadLink(Base):
    __tablename__ = "download_links"
    
    id = Column(Integer, primary_key=True, index=True)
    movie_id = Column(Integer, ForeignKey("movies.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(100))
    url = Column(String(500), nullable=False)
    quality = Column(String(50), index=True)  # 720p, 1080p, 4K, etc.
    file_size = Column(String(50))  # e.g., "1.5 GB"
    is_active = Column(Boolean, default=True)
    sort_order = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    movie = relationship("Movie", back_populates="download_links")


class MovieGallery(Base):
    __tablename__ = "movie_gallery"
    
    id = Column(Integer, primary_key=True, index=True)
    movie_id = Column(Integer, ForeignKey("movies.id", ondelete="CASCADE"), nullable=False)
    image_url = Column(String(500), nullable=False)
    image_type = Column(String(50), default="gallery")  # gallery, screenshot, etc.
    sort_order = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    movie = relationship("Movie", back_populates="gallery")
