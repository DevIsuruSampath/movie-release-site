from __future__ import annotations

from datetime import datetime
from typing import Any, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator


TelegramSendPosterMode = Literal["photo", "document", "text_only"]
TelegramParseMode = Literal["HTML", "MarkdownV2", "None"]
TelegramLogStatus = Literal["pending", "sent", "failed"]


class TelegramSettingsUpdate(BaseModel):
    is_enabled: bool = False
    bot_token: Optional[str] = None
    channel_id: str = Field(min_length=1, max_length=255)
    channel_username: Optional[str] = None
    channel_title: Optional[str] = None
    channel_invite_link: Optional[str] = None
    auto_post_on_publish: bool = False
    auto_post_on_update: bool = False
    caption_template: Optional[str] = None
    button_text: Optional[str] = None
    default_hashtags: Optional[str] = None
    send_poster_mode: TelegramSendPosterMode = "photo"
    parse_mode: TelegramParseMode = "HTML"
    disable_web_page_preview: bool = False

    @field_validator("bot_token")
    @classmethod
    def validate_bot_token(cls, value: str | None) -> str | None:
        if value is None:
            return value
        normalized = value.strip()
        if not normalized:
            raise ValueError("Bot token cannot be empty")
        if ":" not in normalized:
            raise ValueError("Bot token format is invalid")
        return normalized

    @field_validator("channel_id")
    @classmethod
    def validate_channel_id(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("Channel ID is required")
        return normalized

    @field_validator("channel_username", "channel_title", "channel_invite_link", "caption_template", "button_text", "default_hashtags")
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
    has_bot_token: bool
    bot_token_masked: str | None = None
    bot_username: str | None = None
    channel_id: str | None = None
    channel_username: str | None = None
    channel_title: str | None = None
    channel_invite_link: str | None = None
    auto_post_on_publish: bool
    auto_post_on_update: bool
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


class TelegramTestResponse(BaseModel):
    ok: bool
    message: str
    bot_username: str | None = None
    channel_title: str | None = None
    channel_id: str | None = None
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
    sent_at: datetime | None = None
    created_at: datetime
    updated_at: datetime | None = None


class TelegramPostLogListResponse(BaseModel):
    items: list[TelegramPostLogResponse]
    total: int
    page: int
    pages: int
