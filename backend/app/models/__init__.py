from sqlalchemy.orm import declarative_base

Base = declarative_base()

from app.models.user import User  # noqa: E402,F401
from app.models.category import Category, movie_categories  # noqa: E402,F401
from app.models.tag import Tag, movie_tags  # noqa: E402,F401
from app.models.movie import Movie, StreamLink, DownloadLink, MovieGallery  # noqa: E402,F401
from app.models.seo import SEOMetadata  # noqa: E402,F401
from app.models.audit import AuditLog  # noqa: E402,F401
from app.models.site_setting import SiteSetting  # noqa: E402,F401
