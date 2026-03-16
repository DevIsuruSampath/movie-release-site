from fastapi import APIRouter
from .auth import router as auth_router
from .movies import router as movies_router
from .categories import router as categories_router
from .uploads import router as uploads_router

api_router = APIRouter()
api_router.include_router(auth_router, prefix="/auth", tags=["auth"])
api_router.include_router(movies_router, prefix="/movies", tags=["movies"])
api_router.include_router(categories_router, prefix="/categories", tags=["categories"])
api_router.include_router(uploads_router, prefix="/uploads", tags=["uploads"])
