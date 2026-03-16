"""Admin dashboard API routes"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.db.database import get_db
from app.models.movie import Movie, StreamLink, DownloadLink
from app.models.category import Category
from app.models.user import User
from app.models.tag import Tag
from app.core.security import get_current_admin

router = APIRouter()


@router.get("/stats")
async def get_dashboard_stats(
    db: AsyncSession = Depends(get_db),
    admin = Depends(get_current_admin)
):
    """Get admin dashboard statistics"""
    # Count movies
    movies_count = await db.scalar(select(func.count(Movie.id)))
    
    # Count categories
    categories_count = await db.scalar(select(func.count(Category.id)))
    
    # Count users
    users_count = await db.scalar(select(func.count(User.id)))
    
    # Count tags
    tags_count = await db.scalar(select(func.count(Tag.id)))
    
    # Count stream links
    stream_links_count = await db.scalar(select(func.count(StreamLink.id)))
    
    # Count download links
    download_links_count = await db.scalar(select(func.count(DownloadLink.id)))
    
    # Recent movies
    result = await db.execute(
        select(Movie).order_by(Movie.created_at.desc()).limit(5)
    )
    recent_movies = result.scalars().all()
    
    return {
        "movies_count": movies_count,
        "categories_count": categories_count,
        "users_count": users_count,
        "tags_count": tags_count,
        "stream_links_count": stream_links_count,
        "download_links_count": download_links_count,
        "recent_movies": [
            {
                "id": m.id,
                "title": m.title,
                "slug": m.slug,
                "created_at": m.created_at.isoformat()
            }
            for m in recent_movies
        ]
    }
