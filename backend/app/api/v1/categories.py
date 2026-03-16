from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List, Optional
from slugify import slugify

from app.db.database import get_db
from app.models.category import Category
from app.schemas.category import CategoryCreate, CategoryUpdate, CategoryResponse

router = APIRouter()


@router.get("/", response_model=List[CategoryResponse])
def list_categories(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
):
    """List all categories."""
    categories = db.query(Category).offset(skip).limit(limit).all()
    return [CategoryResponse.from_orm(c) for c in categories]


@router.get("/{category_id}", response_model=CategoryResponse)
def get_category(category_id: int, db: Session = Depends(get_db)):
    """Get category by ID."""
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    return CategoryResponse.from_orm(category)


@router.get("/slug/{slug}", response_model=CategoryResponse)
def get_category_by_slug(slug: str, db: Session = Depends(get_db)):
    """Get category by slug."""
    category = db.query(Category).filter(Category.slug == slug).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    return CategoryResponse.from_orm(category)


@router.post("/", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
def create_category(
    category_data: CategoryCreate,
    db: Session = Depends(get_db),
):
    """Create a new category."""
    # Check if slug already exists
    existing = db.query(Category).filter(Category.slug == category_data.slug).first()
    if existing:
        raise HTTPException(status_code=400, detail="Slug already exists")
    
    category = Category(
        name=category_data.name,
        slug=category_data.slug,
        description=category_data.description,
    )
    db.add(category)
    db.commit()
    db.refresh(category)
    return CategoryResponse.from_orm(category)


@router.put("/{category_id}", response_model=CategoryResponse)
def update_category(
    category_id: int,
    category_data: CategoryUpdate,
    db: Session = Depends(get_db),
):
    """Update category."""
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    update_data = category_data.model_dump(exclude_unset=True)
    
    # Check slug uniqueness if updating
    if "slug" in update_data:
        existing = db.query(Category).filter(
            Category.slug == update_data["slug"],
            Category.id != category_id
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Slug already exists")
    
    for field, value in update_data.items():
        setattr(category, field, value)
    
    db.commit()
    db.refresh(category)
    return CategoryResponse.from_orm(category)


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category(category_id: int, db: Session = Depends(get_db)):
    """Delete category."""
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    db.delete(category)
    db.commit()
    return None
