"""
Application configuration using Pydantic settings
"""
from typing import List, Optional, Union

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # API Settings
    API_V1_STR: str = "/api"
    PROJECT_NAME: str = "Movie Release API"
    VERSION: str = "0.1.0"

    # Database
    DATABASE_URL: str = "postgresql://movie_user:movie_pass@postgres:5432/movie_db"

    # Security
    SECRET_KEY: str = "your-super-secret-jwt-key-change-this-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # CORS - Can be a list or comma-separated string
    ALLOWED_ORIGINS: Union[List[str], str] = ["http://localhost:3000", "http://localhost:3001"]

    # Local Storage
    UPLOAD_DIR: str = "uploads"
    MAX_FILE_SIZE_MB: int = 10
    PUBLIC_SITE_URL: str = "http://localhost:3000"

    # Telegram
    TELEGRAM_API_ID: str = ""
    TELEGRAM_API_HASH: str = ""
    TELEGRAM_BOT_TOKEN: str = ""
    TELEGRAM_PRIVATE_CHANNEL_ID: str = ""
    TELEGRAM_BOT_TOKEN_ENCRYPTION_KEY: str = ""
    TELEGRAM_REQUEST_TIMEOUT: int = 15
    TELEGRAM_ENABLED_DEFAULT: bool = False
    TELEGRAM_STORAGE_ENABLED_DEFAULT: bool = False
    TELEGRAM_STORAGE_MODE_DEFAULT: str = "local_only"

    # S3 Storage (Optional)
    S3_BUCKET: Optional[str] = None
    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None
    AWS_REGION: str = "us-east-1"

    # Redis (Optional)
    REDIS_URL: str = "redis://localhost:6379/0"

    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 100

    # Registration
    ADMIN_REGISTRATION_CODE: Optional[str] = None
    ALLOW_PUBLIC_REGISTRATION: bool = False

    @field_validator('ALLOWED_ORIGINS', mode='before')
    @classmethod
    def parse_allowed_origins(cls, v):
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(',') if origin.strip()]
        return v

    @field_validator("TELEGRAM_REQUEST_TIMEOUT")
    @classmethod
    def validate_telegram_request_timeout(cls, value: int) -> int:
        return max(1, value)

    @field_validator("TELEGRAM_STORAGE_MODE_DEFAULT")
    @classmethod
    def validate_telegram_storage_mode_default(cls, value: str) -> str:
        normalized = (value or "local_only").strip().lower()
        if normalized not in {"local_only", "telegram_only", "hybrid"}:
            return "local_only"
        return normalized

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False
    )

settings = Settings()
