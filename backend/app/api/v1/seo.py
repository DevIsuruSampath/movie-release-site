"""SEO metadata API routes"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.database import get_db
from app.models.seo import SEOMetadata
from app.models.movie import Movie
from app.schemas.seo import SEOMetadataCreate, SEOMetadataUpdate, SEOMetadataResponse
from app.core.security import get_current_admin

router = APIRouter()


@router.get("/movie/{movie_id}", response_model=SEOMetadataResponse)
async def get_movie_seo(
    movie_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get SEO metadata for a movie"""
    result = await db.execute(
        select(SEOMetadata).where(SEOMetadata.movie_id == movie_id)
    )
    seo = result.scalar_one_or_none()
    if not seo:
        raise HTTPException(status_code=404, detail="SEO metadata not found")
    return seo


@router.post("/", response_model=SEOMetadataResponse, status_code=status.HTTP_201_CREATED)
async def create_seo_metadata(
    seo_data: SEOMetadataCreate,
    db: AsyncSession = Depends(get_db),
    admin = Depends(get_current_admin)
):
    """Create SEO metadata (admin only)"""
    movie = await db.get(Movie, seo_data.movie_id)
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")
    
    # Check if SEO already exists
    result = await db.execute(
        select(SEOMetadata).where(SEOMetadata.movie_id == seo_data.movie_id)
    )
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="SEO metadata already exists")
    
    seo = SEOMetadata(**seo_data.model_dump())
    db.add(seo)
    await db.commit()
    await db.refresh(seo)
    return seo


@router.put("/{seo_id}", response_model=SEOMetadataResponse)
async def update_seo_metadata(
    seo_id: int,
    seo_data: SEOMetadataUpdate,
    db: AsyncSession = Depends(get_db),
    admin = Depends(get_current_admin)
):
    """Update SEO metadata (admin only)"""
    seo = await db.get(SEOMetadata, seo_id)
    if not seo:
        raise HTTPException(status_code=404, detail="SEO metadata not found")
    
    for key, value in seo_data.model_dump(exclude_unset=True).items():
        setattr(seo, key, value)
    
    await db.commit()
    await db.refresh(seo)
    return seo


@router.delete("/{seo_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_seo_metadata(
    seo_id: int,
    db: AsyncSession = Depends(get_db),
    admin = Depends(get_current_admin)
):
    """Delete SEO metadata (admin only)"""
    seo = await db.get(SEOMetadata, seo_id)
    if not seo:
        raise HTTPException(status_code=404, detail="SEO metadata not found")
    
    await db.delete(seo)
    await db.commit()
