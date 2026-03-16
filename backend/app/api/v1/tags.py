"""Tags API routes"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from app.db.database import get_db
from app.models.tag import Tag
from app.schemas.tag import TagCreate, TagUpdate, TagResponse
from app.core.security import get_current_admin

router = APIRouter()


@router.get("/", response_model=List[TagResponse])
async def list_tags(db: AsyncSession = Depends(get_db)):
    """List all tags"""
    result = await db.execute(select(Tag).order_by(Tag.name))
    return result.scalars().all()


@router.get("/{tag_id}", response_model=TagResponse)
async def get_tag(tag_id: int, db: AsyncSession = Depends(get_db)):
    """Get a single tag"""
    tag = await db.get(Tag, tag_id)
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    return tag


@router.post("/", response_model=TagResponse, status_code=status.HTTP_201_CREATED)
async def create_tag(
    tag_data: TagCreate,
    db: AsyncSession = Depends(get_db),
    admin = Depends(get_current_admin)
):
    """Create a new tag (admin only)"""
    # Check if tag already exists
    result = await db.execute(select(Tag).where(Tag.name == tag_data.name))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Tag already exists")
    
    tag = Tag(**tag_data.model_dump())
    db.add(tag)
    await db.commit()
    await db.refresh(tag)
    return tag


@router.put("/{tag_id}", response_model=TagResponse)
async def update_tag(
    tag_id: int,
    tag_data: TagUpdate,
    db: AsyncSession = Depends(get_db),
    admin = Depends(get_current_admin)
):
    """Update a tag (admin only)"""
    tag = await db.get(Tag, tag_id)
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    
    for key, value in tag_data.model_dump(exclude_unset=True).items():
        setattr(tag, key, value)
    
    await db.commit()
    await db.refresh(tag)
    return tag


@router.delete("/{tag_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_tag(
    tag_id: int,
    db: AsyncSession = Depends(get_db),
    admin = Depends(get_current_admin)
):
    """Delete a tag (admin only)"""
    tag = await db.get(Tag, tag_id)
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    
    await db.delete(tag)
    await db.commit()
