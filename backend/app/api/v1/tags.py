from math import ceil

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from slugify import slugify
from sqlalchemy.orm import Session

from app.core.security import get_current_admin_user
from app.db.database import get_db
from app.models.audit import AuditLog
from app.models.tag import Tag
from app.models.user import User
from app.schemas.tag import TagCreate, TagListResponse, TagResponse, TagUpdate

router = APIRouter()


def _resolve_slug(db: Session, value: str, tag_id: int | None = None) -> str:
    base_slug = slugify(value) or "tag"
    candidate = base_slug
    index = 1
    while True:
        query = db.query(Tag).filter(Tag.slug == candidate)
        if tag_id:
            query = query.filter(Tag.id != tag_id)
        if not query.first():
            return candidate
        index += 1
        candidate = f"{base_slug}-{index}"


@router.get("", response_model=TagListResponse)
def list_tags(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: str | None = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(Tag)
    if search:
        query = query.filter(Tag.name.ilike(f"%{search}%"))
    total = query.count()
    items = query.order_by(Tag.name.asc()).offset((page - 1) * limit).limit(limit).all()
    return TagListResponse(items=items, total=total, page=page, pages=ceil(total / limit) if total else 1)


@router.get("/{tag_id}", response_model=TagResponse)
def get_tag(tag_id: int, db: Session = Depends(get_db)):
    tag = db.query(Tag).filter(Tag.id == tag_id).first()
    if not tag:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tag not found")
    return tag


@router.post("", response_model=TagResponse, status_code=status.HTTP_201_CREATED)
def create_tag(
    tag_data: TagCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user),
):
    tag = Tag(**tag_data.model_dump(exclude={"slug"}), slug=_resolve_slug(db, tag_data.slug or tag_data.name))
    db.add(tag)
    db.flush()
    db.add(
        AuditLog(
            actor_id=current_admin.id,
            action="create",
            entity_type="tag",
            entity_id=tag.id,
            description=f"Created tag {tag.name}",
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent"),
        )
    )
    db.commit()
    db.refresh(tag)
    return tag


@router.put("/{tag_id}", response_model=TagResponse)
def update_tag(
    tag_id: int,
    tag_data: TagUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user),
):
    tag = db.query(Tag).filter(Tag.id == tag_id).first()
    if not tag:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tag not found")

    updates = tag_data.model_dump(exclude_unset=True)
    if "name" in updates or "slug" in updates:
        tag.slug = _resolve_slug(db, updates.get("slug") or updates.get("name") or tag.slug, tag.id)
    for field, value in updates.items():
        if field != "slug":
            setattr(tag, field, value)
    db.add(
        AuditLog(
            actor_id=current_admin.id,
            action="update",
            entity_type="tag",
            entity_id=tag.id,
            description=f"Updated tag {tag.name}",
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent"),
        )
    )
    db.commit()
    db.refresh(tag)
    return tag


@router.delete("/{tag_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_tag(
    tag_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user),
):
    tag = db.query(Tag).filter(Tag.id == tag_id).first()
    if not tag:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tag not found")
    db.add(
        AuditLog(
            actor_id=current_admin.id,
            action="delete",
            entity_type="tag",
            entity_id=tag.id,
            description=f"Deleted tag {tag.name}",
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent"),
        )
    )
    db.delete(tag)
    db.commit()
