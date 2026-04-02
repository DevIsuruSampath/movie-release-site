from sqlalchemy import Boolean, Column, Date, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.config import settings
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
    quality = Column(String(50))
    trailer_url = Column(String(500))
    poster_url = Column(String(500))
    backdrop_url = Column(String(500))
    thumbnail_url = Column(String(500))
    age_rating = Column(String(20))
    content_warning = Column(String(255))
    visibility = Column(String(20), default="public", nullable=False, index=True)
    featured = Column(Boolean, default=False, nullable=False, index=True)
    stream_enabled = Column(Boolean, default=True, nullable=False)
    download_enabled = Column(Boolean, default=True, nullable=False)
    status = Column(String(20), default="draft", nullable=False, index=True)
    is_published = Column(Boolean, default=False, nullable=False, index=True)
    published_at = Column(DateTime(timezone=True))
    meta_title = Column(String(255))
    meta_description = Column(String(500))
    meta_keywords = Column(String(500))
    canonical_url = Column(String(500))
    open_graph_image = Column(String(500))
    robots = Column(String(100), default="index,follow")
    schema_markup = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    categories = relationship("Category", secondary="movie_categories", back_populates="movies")
    tags = relationship("Tag", secondary="movie_tags", back_populates="movies")
    stream_links = relationship(
        "StreamLink",
        back_populates="movie",
        cascade="all, delete-orphan",
        order_by="StreamLink.sort_order",
    )
    download_links = relationship(
        "DownloadLink",
        back_populates="movie",
        cascade="all, delete-orphan",
        order_by="DownloadLink.sort_order",
    )
    subtitles = relationship(
        "Subtitle",
        back_populates="movie",
        cascade="all, delete-orphan",
        order_by="Subtitle.sort_order",
    )
    gallery = relationship(
        "MovieGallery",
        back_populates="movie",
        cascade="all, delete-orphan",
        order_by="MovieGallery.sort_order",
    )
    @property
    def media_url(self) -> str | None:
        first_active_stream = None
        for link in self.stream_links:
            if not link.is_active:
                continue
            if link.is_primary:
                return link.url
            if first_active_stream is None:
                first_active_stream = link
        if first_active_stream is not None:
            return first_active_stream.url

        for link in self.download_links:
            if link.is_active:
                return link.url

        return None

    @staticmethod
    def _storage_source_for_url(url: str | None) -> str | None:
        if not url:
            return None
        if url.startswith("/uploads/"):
            return "local"
        if settings.SUPABASE_URL:
            prefix = f"{settings.SUPABASE_URL.rstrip('/')}/storage/v1/object/public/"
            if url.startswith(prefix):
                return "supabase"
        return None

    @property
    def media_storage_summary(self) -> dict[str, dict[str, str | int | None]]:
        summary: dict[str, dict[str, str | int | None]] = {}
        for role, url in (
            ("poster", self.poster_url),
            ("backdrop", self.backdrop_url),
            ("thumbnail", self.thumbnail_url),
            ("other", self.open_graph_image),
        ):
            storage_source = self._storage_source_for_url(url)
            if not storage_source:
                continue
            summary[role] = {
                "storage_source": storage_source,
                "public_url": url,
            }
        return summary


class StreamLink(Base):
    __tablename__ = "stream_links"

    id = Column(Integer, primary_key=True, index=True)
    movie_id = Column(Integer, ForeignKey("movies.id", ondelete="CASCADE"), nullable=False, index=True)
    server_name = Column(String(100), nullable=False)
    url = Column(String(500), nullable=False)
    quality = Column(String(50))
    language = Column(String(50))
    is_active = Column(Boolean, default=True, nullable=False)
    is_primary = Column(Boolean, default=False, nullable=False)
    sort_order = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    movie = relationship("Movie", back_populates="stream_links")


class DownloadLink(Base):
    __tablename__ = "download_links"

    id = Column(Integer, primary_key=True, index=True)
    movie_id = Column(Integer, ForeignKey("movies.id", ondelete="CASCADE"), nullable=False, index=True)
    provider = Column(String(100), nullable=False)
    url = Column(String(500), nullable=False)
    quality = Column(String(50))
    size = Column(String(50))
    language = Column(String(50))
    is_active = Column(Boolean, default=True, nullable=False)
    sort_order = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    movie = relationship("Movie", back_populates="download_links")


class MovieGallery(Base):
    __tablename__ = "movie_gallery"

    id = Column(Integer, primary_key=True, index=True)
    movie_id = Column(Integer, ForeignKey("movies.id", ondelete="CASCADE"), nullable=False, index=True)
    image_url = Column(String(500), nullable=False)
    image_type = Column(String(50), default="gallery", nullable=False)
    sort_order = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    movie = relationship("Movie", back_populates="gallery")
