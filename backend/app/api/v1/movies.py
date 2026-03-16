from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from slugify import slugify

from app.db.database import get_db
from app.models.movie import Movie, StreamLink, DownloadLink, MovieGallery
from app.models.category import Category
from app.schemas.movie import (
    MovieCreate, MovieUpdate, MovieResponse, MovieListResponse,
    StreamLinkCreate, StreamLinkResponse,
    DownloadLinkCreate, DownloadLinkResponse,
    MovieGalleryCreate, MovieGalleryResponse,
)
from app.api.v1.auth import get_current_user
from app.models.user import User

router = APIRouter()


def check_admin(current_user: User = Depends(get_current_user)) -> User:
    """Check if user is admin."""
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return current_user


# ============== PUBLIC Endpoints ==============

@router.get("", response_model=MovieListResponse)
def list_movies(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, le=100),
    category: Optional[str] = Query(None),
    year: Optional[int] = Query(None),
    language: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    is_published: Optional[bool] = Query(True),
    db: Session = Depends(get_db),
):
    """List movies with filters (public)."""
    query = db.query(Movie)
    
    if category:
        query = query.join(Movie.categories).filter(Category.slug == category)
    if year:
        query = query.filter(Movie.release_year == year)
    if language:
        query = query.filter(Movie.language == language)
    if search:
        query = query.filter(Movie.title.ilike(f"%{search}%"))
    if is_published is not None:
        query = query.filter(Movie.is_published == is_published)
    
    total = query.count()
    movies = query.offset(skip).limit(limit).all()
    
    pages = (total + limit - 1) // limit if limit > 0 else 0
    
    return MovieListResponse(
        items=[MovieResponse.from_orm(m) for m in movies],
        total=total,
        page=skip // limit + 1,
        pages=pages,
    )


@router.get("/{slug}", response_model=MovieResponse)
def get_movie(slug: str, db: Session = Depends(get_db)):
    """Get movie by slug (public)."""
    movie = db.query(Movie).filter(Movie.slug == slug).first()
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")
    return MovieResponse.from_orm(movie)


# ============== Admin Endpoints ==============

@router.post("", response_model=MovieResponse, status_code=status.HTTP_201_CREATED)
def create_movie(
    movie_data: MovieCreate,
    db: Session = Depends(get_db),
    _: User = Depends(check_admin),
):
    """Create a new movie (admin only)."""
    # Generate slug if not provided
    slug = movie_data.slug or slugify(movie_data.title)
    
    # Check slug uniqueness
    existing = db.query(Movie).filter(Movie.slug == slug).first()
    if existing:
        raise HTTPException(status_code=400, detail="Slug already exists")
    
    # Create movie
    movie = Movie(
        title=movie_data.title,
        slug=slug,
        original_title=movie_data.original_title,
        description=movie_data.description,
        short_description=movie_data.short_description,
        release_year=movie_data.release_year,
        release_date=movie_data.release_date,
        duration_minutes=movie_data.duration_minutes,
        language=movie_data.language,
        country=movie_data.country,
        imdb_rating=movie_data.imdb_rating,
        trailer_url=movie_data.trailer_url,
        age_rating=movie_data.age_rating,
        content_warning=movie_data.content_warning,
        visibility=movie_data.visibility,
        featured=movie_data.featured,
        stream_enabled=movie_data.stream_enabled,
        download_enabled=movie_data.download_enabled,
        meta_title=movie_data.meta_title,
        meta_description=movie_data.meta_description,
        meta_keywords=movie_data.meta_keywords,
        canonical_url=movie_data.canonical_url,
        open_graph_image=movie_data.open_graph_image,
    )
    
    # Add categories
    if movie_data.category_ids:
        categories = db.query(Category).filter(Category.id.in_(movie_data.category_ids)).all()
        movie.categories = categories
    
    db.add(movie)
    db.commit()
    db.refresh(movie)
    return MovieResponse.from_orm(movie)


@router.put("/{movie_id}", response_model=MovieResponse)
def update_movie(
    movie_id: int,
    movie_data: MovieUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(check_admin),
):
    """Update movie (admin only)."""
    movie = db.query(Movie).filter(Movie.id == movie_id).first()
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")
    
    update_data = movie_data.model_dump(exclude_unset=True)
    
    # Check slug uniqueness if updating
    if "slug" in update_data:
        existing = db.query(Movie).filter(
            Movie.slug == update_data["slug"],
            Movie.id != movie_id
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Slug already exists")
    
    for field, value in update_data.items():
        setattr(movie, field, value)
    
    db.commit()
    db.refresh(movie)
    return MovieResponse.from_orm(movie)


@router.delete("/{movie_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_movie(
    movie_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(check_admin),
):
    """Delete movie (admin only)."""
    movie = db.query(Movie).filter(Movie.id == movie_id).first()
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")
    
    db.delete(movie)
    db.commit()


@router.patch("/{movie_id}/publish", response_model=MovieResponse)
def publish_movie(
    movie_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(check_admin),
):
    """Publish movie (admin only)."""
    from datetime import datetime
    movie = db.query(Movie).filter(Movie.id == movie_id).first()
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")
    
    movie.is_published = True
    movie.published_at = datetime.utcnow()
    db.commit()
    db.refresh(movie)
    return MovieResponse.from_orm(movie)


@router.patch("/{movie_id}/unpublish", response_model=MovieResponse)
def unpublish_movie(
    movie_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(check_admin),
):
    """Unpublish movie (admin only)."""
    movie = db.query(Movie).filter(Movie.id == movie_id).first()
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")
    
    movie.is_published = False
    db.commit()
    db.refresh(movie)
    return MovieResponse.from_orm(movie)


# ============== Stream Links ==============

@router.post("/{movie_id}/stream-links", response_model=StreamLinkResponse, status_code=status.HTTP_201_CREATED)
def add_stream_link(
    movie_id: int,
    link_data: StreamLinkCreate,
    db: Session = Depends(get_db),
    _: User = Depends(check_admin),
):
    """Add stream link to movie (admin only)."""
    movie = db.query(Movie).filter(Movie.id == movie_id).first()
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")
    
    link = StreamLink(
        movie_id=movie_id,
        title=link_data.title,
        url=link_data.url,
        is_primary=link_data.is_primary,
        is_active=link_data.is_active,
        sort_order=link_data.sort_order,
        region_note=link_data.region_note,
    )
    db.add(link)
    db.commit()
    db.refresh(link)
    return StreamLinkResponse.from_orm(link)


@router.get("/{movie_id}/stream-links", response_model=List[StreamLinkResponse])
def get_stream_links(movie_id: int, db: Session = Depends(get_db)):
    """Get stream links for movie (public)."""
    links = db.query(StreamLink).filter(
        StreamLink.movie_id == movie_id,
        StreamLink.is_active == True
    ).order_by(StreamLink.sort_order).all()
    return [StreamLinkResponse.from_orm(l) for l in links]


@router.put("/stream-links/{link_id}", response_model=StreamLinkResponse)
def update_stream_link(
    link_id: int,
    link_data: StreamLinkUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(check_admin),
):
    """Update stream link (admin only)."""
    link = db.query(StreamLink).filter(StreamLink.id == link_id).first()
    if not link:
        raise HTTPException(status_code=404, detail="Stream link not found")
    
    update_data = link_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(link, field, value)
    
    db.commit()
    db.refresh(link)
    return StreamLinkResponse.from_orm(link)


@router.delete("/stream-links/{link_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_stream_link(
    link_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(check_admin),
):
    """Delete stream link (admin only)."""
    link = db.query(StreamLink).filter(StreamLink.id == link_id).first()
    if not link:
        raise HTTPException(status_code=404, detail="Stream link not found")
    
    db.delete(link)
    db.commit()


# ============== Download Links ==============

@router.post("/{movie_id}/download-links", response_model=DownloadLinkResponse, status_code=status.HTTP_201_CREATED)
def add_download_link(
    movie_id: int,
    link_data: DownloadLinkCreate,
    db: Session = Depends(get_db),
    _: User = Depends(check_admin),
):
    """Add download link in movie (admin only)."""
    movie = db.query(Movie).filter(Movie.id == movie_id).first()
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")
    
    link = DownloadLink(
        movie_id=movie_id,
        title=link_data.title,
        url=link_data.url,
        quality=link_data.quality,
        file_size=link_data.file_size,
        is_active=link_data.is_active,
        sort_order=link_data.sort_order,
    )
    db.add(link)
    db.commit()
    db.refresh(link)
    return DownloadLinkResponse.from_orm(link)


@router.get("/{movie_id}/download-links", response_model=List[DownloadLinkResponse])
def get_download_links(movie_id: int, db: Session = Depends(get_db)):
    """Get download links for movie (public)."""
    links = db.query(DownloadLink).filter(
        DownloadLink.movie_id == movie_id,
        DownloadLink.is_active == True
    ).order_by(DownloadLink.sort_order).all()
    return [DownloadLinkResponse.from_orm(l) for l in links]


@router.put("/download-links/{link_id}", response_model=DownloadLinkResponse)
def update_download_link(
    link_id: int,
    link_data: DownloadLinkUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(check_admin),
):
    """Update download link (admin only)."""
    link = db.query(DownloadLink).filter(DownloadLink.id == link_id).first()
    if not link:
        raise HTTPException(status_code=404, detail="Download link not found")
    
    update_data = link_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(link, field, value)
    
    db.commit()
    db.refresh(link)
    return DownloadLinkResponse.from_orm(link)


@router.delete("/download-links/{link_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_download_link(
    link_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(check_admin),
):
    """Delete download link (admin only)."""
    link = db.query(DownloadLink).filter(DownloadLink.id == link_id).first()
    if not link:
        raise HTTPException(status_code=404, detail="Download link not found")
    
    db.delete(link)
    db.commit()


# ============== Gallery ==============

@router.post("/{movie_id}/gallery", response_model=MovieGalleryResponse, status_code=status.HTTP_201_CREATED)
def add_gallery_image(
    movie_id: int,
    gallery_data: MovieGalleryCreate,
    db: Session = Depends(get_db),
    _: User = Depends(check_admin),
):
    """Add gallery image to movie (admin only)."""
    movie = db.query(Movie).filter(Movie.id == movie_id).first()
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")
    
    gallery = MovieGallery(
        movie_id=movie_id,
        image_url=gallery_data.image_url,
        image_type=gallery_data.image_type,
        sort_order=gallery_data.sort_order,
    )
    db.add(gallery)
    db.commit()
    db.refresh(gallery)
    return MovieGalleryResponse.from_orm(gallery)


@router.get("/{movie_id}/gallery", response_model=List[MovieGalleryResponse])
def get_movie_gallery(movie_id: int, db: Session = Depends(get_db)):
    """Get movie gallery (public)."""
    gallery = db.query(MovieGallery).filter(
        MovieGallery.movie_id == movie_id
    ).order_by(MovieGallery.sort_order).all()
    return [MovieGalleryResponse.from_orm(g) for g in gallery]
