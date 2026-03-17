"""
SQLAlchemy database models
"""
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

# Import all models here
from app.models.user import User
from app.models.movie import Movie, StreamLink, DownloadLink, MovieGallery
from app.models.category import Category, movie_categories
from app.models.tag import Tag, movie_tags
from app.models.subtitle import Subtitle
from app.models.seo import SEOMetadata
from app.models.audit import AuditLog
