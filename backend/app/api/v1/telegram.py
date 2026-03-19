from __future__ import annotations

from pathlib import Path

from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, Query, Request, UploadFile, status
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.core.security import get_current_admin_user
from app.db.database import SessionLocal, get_db
from app.models.movie import Movie
from app.models.telegram import TelegramMediaCache
from app.models.user import User
from app.schemas.telegram import (
    TelegramMediaCacheListResponse,
    TelegramPostLogListResponse,
    TelegramSendRequest,
    TelegramSendResponse,
    TelegramSettingsResponse,
    TelegramSettingsUpdate,
    TelegramTestResponse,
    TelegramValidateChannelResponse,
)
from app.services.audit_service import create_audit_log
from app.services.file_storage import save_upload
from app.services.telegram_service import telegram_service
from app.services.telegram_storage_service import telegram_storage_service

router = APIRouter()


def run_background_movie_post(movie_id: int, log_id: int, force_resend: bool, reason: str) -> None:
    db = SessionLocal()
    try:
        movie = (
            db.query(Movie)
            .filter(Movie.id == movie_id)
            .first()
        )
        if not movie:
            return
        telegram_service.send_movie_post(db, movie, force_resend=force_resend, log_id=log_id, reason=reason)
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


@router.get("/settings", response_model=TelegramSettingsResponse)
def get_telegram_settings(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin_user),
):
    config = telegram_service.get_settings(db)
    return telegram_service.serialize_settings(db, config)


@router.put("/settings", response_model=TelegramSettingsResponse)
def update_telegram_settings(
    payload: TelegramSettingsUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user),
):
    config = telegram_service.update_settings(db, payload)
    create_audit_log(
        db,
        request,
        current_admin,
        action="update",
        entity_type="telegram_settings",
        entity_id=config.id,
        description="Updated Telegram integration settings",
        metadata_json={
            "is_enabled": config.is_enabled,
            "private_channel_id": config.private_channel_id,
            "auto_post_on_publish": config.auto_post_on_publish,
            "auto_post_on_update": config.auto_post_on_update,
            "enable_telegram_storage": config.enable_telegram_storage,
            "telegram_storage_mode": config.telegram_storage_mode,
        },
    )
    db.commit()
    db.refresh(config)
    return telegram_service.serialize_settings(db, config)


@router.post("/test", response_model=TelegramTestResponse)
def test_telegram_settings(
    request: Request,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user),
):
    result = telegram_service.test_connection(db)
    create_audit_log(
        db,
        request,
        current_admin,
        action="test",
        entity_type="telegram_settings",
        description="Tested Telegram configuration",
        metadata_json={"private_channel_id": result["private_channel_id"], "bot_username": result["bot_username"]},
    )
    db.commit()
    return result


@router.post("/validate-channel", response_model=TelegramValidateChannelResponse)
def validate_telegram_channel(
    request: Request,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user),
):
    result = telegram_service.validate_channel_access(db)
    create_audit_log(
        db,
        request,
        current_admin,
        action="validate",
        entity_type="telegram_settings",
        description="Validated Telegram private channel",
        metadata_json={"private_channel_id": result["private_channel_id"], "bot_username": result["bot_username"]},
    )
    db.commit()
    return result


@router.post("/movies/{movie_id}/send", response_model=TelegramSendResponse)
def send_movie_to_telegram(
    movie_id: int,
    payload: TelegramSendRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user),
):
    movie = db.query(Movie).filter(Movie.id == movie_id).first()
    if not movie:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Movie not found")

    result = telegram_service.send_movie_post(db, movie, force_resend=payload.force_resend, reason="manual")
    create_audit_log(
        db,
        request,
        current_admin,
        action="send",
        entity_type="telegram_post",
        entity_id=result.log.id,
        description=f"Sent movie {movie.title} to Telegram",
        metadata_json={"movie_id": movie.id, "status": result.status, "force_resend": payload.force_resend},
    )
    db.commit()
    return {
        "ok": result.ok,
        "status": result.status,
        "log_id": result.log.id,
        "telegram_chat_id": result.log.telegram_chat_id,
        "telegram_message_id": result.log.telegram_message_id,
        "error_message": result.error_message,
        "response_payload_json": result.response_payload_json,
        "send_mode": result.log.send_mode,
        "used_cached_media": result.log.used_cached_media,
    }


@router.post("/logs/{log_id}/retry", response_model=TelegramSendResponse)
def retry_telegram_log(
    log_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user),
):
    result = telegram_service.retry_failed_post(db, log_id)
    create_audit_log(
        db,
        request,
        current_admin,
        action="retry",
        entity_type="telegram_post",
        entity_id=result.log.id,
        description=f"Retried Telegram post log {result.log.id}",
        metadata_json={"movie_id": result.log.movie_id, "status": result.status},
    )
    db.commit()
    return {
        "ok": result.ok,
        "status": result.status,
        "log_id": result.log.id,
        "telegram_chat_id": result.log.telegram_chat_id,
        "telegram_message_id": result.log.telegram_message_id,
        "error_message": result.error_message,
        "response_payload_json": result.response_payload_json,
        "send_mode": result.log.send_mode,
        "used_cached_media": result.log.used_cached_media,
    }


@router.get("/logs", response_model=TelegramPostLogListResponse)
def get_telegram_logs(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    status_filter: str | None = Query(None, alias="status"),
    movie_id: int | None = Query(None),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin_user),
):
    return telegram_service.list_logs(db, page=page, limit=limit, status_filter=status_filter, movie_id=movie_id)


@router.get("/logs/{movie_id}", response_model=TelegramPostLogListResponse)
def get_movie_telegram_logs(
    movie_id: int,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin_user),
):
    return telegram_service.list_logs(db, page=page, limit=limit, movie_id=movie_id)


@router.post("/storage/upload-image")
async def upload_image_to_telegram_storage(
    file: UploadFile = File(...),
    media_role: str = Form("other"),
    movie_id: int | None = Form(None),
    request: Request | None = None,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user),
):
    saved = await save_upload(
        file,
        folder="images",
        allowed_extensions={".jpg", ".jpeg", ".png", ".webp", ".gif"},
        allowed_mime_types={"image/jpeg", "image/png", "image/webp", "image/gif"},
    )
    config = telegram_service.get_settings(db)
    payload = await telegram_storage_service.register_uploaded_media(
        db,
        config,
        file_path=Path(saved["local_file_path"]),
        file_url=saved["file_url"],
        media_role=media_role,
        movie_id=movie_id,
        original_filename=file.filename or saved["filename"],
        mime_type=saved["content_type"],
        file_size=saved["size"],
    )
    create_audit_log(
        db,
        request,
        current_admin,
        action="upload",
        entity_type="telegram_media",
        description=f"Uploaded image to Telegram storage as {media_role}",
        metadata_json={"movie_id": movie_id, "storage_source": payload["storage_source"]},
    )
    db.commit()
    return {**saved, **payload}


@router.post("/storage/upload-file")
async def upload_file_to_telegram_storage(
    file: UploadFile = File(...),
    media_role: str = Form("other"),
    movie_id: int | None = Form(None),
    request: Request | None = None,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user),
):
    saved = await save_upload(
        file,
        folder="temp",
        allowed_extensions={Path(file.filename or "upload").suffix.lower() or ".bin"},
        allowed_mime_types={file.content_type or "application/octet-stream"},
    )
    config = telegram_service.get_settings(db)
    payload = await telegram_storage_service.register_uploaded_media(
        db,
        config,
        file_path=Path(saved["local_file_path"]),
        file_url=saved["file_url"],
        media_role=media_role,
        movie_id=movie_id,
        original_filename=file.filename or saved["filename"],
        mime_type=saved["content_type"],
        file_size=saved["size"],
    )
    create_audit_log(
        db,
        request,
        current_admin,
        action="upload",
        entity_type="telegram_media",
        description=f"Uploaded file to Telegram storage as {media_role}",
        metadata_json={"movie_id": movie_id, "storage_source": payload["storage_source"]},
    )
    db.commit()
    return {**saved, **payload}


@router.get("/storage/media", response_model=TelegramMediaCacheListResponse)
def list_telegram_storage_media(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    movie_id: int | None = Query(None),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin_user),
):
    return telegram_storage_service.list_media(db, page=page, limit=limit, movie_id=movie_id)


@router.get("/storage/media/{media_id}/content")
def get_telegram_storage_media_content(
    media_id: int,
    db: Session = Depends(get_db),
):
    media = db.query(TelegramMediaCache).filter(TelegramMediaCache.id == media_id).first()
    if not media:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Telegram media not found")
    config = telegram_service.get_settings(db)
    content, media_type = telegram_storage_service.stream_media_content(config, media)
    return Response(content=content, media_type=media_type or "application/octet-stream")
