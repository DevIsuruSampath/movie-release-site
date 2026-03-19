from __future__ import annotations

from pathlib import Path
from typing import Any
from uuid import uuid4

import aiofiles
from fastapi import HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.category import Category
from app.models.movie import Movie, MovieGallery
from app.models.subtitle import Subtitle

UPLOAD_ROOT = Path(settings.UPLOAD_DIR)
IMAGE_DIR = UPLOAD_ROOT / "images"
SUBTITLE_DIR = UPLOAD_ROOT / "subtitles"
TEMP_DIR = UPLOAD_ROOT / "temp"
UPLOAD_DIRECTORIES = {
    "images": IMAGE_DIR,
    "subtitles": SUBTITLE_DIR,
    "temp": TEMP_DIR,
}


def ensure_upload_directories() -> None:
    for directory in UPLOAD_DIRECTORIES.values():
        directory.mkdir(parents=True, exist_ok=True)


def build_public_upload_url(folder: str, filename: str) -> str:
    return f"/uploads/{folder}/{filename}"


def relative_path_from_file_url(file_url: str | None) -> str | None:
    if not file_url or not file_url.startswith("/uploads/"):
        return None
    relative_path = file_url.removeprefix("/uploads/").strip("/")
    if not relative_path:
        return None
    return relative_path


def resolve_local_upload_path(file_url: str) -> Path | None:
    relative_path = relative_path_from_file_url(file_url)
    if not relative_path:
        return None
    candidate = (UPLOAD_ROOT / relative_path).resolve()
    if not str(candidate).startswith(str(UPLOAD_ROOT.resolve())):
        return None
    return candidate


def sanitize_extension(filename: str | None, default_extension: str = ".bin") -> str:
    extension = Path(filename or "upload").suffix.lower().strip()
    return extension or default_extension


async def save_upload(
    file: UploadFile,
    *,
    folder: str,
    allowed_extensions: set[str],
    allowed_mime_types: set[str],
) -> dict[str, Any]:
    ensure_upload_directories()
    if folder not in UPLOAD_DIRECTORIES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported upload folder")

    extension = sanitize_extension(file.filename)
    if extension not in allowed_extensions:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported file extension")

    if file.content_type not in allowed_mime_types:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported file type")

    content = await file.read()
    max_bytes = settings.MAX_FILE_SIZE_MB * 1024 * 1024
    if len(content) > max_bytes:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File exceeds maximum size")

    filename = f"{uuid4().hex}{extension}"
    target = UPLOAD_DIRECTORIES[folder] / filename

    async with aiofiles.open(target, "wb") as output:
        await output.write(content)

    return {
        "filename": filename,
        "file_url": build_public_upload_url(folder, filename),
        "local_file_path": str(target),
        "relative_path": f"{folder}/{filename}",
        "size": len(content),
        "content_type": file.content_type,
    }


def list_upload_items(folder: str) -> list[dict[str, Any]]:
    ensure_upload_directories()
    if folder not in UPLOAD_DIRECTORIES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported upload folder")

    items: list[dict[str, Any]] = []
    for file_path in sorted(UPLOAD_DIRECTORIES[folder].iterdir(), key=lambda item: item.stat().st_mtime, reverse=True):
        if file_path.is_file():
            stat = file_path.stat()
            items.append(
                {
                    "filename": file_path.name,
                    "file_url": build_public_upload_url(folder, file_path.name),
                    "size": stat.st_size,
                    "updated_at": stat.st_mtime,
                }
            )
    return items


def _add_reference(references: dict[str, list[dict[str, Any]]], file_url: str | None, reference: dict[str, Any]) -> None:
    relative_path = relative_path_from_file_url(file_url)
    if not relative_path:
        return
    references.setdefault(relative_path, []).append(reference)


def collect_upload_references(db: Session) -> dict[str, list[dict[str, Any]]]:
    references: dict[str, list[dict[str, Any]]] = {}

    for movie in db.query(Movie).all():
        _add_reference(references, movie.poster_url, {"entity": "movie", "entity_id": movie.id, "field": "poster_url", "label": movie.title})
        _add_reference(references, movie.backdrop_url, {"entity": "movie", "entity_id": movie.id, "field": "backdrop_url", "label": movie.title})
        _add_reference(references, movie.thumbnail_url, {"entity": "movie", "entity_id": movie.id, "field": "thumbnail_url", "label": movie.title})
        _add_reference(references, movie.open_graph_image, {"entity": "movie", "entity_id": movie.id, "field": "open_graph_image", "label": movie.title})

    for category in db.query(Category).all():
        _add_reference(references, category.image_url, {"entity": "category", "entity_id": category.id, "field": "image_url", "label": category.name})
        _add_reference(references, category.og_image, {"entity": "category", "entity_id": category.id, "field": "og_image", "label": category.name})

    for subtitle in db.query(Subtitle).all():
        _add_reference(references, subtitle.file_url, {"entity": "subtitle", "entity_id": subtitle.id, "field": "file_url", "label": subtitle.label})

    for gallery_item in db.query(MovieGallery).all():
        _add_reference(references, gallery_item.image_url, {"entity": "movie_gallery", "entity_id": gallery_item.id, "field": "image_url", "label": gallery_item.image_type})

    return references


def scan_orphaned_uploads(db: Session) -> dict[str, Any]:
    ensure_upload_directories()
    references = collect_upload_references(db)
    files: list[dict[str, Any]] = []
    orphan_files: list[dict[str, Any]] = []

    for folder, directory in UPLOAD_DIRECTORIES.items():
        for file_path in sorted(directory.rglob("*")):
            if not file_path.is_file():
                continue
            relative_path = str(file_path.relative_to(UPLOAD_ROOT))
            file_item = {
                "folder": folder,
                "relative_path": relative_path,
                "file_url": f"/uploads/{relative_path}",
                "size": file_path.stat().st_size,
                "references": references.get(relative_path, []),
            }
            files.append(file_item)
            if not file_item["references"]:
                orphan_files.append(file_item)

    return {
        "total_files": len(files),
        "orphaned_files": orphan_files,
        "files": files,
    }
