from fastapi import APIRouter

from app.api.v1.routes import auth, gallery, generate

api_router = APIRouter()
api_router.include_router(generate.router, prefix="/generate", tags=["generate"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(gallery.router, prefix="/gallery", tags=["gallery"])
