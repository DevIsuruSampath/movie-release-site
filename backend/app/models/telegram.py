from sqlalchemy import JSON, Boolean, Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.models import Base


class TelegramSettings(Base):
    __tablename__ = "telegram_settings"

    id = Column(Integer, primary_key=True, index=True)
    is_enabled = Column(Boolean, default=False, nullable=False)
    bot_token_encrypted = Column(Text, nullable=True)
    bot_username = Column(String(255), nullable=True)
    channel_id = Column(String(255), nullable=True)
    channel_username = Column(String(255), nullable=True)
    channel_title = Column(String(255), nullable=True)
    channel_invite_link = Column(String(500), nullable=True)
    auto_post_on_publish = Column(Boolean, default=False, nullable=False)
    auto_post_on_update = Column(Boolean, default=False, nullable=False)
    caption_template = Column(Text, nullable=True)
    button_text = Column(String(255), nullable=True)
    default_hashtags = Column(String(500), nullable=True)
    send_poster_mode = Column(String(20), default="photo", nullable=False)
    parse_mode = Column(String(20), nullable=True)
    disable_web_page_preview = Column(Boolean, default=False, nullable=False)
    test_status = Column(String(50), nullable=True)
    last_tested_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class TelegramPostLog(Base):
    __tablename__ = "telegram_post_logs"

    id = Column(Integer, primary_key=True, index=True)
    movie_id = Column(Integer, ForeignKey("movies.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(String(20), nullable=False, default="pending", index=True)
    telegram_chat_id = Column(String(255), nullable=True)
    telegram_message_id = Column(String(255), nullable=True)
    request_payload_json = Column(JSON, nullable=True)
    response_payload_json = Column(JSON, nullable=True)
    error_message = Column(Text, nullable=True)
    retry_count = Column(Integer, nullable=False, default=0)
    sent_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    movie = relationship("Movie", back_populates="telegram_post_logs")


class TelegramMediaCache(Base):
    __tablename__ = "telegram_media_cache"

    id = Column(Integer, primary_key=True, index=True)
    movie_id = Column(Integer, ForeignKey("movies.id", ondelete="CASCADE"), nullable=False, index=True)
    telegram_file_id = Column(String(255), nullable=False)
    media_type = Column(String(50), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    movie = relationship("Movie", back_populates="telegram_media_cache")
