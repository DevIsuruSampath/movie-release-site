from __future__ import annotations

import logging
import json
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from math import ceil
from typing import Any

import httpx
from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.core.config import settings
from app.core.encryption import EncryptionConfigurationError, decrypt_secret, encrypt_secret, mask_secret
from app.models.movie import Movie
from app.models.telegram import TelegramPostLog, TelegramSettings
from app.schemas.telegram import TelegramSettingsUpdate
from app.services.file_storage import resolve_local_upload_path

logger = logging.getLogger(__name__)

DEFAULT_CAPTION_TEMPLATE = (
    "<b>{title}</b>\n"
    "{year}\n"
    "{language}\n"
    "{quality}\n\n"
    "{short_description}\n\n"
    "Categories: {categories}\n"
    "Tags: {tags}\n"
    "{default_hashtags}"
)


@dataclass
class TelegramSendResult:
    ok: bool
    status: str
    log: TelegramPostLog
    response_payload_json: dict[str, Any] | None = None
    error_message: str | None = None


class SafeTemplateDict(dict[str, str]):
    def __missing__(self, key: str) -> str:
        return ""


class TelegramService:
    duplicate_window = timedelta(minutes=5)

    def __init__(self) -> None:
        self.timeout = httpx.Timeout(settings.TELEGRAM_REQUEST_TIMEOUT)

    def get_settings(self, db: Session) -> TelegramSettings:
        config = db.query(TelegramSettings).order_by(TelegramSettings.id.asc()).first()
        if config:
            return config

        config = TelegramSettings(
            is_enabled=settings.TELEGRAM_ENABLED_DEFAULT,
            auto_post_on_publish=False,
            auto_post_on_update=False,
            send_poster_mode="photo",
            parse_mode="HTML",
            disable_web_page_preview=False,
            caption_template=DEFAULT_CAPTION_TEMPLATE,
            button_text="Watch movie",
        )
        db.add(config)
        db.flush()
        return config

    def serialize_settings(self, config: TelegramSettings) -> dict[str, Any]:
        masked = None
        if config.bot_token_encrypted:
            try:
                masked = mask_secret(decrypt_secret(config.bot_token_encrypted))
            except Exception:
                masked = "********"

        parse_mode = config.parse_mode or "None"
        return {
            "id": config.id,
            "is_enabled": config.is_enabled,
            "has_bot_token": bool(config.bot_token_encrypted),
            "bot_token_masked": masked,
            "bot_username": config.bot_username,
            "channel_id": config.channel_id,
            "channel_username": config.channel_username,
            "channel_title": config.channel_title,
            "channel_invite_link": config.channel_invite_link,
            "auto_post_on_publish": config.auto_post_on_publish,
            "auto_post_on_update": config.auto_post_on_update,
            "caption_template": config.caption_template or DEFAULT_CAPTION_TEMPLATE,
            "button_text": config.button_text,
            "default_hashtags": config.default_hashtags,
            "send_poster_mode": config.send_poster_mode,
            "parse_mode": parse_mode,
            "disable_web_page_preview": config.disable_web_page_preview,
            "test_status": config.test_status,
            "last_tested_at": config.last_tested_at,
            "created_at": config.created_at,
            "updated_at": config.updated_at,
        }

    def update_settings(self, db: Session, payload: TelegramSettingsUpdate) -> TelegramSettings:
        config = self.get_settings(db)

        if payload.bot_token is not None:
            try:
                config.bot_token_encrypted = encrypt_secret(payload.bot_token)
            except (EncryptionConfigurationError, ValueError) as exc:
                raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc)) from exc

        config.is_enabled = payload.is_enabled
        config.channel_id = payload.channel_id
        config.channel_username = payload.channel_username
        config.channel_title = payload.channel_title
        config.channel_invite_link = payload.channel_invite_link
        config.auto_post_on_publish = payload.auto_post_on_publish
        config.auto_post_on_update = payload.auto_post_on_update
        config.caption_template = payload.caption_template or DEFAULT_CAPTION_TEMPLATE
        config.button_text = payload.button_text
        config.default_hashtags = payload.default_hashtags
        config.send_poster_mode = payload.send_poster_mode
        config.parse_mode = None if payload.parse_mode == "None" else payload.parse_mode
        config.disable_web_page_preview = payload.disable_web_page_preview
        db.add(config)
        db.flush()
        return config

    def _get_bot_token(self, config: TelegramSettings) -> str:
        if not config.bot_token_encrypted:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Telegram bot token is not configured")
        try:
            return decrypt_secret(config.bot_token_encrypted)
        except EncryptionConfigurationError as exc:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc)) from exc

    def _request(
        self,
        token: str,
        method: str,
        *,
        data: dict[str, Any] | None = None,
        files: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        url = f"https://api.telegram.org/bot{token}/{method}"
        try:
            with httpx.Client(timeout=self.timeout) as client:
                response = client.post(url, data=data, files=files)
        except httpx.TimeoutException as exc:
            raise HTTPException(status_code=status.HTTP_504_GATEWAY_TIMEOUT, detail="Telegram API request timed out") from exc
        except httpx.HTTPError as exc:
            raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Telegram API request failed") from exc

        try:
            payload = response.json()
        except ValueError:
            payload = {"ok": False, "description": response.text}

        if not response.is_success or not payload.get("ok"):
            detail = self.safe_error_parsing(payload)
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=detail)

        return payload

    def safe_error_parsing(self, payload: dict[str, Any] | None) -> str:
        if not payload:
            return "Unknown Telegram API error"
        description = str(payload.get("description") or "Unknown Telegram API error")
        lowered = description.lower()
        if "bot is not a member" in lowered or "chat not found" in lowered:
            return "Bot cannot access the configured channel"
        if "unauthorized" in lowered or "token" in lowered:
            return "Telegram bot token is invalid"
        if "have no rights" in lowered or "not enough rights" in lowered:
            return "Bot is missing permission to post in the channel"
        if "peer_id_invalid" in lowered or "chat_id" in lowered:
            return "Telegram channel ID is invalid"
        return description

    def _movie_context(self, movie: Movie) -> dict[str, str]:
        categories = ", ".join(category.name for category in movie.categories)
        tags = ", ".join(tag.name for tag in movie.tags)
        movie_url = f"{settings.PUBLIC_SITE_URL.rstrip('/')}/movies/{movie.slug}"
        return {
            "title": movie.title or "",
            "year": str(movie.release_year or ""),
            "language": movie.language or "",
            "quality": movie.quality or "",
            "short_description": movie.short_description or "",
            "categories": categories,
            "tags": tags,
            "movie_url": movie_url,
            "channel_invite_link": "",
            "default_hashtags": "",
        }

    def build_caption_from_movie(self, movie: Movie, config: TelegramSettings) -> str:
        context = self._movie_context(movie)
        context["channel_invite_link"] = config.channel_invite_link or ""
        context["default_hashtags"] = config.default_hashtags or ""
        template = config.caption_template or DEFAULT_CAPTION_TEMPLATE
        try:
            caption = template.format_map(SafeTemplateDict(context))
        except Exception:
            caption = DEFAULT_CAPTION_TEMPLATE.format_map(SafeTemplateDict(context))
        return caption.strip()

    def _build_reply_markup(self, movie: Movie, config: TelegramSettings) -> str | None:
        if not config.button_text:
            return None
        button_url = config.channel_invite_link or f"{settings.PUBLIC_SITE_URL.rstrip('/')}/movies/{movie.slug}"
        return json.dumps({"inline_keyboard": [[{"text": config.button_text, "url": button_url}]]})

    def send_message(
        self,
        config: TelegramSettings,
        chat_id: str,
        text: str,
        *,
        reply_markup: str | None = None,
    ) -> dict[str, Any]:
        token = self._get_bot_token(config)
        data: dict[str, Any] = {
            "chat_id": chat_id,
            "text": text,
            "disable_web_page_preview": str(config.disable_web_page_preview).lower(),
        }
        if config.parse_mode:
            data["parse_mode"] = config.parse_mode
        if reply_markup:
            data["reply_markup"] = reply_markup
        return self._request(token, "sendMessage", data=data)

    def send_photo(
        self,
        config: TelegramSettings,
        chat_id: str,
        photo_url: str,
        caption: str,
        *,
        reply_markup: str | None = None,
    ) -> dict[str, Any]:
        token = self._get_bot_token(config)
        data: dict[str, Any] = {"chat_id": chat_id, "caption": caption}
        if config.parse_mode:
            data["parse_mode"] = config.parse_mode
        if reply_markup:
            data["reply_markup"] = reply_markup

        local_path = resolve_local_upload_path(photo_url)
        if local_path and local_path.exists():
            with local_path.open("rb") as file_handle:
                return self._request(token, "sendPhoto", data=data, files={"photo": (local_path.name, file_handle)})

        data["photo"] = photo_url
        return self._request(token, "sendPhoto", data=data)

    def send_document(
        self,
        config: TelegramSettings,
        chat_id: str,
        document_url: str,
        caption: str,
        *,
        reply_markup: str | None = None,
    ) -> dict[str, Any]:
        token = self._get_bot_token(config)
        data: dict[str, Any] = {"chat_id": chat_id, "caption": caption}
        if config.parse_mode:
            data["parse_mode"] = config.parse_mode
        if reply_markup:
            data["reply_markup"] = reply_markup

        local_path = resolve_local_upload_path(document_url)
        if local_path and local_path.exists():
            with local_path.open("rb") as file_handle:
                return self._request(token, "sendDocument", data=data, files={"document": (local_path.name, file_handle)})

        data["document"] = document_url
        return self._request(token, "sendDocument", data=data)

    def validate_channel_access(self, config: TelegramSettings) -> dict[str, Any]:
        token = self._get_bot_token(config)
        return self._request(token, "getChat", data={"chat_id": config.channel_id})

    def test_connection(self, db: Session) -> dict[str, Any]:
        config = self.get_settings(db)
        if not config.channel_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Telegram channel ID is not configured")

        token = self._get_bot_token(config)
        me_payload = self._request(token, "getMe")
        chat_payload = self._request(token, "getChat", data={"chat_id": config.channel_id})

        config.bot_username = me_payload["result"].get("username")
        config.channel_title = chat_payload["result"].get("title") or config.channel_title
        config.test_status = "success"
        config.last_tested_at = datetime.now(timezone.utc)
        db.add(config)
        db.flush()

        return {
            "ok": True,
            "message": "Telegram connection verified",
            "bot_username": config.bot_username,
            "channel_title": config.channel_title,
            "channel_id": config.channel_id,
            "details": {
                "bot": me_payload["result"],
                "chat": chat_payload["result"],
            },
        }

    def create_pending_log(
        self,
        db: Session,
        movie: Movie,
        config: TelegramSettings,
        *,
        reason: str,
        force_resend: bool,
    ) -> TelegramPostLog:
        log = TelegramPostLog(
            movie_id=movie.id,
            status="pending",
            telegram_chat_id=config.channel_id,
            request_payload_json={
                "reason": reason,
                "force_resend": force_resend,
                "movie_slug": movie.slug,
                "send_poster_mode": config.send_poster_mode,
            },
        )
        db.add(log)
        db.flush()
        return log

    def _recent_duplicate(self, db: Session, movie_id: int) -> TelegramPostLog | None:
        cutoff = datetime.now(timezone.utc) - self.duplicate_window
        return (
            db.query(TelegramPostLog)
            .filter(
                TelegramPostLog.movie_id == movie_id,
                TelegramPostLog.status.in_(("pending", "sent")),
                TelegramPostLog.created_at >= cutoff,
            )
            .order_by(TelegramPostLog.created_at.desc())
            .first()
        )

    def send_movie_post(
        self,
        db: Session,
        movie: Movie,
        *,
        force_resend: bool = False,
        log_id: int | None = None,
        reason: str = "manual",
    ) -> TelegramSendResult:
        config = self.get_settings(db)
        if not config.is_enabled:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Telegram integration is disabled")
        if not config.channel_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Telegram channel ID is not configured")
        if not movie.title:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Movie title is required before posting to Telegram")

        duplicate_log = None if force_resend else self._recent_duplicate(db, movie.id)
        if duplicate_log and duplicate_log.id != log_id:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="This movie was already posted to Telegram recently")

        log = db.query(TelegramPostLog).filter(TelegramPostLog.id == log_id).first() if log_id else None
        if not log:
            log = self.create_pending_log(db, movie, config, reason=reason, force_resend=force_resend)

        caption = self.build_caption_from_movie(movie, config)
        reply_markup = self._build_reply_markup(movie, config)
        log.request_payload_json = {
            **(log.request_payload_json or {}),
            "caption": caption,
            "reply_markup": reply_markup,
            "poster_url": movie.poster_url,
        }
        db.add(log)
        db.flush()

        try:
            if config.send_poster_mode == "photo" and movie.poster_url:
                response_payload = self.send_photo(config, config.channel_id, movie.poster_url, caption, reply_markup=reply_markup)
            elif config.send_poster_mode == "document" and movie.poster_url:
                response_payload = self.send_document(config, config.channel_id, movie.poster_url, caption, reply_markup=reply_markup)
            else:
                response_payload = self.send_message(config, config.channel_id, caption, reply_markup=reply_markup)
        except HTTPException as exc:
            log.status = "failed"
            log.error_message = exc.detail if isinstance(exc.detail, str) else "Telegram delivery failed"
            log.response_payload_json = None
            log.retry_count = (log.retry_count or 0) + (1 if force_resend else 0)
            db.add(log)
            db.flush()
            logger.warning("Telegram post failed", extra={"movie_id": movie.id, "log_id": log.id, "error": log.error_message})
            return TelegramSendResult(ok=False, status="failed", log=log, error_message=log.error_message)

        result = response_payload.get("result", {})
        log.status = "sent"
        log.error_message = None
        log.telegram_chat_id = str(result.get("chat", {}).get("id") or config.channel_id)
        log.telegram_message_id = str(result.get("message_id")) if result.get("message_id") is not None else None
        log.response_payload_json = response_payload
        log.sent_at = datetime.now(timezone.utc)
        log.retry_count = (log.retry_count or 0) + (1 if force_resend else 0)
        db.add(log)
        db.flush()
        logger.info("Telegram post sent", extra={"movie_id": movie.id, "log_id": log.id, "message_id": log.telegram_message_id})
        return TelegramSendResult(ok=True, status="sent", log=log, response_payload_json=response_payload)

    def retry_failed_post(self, db: Session, log_id: int) -> TelegramSendResult:
        log = (
            db.query(TelegramPostLog)
            .options(
                joinedload(TelegramPostLog.movie).joinedload(Movie.categories),
                joinedload(TelegramPostLog.movie).joinedload(Movie.tags),
                joinedload(TelegramPostLog.movie).joinedload(Movie.telegram_post_logs),
            )
            .filter(TelegramPostLog.id == log_id)
            .first()
        )
        if not log:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Telegram log not found")
        return self.send_movie_post(db, log.movie, force_resend=True, log_id=log.id, reason="retry")

    def list_logs(
        self,
        db: Session,
        *,
        page: int,
        limit: int,
        status_filter: str | None = None,
        movie_id: int | None = None,
    ) -> dict[str, Any]:
        query = db.query(TelegramPostLog).options(joinedload(TelegramPostLog.movie)).order_by(TelegramPostLog.created_at.desc())
        if status_filter:
            query = query.filter(TelegramPostLog.status == status_filter)
        if movie_id is not None:
            query = query.filter(TelegramPostLog.movie_id == movie_id)

        total = query.count()
        items = query.offset((page - 1) * limit).limit(limit).all()
        return {
            "items": [
                {
                    "id": item.id,
                    "movie_id": item.movie_id,
                    "movie_title": item.movie.title if item.movie else None,
                    "status": item.status,
                    "telegram_chat_id": item.telegram_chat_id,
                    "telegram_message_id": item.telegram_message_id,
                    "request_payload_json": item.request_payload_json,
                    "response_payload_json": item.response_payload_json,
                    "error_message": item.error_message,
                    "retry_count": item.retry_count,
                    "sent_at": item.sent_at,
                    "created_at": item.created_at,
                    "updated_at": item.updated_at,
                }
                for item in items
            ],
            "total": total,
            "page": page,
            "pages": ceil(total / limit) if total else 1,
        }


telegram_service = TelegramService()
