from time import perf_counter
from uuid import uuid4

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.v1.admin import router as admin_router
from app.api.v1.auth import router as auth_router
from app.api.v1.categories import router as categories_router
from app.api.v1.download import router as download_router
from app.api.v1.movies import router as movies_router
from app.api.v1.seo import router as seo_router
from app.api.v1.stream import router as stream_router
from app.api.v1.tags import router as tags_router
from app.api.v1.uploads import router as uploads_router
from app.core.config import settings
from app.db.database import init_db
from app.services.file_storage import ensure_upload_directories

ensure_upload_directories()


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        request_id = request.headers.get("x-request-id") or uuid4().hex
        start = perf_counter()
        response = await call_next(request)
        duration_ms = (perf_counter() - start) * 1000
        response.headers["X-Request-Id"] = request_id
        response.headers.setdefault("X-Content-Type-Options", "nosniff")
        response.headers.setdefault("X-Frame-Options", "DENY")
        response.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
        response.headers.setdefault("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
        if request.url.path.startswith("/uploads/"):
            response.headers.setdefault("Cache-Control", "public, max-age=86400, stale-while-revalidate=604800")
        elif request.url.path.startswith("/api/"):
            response.headers.setdefault("Cache-Control", "no-store")
        response.headers.setdefault("Server-Timing", f"app;dur={duration_ms:.1f}")
        return response

app = FastAPI(
    title="Movie Release API",
    description="Backend API for movie release website",
    version="1.0.0",
    on_startup=[ensure_upload_directories, init_db],
)

app.add_middleware(SecurityHeadersMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Requested-With", "X-Request-Id"],
)

app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

app.include_router(auth_router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(admin_router, prefix="/api/v1/admin", tags=["admin"])
app.include_router(movies_router, prefix="/api/v1/movies", tags=["movies"])
app.include_router(categories_router, prefix="/api/v1/categories", tags=["categories"])
app.include_router(tags_router, prefix="/api/v1/tags", tags=["tags"])
app.include_router(stream_router, prefix="/api/v1/stream", tags=["stream"])
app.include_router(download_router, prefix="/api/v1/download", tags=["download"])
app.include_router(seo_router, prefix="/api/v1/seo", tags=["seo"])
app.include_router(uploads_router, prefix="/api/v1/uploads", tags=["uploads"])


@app.get("/")
def root():
    return {"message": "Movie Release API", "version": "1.0.0"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}
