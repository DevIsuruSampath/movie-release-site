from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, Request, UploadFile, status

from app.core.security import get_current_admin_user
from app.db.database import get_db
from app.models.user import User
from app.services.audit_service import create_audit_log
from app.services.file_storage import list_upload_items, save_upload, scan_orphaned_uploads
from app.services.telegram_service import telegram_service
from app.services.telegram_storage_service import telegram_storage_service
from sqlalchemy.orm import Session

router = APIRouter()
IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}
SUBTITLE_TYPES = {"application/x-subrip", "text/vtt", "text/plain", "application/octet-stream"}
SUBTITLE_EXTENSIONS = {".srt", ".vtt", ".ass"}


@router.post("/image", status_code=status.HTTP_201_CREATED)
async def upload_image(
    file: UploadFile = File(...),
    media_role: str = Form("other"),
    movie_id: int | None = Form(None),
    request: Request | None = None,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user),
):
    payload = await save_upload(
        file,
        folder="images",
        allowed_extensions=IMAGE_EXTENSIONS,
        allowed_mime_types=IMAGE_TYPES,
    )
    config = telegram_service.get_settings(db)
    storage_payload = await telegram_storage_service.register_uploaded_media(
        db,
        config,
        file_path=Path(payload["local_file_path"]),
        file_url=payload["file_url"],
        media_role=media_role,
        movie_id=movie_id,
        original_filename=file.filename or payload["filename"],
        mime_type=payload["content_type"],
        file_size=payload["size"],
    )
    payload.update(storage_payload)
    create_audit_log(
        db,
        request,
        current_admin,
        action="upload",
        entity_type="image",
        description=f"Uploaded image {payload['filename']}",
        metadata_json={"file_url": payload["file_url"], "content_type": payload["content_type"]},
    )
    db.commit()
    return payload


@router.post("/subtitle", status_code=status.HTTP_201_CREATED)
async def upload_subtitle(
    file: UploadFile = File(...),
    movie_id: int | None = Form(None),
    request: Request | None = None,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user),
):
    payload = await save_upload(
        file,
        folder="subtitles",
        allowed_extensions=SUBTITLE_EXTENSIONS,
        allowed_mime_types=SUBTITLE_TYPES,
    )
    config = telegram_service.get_settings(db)
    storage_payload = await telegram_storage_service.register_uploaded_media(
        db,
        config,
        file_path=Path(payload["local_file_path"]),
        file_url=payload["file_url"],
        media_role="subtitle",
        movie_id=movie_id,
        original_filename=file.filename or payload["filename"],
        mime_type=payload["content_type"],
        file_size=payload["size"],
    )
    payload.update(storage_payload)
    create_audit_log(
        db,
        request,
        current_admin,
        action="upload",
        entity_type="subtitle_file",
        description=f"Uploaded subtitle {payload['filename']}",
        metadata_json={"file_url": payload["file_url"], "content_type": payload["content_type"]},
    )
    db.commit()
    return payload


@router.get("/images")
def list_images(_: User = Depends(get_current_admin_user)):
    return list_upload_items("images")


@router.get("/subtitles")
def list_subtitles(_: User = Depends(get_current_admin_user)):
    return list_upload_items("subtitles")


@router.get("/orphans")
def list_orphan_uploads(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin_user),
):
    return scan_orphaned_uploads(db)
