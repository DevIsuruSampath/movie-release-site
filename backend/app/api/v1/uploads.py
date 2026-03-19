from pathlib import Path
from uuid import uuid4

import aiofiles
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status

from app.core.config import settings
from app.core.security import get_current_admin_user
from app.models.user import User

router = APIRouter()

UPLOAD_DIR = Path(settings.UPLOAD_DIR)
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}


def _public_url(filename: str) -> str:
    return f"/uploads/{filename}"


@router.post("/image", status_code=status.HTTP_201_CREATED)
async def upload_image(
    file: UploadFile = File(...),
    _: User = Depends(get_current_admin_user),
):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported file type")

    content = await file.read()
    max_bytes = settings.MAX_FILE_SIZE_MB * 1024 * 1024
    if len(content) > max_bytes:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File exceeds maximum size")

    extension = Path(file.filename or "upload").suffix.lower() or ".bin"
    filename = f"{uuid4().hex}{extension}"
    target = UPLOAD_DIR / filename

    async with aiofiles.open(target, "wb") as out_file:
        await out_file.write(content)

    return {
        "filename": filename,
        "file_url": _public_url(filename),
        "size": len(content),
        "content_type": file.content_type,
    }


@router.get("/images")
def list_images(_: User = Depends(get_current_admin_user)):
    items = []
    for file_path in sorted(UPLOAD_DIR.iterdir(), key=lambda item: item.stat().st_mtime, reverse=True):
        if file_path.is_file():
            stat = file_path.stat()
            items.append(
                {
                    "filename": file_path.name,
                    "file_url": _public_url(file_path.name),
                    "size": stat.st_size,
                    "updated_at": stat.st_mtime,
                }
            )
    return items
