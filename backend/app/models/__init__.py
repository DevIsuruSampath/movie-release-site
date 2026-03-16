"""
SQLAlchemy database models
"""
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Import all models here
from app.models.user import User
from app.models.movie import Movie, StreamLink, DownloadLink, MovieGallery
from app.models.category import Category, movie_categories
from app.models.tag import Tag, movie_tags
from app.models.subtitle import Subtitle
from app.models.seo import SEOMetadata
from app.models.audit import AuditLog
