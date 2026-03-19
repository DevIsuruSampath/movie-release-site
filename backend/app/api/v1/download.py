from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.security import get_current_admin_user
from app.db.database import get_db
from app.models.audit import AuditLog
from app.models.movie import DownloadLink, Movie
from app.models.user import User
from app.schemas.movie import DownloadLinkCreate, DownloadLinkResponse, DownloadLinkUpdate

router = APIRouter()


@router.get("/movie/{movie_id}", response_model=list[DownloadLinkResponse])
def get_movie_download_links(movie_id: int, db: Session = Depends(get_db)):
    return db.query(DownloadLink).filter(DownloadLink.movie_id == movie_id).order_by(DownloadLink.sort_order.asc()).all()


@router.post("/movie/{movie_id}", response_model=DownloadLinkResponse, status_code=status.HTTP_201_CREATED)
def create_download_link(
    movie_id: int,
    link_data: DownloadLinkCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user),
):
    movie = db.query(Movie).filter(Movie.id == movie_id).first()
    if not movie:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Movie not found")
    download_link = DownloadLink(movie_id=movie_id, **link_data.model_dump())
    db.add(download_link)
    db.flush()
    db.add(
        AuditLog(
            actor_id=current_admin.id,
            action="create",
            entity_type="download_link",
            entity_id=download_link.id,
            description=f"Added download link to {movie.title}",
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent"),
        )
    )
    db.commit()
    db.refresh(download_link)
    return download_link


@router.put("/{link_id}", response_model=DownloadLinkResponse)
def update_download_link(
    link_id: int,
    link_data: DownloadLinkUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user),
):
    download_link = db.query(DownloadLink).filter(DownloadLink.id == link_id).first()
    if not download_link:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Download link not found")
    for field, value in link_data.model_dump(exclude_unset=True).items():
        setattr(download_link, field, value)
    db.add(
        AuditLog(
            actor_id=current_admin.id,
            action="update",
            entity_type="download_link",
            entity_id=download_link.id,
            description=f"Updated download link {download_link.provider}",
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent"),
        )
    )
    db.commit()
    db.refresh(download_link)
    return download_link


@router.delete("/{link_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_download_link(
    link_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user),
):
    download_link = db.query(DownloadLink).filter(DownloadLink.id == link_id).first()
    if not download_link:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Download link not found")
    db.add(
        AuditLog(
            actor_id=current_admin.id,
            action="delete",
            entity_type="download_link",
            entity_id=download_link.id,
            description=f"Deleted download link {download_link.provider}",
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent"),
        )
    )
    db.delete(download_link)
    db.commit()
