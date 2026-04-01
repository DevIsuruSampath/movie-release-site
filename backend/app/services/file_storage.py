from __future__ import annotations

from pathlib import Path, PurePosixPath
from typing import Any
from uuid import uuid4

import aiofiles
from fastapi import HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.category import Category
from app.models.movie import Movie, MovieGallery
from app.models.subtitle import Subtitle
from app.services.supabase_storage import supabase_storage

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
    if settings.STORAGE_BACKEND == "supabase":
        return
    for directory in UPLOAD_DIRECTORIES.values():
        directory.mkdir(parents=True, exist_ok=True)


def build_public_upload_url(folder: str, filename: str) -> str:
    return f"/uploads/{folder}/{filename}"


def relative_path_from_file_url(file_url: str | None) -> str | None:
    if not file_url or not file_url.startswith("/uploads/"):
        return None
    relative_path = PurePosixPath(file_url.removeprefix("/uploads/").strip("/"))
    if not relative_path.parts:
        return None
    normalized = relative_path.as_posix()
    if normalized in {".", ""} or any(part in {"..", ""} for part in relative_path.parts):
        return None
    return normalized


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
    if folder not in UPLOAD_DIRECTORIES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported upload folder")

    extension = sanitize_extension(file.filename)
    if extension not in allowed_extensions:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported file extension")

    if file.content_type not in allowed_mime_types:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported file type")

    max_bytes = settings.MAX_FILE_SIZE_MB * 1024 * 1024
    filename = f"{uuid4().hex}{extension}"
    if settings.STORAGE_BACKEND == "supabase":
        content = await file.read()
        if len(content) > max_bytes:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File exceeds maximum size")
        bucket = supabase_storage.bucket_for_folder(folder)
        file_url = supabase_storage.upload_bytes(
            bucket=bucket,
            path=filename,
            content=content,
            content_type=file.content_type or "application/octet-stream",
        )
        return {
            "filename": filename,
            "file_url": file_url,
            "relative_path": f"{bucket}/{filename}",
            "size": len(content),
            "content_type": file.content_type,
            "storage_source": "supabase",
        }

    ensure_upload_directories()
    target = UPLOAD_DIRECTORIES[folder] / filename
    total_bytes = 0
    async with aiofiles.open(target, "wb") as output:
        while chunk := await file.read(1024 * 1024):
            total_bytes += len(chunk)
            if total_bytes > max_bytes:
                await output.close()
                target.unlink(missing_ok=True)
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File exceeds maximum size")
            await output.write(chunk)

    return {
        "filename": filename,
        "file_url": build_public_upload_url(folder, filename),
        "local_file_path": str(target),
        "relative_path": f"{folder}/{filename}",
        "size": total_bytes,
        "content_type": file.content_type,
        "storage_source": "local",
    }


def list_upload_items(folder: str) -> list[dict[str, Any]]:
    if settings.STORAGE_BACKEND == "supabase":
        return [
            {
                "filename": item.path,
                "file_url": item.public_url,
                "relative_path": f"{item.bucket}/{item.path}",
                "size": item.size or 0,
                "updated_at": item.updated_at,
                "storage_source": "supabase",
            }
            for item in supabase_storage.list_objects(folder=folder)
        ]

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
                    "relative_path": f"{folder}/{file_path.name}",
                    "size": stat.st_size,
                    "updated_at": stat.st_mtime,
                    "storage_source": "local",
                }
            )
    return items


def _add_reference(references: dict[str, list[dict[str, Any]]], file_url: str | None, reference: dict[str, Any]) -> None:
    normalized_key = normalize_upload_key(file_url)
    if not normalized_key:
        return
    references.setdefault(normalized_key, []).append(reference)


def normalize_upload_key(file_url: str | None) -> str | None:
    relative_path = relative_path_from_file_url(file_url)
    if relative_path:
        return f"local:{relative_path}"

    supabase_path = supabase_storage.normalize_public_url(file_url)
    if supabase_path:
        return f"supabase:{supabase_path}"

    return None


def collect_upload_references(db: Session) -> dict[str, list[dict[str, Any]]]:
    references: dict[str, list[dict[str, Any]]] = {}

    for movie_id, title, poster_url, backdrop_url, thumbnail_url, open_graph_image in db.query(
        Movie.id,
        Movie.title,
        Movie.poster_url,
        Movie.backdrop_url,
        Movie.thumbnail_url,
        Movie.open_graph_image,
    ):
        _add_reference(references, poster_url, {"entity": "movie", "entity_id": movie_id, "field": "poster_url", "label": title})
        _add_reference(references, backdrop_url, {"entity": "movie", "entity_id": movie_id, "field": "backdrop_url", "label": title})
        _add_reference(references, thumbnail_url, {"entity": "movie", "entity_id": movie_id, "field": "thumbnail_url", "label": title})
        _add_reference(references, open_graph_image, {"entity": "movie", "entity_id": movie_id, "field": "open_graph_image", "label": title})

    for category_id, name, image_url, og_image in db.query(
        Category.id,
        Category.name,
        Category.image_url,
        Category.og_image,
    ):
        _add_reference(references, image_url, {"entity": "category", "entity_id": category_id, "field": "image_url", "label": name})
        _add_reference(references, og_image, {"entity": "category", "entity_id": category_id, "field": "og_image", "label": name})

    for subtitle_id, label, file_url in db.query(Subtitle.id, Subtitle.label, Subtitle.file_url):
        _add_reference(references, file_url, {"entity": "subtitle", "entity_id": subtitle_id, "field": "file_url", "label": label})

    for gallery_item_id, image_type, image_url in db.query(MovieGallery.id, MovieGallery.image_type, MovieGallery.image_url):
        _add_reference(
            references,
            image_url,
            {"entity": "movie_gallery", "entity_id": gallery_item_id, "field": "image_url", "label": image_type},
        )

    return references


def scan_orphaned_uploads(db: Session) -> dict[str, Any]:
    references = collect_upload_references(db)
    files: list[dict[str, Any]] = []
    orphan_files: list[dict[str, Any]] = []

    if settings.STORAGE_BACKEND == "supabase":
        for folder in ("images", "subtitles"):
            for item in list_upload_items(folder):
                key = f"supabase:{item['relative_path']}"
                file_item = {
                    "folder": folder,
                    "relative_path": item["relative_path"],
                    "file_url": item["file_url"],
                    "size": item["size"],
                    "references": references.get(key, []),
                    "storage_source": "supabase",
                }
                files.append(file_item)
                if not file_item["references"]:
                    orphan_files.append(file_item)
        return {
            "total_files": len(files),
            "orphaned_files": orphan_files,
            "files": files,
        }

    ensure_upload_directories()
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
                "references": references.get(f"local:{relative_path}", []),
                "storage_source": "local",
            }
            files.append(file_item)
            if not file_item["references"]:
                orphan_files.append(file_item)

    return {
        "total_files": len(files),
        "orphaned_files": orphan_files,
        "files": files,
    }
