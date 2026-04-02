from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile, status
from sqlalchemy.orm import Session

from app.core.security import get_current_admin_user
from app.db.database import get_db
from app.models.movie import Movie
from app.models.subtitle import Subtitle
from app.models.user import User
from app.schemas.subtitle import SubtitleCreate, SubtitleListResponse, SubtitleResponse, SubtitleUpdate
from app.services.audit_service import create_audit_log
from app.services.file_storage import cleanup_unreferenced_uploads, save_upload

router = APIRouter()


def _ensure_single_default_subtitle(db: Session, movie_id: int, default_subtitle_id: int) -> None:
    db.query(Subtitle).filter(
        Subtitle.movie_id == movie_id,
        Subtitle.id != default_subtitle_id,
        Subtitle.is_default.is_(True),
    ).update({"is_default": False}, synchronize_session=False)


@router.get("/movie/{movie_id}", response_model=SubtitleListResponse)
def get_movie_subtitles(movie_id: int, db: Session = Depends(get_db)):
    items = db.query(Subtitle).filter(Subtitle.movie_id == movie_id).order_by(Subtitle.sort_order.asc()).all()
    return SubtitleListResponse(items=items, total=len(items))


@router.post("/movie/{movie_id}", response_model=SubtitleResponse, status_code=status.HTTP_201_CREATED)
def create_subtitle(
    movie_id: int,
    subtitle_data: SubtitleCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user),
):
    movie = db.query(Movie).filter(Movie.id == movie_id).first()
    if not movie:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Movie not found")
    subtitle = Subtitle(movie_id=movie_id, **subtitle_data.model_dump())
    db.add(subtitle)
    db.flush()
    if subtitle.is_default:
        _ensure_single_default_subtitle(db, movie_id, subtitle.id)
    create_audit_log(
        db,
        request,
        current_admin,
        action="create",
        entity_type="subtitle",
        entity_id=subtitle.id,
        description=f"Added subtitle to {movie.title}",
    )
    db.commit()
    db.refresh(subtitle)
    return subtitle


@router.put("/{subtitle_id}", response_model=SubtitleResponse)
def update_subtitle(
    subtitle_id: int,
    subtitle_data: SubtitleUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user),
):
    subtitle = db.query(Subtitle).filter(Subtitle.id == subtitle_id).first()
    if not subtitle:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subtitle not found")
    previous_file_urls = [subtitle.file_url]
    for field, value in subtitle_data.model_dump(exclude_unset=True).items():
        setattr(subtitle, field, value)
    if subtitle.is_default:
        _ensure_single_default_subtitle(db, subtitle.movie_id, subtitle.id)
    create_audit_log(
        db,
        request,
        current_admin,
        action="update",
        entity_type="subtitle",
        entity_id=subtitle.id,
        description=f"Updated subtitle {subtitle.label}",
    )
    db.commit()
    cleanup_unreferenced_uploads(db, previous_file_urls)
    db.refresh(subtitle)
    return subtitle


@router.delete("/{subtitle_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_subtitle(
    subtitle_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user),
):
    subtitle = db.query(Subtitle).filter(Subtitle.id == subtitle_id).first()
    if not subtitle:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subtitle not found")
    previous_file_urls = [subtitle.file_url]
    create_audit_log(
        db,
        request,
        current_admin,
        action="delete",
        entity_type="subtitle",
        entity_id=subtitle.id,
        description=f"Deleted subtitle {subtitle.label}",
    )
    db.delete(subtitle)
    db.commit()
    cleanup_unreferenced_uploads(db, previous_file_urls)


@router.post("/upload", status_code=status.HTTP_201_CREATED)
async def upload_subtitle_file(
    request: Request,
    file: UploadFile = File(...),
    movie_id: int | None = Form(None),
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user),
):
    payload = await save_upload(
        file,
        folder="subtitles",
        allowed_extensions={".srt", ".vtt", ".ass"},
        allowed_mime_types={"application/x-subrip", "text/vtt", "text/plain", "application/octet-stream"},
    )
    create_audit_log(
        db,
        request,
        current_admin,
        action="upload",
        entity_type="subtitle_file",
        description=f"Uploaded subtitle file {payload['filename']}",
        metadata_json={"file_url": payload["file_url"]},
    )
    db.commit()
    return payload
