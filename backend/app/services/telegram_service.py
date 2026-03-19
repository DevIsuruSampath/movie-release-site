from __future__ import annotations

import asyncio
import json
import logging
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from math import ceil
from pathlib import Path
from typing import Any

import jinja2
import psutil
import requests
from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.core.config import settings
from app.core.encryption import EncryptionConfigurationError, decrypt_secret, encrypt_secret, mask_secret
from app.models.movie import Movie
from app.models.telegram import TelegramMediaCache, TelegramPostLog, TelegramSettings
from app.schemas.telegram import TelegramSettingsUpdate
from app.services.file_storage import resolve_local_upload_path
from app.services.telegram_storage_service import telegram_storage_service

logger = logging.getLogger(__name__)

DEFAULT_CAPTION_TEMPLATE = (
    "<b>{{ title }}</b>\n"
    "{{ year }}\n"
    "{{ language }}\n"
    "{{ quality }}\n\n"
    "{{ short_description }}\n\n"
    "Categories: {{ categories }}\n"
    "Tags: {{ tags }}\n"
    "{{ default_hashtags }}"
)


@dataclass
class TelegramSendResult:
    ok: bool
    status: str
    log: TelegramPostLog
    response_payload_json: dict[str, Any] | None = None
    error_message: str | None = None


class TelegramService:
    duplicate_window = timedelta(minutes=5)

    def _template_environment(self) -> jinja2.Environment:
        return jinja2.Environment(undefined=jinja2.ChainableUndefined, autoescape=False, trim_blocks=False, lstrip_blocks=False)

    def get_settings(self, db: Session) -> TelegramSettings:
        config = db.query(TelegramSettings).order_by(TelegramSettings.id.asc()).first()
        if config:
            return config

        config = TelegramSettings(
            is_enabled=settings.TELEGRAM_ENABLED_DEFAULT,
            auto_post_on_publish=False,
            auto_post_on_update=False,
            enable_telegram_storage=settings.TELEGRAM_STORAGE_ENABLED_DEFAULT,
            telegram_storage_mode=settings.TELEGRAM_STORAGE_MODE_DEFAULT,
            parse_mode="HTML",
            disable_web_page_preview=False,
            caption_template=DEFAULT_CAPTION_TEMPLATE,
            button_text="Watch movie",
            private_channel_id=settings.TELEGRAM_PRIVATE_CHANNEL_ID or None,
        )
        if settings.TELEGRAM_API_ID:
            config.api_id_encrypted = encrypt_secret(settings.TELEGRAM_API_ID)
        if settings.TELEGRAM_API_HASH:
            config.api_hash_encrypted = encrypt_secret(settings.TELEGRAM_API_HASH)
        if settings.TELEGRAM_BOT_TOKEN:
            config.bot_token_encrypted = encrypt_secret(settings.TELEGRAM_BOT_TOKEN)
        db.add(config)
        db.flush()
        return config

    def _storage_stats(self, db: Session) -> dict[str, int]:
        return {
            "total": db.query(TelegramMediaCache).count(),
            "telegram": db.query(TelegramMediaCache).filter(TelegramMediaCache.storage_source == "telegram").count(),
            "hybrid": db.query(TelegramMediaCache).filter(TelegramMediaCache.storage_source == "hybrid").count(),
            "local": db.query(TelegramMediaCache).filter(TelegramMediaCache.storage_source == "local").count(),
        }

    def serialize_settings(self, db: Session, config: TelegramSettings) -> dict[str, Any]:
        api_id_masked = None
        api_hash_masked = None
        bot_token_masked = None
        for source, target in (
            (config.api_id_encrypted, "api_id"),
            (config.api_hash_encrypted, "api_hash"),
            (config.bot_token_encrypted, "bot_token"),
        ):
            if not source:
                continue
            try:
                masked = mask_secret(decrypt_secret(source))
            except Exception:
                masked = "********"
            if target == "api_id":
                api_id_masked = masked
            elif target == "api_hash":
                api_hash_masked = masked
            else:
                bot_token_masked = masked

        parse_mode = config.parse_mode or "None"
        return {
            "id": config.id,
            "is_enabled": config.is_enabled,
            "has_api_id": bool(config.api_id_encrypted),
            "has_api_hash": bool(config.api_hash_encrypted),
            "has_bot_token": bool(config.bot_token_encrypted),
            "api_id_masked": api_id_masked,
            "api_hash_masked": api_hash_masked,
            "bot_token_masked": bot_token_masked,
            "bot_username": config.bot_username,
            "private_channel_id": config.private_channel_id,
            "private_channel_username": config.private_channel_username,
            "private_channel_title": config.private_channel_title,
            "private_channel_invite_link": config.private_channel_invite_link,
            "auto_post_on_publish": config.auto_post_on_publish,
            "auto_post_on_update": config.auto_post_on_update,
            "enable_telegram_storage": config.enable_telegram_storage,
            "telegram_storage_mode": config.telegram_storage_mode,
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
            "storage_stats": self._storage_stats(db),
        }

    def _validate_settings_payload(self, payload: TelegramSettingsUpdate, current: TelegramSettings) -> None:
        api_id = payload.api_id if payload.api_id is not None else (decrypt_secret(current.api_id_encrypted) if current.api_id_encrypted else None)
        api_hash = payload.api_hash if payload.api_hash is not None else (decrypt_secret(current.api_hash_encrypted) if current.api_hash_encrypted else None)
        bot_token = payload.bot_token if payload.bot_token is not None else (decrypt_secret(current.bot_token_encrypted) if current.bot_token_encrypted else None)
        private_channel_id = payload.private_channel_id or current.private_channel_id

        if payload.is_enabled or payload.enable_telegram_storage:
            if not api_id or not api_hash or not bot_token:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Telegram API ID, API hash, and bot token are required")
            if not private_channel_id:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Private channel ID is required")

    def update_settings(self, db: Session, payload: TelegramSettingsUpdate) -> TelegramSettings:
        config = self.get_settings(db)
        self._validate_settings_payload(payload, config)

        try:
            if payload.api_id is not None:
                config.api_id_encrypted = encrypt_secret(payload.api_id)
            if payload.api_hash is not None:
                config.api_hash_encrypted = encrypt_secret(payload.api_hash)
            if payload.bot_token is not None:
                config.bot_token_encrypted = encrypt_secret(payload.bot_token)
        except (EncryptionConfigurationError, ValueError) as exc:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc)) from exc

        config.is_enabled = payload.is_enabled
        config.private_channel_id = payload.private_channel_id or config.private_channel_id
        config.private_channel_username = payload.private_channel_username
        config.private_channel_title = payload.private_channel_title
        config.private_channel_invite_link = payload.private_channel_invite_link
        config.auto_post_on_publish = payload.auto_post_on_publish
        config.auto_post_on_update = payload.auto_post_on_update
        config.enable_telegram_storage = payload.enable_telegram_storage
        config.telegram_storage_mode = payload.telegram_storage_mode
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
        timeout: int | None = None,
    ) -> dict[str, Any]:
        url = f"https://api.telegram.org/bot{token}/{method}"
        try:
            response = requests.post(url, data=data, files=files, timeout=timeout or settings.TELEGRAM_REQUEST_TIMEOUT)
        except requests.Timeout as exc:
            raise HTTPException(status_code=status.HTTP_504_GATEWAY_TIMEOUT, detail="Telegram API request timed out") from exc
        except requests.RequestException as exc:
            raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Telegram API request failed") from exc

        try:
            payload = response.json()
        except ValueError:
            payload = {"ok": False, "description": response.text}

        if not response.ok or not payload.get("ok"):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=self.safe_error_parsing(payload))
        return payload

    def safe_error_parsing(self, payload: dict[str, Any] | None) -> str:
        if not payload:
            return "Unknown Telegram API error"
        description = str(payload.get("description") or "Unknown Telegram API error")
        lowered = description.lower()
        if "chat not found" in lowered or "bot is not a member" in lowered:
            return "Bot cannot access the configured private channel"
        if "unauthorized" in lowered or "token" in lowered:
            return "Telegram bot token is invalid"
        if "have no rights" in lowered or "not enough rights" in lowered:
            return "Bot is missing permission to post in the private channel"
        if "peer_id_invalid" in lowered or "chat_id" in lowered:
            return "Private channel ID is invalid"
        return description

    def _movie_context(self, movie: Movie, config: TelegramSettings) -> dict[str, str]:
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
            "channel_invite_link": config.private_channel_invite_link or "",
            "default_hashtags": config.default_hashtags or "",
        }

    def render_caption_template(self, template: str, context: dict[str, str]) -> str:
        try:
            rendered = self._template_environment().from_string(template).render(**context)
        except jinja2.TemplateError:
            rendered = self._template_environment().from_string(DEFAULT_CAPTION_TEMPLATE).render(**context)
        return rendered.strip()

    def build_caption_from_movie(self, movie: Movie, config: TelegramSettings) -> str:
        context = self._movie_context(movie, config)
        template = config.caption_template or DEFAULT_CAPTION_TEMPLATE
        return self.render_caption_template(template, context)

    def _build_reply_markup(self, movie: Movie, config: TelegramSettings) -> str | None:
        if not config.button_text:
            return None
        button_url = config.private_channel_invite_link or f"{settings.PUBLIC_SITE_URL.rstrip('/')}/movies/{movie.slug}"
        return json.dumps({"inline_keyboard": [[{"text": config.button_text, "url": button_url}]]})

    def send_message(self, config: TelegramSettings, chat_id: str, text: str, *, reply_markup: str | None = None) -> tuple[dict[str, Any], str]:
        token = self._get_bot_token(config)
        data: dict[str, Any] = {"chat_id": chat_id, "text": text, "disable_web_page_preview": str(config.disable_web_page_preview).lower()}
        if config.parse_mode:
            data["parse_mode"] = config.parse_mode
        if reply_markup:
            data["reply_markup"] = reply_markup
        return self._request(token, "sendMessage", data=data), "bot_api"

    def send_photo(
        self,
        config: TelegramSettings,
        chat_id: str,
        photo_reference: str,
        caption: str,
        *,
        reply_markup: str | None = None,
    ) -> tuple[dict[str, Any], str]:
        token = self._get_bot_token(config)
        data: dict[str, Any] = {"chat_id": chat_id, "caption": caption}
        if config.parse_mode:
            data["parse_mode"] = config.parse_mode
        if reply_markup:
            data["reply_markup"] = reply_markup

        local_path = resolve_local_upload_path(photo_reference)
        if local_path and local_path.exists():
            with local_path.open("rb") as file_handle:
                return self._request(token, "sendPhoto", data=data, files={"photo": (local_path.name, file_handle)}), "bot_api"

        data["photo"] = photo_reference
        return self._request(token, "sendPhoto", data=data), "bot_api"

    def send_document(
        self,
        config: TelegramSettings,
        chat_id: str,
        document_reference: str,
        caption: str,
        *,
        reply_markup: str | None = None,
    ) -> tuple[dict[str, Any], str]:
        token = self._get_bot_token(config)
        data: dict[str, Any] = {"chat_id": chat_id, "caption": caption}
        if config.parse_mode:
            data["parse_mode"] = config.parse_mode
        if reply_markup:
            data["reply_markup"] = reply_markup

        local_path = resolve_local_upload_path(document_reference)
        if local_path and local_path.exists():
            with local_path.open("rb") as file_handle:
                return self._request(token, "sendDocument", data=data, files={"document": (local_path.name, file_handle)}), "bot_api"

        data["document"] = document_reference
        return self._request(token, "sendDocument", data=data), "bot_api"

    def validate_channel_access(self, db: Session) -> dict[str, Any]:
        config = self.get_settings(db)
        diagnostics = telegram_storage_service.validate_private_channel_sync(config)
        chat = diagnostics["chat"]
        bot = diagnostics["bot"]
        config.private_channel_title = chat.get("title") or config.private_channel_title
        config.private_channel_username = chat.get("username") or config.private_channel_username
        config.bot_username = bot.get("username") or config.bot_username
        db.add(config)
        db.flush()
        return {
            "ok": True,
            "message": "Private channel validated",
            "private_channel_title": config.private_channel_title,
            "private_channel_username": config.private_channel_username,
            "private_channel_id": config.private_channel_id,
            "bot_username": config.bot_username,
            "details": diagnostics,
        }

    def test_connection(self, db: Session) -> dict[str, Any]:
        config = self.get_settings(db)
        if not config.private_channel_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Private channel ID is not configured")

        client_info = telegram_storage_service.test_client_sync(config)
        validation = telegram_storage_service.validate_private_channel_sync(config)
        config.bot_username = client_info.get("username") or config.bot_username
        config.private_channel_title = validation["chat"].get("title") or config.private_channel_title
        config.private_channel_username = validation["chat"].get("username") or config.private_channel_username
        config.test_status = "success"
        config.last_tested_at = datetime.now(timezone.utc)
        db.add(config)
        db.flush()
        return {
            "ok": True,
            "message": "Telegram credentials and private channel verified",
            "bot_username": config.bot_username,
            "private_channel_title": config.private_channel_title,
            "private_channel_id": config.private_channel_id,
            "details": {
                "client": client_info,
                "channel": validation,
                "system": {
                    "memory_percent": psutil.virtual_memory().percent,
                    "cpu_percent": psutil.cpu_percent(interval=0.0),
                },
            },
        }

    def create_pending_log(self, db: Session, movie: Movie, config: TelegramSettings, *, reason: str, force_resend: bool) -> TelegramPostLog:
        log = TelegramPostLog(
            movie_id=movie.id,
            status="pending",
            telegram_chat_id=config.private_channel_id,
            send_mode="bot_api",
            used_cached_media=False,
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

    def _poster_reference(self, db: Session, config: TelegramSettings, movie: Movie) -> tuple[str | None, bool]:
        cache = telegram_storage_service.get_cached_movie_media(db, movie, "poster")
        if cache and cache.telegram_file_id:
            return cache.telegram_file_id, True

        local_path = resolve_local_upload_path(movie.poster_url or "")
        if local_path and local_path.exists() and config.enable_telegram_storage:
            cache = asyncio.run(
                telegram_storage_service.upload_file_to_telegram_storage(
                    db,
                    config,
                    file_path=local_path,
                    media_role="poster",
                    movie_id=movie.id,
                    original_filename=local_path.name,
                    mime_type="image/jpeg",
                    file_size=local_path.stat().st_size,
                    local_file_path=str(local_path) if config.telegram_storage_mode == "hybrid" else None,
                    storage_source="hybrid" if config.telegram_storage_mode == "hybrid" else "telegram",
                )
            )
            return cache.telegram_file_id, True

        return movie.poster_url, False

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
        if not config.private_channel_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Private channel ID is not configured")
        if not movie.title:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Movie title is required before posting to Telegram")

        telegram_storage_service.attach_movie_media(db, movie)
        duplicate_log = None if force_resend else self._recent_duplicate(db, movie.id)
        if duplicate_log and duplicate_log.id != log_id:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="This movie was already posted to Telegram recently")

        log = db.query(TelegramPostLog).filter(TelegramPostLog.id == log_id).first() if log_id else None
        if not log:
            log = self.create_pending_log(db, movie, config, reason=reason, force_resend=force_resend)

        caption = self.build_caption_from_movie(movie, config)
        reply_markup = self._build_reply_markup(movie, config)
        poster_reference, used_cached_media = self._poster_reference(db, config, movie) if movie.poster_url else (None, False)
        log.request_payload_json = {
            **(log.request_payload_json or {}),
            "caption": caption,
            "reply_markup": reply_markup,
            "poster_reference": poster_reference,
        }
        db.add(log)
        db.flush()

        try:
            if config.send_poster_mode == "photo" and poster_reference:
                response_payload, send_mode = self.send_photo(config, config.private_channel_id, poster_reference, caption, reply_markup=reply_markup)
            elif config.send_poster_mode == "document" and poster_reference:
                response_payload, send_mode = self.send_document(config, config.private_channel_id, poster_reference, caption, reply_markup=reply_markup)
            else:
                response_payload, send_mode = self.send_message(config, config.private_channel_id, caption, reply_markup=reply_markup)
        except HTTPException as exc:
            log.status = "failed"
            log.error_message = exc.detail if isinstance(exc.detail, str) else "Telegram delivery failed"
            log.response_payload_json = None
            log.retry_count = (log.retry_count or 0) + (1 if force_resend else 0)
            log.send_mode = "bot_api"
            log.used_cached_media = used_cached_media
            db.add(log)
            db.flush()
            logger.warning("Telegram post failed", extra={"movie_id": movie.id, "log_id": log.id, "error": log.error_message})
            return TelegramSendResult(ok=False, status="failed", log=log, error_message=log.error_message)

        result = response_payload.get("result", {})
        log.status = "sent"
        log.error_message = None
        log.telegram_chat_id = str(result.get("chat", {}).get("id") or config.private_channel_id)
        log.telegram_message_id = str(result.get("message_id")) if result.get("message_id") is not None else None
        log.response_payload_json = response_payload
        log.retry_count = (log.retry_count or 0) + (1 if force_resend else 0)
        log.sent_at = datetime.now(timezone.utc)
        log.send_mode = send_mode
        log.used_cached_media = used_cached_media
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
                joinedload(TelegramPostLog.movie).joinedload(Movie.telegram_media_cache),
            )
            .filter(TelegramPostLog.id == log_id)
            .first()
        )
        if not log:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Telegram log not found")
        return self.send_movie_post(db, log.movie, force_resend=True, log_id=log.id, reason="retry")

    def list_logs(self, db: Session, *, page: int, limit: int, status_filter: str | None = None, movie_id: int | None = None) -> dict[str, Any]:
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
                    "send_mode": item.send_mode,
                    "used_cached_media": item.used_cached_media,
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
