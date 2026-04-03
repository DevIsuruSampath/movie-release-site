import logging
from urllib.parse import urlsplit

from typing import Any, Generator

from sqlalchemy import create_engine, inspect, text
from sqlalchemy.exc import OperationalError
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.models import Base

logger = logging.getLogger(__name__)

engine = create_engine(
    settings.DATABASE_URL,
    future=True,
    pool_pre_ping=True,
    pool_size=settings.DATABASE_POOL_SIZE,
    max_overflow=settings.DATABASE_MAX_OVERFLOW,
    pool_recycle=settings.DATABASE_POOL_RECYCLE_SECONDS,
    pool_timeout=settings.DATABASE_POOL_TIMEOUT_SECONDS,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def _column_names(inspector: Any, table_name: str) -> set[str]:
    try:
        return {column["name"] for column in inspector.get_columns(table_name)}
    except Exception:
        return set()


def _ensure_schema_compatibility() -> None:
    inspector = inspect(engine)

    with engine.begin() as connection:
        user_columns = _column_names(inspector, "users")
        if "is_admin" not in user_columns:
            connection.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE NOT NULL"))
            connection.execute(text("UPDATE users SET is_admin = COALESCE(is_superuser, FALSE)"))

        movie_columns = _column_names(inspector, "movies")
        if "quality" not in movie_columns:
            connection.execute(text("ALTER TABLE movies ADD COLUMN IF NOT EXISTS quality VARCHAR(50)"))
        if "is_published" not in movie_columns:
            connection.execute(text("ALTER TABLE movies ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT FALSE NOT NULL"))
            if "status" in movie_columns:
                connection.execute(text("UPDATE movies SET is_published = CASE WHEN status = 'published' THEN TRUE ELSE FALSE END"))
        if "robots" not in movie_columns:
            connection.execute(text("ALTER TABLE movies ADD COLUMN IF NOT EXISTS robots VARCHAR(100) DEFAULT 'index,follow'"))
        if "schema_markup" not in movie_columns:
            connection.execute(text("ALTER TABLE movies ADD COLUMN IF NOT EXISTS schema_markup TEXT"))

        category_columns = _column_names(inspector, "categories")
        for ddl in (
            ("image_url", "ALTER TABLE categories ADD COLUMN IF NOT EXISTS image_url VARCHAR(500)"),
            ("meta_title", "ALTER TABLE categories ADD COLUMN IF NOT EXISTS meta_title VARCHAR(255)"),
            ("meta_description", "ALTER TABLE categories ADD COLUMN IF NOT EXISTS meta_description VARCHAR(500)"),
            ("meta_keywords", "ALTER TABLE categories ADD COLUMN IF NOT EXISTS meta_keywords VARCHAR(500)"),
            ("canonical_url", "ALTER TABLE categories ADD COLUMN IF NOT EXISTS canonical_url VARCHAR(500)"),
            ("og_image", "ALTER TABLE categories ADD COLUMN IF NOT EXISTS og_image VARCHAR(500)"),
            ("robots", "ALTER TABLE categories ADD COLUMN IF NOT EXISTS robots VARCHAR(100) DEFAULT 'index,follow'"),
            ("schema_markup", "ALTER TABLE categories ADD COLUMN IF NOT EXISTS schema_markup TEXT"),
            ("created_at", "ALTER TABLE categories ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW()"),
            ("updated_at", "ALTER TABLE categories ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ"),
        ):
            if ddl[0] not in category_columns:
                connection.execute(text(ddl[1]))

        tag_columns = _column_names(inspector, "tags")
        if "description" not in tag_columns:
            connection.execute(text("ALTER TABLE tags ADD COLUMN IF NOT EXISTS description TEXT"))
        if "updated_at" not in tag_columns:
            connection.execute(text("ALTER TABLE tags ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ"))

        stream_columns = _column_names(inspector, "stream_links")
        if "server_name" not in stream_columns:
            connection.execute(text("ALTER TABLE stream_links ADD COLUMN IF NOT EXISTS server_name VARCHAR(100)"))
            if "title" in stream_columns:
                connection.execute(text("UPDATE stream_links SET server_name = COALESCE(title, 'Primary') WHERE server_name IS NULL"))
            connection.execute(text("UPDATE stream_links SET server_name = 'Primary' WHERE server_name IS NULL"))
            connection.execute(text("ALTER TABLE stream_links ALTER COLUMN server_name SET NOT NULL"))
        if "quality" not in stream_columns:
            connection.execute(text("ALTER TABLE stream_links ADD COLUMN IF NOT EXISTS quality VARCHAR(50)"))
        if "language" not in stream_columns:
            connection.execute(text("ALTER TABLE stream_links ADD COLUMN IF NOT EXISTS language VARCHAR(50)"))
        if "updated_at" not in stream_columns:
            connection.execute(text("ALTER TABLE stream_links ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ"))

        download_columns = _column_names(inspector, "download_links")
        if "provider" not in download_columns:
            connection.execute(text("ALTER TABLE download_links ADD COLUMN IF NOT EXISTS provider VARCHAR(100)"))
            if "title" in download_columns:
                connection.execute(text("UPDATE download_links SET provider = COALESCE(title, 'Direct') WHERE provider IS NULL"))
            connection.execute(text("UPDATE download_links SET provider = 'Direct' WHERE provider IS NULL"))
            connection.execute(text("ALTER TABLE download_links ALTER COLUMN provider SET NOT NULL"))
        if "size" not in download_columns:
            connection.execute(text("ALTER TABLE download_links ADD COLUMN IF NOT EXISTS size VARCHAR(50)"))
            if "file_size" in download_columns:
                connection.execute(text("UPDATE download_links SET size = file_size WHERE size IS NULL"))
        if "language" not in download_columns:
            connection.execute(text("ALTER TABLE download_links ADD COLUMN IF NOT EXISTS language VARCHAR(50)"))
        if "updated_at" not in download_columns:
            connection.execute(text("ALTER TABLE download_links ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ"))

        subtitle_columns = _column_names(inspector, "subtitles")
        if "label" not in subtitle_columns:
            connection.execute(text("ALTER TABLE subtitles ADD COLUMN IF NOT EXISTS label VARCHAR(100)"))
            if "language" in subtitle_columns:
                connection.execute(text("UPDATE subtitles SET label = COALESCE(language, 'Subtitle') WHERE label IS NULL"))
            connection.execute(text("UPDATE subtitles SET label = 'Subtitle' WHERE label IS NULL"))
            connection.execute(text("ALTER TABLE subtitles ALTER COLUMN label SET NOT NULL"))
        if "file_url" not in subtitle_columns:
            connection.execute(text("ALTER TABLE subtitles ADD COLUMN IF NOT EXISTS file_url VARCHAR(500)"))
            if "url" in subtitle_columns:
                connection.execute(text("UPDATE subtitles SET file_url = url WHERE file_url IS NULL"))
            connection.execute(text("ALTER TABLE subtitles ALTER COLUMN file_url SET NOT NULL"))
        if "updated_at" not in subtitle_columns:
            connection.execute(text("ALTER TABLE subtitles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ"))

        audit_columns = _column_names(inspector, "audit_logs")
        if "actor_id" not in audit_columns:
            connection.execute(text("ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS actor_id INTEGER"))
            if "user_id" in audit_columns:
                connection.execute(text("UPDATE audit_logs SET actor_id = user_id WHERE actor_id IS NULL"))
        if "metadata_json" not in audit_columns:
            connection.execute(text("ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS metadata_json JSON"))
        if "ip_address" not in audit_columns:
            connection.execute(text("ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS ip_address VARCHAR(45)"))
        if "user_agent" not in audit_columns:
            connection.execute(text("ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS user_agent VARCHAR(500)"))
        if "description" not in audit_columns:
            connection.execute(text("ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS description TEXT"))

        if "site_settings" not in inspector.get_table_names():
            connection.execute(
                text(
                    """
                    CREATE TABLE IF NOT EXISTS site_settings (
                        id SERIAL PRIMARY KEY,
                        key VARCHAR(100) NOT NULL UNIQUE,
                        value TEXT NOT NULL,
                        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                    )
                    """
                )
            )
            connection.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS ix_site_settings_key ON site_settings (key)"))

def init_db() -> None:
    parsed_database_url = urlsplit(settings.DATABASE_URL)
    database_name = parsed_database_url.path.lstrip("/") or "<missing>"
    if settings.direct_supabase_host_requires_pooler(settings.DATABASE_URL):
        raise RuntimeError(
            "The configured Supabase direct database host "
            f"'{parsed_database_url.hostname}' does not have a reachable IPv4 path from this runtime. "
            "Use a Supabase pooler connection string in SUPABASE_DB_URL, or run this backend on an IPv6-enabled network. "
            f"Your current database name is '{database_name}'; Supabase usually uses 'postgres'."
        )

    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        if settings.DB_STARTUP_MODE == "bootstrap":
            Base.metadata.create_all(bind=engine)
            if settings.APPLY_RUNTIME_SCHEMA_PATCHES:
                _ensure_schema_compatibility()
        else:
            logger.info(
                "Database startup mode is '%s'; skipping runtime schema creation and compatibility patching",
                settings.DB_STARTUP_MODE,
            )
    except OperationalError as exc:
        if settings.direct_supabase_host_requires_pooler(settings.DATABASE_URL):
            raise RuntimeError(
                "Database startup failed because this runtime cannot reach the direct Supabase database host over IPv4. "
                f"Use a Supabase pooler connection string in SUPABASE_DB_URL. Current database name: '{database_name}'."
            ) from exc
        raise


def get_db() -> Generator[Any, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
