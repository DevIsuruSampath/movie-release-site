from typing import Any, Generator

from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.models import Base

engine = create_engine(
    settings.DATABASE_URL,
    future=True,
    pool_pre_ping=True,
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

        telegram_settings_columns = _column_names(inspector, "telegram_settings")
        if telegram_settings_columns:
            for ddl in (
                ("api_id_encrypted", "ALTER TABLE telegram_settings ADD COLUMN IF NOT EXISTS api_id_encrypted TEXT"),
                ("api_hash_encrypted", "ALTER TABLE telegram_settings ADD COLUMN IF NOT EXISTS api_hash_encrypted TEXT"),
                ("private_channel_id", "ALTER TABLE telegram_settings ADD COLUMN IF NOT EXISTS private_channel_id VARCHAR(255)"),
                ("private_channel_username", "ALTER TABLE telegram_settings ADD COLUMN IF NOT EXISTS private_channel_username VARCHAR(255)"),
                ("private_channel_title", "ALTER TABLE telegram_settings ADD COLUMN IF NOT EXISTS private_channel_title VARCHAR(255)"),
                ("private_channel_invite_link", "ALTER TABLE telegram_settings ADD COLUMN IF NOT EXISTS private_channel_invite_link VARCHAR(500)"),
                ("enable_telegram_storage", "ALTER TABLE telegram_settings ADD COLUMN IF NOT EXISTS enable_telegram_storage BOOLEAN DEFAULT FALSE NOT NULL"),
                ("telegram_storage_mode", "ALTER TABLE telegram_settings ADD COLUMN IF NOT EXISTS telegram_storage_mode VARCHAR(20) DEFAULT 'local_only' NOT NULL"),
            ):
                if ddl[0] not in telegram_settings_columns:
                    connection.execute(text(ddl[1]))
            if "private_channel_id" in telegram_settings_columns and "channel_id" in telegram_settings_columns:
                connection.execute(text("UPDATE telegram_settings SET private_channel_id = COALESCE(private_channel_id, channel_id)"))
            if "private_channel_username" in telegram_settings_columns and "channel_username" in telegram_settings_columns:
                connection.execute(text("UPDATE telegram_settings SET private_channel_username = COALESCE(private_channel_username, channel_username)"))
            if "private_channel_title" in telegram_settings_columns and "channel_title" in telegram_settings_columns:
                connection.execute(text("UPDATE telegram_settings SET private_channel_title = COALESCE(private_channel_title, channel_title)"))
            if "private_channel_invite_link" in telegram_settings_columns and "channel_invite_link" in telegram_settings_columns:
                connection.execute(text("UPDATE telegram_settings SET private_channel_invite_link = COALESCE(private_channel_invite_link, channel_invite_link)"))

        telegram_log_columns = _column_names(inspector, "telegram_post_logs")
        if telegram_log_columns:
            for ddl in (
                ("send_mode", "ALTER TABLE telegram_post_logs ADD COLUMN IF NOT EXISTS send_mode VARCHAR(20) DEFAULT 'bot_api' NOT NULL"),
                ("used_cached_media", "ALTER TABLE telegram_post_logs ADD COLUMN IF NOT EXISTS used_cached_media BOOLEAN DEFAULT FALSE NOT NULL"),
            ):
                if ddl[0] not in telegram_log_columns:
                    connection.execute(text(ddl[1]))

        telegram_media_columns = _column_names(inspector, "telegram_media_cache")
        if telegram_media_columns:
            for ddl in (
                ("media_role", "ALTER TABLE telegram_media_cache ADD COLUMN IF NOT EXISTS media_role VARCHAR(50) DEFAULT 'other' NOT NULL"),
                ("storage_source", "ALTER TABLE telegram_media_cache ADD COLUMN IF NOT EXISTS storage_source VARCHAR(20) DEFAULT 'local' NOT NULL"),
                ("local_file_path", "ALTER TABLE telegram_media_cache ADD COLUMN IF NOT EXISTS local_file_path VARCHAR(1000)"),
                ("telegram_chat_id", "ALTER TABLE telegram_media_cache ADD COLUMN IF NOT EXISTS telegram_chat_id VARCHAR(255)"),
                ("telegram_message_id", "ALTER TABLE telegram_media_cache ADD COLUMN IF NOT EXISTS telegram_message_id VARCHAR(255)"),
                ("telegram_file_unique_id", "ALTER TABLE telegram_media_cache ADD COLUMN IF NOT EXISTS telegram_file_unique_id VARCHAR(255)"),
                ("telegram_media_type", "ALTER TABLE telegram_media_cache ADD COLUMN IF NOT EXISTS telegram_media_type VARCHAR(50)"),
                ("original_filename", "ALTER TABLE telegram_media_cache ADD COLUMN IF NOT EXISTS original_filename VARCHAR(255)"),
                ("mime_type", "ALTER TABLE telegram_media_cache ADD COLUMN IF NOT EXISTS mime_type VARCHAR(255)"),
                ("file_size", "ALTER TABLE telegram_media_cache ADD COLUMN IF NOT EXISTS file_size INTEGER"),
                ("public_url", "ALTER TABLE telegram_media_cache ADD COLUMN IF NOT EXISTS public_url VARCHAR(1000)"),
                ("updated_at", "ALTER TABLE telegram_media_cache ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ"),
            ):
                if ddl[0] not in telegram_media_columns:
                    connection.execute(text(ddl[1]))
            if "media_type" in telegram_media_columns and "telegram_media_type" in telegram_media_columns:
                connection.execute(text("UPDATE telegram_media_cache SET telegram_media_type = COALESCE(telegram_media_type, media_type)"))


def init_db() -> None:
    Base.metadata.create_all(bind=engine)
    _ensure_schema_compatibility()


def get_db() -> Generator[Any, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
