from collections.abc import Sequence
from math import ceil

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from slugify import slugify
from sqlalchemy import func
from sqlalchemy.orm import Session, selectinload

from app.core.security import get_current_admin_user
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
from app.services.file_storage import cleanup_unreferenced_uploads

router = APIRouter()


def _movie_query(db: Session):
    return db.query(Movie).options(
        selectinload(Movie.categories),
        selectinload(Movie.tags),
        selectinload(Movie.subtitles),
        selectinload(Movie.stream_links),
        selectinload(Movie.download_links),
        selectinload(Movie.gallery),
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


def _normalize_search_term(value: str | None) -> str | None:
    normalized = value.strip() if value else ""
    return normalized or None


def _validate_relation_ids(
    db: Session,
    *,
    model: type[Category] | type[Tag],
    ids: Sequence[int],
    entity_name: str,
) -> list[Category] | list[Tag]:
    unique_ids = list(dict.fromkeys(ids))
    if not unique_ids:
        return []

    records = db.query(model).filter(model.id.in_(unique_ids)).all()
    records_by_id = {record.id: record for record in records}
    missing_ids = [value for value in unique_ids if value not in records_by_id]
    if missing_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid {entity_name} ids: {', '.join(str(value) for value in missing_ids)}",
        )
    return [records_by_id[value] for value in unique_ids]


def _sync_nested_relations(movie: Movie, payload: MovieCreate | MovieUpdate) -> None:
    subtitles = getattr(payload, "subtitles", None)
    if subtitles is not None:
        normalized_subtitles: list[Subtitle] = []
        default_subtitle_assigned = False
        for item in subtitles:
            subtitle = Subtitle(**item.model_dump(exclude={"id"}))
            if subtitle.is_default:
                if default_subtitle_assigned:
                    subtitle.is_default = False
                else:
                    default_subtitle_assigned = True
            normalized_subtitles.append(subtitle)
        movie.subtitles = normalized_subtitles

    stream_links = getattr(payload, "stream_links", None)
    if stream_links is not None:
        normalized_stream_links: list[StreamLink] = []
        primary_stream_assigned = False
        for item in stream_links:
            stream_link = StreamLink(**item.model_dump(exclude={"id"}))
            if stream_link.is_primary:
                if primary_stream_assigned:
                    stream_link.is_primary = False
                else:
                    primary_stream_assigned = True
            normalized_stream_links.append(stream_link)
        movie.stream_links = normalized_stream_links

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
        movie.categories = _validate_relation_ids(db, model=Category, ids=category_ids, entity_name="category")
    if tag_ids is not None:
        movie.tags = _validate_relation_ids(db, model=Tag, ids=tag_ids, entity_name="tag")
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


def _collect_movie_managed_file_urls(movie: Movie) -> list[str | None]:
    file_urls: list[str | None] = [
        movie.poster_url,
        movie.backdrop_url,
        movie.thumbnail_url,
        movie.open_graph_image,
    ]
    file_urls.extend(subtitle.file_url for subtitle in movie.subtitles)
    file_urls.extend(item.image_url for item in movie.gallery)
    return file_urls


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
        query = query.filter(Movie.categories.any(Category.slug == category))
    if year:
        query = query.filter(Movie.release_year == year)
    if language:
        query = query.filter(Movie.language == language)
    normalized_search = _normalize_search_term(search)
    if normalized_search:
        query = query.filter(Movie.title.ilike(f"%{normalized_search}%"))
    if status_filter:
        query = query.filter(Movie.status == status_filter)
    if is_published is not None:
        query = query.filter(Movie.is_published == is_published)
    elif not admin_view:
        query = query.filter(Movie.is_published.is_(True))
    if featured is not None:
        query = query.filter(Movie.featured == featured)

    total = query.with_entities(func.count(Movie.id)).scalar() or 0
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
    _log(db, request, current_admin, "create", movie)
    db.commit()
    return _movie_query(db).filter(Movie.id == movie.id).first()


@router.put("/{movie_id}", response_model=MovieResponse)
def update_movie(
    movie_id: int,
    movie_data: MovieUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user),
):
    movie = _movie_query(db).filter(Movie.id == movie_id).first()
    if not movie:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Movie not found")
    previous_file_urls = _collect_movie_managed_file_urls(movie)

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
    _log(db, request, current_admin, "update", movie)
    db.commit()
    cleanup_unreferenced_uploads(db, previous_file_urls)
    return _movie_query(db).filter(Movie.id == movie.id).first()


@router.delete("/{movie_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_movie(
    movie_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user),
):
    movie = _movie_query(db).filter(Movie.id == movie_id).first()
    if not movie:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Movie not found")
    previous_file_urls = _collect_movie_managed_file_urls(movie)
    _log(db, request, current_admin, "delete", movie)
    db.delete(movie)
    db.commit()
    cleanup_unreferenced_uploads(db, previous_file_urls)
    return None


@router.patch("/{movie_id}/publish", response_model=MovieResponse)
def publish_movie(
    movie_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user),
):
    movie = db.query(Movie).filter(Movie.id == movie_id).first()
    if not movie:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Movie not found")
    _set_publish_state(movie, True)
    _log(db, request, current_admin, "publish", movie)
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
