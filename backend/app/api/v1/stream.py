"""Stream links API routes"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from app.db.database import get_db
from app.models.movie import StreamLink, Movie
from app.schemas.movie import StreamLinkCreate, StreamLinkUpdate, StreamLinkResponse
from app.core.security import get_current_admin

router = APIRouter()


@router.get("/movie/{movie_id}", response_model=List[StreamLinkResponse])
async def get_movie_stream_links(
    movie_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get all stream links for a movie"""
    result = await db.execute(
        select(StreamLink).where(StreamLink.movie_id == movie_id)
    )
    return result.scalars().all()


@router.post("/", response_model=StreamLinkResponse, status_code=status.HTTP_201_CREATED)
async def create_stream_link(
    link_data: StreamLinkCreate,
    db: AsyncSession = Depends(get_db),
    admin = Depends(get_current_admin)
):
    """Create a new stream link (admin only)"""
    # Verify movie exists
    movie = await db.get(Movie, link_data.movie_id)
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")
    
    stream_link = StreamLink(**link_data.model_dump())
    db.add(stream_link)
    await db.commit()
    await db.refresh(stream_link)
    return stream_link


@router.put("/{link_id}", response_model=StreamLinkResponse)
async def update_stream_link(
    link_id: int,
    link_data: StreamLinkUpdate,
    db: AsyncSession = Depends(get_db),
    admin = Depends(get_current_admin)
):
    """Update a stream link (admin only)"""
    stream_link = await db.get(StreamLink, link_id)
    if not stream_link:
        raise HTTPException(status_code=404, detail="Stream link not found")
    
    for key, value in link_data.model_dump(exclude_unset=True).items():
        setattr(stream_link, key, value)
    
    await db.commit()
    await db.refresh(stream_link)
    return stream_link


@router.delete("/{link_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_stream_link(
    link_id: int,
    db: AsyncSession = Depends(get_db),
    admin = Depends(get_current_admin)
):
    """Delete a stream link (admin only)"""
    stream_link = await db.get(StreamLink, link_id)
    if not stream_link:
        raise HTTPException(status_code=404, detail="Stream link not found")
    
    await db.delete(stream_link)
    await db.commit()
