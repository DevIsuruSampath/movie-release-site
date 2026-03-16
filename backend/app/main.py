from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings

from app.api.v1.auth import router as auth_router
from app.api.v1.movies import router as movies_router
from app.api.v1.categories import router as categories_router
from app.api.v1.uploads import router as uploads_router

app = FastAPI(
    title="Movie Release API",
    description="Backend API for movie release website",
    version="0.1.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(movies_router, prefix="/api/v1/movies", tags=["movies"])
app.include_router(categories_router, prefix="/api/v1/categories", tags=["categories"])
app.include_router(uploads_router, prefix="/api/v1/uploads", tags=["uploads"])


@app.get("/")
async def root():
    return {"message": "Movie Release API", "version": "0.1.0"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
