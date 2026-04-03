from math import ceil

from fastapi import APIRouter, Depends, Query
from sqlalchemy import case, func
from sqlalchemy.orm import Session, joinedload

from app.core.config import settings
from app.core.security import get_current_admin_user
from app.db.database import get_db
from app.models.audit import AuditLog
from app.models.category import Category
from app.models.movie import Movie
from app.models.tag import Tag
from app.models.user import User
from app.schemas.movie import MovieDashboardItem
from app.schemas.site_setting import AdminSettingsResponse, AdminSettingsUpdate
from app.services.file_storage import list_referenced_uploads
from app.services.site_settings import (
    MEDIA_BASE_URL_KEY,
    STORAGE_BACKEND_KEY,
    get_setting_value,
    resolve_storage_backend,
    set_setting_value,
)

router = APIRouter()


def _summarize_uploads(db: Session) -> dict[str, object]:
    images = list_referenced_uploads(db, folder="images")
    storage_sources = sorted({str(item.get("storage_source") or "unknown") for item in images})
    return {
        "configured_backend": resolve_storage_backend(db),
        "images_count": len(images),
        "total_count": len(images),
        "storage_sources": storage_sources,
    }


@router.get("/settings", response_model=AdminSettingsResponse)
def get_admin_settings(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin_user),
):
    return {
        "storage_backend": resolve_storage_backend(db),
        "media_base_url": get_setting_value(db, MEDIA_BASE_URL_KEY) or None,
    }


@router.put("/settings", response_model=AdminSettingsResponse)
def update_admin_settings(
    payload: AdminSettingsUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin_user),
):
    set_setting_value(db, STORAGE_BACKEND_KEY, payload.storage_backend)
    set_setting_value(db, MEDIA_BASE_URL_KEY, payload.media_base_url or "")
    db.commit()
    return {
        "storage_backend": payload.storage_backend,
        "media_base_url": payload.media_base_url,
    }


@router.get("/dashboard")
def get_dashboard(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin_user),
):
    total_categories_subquery = db.query(func.count(Category.id)).scalar_subquery()
    total_tags_subquery = db.query(func.count(Tag.id)).scalar_subquery()
    movie_totals = db.query(
        func.count(Movie.id).label("total_movies"),
        func.sum(case((Movie.is_published.is_(True), 1), else_=0)).label("total_published_movies"),
        func.sum(case((Movie.featured.is_(True), 1), else_=0)).label("total_featured_movies"),
        func.sum(case((Movie.stream_enabled.is_(True), 1), else_=0)).label("total_media_ready_movies"),
        func.sum(case(((Movie.trailer_url.isnot(None)) & (Movie.trailer_url != ""), 1), else_=0)).label("total_trailer_movies"),
        total_categories_subquery.label("total_categories"),
        total_tags_subquery.label("total_tags"),
    ).one()
    recent_movies = (
        db.query(Movie)
        .order_by(Movie.created_at.desc())
        .limit(5)
        .all()
    )
    recent_activity = (
        db.query(AuditLog)
        .options(joinedload(AuditLog.actor))
        .order_by(AuditLog.created_at.desc())
        .limit(10)
        .all()
    )
    upload_summary = _summarize_uploads(db)
    return {
        "total_movies": movie_totals.total_movies or 0,
        "total_published_movies": movie_totals.total_published_movies or 0,
        "total_featured_movies": movie_totals.total_featured_movies or 0,
        "total_media_ready_movies": movie_totals.total_media_ready_movies or 0,
        "total_trailer_movies": movie_totals.total_trailer_movies or 0,
        "total_categories": movie_totals.total_categories or 0,
        "total_tags": movie_totals.total_tags or 0,
        "upload_summary": upload_summary,
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
    total = db.query(func.count(AuditLog.id)).scalar() or 0
    items = (
        db.query(AuditLog)
        .options(joinedload(AuditLog.actor))
        .order_by(AuditLog.created_at.desc())
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )
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
