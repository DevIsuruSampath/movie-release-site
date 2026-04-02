from math import ceil

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from slugify import slugify
from sqlalchemy.orm import Session

from app.core.security import get_current_admin_user
from app.db.database import get_db
from app.models.audit import AuditLog
from app.models.category import Category
from app.models.user import User
from app.schemas.category import CategoryCreate, CategoryListResponse, CategoryResponse, CategoryUpdate
from app.services.file_storage import cleanup_unreferenced_uploads

router = APIRouter()


def _normalize_search_term(value: str | None) -> str | None:
    normalized = value.strip() if value else ""
    return normalized or None


def _resolve_slug(db: Session, slug: str, category_id: int | None = None) -> str:
    base_slug = slugify(slug) or "category"
    candidate = base_slug
    index = 1
    while True:
        query = db.query(Category).filter(Category.slug == candidate)
        if category_id:
            query = query.filter(Category.id != category_id)
        if not query.first():
            return candidate
        index += 1
        candidate = f"{base_slug}-{index}"


def _log(db: Session, request: Request, actor: User, action: str, category: Category) -> None:
    db.add(
        AuditLog(
            actor_id=actor.id,
            action=action,
            entity_type="category",
            entity_id=category.id,
            description=f"{action.title()}d category {category.name}",
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent"),
        )
    )


@router.get("", response_model=CategoryListResponse)
def list_categories(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=200),
    search: str | None = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(Category)
    normalized_search = _normalize_search_term(search)
    if normalized_search:
        query = query.filter(Category.name.ilike(f"%{normalized_search}%"))
    total = query.count()
    items = query.order_by(Category.name.asc()).offset((page - 1) * limit).limit(limit).all()
    return CategoryListResponse(
        items=items,
        total=total,
        page=page,
        pages=ceil(total / limit) if total else 1,
    )


@router.get("/slug/{slug}", response_model=CategoryResponse)
def get_category_by_slug(slug: str, db: Session = Depends(get_db)):
    category = db.query(Category).filter(Category.slug == slug).first()
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    return category


@router.get("/{category_id}", response_model=CategoryResponse)
def get_category(category_id: int, db: Session = Depends(get_db)):
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    return category


@router.post("", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
def create_category(
    category_data: CategoryCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user),
):
    slug = _resolve_slug(db, category_data.slug or category_data.name)
    category = Category(**category_data.model_dump(exclude={"slug"}), slug=slug)
    db.add(category)
    db.flush()
    _log(db, request, current_admin, "create", category)
    db.commit()
    db.refresh(category)
    return category


@router.put("/{category_id}", response_model=CategoryResponse)
def update_category(
    category_id: int,
    category_data: CategoryUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user),
):
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    previous_file_urls = [category.image_url, category.og_image]

    updates = category_data.model_dump(exclude_unset=True)
    if "slug" in updates or "name" in updates:
        category.slug = _resolve_slug(db, updates.get("slug") or updates.get("name") or category.slug, category.id)
    for field, value in updates.items():
        if field != "slug":
            setattr(category, field, value)
    _log(db, request, current_admin, "update", category)
    db.commit()
    cleanup_unreferenced_uploads(db, previous_file_urls)
    db.refresh(category)
    return category


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category(
    category_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user),
):
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    previous_file_urls = [category.image_url, category.og_image]
    _log(db, request, current_admin, "delete", category)
    db.delete(category)
    db.commit()
    cleanup_unreferenced_uploads(db, previous_file_urls)
