"""Subtitles API routes"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from app.db.database import get_db
from app.models.subtitle import Subtitle
from app.models.movie import Movie
from app.schemas.subtitle import SubtitleCreate, SubtitleUpdate, SubtitleResponse
from app.core.security import get_current_admin

router = APIRouter()


@router.get("/movie/{movie_id}", response_model=List[SubtitleResponse])
async def get_movie_subtitles(
    movie_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get all subtitles for a movie"""
    result = await db.execute(
        select(Subtitle).where(Subtitle.movie_id == movie_id)
    )
    return result.scalars().all()


@router.post("/", response_model=SubtitleResponse, status_code=status.HTTP_201_CREATED)
async def create_subtitle(
    subtitle_data: SubtitleCreate,
    db: AsyncSession = Depends(get_db),
    admin = Depends(get_current_admin)
):
    """Create a new subtitle (admin only)"""
    movie = await db.get(Movie, subtitle_data.movie_id)
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")
    
    subtitle = Subtitle(**subtitle_data.model_dump())
    db.add(subtitle)
    await db.commit()
    await db.refresh(subtitle)
    return subtitle


@router.put("/{subtitle_id}", response_model=SubtitleResponse)
async def update_subtitle(
    subtitle_id: int,
    subtitle_data: SubtitleUpdate,
    db: AsyncSession = Depends(get_db),
    admin = Depends(get_current_admin)
):
    """Update a subtitle (admin only)"""
    subtitle = await db.get(Subtitle, subtitle_id)
    if not subtitle:
        raise HTTPException(status_code=404, detail="Subtitle not found")
    
    for key, value in subtitle_data.model_dump(exclude_unset=True).items():
        setattr(subtitle, key, value)
    
    await db.commit()
    await db.refresh(subtitle)
    return subtitle


@router.delete("/{subtitle_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_subtitle(
    subtitle_id: int,
    db: AsyncSession = Depends(get_db),
    admin = Depends(get_current_admin)
):
    """Delete a subtitle (admin only)"""
    subtitle = await db.get(Subtitle, subtitle_id)
    if not subtitle:
        raise HTTPException(status_code=404, detail="Subtitle not found")
    
    await db.delete(subtitle)
    await db.commit()
