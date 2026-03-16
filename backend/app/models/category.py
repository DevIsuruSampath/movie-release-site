"""
Category model
"""
from sqlalchemy import Column, Integer, String, Table, ForeignKey
from sqlalchemy.orm import relationship
from app.models import Base

# Association table for many-to-many relationship
movie_categories = Table(
    'movie_categories',
    Base.metadata,
    Column('movie_id', Integer, ForeignKey('movies.id', ondelete="CASCADE"), primary_key=True),
    Column('category_id', Integer, ForeignKey('categories.id', ondelete="CASCADE"), primary_key=True)
)

class Category(Base):
    __tablename__ = "categories"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    slug = Column(String(100), unique=True, nullable=False, index=True)
    description = Column(String(500))
    
    # Relationships
    movies = relationship("Movie", secondary=movie_categories, back_populates="categories")
