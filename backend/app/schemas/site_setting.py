from pydantic import BaseModel, HttpUrl, field_validator


class AdminSettingsResponse(BaseModel):
    storage_backend: str
    media_base_url: str | None = None


class AdminSettingsUpdate(BaseModel):
    storage_backend: str
    media_base_url: str | None = None

    @field_validator("storage_backend")
    @classmethod
    def validate_storage_backend(cls, value: str) -> str:
        normalized = (value or "").strip().lower()
        if normalized not in {"local", "supabase"}:
            raise ValueError("storage_backend must be 'local' or 'supabase'")
        return normalized

    @field_validator("media_base_url")
    @classmethod
    def validate_media_base_url(cls, value: str | None) -> str | None:
        normalized = (value or "").strip()
        if not normalized:
            return None
        if not normalized.startswith(("http://", "https://")):
            normalized = f"https://{normalized}"
        HttpUrl(normalized)
        return normalized.rstrip("/")
