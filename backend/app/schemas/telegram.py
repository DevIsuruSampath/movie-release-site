from __future__ import annotations

from datetime import datetime
from typing import Any, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator


TelegramSendPosterMode = Literal["photo", "document", "text_only"]
TelegramParseMode = Literal["HTML", "MarkdownV2", "None"]
TelegramLogStatus = Literal["pending", "sent", "failed"]
TelegramStorageMode = Literal["local_only", "telegram_only", "hybrid"]
TelegramSendMode = Literal["bot_api", "pyrofork"]


class TelegramSettingsUpdate(BaseModel):
    is_enabled: bool = False
    api_id: Optional[str] = None
    api_hash: Optional[str] = None
    bot_token: Optional[str] = None
    private_channel_id: str | None = Field(default=None, min_length=1, max_length=255)
    private_channel_username: Optional[str] = None
    private_channel_title: Optional[str] = None
    private_channel_invite_link: Optional[str] = None
    auto_post_on_publish: bool = False
    auto_post_on_update: bool = False
    enable_telegram_storage: bool = False
    telegram_storage_mode: TelegramStorageMode = "local_only"
    caption_template: Optional[str] = None
    button_text: Optional[str] = None
    default_hashtags: Optional[str] = None
    send_poster_mode: TelegramSendPosterMode = "photo"
    parse_mode: TelegramParseMode = "HTML"
    disable_web_page_preview: bool = False

    @field_validator("api_id")
    @classmethod
    def validate_api_id(cls, value: str | None) -> str | None:
        if value is None:
            return value
        normalized = value.strip()
        if not normalized:
            return None
        if not normalized.isdigit():
            raise ValueError("API ID must be numeric")
        return normalized

    @field_validator("api_hash")
    @classmethod
    def validate_api_hash(cls, value: str | None) -> str | None:
        if value is None:
            return value
        normalized = value.strip()
        if not normalized:
            return None
        if len(normalized) < 8:
            raise ValueError("API hash format is invalid")
        return normalized

    @field_validator("bot_token")
    @classmethod
    def validate_bot_token(cls, value: str | None) -> str | None:
        if value is None:
            return value
        normalized = value.strip()
        if not normalized:
            return None
        if ":" not in normalized:
            raise ValueError("Bot token format is invalid")
        return normalized

    @field_validator("private_channel_id")
    @classmethod
    def validate_channel_id(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = value.strip()
        if not normalized:
            return None
        if not normalized.startswith("-100"):
            raise ValueError("Private channel ID must start with -100")
        return normalized

    @field_validator(
        "private_channel_username",
        "private_channel_title",
        "private_channel_invite_link",
        "caption_template",
        "button_text",
        "default_hashtags",
    )
    @classmethod
    def strip_optional_strings(cls, value: str | None) -> str | None:
        if value is None:
            return value
        normalized = value.strip()
        return normalized or None


class TelegramSettingsResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int | None = None
    is_enabled: bool
    has_api_id: bool
    has_api_hash: bool
    has_bot_token: bool
    api_id_masked: str | None = None
    api_hash_masked: str | None = None
    bot_token_masked: str | None = None
    bot_username: str | None = None
    private_channel_id: str | None = None
    private_channel_username: str | None = None
    private_channel_title: str | None = None
    private_channel_invite_link: str | None = None
    auto_post_on_publish: bool
    auto_post_on_update: bool
    enable_telegram_storage: bool
    telegram_storage_mode: TelegramStorageMode
    caption_template: str | None = None
    button_text: str | None = None
    default_hashtags: str | None = None
    send_poster_mode: TelegramSendPosterMode
    parse_mode: TelegramParseMode | None = None
    disable_web_page_preview: bool
    test_status: str | None = None
    last_tested_at: datetime | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None
    storage_stats: dict[str, int] | None = None


class TelegramTestResponse(BaseModel):
    ok: bool
    message: str
    bot_username: str | None = None
    private_channel_title: str | None = None
    private_channel_id: str | None = None
    details: dict[str, Any] | None = None


class TelegramValidateChannelResponse(BaseModel):
    ok: bool
    message: str
    private_channel_title: str | None = None
    private_channel_username: str | None = None
    private_channel_id: str | None = None
    bot_username: str | None = None
    details: dict[str, Any] | None = None


class TelegramSendRequest(BaseModel):
    force_resend: bool = False


class TelegramSendResponse(BaseModel):
    ok: bool
    status: TelegramLogStatus
    log_id: int
    telegram_chat_id: str | None = None
    telegram_message_id: str | None = None
    error_message: str | None = None
    response_payload_json: dict[str, Any] | None = None
    send_mode: TelegramSendMode | None = None
    used_cached_media: bool = False


class TelegramPostLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    movie_id: int
    movie_title: str | None = None
    status: TelegramLogStatus
    telegram_chat_id: str | None = None
    telegram_message_id: str | None = None
    request_payload_json: dict[str, Any] | None = None
    response_payload_json: dict[str, Any] | None = None
    error_message: str | None = None
    retry_count: int
    send_mode: TelegramSendMode
    used_cached_media: bool
    sent_at: datetime | None = None
    created_at: datetime
    updated_at: datetime | None = None


class TelegramPostLogListResponse(BaseModel):
    items: list[TelegramPostLogResponse]
    total: int
    page: int
    pages: int


class TelegramMediaCacheResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    movie_id: int | None = None
    media_role: str
    storage_source: str
    local_file_path: str | None = None
    telegram_chat_id: str | None = None
    telegram_message_id: str | None = None
    telegram_file_id: str | None = None
    telegram_file_unique_id: str | None = None
    telegram_media_type: str | None = None
    original_filename: str | None = None
    mime_type: str | None = None
    file_size: int | None = None
    public_url: str | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None


class TelegramMediaCacheListResponse(BaseModel):
    items: list[TelegramMediaCacheResponse]
    total: int
    page: int
    pages: int
    stats: dict[str, int]
