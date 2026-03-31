from pydantic import BaseModel, Field


class SketchSaveRequest(BaseModel):
    title: str = Field(default="Untitled Sketch", max_length=100)
    image_base64: str
    page_preset: str = "landscape"
    page_width: int = Field(default=1600, gt=0)
    page_height: int = Field(default=900, gt=0)


class SketchItem(BaseModel):
    id: str
    title: str
    image_url: str
    page_preset: str
    page_width: int
    page_height: int
    created_at: str
    updated_at: str


class SketchListResponse(BaseModel):
    items: list[SketchItem]
    total: int
    page: int
    has_more: bool
