from sqlalchemy import Boolean, Column, Date, DateTime, Float, ForeignKey, Integer, String, Text
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
    telegram_post_logs = relationship(
        "TelegramPostLog",
        back_populates="movie",
        cascade="all, delete-orphan",
        order_by="TelegramPostLog.created_at.desc()",
    )
    telegram_media_cache = relationship(
        "TelegramMediaCache",
        back_populates="movie",
        cascade="all, delete-orphan",
        order_by="TelegramMediaCache.created_at.desc()",
    )

    @property
    def media_url(self) -> str | None:
        active_streams = [link for link in self.stream_links if link.is_active]
        if active_streams:
            primary_stream = next((link for link in active_streams if link.is_primary), active_streams[0])
            return primary_stream.url

        active_downloads = [link for link in self.download_links if link.is_active]
        if active_downloads:
            return active_downloads[0].url

        return None

    @property
    def telegram_last_log(self):
        return self.telegram_post_logs[0] if self.telegram_post_logs else None

    @property
    def telegram_last_post_status(self) -> str | None:
        return self.telegram_last_log.status if self.telegram_last_log else None

    @property
    def telegram_last_error_message(self) -> str | None:
        return self.telegram_last_log.error_message if self.telegram_last_log else None

    @property
    def telegram_last_sent_at(self):
        return self.telegram_last_log.sent_at if self.telegram_last_log else None

    @property
    def telegram_last_log_id(self) -> int | None:
        return self.telegram_last_log.id if self.telegram_last_log else None


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
