from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.security import get_current_admin_user
from app.db.database import get_db
from app.models.audit import AuditLog
from app.models.movie import Movie
from app.models.subtitle import Subtitle
from app.models.user import User
from app.schemas.subtitle import SubtitleCreate, SubtitleListResponse, SubtitleResponse, SubtitleUpdate

router = APIRouter()


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
    db.add(
        AuditLog(
            actor_id=current_admin.id,
            action="create",
            entity_type="subtitle",
            entity_id=subtitle.id,
            description=f"Added subtitle to {movie.title}",
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent"),
        )
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
    for field, value in subtitle_data.model_dump(exclude_unset=True).items():
        setattr(subtitle, field, value)
    db.add(
        AuditLog(
            actor_id=current_admin.id,
            action="update",
            entity_type="subtitle",
            entity_id=subtitle.id,
            description=f"Updated subtitle {subtitle.label}",
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent"),
        )
    )
    db.commit()
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
    db.add(
        AuditLog(
            actor_id=current_admin.id,
            action="delete",
            entity_type="subtitle",
            entity_id=subtitle.id,
            description=f"Deleted subtitle {subtitle.label}",
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent"),
        )
    )
    db.delete(subtitle)
    db.commit()
