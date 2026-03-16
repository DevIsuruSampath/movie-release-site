"""Download links API routes"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from app.db.database import get_db
from app.models.movie import DownloadLink, Movie
from app.schemas.movie import DownloadLinkCreate, DownloadLinkUpdate, DownloadLinkResponse
from app.core.security import get_current_admin

router = APIRouter()


@router.get("/movie/{movie_id}", response_model=List[DownloadLinkResponse])
async def get_movie_download_links(
    movie_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get all download links for a movie"""
    result = await db.execute(
        select(DownloadLink).where(DownloadLink.movie_id == movie_id)
    )
    return result.scalars().all()


@router.post("/", response_model=DownloadLinkResponse, status_code=status.HTTP_201_CREATED)
async def create_download_link(
    link_data: DownloadLinkCreate,
    db: AsyncSession = Depends(get_db),
    admin = Depends(get_current_admin)
):
    """Create a new download link (admin only)"""
    movie = await db.get(Movie, link_data.movie_id)
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")
    
    download_link = DownloadLink(**link_data.model_dump())
    db.add(download_link)
    await db.commit()
    await db.refresh(download_link)
    return download_link


@router.put("/{link_id}", response_model=DownloadLinkResponse)
async def update_download_link(
    link_id: int,
    link_data: DownloadLinkUpdate,
    db: AsyncSession = Depends(get_db),
    admin = Depends(get_current_admin)
):
    """Update a download link (admin only)"""
    download_link = await db.get(DownloadLink, link_id)
    if not download_link:
        raise HTTPException(status_code=404, detail="Download link not found")
    
    for key, value in link_data.model_dump(exclude_unset=True).items():
        setattr(download_link, key, value)
    
    await db.commit()
    await db.refresh(download_link)
    return download_link


@router.delete("/{link_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_download_link(
    link_id: int,
    db: AsyncSession = Depends(get_db),
    admin = Depends(get_current_admin)
):
    """Delete a download link (admin only)"""
    download_link = await db.get(DownloadLink, link_id)
    if not download_link:
        raise HTTPException(status_code=404, detail="Download link not found")
    
    await db.delete(download_link)
    await db.commit()
