from __future__ import annotations

import logging
from math import ceil
from pathlib import Path
from typing import Any

import requests
from fastapi import HTTPException, status

from app.core.config import settings
from app.core.encryption import decrypt_secret
from app.models.movie import Movie
from app.models.telegram import TelegramMediaCache, TelegramSettings
from app.services.file_storage import resolve_local_upload_path

logger = logging.getLogger(__name__)


class TelegramStorageService:
    def _require_telegram_credentials(self, config: TelegramSettings) -> tuple[int, str, str]:
        if not config.api_id_encrypted or not config.api_hash_encrypted or not config.bot_token_encrypted:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Telegram API credentials are incomplete")
        try:
            api_id = int(decrypt_secret(config.api_id_encrypted))
            api_hash = decrypt_secret(config.api_hash_encrypted)
            bot_token = decrypt_secret(config.bot_token_encrypted)
        except Exception as exc:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Unable to decrypt Telegram credentials") from exc
        return api_id, api_hash, bot_token

    def _bot_api_request(
        self,
        config: TelegramSettings,
        method: str,
        *,
        data: dict[str, Any] | None = None,
        files: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        _, _, bot_token = self._require_telegram_credentials(config)
        url = f"https://api.telegram.org/bot{bot_token}/{method}"
        try:
            response = requests.post(url, data=data, files=files, timeout=settings.TELEGRAM_REQUEST_TIMEOUT)
        except requests.Timeout as exc:
            raise HTTPException(status_code=status.HTTP_504_GATEWAY_TIMEOUT, detail="Telegram API request timed out") from exc
        except requests.RequestException as exc:
            raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Telegram API request failed") from exc

        try:
            payload = response.json()
        except ValueError:
            payload = {"ok": False, "description": response.text}

        if not response.ok or not payload.get("ok"):
            description = str(payload.get("description") or "Unknown Telegram API error")
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=self._translate_bot_api_error(description, method))

        result = payload.get("result")
        if not isinstance(result, dict):
            raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Telegram API returned an unexpected response")
        return result

    def test_client(self, config: TelegramSettings) -> dict[str, Any]:
        me = self._bot_api_request(config, "getMe")
        return {"id": me.get("id"), "username": me.get("username"), "first_name": me.get("first_name")}

    def validate_private_channel(self, config: TelegramSettings) -> dict[str, Any]:
        if not config.private_channel_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Private channel ID is not configured")
        me = self._bot_api_request(config, "getMe")
        chat = self._bot_api_request(config, "getChat", data={"chat_id": config.private_channel_id})
        member = self._bot_api_request(config, "getChatMember", data={"chat_id": config.private_channel_id, "user_id": me.get("id")})
        return {
            "bot": {"id": me.get("id"), "username": me.get("username")},
            "chat": {
                "id": chat.get("id"),
                "title": chat.get("title"),
                "username": chat.get("username"),
                "invite_link": chat.get("invite_link"),
                "type": str(chat.get("type", "")),
            },
            "membership": {
                "status": str(member.get("status", "")),
            },
        }

    def _translate_validation_error(self, exc: Exception, channel_id: str) -> str | None:
        module_name = exc.__class__.__module__
        error_name = exc.__class__.__name__

        if module_name.startswith("pyrogram.") and error_name == "PeerIdInvalid":
            return (
                f"Telegram could not resolve private channel ID {channel_id}. "
                "Make sure the ID is correct and the bot has already been added to that channel."
            )

        if module_name.startswith("pyrogram.") and error_name == "UsernameNotOccupied":
            return "Telegram could not find that private channel username."

        if module_name.startswith("pyrogram.") and error_name in {"ChannelInvalid", "ChannelPrivate", "ChatAdminRequired"}:
            return (
                f"Telegram denied access to private channel {channel_id}. "
                "Make sure the bot is a member of the channel and has permission to read and post messages."
            )

        return None

    def _translate_bot_api_error(self, description: str, method: str) -> str:
        lowered = description.lower()
        if "chat not found" in lowered:
            return "Telegram could not find the configured private channel"
        if "bot is not a member" in lowered or "member list is inaccessible" in lowered:
            return "Bot cannot access the configured private channel"
        if "have no rights" in lowered or "not enough rights" in lowered:
            return "Bot is missing permission to access or post in the private channel"
        if "chat_admin_required" in lowered:
            return "Bot must be an admin in the private channel for this operation"
        if "unauthorized" in lowered or "token" in lowered:
            return "Telegram bot token is invalid"
        if "peer_id_invalid" in lowered or "chat_id is empty" in lowered:
            return "Private channel ID is invalid"
        if method in {"getChat", "getChatMember"}:
            return f"Telegram could not validate private channel access: {description}"
        if method in {"sendPhoto", "sendDocument"}:
            return f"Telegram storage upload failed: {description}"
        return description

    def _proxy_url(self, media_cache_id: int) -> str:
        return f"/api/v1/telegram/storage/media/{media_cache_id}/content"

    def _message_file(self, message: Any) -> tuple[str | None, str | None, str | None, int | None]:
        if isinstance(message, dict):
            photos = message.get("photo")
            if isinstance(photos, list) and photos:
                photo = photos[-1]
                return photo.get("file_id"), photo.get("file_unique_id"), "photo", photo.get("file_size")
            document = message.get("document")
            if isinstance(document, dict):
                return document.get("file_id"), document.get("file_unique_id"), "document", document.get("file_size")
        if getattr(message, "photo", None):
            photo = message.photo
            return photo.file_id, photo.file_unique_id, "photo", getattr(photo, "file_size", None)
        if getattr(message, "document", None):
            document = message.document
            return document.file_id, document.file_unique_id, "document", getattr(document, "file_size", None)
        return None, None, None, None

    async def upload_file_to_telegram_storage(
        self,
        db: Any,
        config: TelegramSettings,
        *,
        file_path: Path,
        media_role: str,
        movie_id: int | None = None,
        original_filename: str | None = None,
        mime_type: str | None = None,
        file_size: int | None = None,
        local_file_path: str | None = None,
        storage_source: str = "telegram",
    ) -> TelegramMediaCache:
        if not config.enable_telegram_storage:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Telegram storage is disabled")
        if not config.private_channel_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Private channel ID is not configured")

        with file_path.open("rb") as file_handle:
            if (mime_type or "").startswith("image/"):
                message = self._bot_api_request(
                    config,
                    "sendPhoto",
                    data={"chat_id": config.private_channel_id, "caption": f"media:{media_role}"},
                    files={"photo": (file_path.name, file_handle)},
                )
            else:
                message = self._bot_api_request(
                    config,
                    "sendDocument",
                    data={"chat_id": config.private_channel_id, "caption": f"media:{media_role}"},
                    files={"document": (file_path.name, file_handle)},
                )

        file_id, file_unique_id, media_type, detected_size = self._message_file(message)
        cache = TelegramMediaCache(
            movie_id=movie_id,
            media_role=media_role,
            storage_source=storage_source,
            local_file_path=local_file_path,
            telegram_chat_id=str(message.get("chat", {}).get("id") or config.private_channel_id),
            telegram_message_id=str(message.get("message_id")) if message.get("message_id") is not None else None,
            telegram_file_id=file_id,
            telegram_file_unique_id=file_unique_id,
            telegram_media_type=media_type,
            original_filename=original_filename or file_path.name,
            mime_type=mime_type,
            file_size=file_size or detected_size,
        )
        db.add(cache)
        db.flush()
        cache.public_url = self._proxy_url(cache.id)
        db.add(cache)
        db.flush()
        return cache

    async def register_uploaded_media(
        self,
        db: Any,
        config: TelegramSettings,
        *,
        file_path: Path,
        file_url: str,
        media_role: str,
        movie_id: int | None,
        original_filename: str,
        mime_type: str | None,
        file_size: int | None,
    ) -> dict[str, Any]:
        storage_mode = config.telegram_storage_mode if config.enable_telegram_storage else "local_only"
        cache = TelegramMediaCache(
            movie_id=movie_id,
            media_role=media_role,
            storage_source="local" if storage_mode == "local_only" else storage_mode.replace("_only", ""),
            local_file_path=str(file_path),
            original_filename=original_filename,
            mime_type=mime_type,
            file_size=file_size,
            public_url=file_url,
        )
        db.add(cache)
        db.flush()

        telegram_error = None
        telegram_cache: TelegramMediaCache | None = None
        if storage_mode in {"telegram_only", "hybrid"} and config.enable_telegram_storage:
            try:
                telegram_cache = await self.upload_file_to_telegram_storage(
                    db,
                    config,
                    file_path=file_path,
                    media_role=media_role,
                    movie_id=movie_id,
                    original_filename=original_filename,
                    mime_type=mime_type,
                    file_size=file_size,
                    local_file_path=str(file_path) if storage_mode == "hybrid" else None,
                    storage_source="hybrid" if storage_mode == "hybrid" else "telegram",
                )
                cache.telegram_chat_id = telegram_cache.telegram_chat_id
                cache.telegram_message_id = telegram_cache.telegram_message_id
                cache.telegram_file_id = telegram_cache.telegram_file_id
                cache.telegram_file_unique_id = telegram_cache.telegram_file_unique_id
                cache.telegram_media_type = telegram_cache.telegram_media_type
                cache.public_url = telegram_cache.public_url if storage_mode == "telegram_only" else file_url
                cache.storage_source = "hybrid" if storage_mode == "hybrid" else "telegram"
                if storage_mode == "telegram_only":
                    cache.local_file_path = None
                    try:
                        file_path.unlink(missing_ok=True)
                    except Exception:
                        logger.warning("Failed to remove local file after telegram-only upload", extra={"path": str(file_path)})
            except HTTPException as exc:
                telegram_error = exc.detail if isinstance(exc.detail, str) else "Telegram storage upload failed"
                if storage_mode == "telegram_only":
                    raise
        db.add(cache)
        db.flush()
        return {
            "media_cache_id": cache.id,
            "file_url": cache.public_url if cache.storage_source == "telegram" else file_url,
            "public_url": cache.public_url,
            "storage_source": cache.storage_source,
            "telegram_message_id": cache.telegram_message_id,
            "telegram_file_id": cache.telegram_file_id,
            "storage_error": telegram_error,
        }

    def attach_movie_media(self, db: Any, movie: Movie) -> None:
        role_map = {
            "poster": movie.poster_url,
            "backdrop": movie.backdrop_url,
            "thumbnail": movie.thumbnail_url,
            "gallery": None,
            "other": movie.open_graph_image,
        }
        for role, url in role_map.items():
            if not url:
                continue
            local_path = resolve_local_upload_path(url)
            query = db.query(TelegramMediaCache).filter(
                TelegramMediaCache.movie_id.is_(None),
                TelegramMediaCache.media_role == role,
            )
            candidates = query.all()
            for item in candidates:
                if item.public_url == url or (local_path and item.local_file_path == str(local_path)):
                    item.movie_id = movie.id
                    db.add(item)
                    break

    def get_cached_movie_media(self, db: Any, movie: Movie, role: str) -> TelegramMediaCache | None:
        item = (
            db.query(TelegramMediaCache)
            .filter(TelegramMediaCache.movie_id == movie.id, TelegramMediaCache.media_role == role)
            .order_by(TelegramMediaCache.created_at.desc())
            .first()
        )
        if item:
            return item

        current_url = getattr(movie, f"{role}_url", None)
        if not current_url:
            return None
        local_path = resolve_local_upload_path(current_url)
        candidates = (
            db.query(TelegramMediaCache)
            .filter(TelegramMediaCache.media_role == role)
            .order_by(TelegramMediaCache.created_at.desc())
            .all()
        )
        for candidate in candidates:
            if candidate.public_url == current_url or (local_path and candidate.local_file_path == str(local_path)):
                candidate.movie_id = movie.id
                db.add(candidate)
                db.flush()
                return candidate
        return None

    def list_media(self, db: Any, *, page: int, limit: int, movie_id: int | None = None) -> dict[str, Any]:
        query = db.query(TelegramMediaCache).order_by(TelegramMediaCache.created_at.desc())
        if movie_id is not None:
            query = query.filter(TelegramMediaCache.movie_id == movie_id)

        total = query.count()
        items = query.offset((page - 1) * limit).limit(limit).all()
        stats = {
            "total": total,
            "telegram": db.query(TelegramMediaCache).filter(TelegramMediaCache.storage_source == "telegram").count(),
            "hybrid": db.query(TelegramMediaCache).filter(TelegramMediaCache.storage_source == "hybrid").count(),
            "local": db.query(TelegramMediaCache).filter(TelegramMediaCache.storage_source == "local").count(),
        }
        return {
            "items": items,
            "total": total,
            "page": page,
            "pages": ceil(total / limit) if total else 1,
            "stats": stats,
        }

    def stream_media_content(self, config: TelegramSettings, media: TelegramMediaCache) -> tuple[bytes, str | None]:
        if media.local_file_path and Path(media.local_file_path).exists():
            file_path = Path(media.local_file_path)
            return file_path.read_bytes(), media.mime_type

        if not media.telegram_file_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Telegram media file is not available")

        _, _, bot_token = self._require_telegram_credentials(config)
        try:
            metadata_response = requests.post(
                f"https://api.telegram.org/bot{bot_token}/getFile",
                data={"file_id": media.telegram_file_id},
                timeout=settings.TELEGRAM_REQUEST_TIMEOUT,
            )
            metadata_payload = metadata_response.json()
            if not metadata_response.ok or not metadata_payload.get("ok"):
                raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Unable to resolve Telegram file path")
            file_path = metadata_payload["result"]["file_path"]
            file_response = requests.get(
                f"https://api.telegram.org/file/bot{bot_token}/{file_path}",
                timeout=settings.TELEGRAM_REQUEST_TIMEOUT,
            )
            file_response.raise_for_status()
        except requests.RequestException as exc:
            raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Unable to download Telegram media") from exc

        return file_response.content, media.mime_type

    def validate_private_channel_sync(self, config: TelegramSettings) -> dict[str, Any]:
        return self.validate_private_channel(config)

    def test_client_sync(self, config: TelegramSettings) -> dict[str, Any]:
        return self.test_client(config)


telegram_storage_service = TelegramStorageService()
