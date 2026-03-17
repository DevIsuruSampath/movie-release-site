"""
Application configuration using Pydantic settings
"""
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List, Optional, Union
from pydantic import field_validator

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

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False
    )

settings = Settings()
