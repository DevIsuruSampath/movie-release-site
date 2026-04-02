from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import get_current_admin_user
from app.db.database import get_db
from app.models.seo import SEOMetadata
from app.models.user import User
from app.schemas.seo import SEOCreate, SEOResponse, SEOUpdate

router = APIRouter()


def _normalize_page_slug(page_slug: str | None) -> str | None:
    normalized = page_slug.strip() if page_slug else ""
    return normalized or None


def _find_existing_metadata(
    db: Session,
    *,
    page_type: str,
    page_slug: str | None,
    exclude_id: int | None = None,
) -> SEOMetadata | None:
    query = db.query(SEOMetadata).filter(
        SEOMetadata.page_type == page_type,
        SEOMetadata.page_slug.is_(page_slug) if page_slug is None else SEOMetadata.page_slug == page_slug,
    )
    if exclude_id is not None:
        query = query.filter(SEOMetadata.id != exclude_id)
    return query.first()


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
    normalized_page_slug = _normalize_page_slug(seo_data.page_slug)
    if _find_existing_metadata(db, page_type=seo_data.page_type, page_slug=normalized_page_slug):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="SEO metadata already exists for this page")

    seo = SEOMetadata(**seo_data.model_dump(), page_slug=normalized_page_slug)
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

    updates = seo_data.model_dump(exclude_unset=True)
    normalized_page_type = updates.get("page_type", seo.page_type)
    normalized_page_slug = _normalize_page_slug(updates.get("page_slug", seo.page_slug))
    if _find_existing_metadata(
        db,
        page_type=normalized_page_type,
        page_slug=normalized_page_slug,
        exclude_id=seo.id,
    ):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="SEO metadata already exists for this page")

    for field, value in updates.items():
        if field == "page_slug":
            value = normalized_page_slug
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
