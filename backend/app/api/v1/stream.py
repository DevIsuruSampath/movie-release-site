from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.security import get_current_admin_user
from app.db.database import get_db
from app.models.audit import AuditLog
from app.models.movie import Movie, StreamLink
from app.models.user import User
from app.schemas.movie import StreamLinkCreate, StreamLinkResponse, StreamLinkUpdate

router = APIRouter()


def _ensure_single_primary_stream(db: Session, movie_id: int, primary_link_id: int) -> None:
    db.query(StreamLink).filter(
        StreamLink.movie_id == movie_id,
        StreamLink.id != primary_link_id,
        StreamLink.is_primary.is_(True),
    ).update({"is_primary": False}, synchronize_session=False)


@router.get("/movie/{movie_id}", response_model=list[StreamLinkResponse])
def get_movie_stream_links(movie_id: int, db: Session = Depends(get_db)):
    return db.query(StreamLink).filter(StreamLink.movie_id == movie_id).order_by(StreamLink.sort_order.asc()).all()


@router.post("/movie/{movie_id}", response_model=StreamLinkResponse, status_code=status.HTTP_201_CREATED)
def create_stream_link(
    movie_id: int,
    link_data: StreamLinkCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user),
):
    movie = db.query(Movie).filter(Movie.id == movie_id).first()
    if not movie:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Movie not found")
    stream_link = StreamLink(movie_id=movie_id, **link_data.model_dump())
    db.add(stream_link)
    db.flush()
    if stream_link.is_primary:
        _ensure_single_primary_stream(db, movie_id, stream_link.id)
    db.add(
        AuditLog(
            actor_id=current_admin.id,
            action="create",
            entity_type="stream_link",
            entity_id=stream_link.id,
            description=f"Added stream link to {movie.title}",
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent"),
        )
    )
    db.commit()
    db.refresh(stream_link)
    return stream_link


@router.put("/{link_id}", response_model=StreamLinkResponse)
def update_stream_link(
    link_id: int,
    link_data: StreamLinkUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user),
):
    stream_link = db.query(StreamLink).filter(StreamLink.id == link_id).first()
    if not stream_link:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Stream link not found")
    for field, value in link_data.model_dump(exclude_unset=True).items():
        setattr(stream_link, field, value)
    if stream_link.is_primary:
        _ensure_single_primary_stream(db, stream_link.movie_id, stream_link.id)
    db.add(
        AuditLog(
            actor_id=current_admin.id,
            action="update",
            entity_type="stream_link",
            entity_id=stream_link.id,
            description=f"Updated stream link {stream_link.server_name}",
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent"),
        )
    )
    db.commit()
    db.refresh(stream_link)
    return stream_link


@router.delete("/{link_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_stream_link(
    link_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user),
):
    stream_link = db.query(StreamLink).filter(StreamLink.id == link_id).first()
    if not stream_link:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Stream link not found")
    db.add(
        AuditLog(
            actor_id=current_admin.id,
            action="delete",
            entity_type="stream_link",
            entity_id=stream_link.id,
            description=f"Deleted stream link {stream_link.server_name}",
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent"),
        )
    )
    db.delete(stream_link)
    db.commit()
