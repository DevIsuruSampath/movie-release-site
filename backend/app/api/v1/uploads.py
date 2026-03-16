from typing import List
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.core.config import settings
from app.api.v1.auth import get_current_user, check_admin
from app.models.movie import Movie
from app.schemas.movie import MovieGalleryCreate, MovieGalleryResponse
import os

router = APIRouter()


async def get_current_admin_user(current_user: dict = Depends(get_current_user)) -> dict:
    """Check if current user is admin."""
    if not current_user.get("is_superuser", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )
    return current_user


def upload_file(file: UploadFile = File, filename: str) -> dict:
    """Upload file to S3 storage."""
    try:
        import boto3
        from botocore.exceptions import BotoCoreError
        import uuid
        
        # Generate unique filename
        file_extension = filename.split(".")[-1]
        unique_filename = f"{uuid.uuid4().hex}.{file_extension}"
        
        # Upload to S3
        s3_client = boto3.client("s3")
        s3_client.upload_fileobj(
            file.file,
            settings.S3_BUCKET,
            unique_filename,
            ExtraArgs={'ContentType': file.content_type}
        )
        
        # Generate URL
        file_url = f"https://{settings.S3_BUCKET}.s3.amazonaws.com/{unique_filename}"
        
        return {"file_url": file_url, "filename": unique_filename}
    except BotoCoreError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload file: {str(e)}",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Upload failed: {str(e)}",
        )


@router.post("/image", status_code=status.HTTP_201_CREATED)
async def upload_image(
    file: UploadFile = File(..., max_size=10 * 1024 * 1024),  # 10MB max
    _: dict = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Upload image to S3 (admin only)."""
    # Validate file type
    allowed_types = ["image/jpeg", "image/png", "image/gif", "image/webp"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type. Only JPEG, PNG, GIF, and WebP allowed.",
        )
    
    # Upload file
    result = upload_file(file, file.filename or "upload.jpg")
    
    return {
        "file_url": result["file_url"],
        "filename": result["filename"],
        "message": "Image uploaded successfully",
    }
