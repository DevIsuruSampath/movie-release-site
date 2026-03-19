from math import ceil

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.security import get_current_admin_user
from app.db.database import get_db
from app.models.audit import AuditLog
from app.models.category import Category
from app.models.movie import DownloadLink, Movie, StreamLink
from app.models.subtitle import Subtitle
from app.models.tag import Tag
from app.models.user import User
from app.schemas.movie import MovieDashboardItem

router = APIRouter()


@router.get("/dashboard")
def get_dashboard(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin_user),
):
    recent_movies = (
        db.query(Movie)
        .order_by(Movie.created_at.desc())
        .limit(5)
        .all()
    )
    recent_activity = (
        db.query(AuditLog)
        .order_by(AuditLog.created_at.desc())
        .limit(10)
        .all()
    )
    return {
        "total_movies": db.query(Movie).count(),
        "total_categories": db.query(Category).count(),
        "total_tags": db.query(Tag).count(),
        "total_subtitles": db.query(Subtitle).count(),
        "total_stream_links": db.query(StreamLink).count(),
        "total_download_links": db.query(DownloadLink).count(),
        "recent_movies": [MovieDashboardItem.model_validate(movie).model_dump() for movie in recent_movies],
        "recent_activity": [
            {
                "id": log.id,
                "actor_id": log.actor_id,
                "actor_name": log.actor.full_name if log.actor else None,
                "actor_email": log.actor.email if log.actor else None,
                "action": log.action,
                "entity_type": log.entity_type,
                "entity_id": log.entity_id,
                "description": log.description,
                "created_at": log.created_at,
            }
            for log in recent_activity
        ],
    }


@router.get("/activity")
def get_activity(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin_user),
):
    query = db.query(AuditLog).order_by(AuditLog.created_at.desc())
    total = query.count()
    items = query.offset((page - 1) * limit).limit(limit).all()
    return {
        "items": [
            {
                "id": log.id,
                "actor_id": log.actor_id,
                "actor_name": log.actor.full_name if log.actor else None,
                "actor_email": log.actor.email if log.actor else None,
                "action": log.action,
                "entity_type": log.entity_type,
                "entity_id": log.entity_id,
                "description": log.description,
                "metadata_json": log.metadata_json,
                "created_at": log.created_at,
            }
            for log in items
        ],
        "total": total,
        "page": page,
        "pages": ceil(total / limit) if total else 1,
    }
