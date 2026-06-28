from datetime import datetime
from pydantic import BaseModel, Field


class GalleryItem(BaseModel):
    id: str
    prompt: str
    style: str
    image_url: str
    created_at: datetime


class GalleryResponse(BaseModel):
    items: list[GalleryItem]
    total: int
    page: int
    has_more: bool
