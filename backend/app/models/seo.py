"""
SEO Metadata model for pages
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean
from sqlalchemy.sql import func
from app.models import Base


class SEOMetadata(Base):
    __tablename__ = "seo_metadata"
    
    id = Column(Integer, primary_key=True, index=True)
    page_type = Column(String(50), nullable=False, index=True)  # home, category, movie, search
    page_slug = Column(String(255), index=True)  # identifier for the page
    meta_title = Column(String(255))
    meta_description = Column(String(500))
    meta_keywords = Column(String(500))
    canonical_url = Column(String(500))
    og_title = Column(String(255))
    og_description = Column(String(500))
    og_image = Column(String(500))
    twitter_card = Column(String(50), default="summary_large_image")
    twitter_title = Column(String(255))
    twitter_description = Column(String(500))
    twitter_image = Column(String(500))
    robots_index = Column(Boolean, default=True)
    robots_follow = Column(Boolean, default=True)
    schema_markup = Column(Text)  # JSON-LD schema
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
