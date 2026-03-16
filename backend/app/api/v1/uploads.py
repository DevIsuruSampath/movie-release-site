from typing import List
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.api.v1.auth import get_current_user, check_admin
from app.models.movie import Movie
from app.schemas.movie import MovieGalleryCreate, MovieGalleryResponse
import aiofiles
from pathlib import Path
import shutil
from datetime import datetime

router = APIRouter()

# Local storage configuration
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
ALLOWED_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp"}


async def get_current_admin_user(current_user: dict = Depends(get_current_user)) -> dict:
    """Check if current user is admin."""
    if not current_user.get("is_superuser", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )
    return current_user


def get_unique_filename(filename: str) -> str:
    """Generate unique filename."""
    from app.models.movie import Movie
    import uuid
    
    file_extension = filename.split(".")[-1]
    unique_name = f"{uuid.uuid4().hex}.{file_extension}"
    return unique_name


@router.post("/image", status_code=status.HTTP_201_CREATED)
async def upload_image(
    file: UploadFile = File(..., max_size=MAX_FILE_SIZE),
    _: dict = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Upload image to local storage (admin only)."""
    # Validate file type
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type. Only JPEG, PNG, GIF, and WebP allowed.",
        )
    
    # Generate unique filename
    unique_filename = get_unique_filename(file.filename)
    file_location = UPLOAD_DIR / unique_filename
    
    # Save file locally
    try:
        async with aiofiles.open(file_location, "wb") as out_file:
            content = await file.read()
            await out_file.write(content)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save file: {str(e)}",
        )
    
    # Generate URL path (relative to backend)
    file_url = f"/uploads/{unique_filename}"
    
    return {
        "file_url": file_url,
        "filename": unique_filename,
        "size": len(content),
        "message": "Image uploaded successfully",
    }


@router.get("/image/{filename}", status_code=status.HTTP_200_OK)
async def get_image(filename: str):
    """Get uploaded image by filename."""
    file_location = UPLOAD_DIR / filename
    
    if not file_location.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Image not found",
        )
    
    from fastapi.responses import FileResponse
    return FileResponse(
        path=str(file_location),
        media_type="image/jpeg",
        filename=filename,
    )


@router.delete("/image/{filename}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_image(
    filename: str,
    _: dict = Depends(get_current_admin_user),
):
    """Delete uploaded image (admin only)."""
    file_location = UPLOAD_DIR / filename
    
    if not file_location.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Image not found",
        )
    
    try:
        file_location.unlink()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete file: {str(e)}",
        )


@router.get("/list", status_code=status.HTTP_200_OK)
async def list_images(_: dict = Depends(get_current_admin_user)):
    """List all uploaded images (admin only)."""
    images = []
    
    for file_path in UPLOAD_DIR.iterdir():
        if file_path.is_file():
            stat = file_path.stat()
            images.append({
                "filename": file_path.name,
                "size": stat.st_size,
                "created": datetime.fromtimestamp(stat.st_mtime).isoformat(),
            })
    
    return images


@router.post("/cleanup", status_code=status.HTTP_200_OK)
async def cleanup_unused_images(
    _: dict = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Clean up unused images (admin only)."""
    # Get all used image URLs from database
    result = db.execute(
        "SELECT DISTINCT poster_url, backdrop_url, thumbnail_url, open_graph_image FROM movies WHERE poster_url IS NOT NULL OR backdrop_url IS NOT NULL"
    )
    used_urls = set()
    for row in result:
        for url in row:
            if url and url.startswith("/uploads/"):
                used_urls.add(url.split("/")[-1])
    
    # Delete unused files
    deleted_count = 0
    for file_path in UPLOAD_DIR.iterdir():
        if file_path.is_file() and file_path.name not in used_urls:
            try:
                file_path.unlink()
                deleted_count += 1
            except Exception as e:
                pass
    
    return {
        "message": f"Cleaned up {deleted_count} unused images",
        "deleted_count": deleted_count,
    }
