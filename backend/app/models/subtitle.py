"""
Subtitle model for movie subtitles
"""
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.models import Base


class Subtitle(Base):
    __tablename__ = "subtitles"
    
    id = Column(Integer, primary_key=True, index=True)
    movie_id = Column(Integer, ForeignKey("movies.id", ondelete="CASCADE"), nullable=False)
    language = Column(String(50), nullable=False, index=True)  # e.g., "English", "Spanish"
    language_code = Column(String(10), nullable=False)  # e.g., "en", "es"
    url = Column(String(500), nullable=False)  # URL to subtitle file
    format = Column(String(20), default="srt")  # srt, vtt, ass, etc.
    is_default = Column(Integer, default=0)  # 1 if default subtitle
    sort_order = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    movie = relationship("Movie", back_populates="subtitles")
