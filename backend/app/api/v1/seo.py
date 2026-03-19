from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import get_current_admin_user
from app.db.database import get_db
from app.models.seo import SEOMetadata
from app.models.user import User
from app.schemas.seo import SEOCreate, SEOResponse, SEOUpdate

router = APIRouter()


@router.get("", response_model=list[SEOResponse])
def list_seo(page_type: str | None = None, db: Session = Depends(get_db)):
    query = db.query(SEOMetadata)
    if page_type:
        query = query.filter(SEOMetadata.page_type == page_type)
    return query.order_by(SEOMetadata.created_at.desc()).all()


@router.post("", response_model=SEOResponse, status_code=status.HTTP_201_CREATED)
def create_seo_metadata(
    seo_data: SEOCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin_user),
):
    seo = SEOMetadata(**seo_data.model_dump())
    db.add(seo)
    db.commit()
    db.refresh(seo)
    return seo


@router.put("/{seo_id}", response_model=SEOResponse)
def update_seo_metadata(
    seo_id: int,
    seo_data: SEOUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin_user),
):
    seo = db.query(SEOMetadata).filter(SEOMetadata.id == seo_id).first()
    if not seo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="SEO metadata not found")
    for field, value in seo_data.model_dump(exclude_unset=True).items():
        setattr(seo, field, value)
    db.commit()
    db.refresh(seo)
    return seo


@router.delete("/{seo_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_seo_metadata(
    seo_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin_user),
):
    seo = db.query(SEOMetadata).filter(SEOMetadata.id == seo_id).first()
    if not seo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="SEO metadata not found")
    db.delete(seo)
    db.commit()
