from __future__ import annotations

from urllib.parse import urljoin, urlparse

from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.site_setting import SiteSetting

STORAGE_BACKEND_KEY = "storage_backend"
MEDIA_BASE_URL_KEY = "media_base_url"


def _get_setting(db: Session, key: str) -> SiteSetting | None:
    return db.query(SiteSetting).filter(SiteSetting.key == key).first()


def get_setting_value(db: Session, key: str, default: str = "") -> str:
    record = _get_setting(db, key)
    return (record.value if record else default).strip()


def set_setting_value(db: Session, key: str, value: str) -> None:
    record = _get_setting(db, key)
    if record:
        record.value = value
        return
    db.add(SiteSetting(key=key, value=value))


def resolve_storage_backend(db: Session | None = None) -> str:
    if db is not None:
        override = get_setting_value(db, STORAGE_BACKEND_KEY)
        if override in {"local", "supabase"}:
            return override
    return settings.STORAGE_BACKEND


def resolve_media_base_url(db: Session | None = None) -> str:
    if db is not None:
        override = get_setting_value(db, MEDIA_BASE_URL_KEY)
        if override:
            return override.rstrip("/")
    return ""


def normalize_media_url(value: str | None, db: Session | None = None) -> str:
    normalized = (value or "").strip()
    if not normalized:
        return ""
    if normalized.startswith("http://") or normalized.startswith("https://"):
        return normalized

    base_url = resolve_media_base_url(db)
    if not base_url:
        return normalized

    joined = urljoin(f"{base_url}/", normalized.lstrip("/"))
    parsed = urlparse(joined)
    if not parsed.scheme or not parsed.netloc:
        return normalized
    return joined
