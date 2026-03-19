from math import ceil

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, Request, status
from slugify import slugify
from sqlalchemy.orm import Session, joinedload

from app.core.security import get_current_admin_user
from app.api.v1.telegram import run_background_movie_post
from app.db.database import get_db
from app.models.category import Category
from app.models.movie import DownloadLink, Movie, StreamLink
from app.models.subtitle import Subtitle
from app.models.tag import Tag
from app.models.user import User
from app.schemas.movie import (
    DownloadLinkInline,
    MovieCreate,
    MovieListResponse,
    MovieResponse,
    MovieUpdate,
    StreamLinkInline,
    SubtitleInline,
)
from app.services.audit_service import create_audit_log
from app.services.telegram_service import telegram_service
from app.services.telegram_storage_service import telegram_storage_service

router = APIRouter()


def _movie_query(db: Session):
    return db.query(Movie).options(
        joinedload(Movie.categories),
        joinedload(Movie.tags),
        joinedload(Movie.subtitles),
        joinedload(Movie.stream_links),
        joinedload(Movie.download_links),
        joinedload(Movie.gallery),
        joinedload(Movie.telegram_post_logs),
        joinedload(Movie.telegram_media_cache),
    )


def _resolve_slug(db: Session, raw_slug: str, movie_id: int | None = None) -> str:
    base_slug = slugify(raw_slug) or "movie"
    candidate = base_slug
    index = 1
    while True:
        query = db.query(Movie).filter(Movie.slug == candidate)
        if movie_id:
            query = query.filter(Movie.id != movie_id)
        if not query.first():
            return candidate
        index += 1
        candidate = f"{base_slug}-{index}"


def _sync_nested_relations(movie: Movie, payload: MovieCreate | MovieUpdate) -> None:
    subtitles = getattr(payload, "subtitles", None)
    if subtitles is not None:
        movie.subtitles = [Subtitle(**item.model_dump(exclude={"id"})) for item in subtitles]

    stream_links = getattr(payload, "stream_links", None)
    if stream_links is not None:
        movie.stream_links = [StreamLink(**item.model_dump(exclude={"id"})) for item in stream_links]

    download_links = getattr(payload, "download_links", None)
    if download_links is not None:
        movie.download_links = [DownloadLink(**item.model_dump(exclude={"id"})) for item in download_links]


def _sync_single_media_url(movie: Movie, payload: MovieCreate | MovieUpdate) -> None:
    media_url = getattr(payload, "media_url", None)
    if media_url is None:
        return

    normalized_url = media_url.strip()
    if not normalized_url:
        movie.stream_links = []
        movie.download_links = []
        movie.stream_enabled = False
        movie.download_enabled = False
        return

    movie.stream_links = [
        StreamLink(
            server_name="Primary",
            url=normalized_url,
            is_active=True,
            is_primary=True,
            sort_order=0,
        )
    ]
    movie.stream_enabled = True
    movie.download_enabled = True
    movie.download_links = [
        DownloadLink(
            provider="Direct",
            url=normalized_url,
            is_active=True,
            sort_order=0,
        )
    ]


def _apply_movie_relations(db: Session, movie: Movie, payload: MovieCreate | MovieUpdate) -> None:
    category_ids = getattr(payload, "category_ids", None)
    tag_ids = getattr(payload, "tag_ids", None)
    if category_ids is not None:
        movie.categories = db.query(Category).filter(Category.id.in_(category_ids)).all() if category_ids else []
    if tag_ids is not None:
        movie.tags = db.query(Tag).filter(Tag.id.in_(tag_ids)).all() if tag_ids else []
    _sync_nested_relations(movie, payload)
    _sync_single_media_url(movie, payload)


def _set_publish_state(movie: Movie, is_published: bool) -> None:
    movie.is_published = is_published
    movie.status = "published" if is_published else "draft"
    if is_published and not movie.published_at:
        from datetime import datetime, timezone

        movie.published_at = datetime.now(timezone.utc)
    if not is_published:
        movie.published_at = None


def _log(db: Session, request: Request, actor: User, action: str, movie: Movie) -> None:
    create_audit_log(
        db,
        request,
        actor,
        action=action,
        entity_type="movie",
        entity_id=movie.id,
        description=f"{action.title()}d movie {movie.title}",
    )


def _queue_telegram_post(background_tasks: BackgroundTasks, movie: Movie, db: Session, *, force_resend: bool, reason: str) -> None:
    config = telegram_service.get_settings(db)
    if not config.is_enabled or not config.channel_id:
        return
    pending_log = telegram_service.create_pending_log(db, movie, config, reason=reason, force_resend=force_resend)
    background_tasks.add_task(run_background_movie_post, movie.id, pending_log.id, force_resend, reason)


@router.get("", response_model=MovieListResponse)
def list_movies(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: str | None = Query(None),
    category: str | None = Query(None),
    year: int | None = Query(None),
    language: str | None = Query(None),
    status_filter: str | None = Query(None, alias="status"),
    is_published: bool | None = Query(None),
    featured: bool | None = Query(None),
    admin_view: bool = Query(False),
    db: Session = Depends(get_db),
):
    query = _movie_query(db)
    if category:
        query = query.join(Movie.categories).filter(Category.slug == category)
    if year:
        query = query.filter(Movie.release_year == year)
    if language:
        query = query.filter(Movie.language == language)
    if search:
        query = query.filter(Movie.title.ilike(f"%{search}%"))
    if status_filter:
        query = query.filter(Movie.status == status_filter)
    if is_published is not None:
        query = query.filter(Movie.is_published == is_published)
    elif not admin_view:
        query = query.filter(Movie.is_published.is_(True))
    if featured is not None:
        query = query.filter(Movie.featured == featured)

    total = query.distinct().count()
    items = (
        query.order_by(Movie.created_at.desc())
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )
    return MovieListResponse(
        items=items,
        total=total,
        page=page,
        pages=ceil(total / limit) if total else 1,
    )


@router.get("/id/{movie_id}", response_model=MovieResponse)
def get_movie_by_id(movie_id: int, db: Session = Depends(get_db)):
    movie = _movie_query(db).filter(Movie.id == movie_id).first()
    if not movie:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Movie not found")
    return movie


@router.get("/{slug}", response_model=MovieResponse)
def get_movie(slug: str, db: Session = Depends(get_db)):
    movie = _movie_query(db).filter(Movie.slug == slug).first()
    if not movie:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Movie not found")
    if not movie.is_published:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Movie not found")
    return movie


@router.post("", response_model=MovieResponse, status_code=status.HTTP_201_CREATED)
def create_movie(
    movie_data: MovieCreate,
    request: Request,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user),
):
    movie = Movie(
        **movie_data.model_dump(
            exclude={"slug", "media_url", "category_ids", "tag_ids", "subtitles", "stream_links", "download_links"}
        )
    )
    movie.slug = _resolve_slug(db, movie_data.slug or movie_data.title)
    _set_publish_state(movie, movie_data.is_published)
    db.add(movie)
    db.flush()
    _apply_movie_relations(db, movie, movie_data)
    telegram_storage_service.attach_movie_media(db, movie)
    _log(db, request, current_admin, "create", movie)
    if movie.is_published:
        config = telegram_service.get_settings(db)
        if config.is_enabled and config.auto_post_on_publish:
            _queue_telegram_post(background_tasks, movie, db, force_resend=False, reason="auto_publish")
    db.commit()
    return _movie_query(db).filter(Movie.id == movie.id).first()


@router.put("/{movie_id}", response_model=MovieResponse)
def update_movie(
    movie_id: int,
    movie_data: MovieUpdate,
    request: Request,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user),
):
    movie = _movie_query(db).filter(Movie.id == movie_id).first()
    if not movie:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Movie not found")

    updates = movie_data.model_dump(
        exclude_unset=True,
        exclude={"media_url", "category_ids", "tag_ids", "subtitles", "stream_links", "download_links"},
    )
    if "slug" in updates or "title" in updates:
        movie.slug = _resolve_slug(db, updates.get("slug") or updates.get("title") or movie.slug, movie.id)
    for field, value in updates.items():
        if field not in {"slug", "is_published"}:
            setattr(movie, field, value)
    if "is_published" in movie_data.model_dump(exclude_unset=True):
        _set_publish_state(movie, bool(movie_data.is_published))
    _apply_movie_relations(db, movie, movie_data)
    telegram_storage_service.attach_movie_media(db, movie)
    _log(db, request, current_admin, "update", movie)
    if movie.is_published:
        config = telegram_service.get_settings(db)
        if config.is_enabled and config.auto_post_on_update:
            _queue_telegram_post(background_tasks, movie, db, force_resend=False, reason="auto_update")
    db.commit()
    return _movie_query(db).filter(Movie.id == movie.id).first()


@router.delete("/{movie_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_movie(
    movie_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user),
):
    movie = db.query(Movie).filter(Movie.id == movie_id).first()
    if not movie:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Movie not found")
    _log(db, request, current_admin, "delete", movie)
    db.delete(movie)
    db.commit()


@router.patch("/{movie_id}/publish", response_model=MovieResponse)
def publish_movie(
    movie_id: int,
    request: Request,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user),
):
    movie = db.query(Movie).filter(Movie.id == movie_id).first()
    if not movie:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Movie not found")
    _set_publish_state(movie, True)
    _log(db, request, current_admin, "publish", movie)
    config = telegram_service.get_settings(db)
    if config.is_enabled and config.auto_post_on_publish:
        _queue_telegram_post(background_tasks, movie, db, force_resend=False, reason="auto_publish")
    db.commit()
    return _movie_query(db).filter(Movie.id == movie_id).first()


@router.patch("/{movie_id}/unpublish", response_model=MovieResponse)
def unpublish_movie(
    movie_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user),
):
    movie = db.query(Movie).filter(Movie.id == movie_id).first()
    if not movie:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Movie not found")
    _set_publish_state(movie, False)
    _log(db, request, current_admin, "unpublish", movie)
    db.commit()
    return _movie_query(db).filter(Movie.id == movie_id).first()
