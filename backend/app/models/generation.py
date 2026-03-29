from pydantic import BaseModel, Field


class GenerateRequest(BaseModel):
    sketch_base64: str
    prompt: str = Field(min_length=1, max_length=500)
    style: str = "realistic"
    strength: float = Field(default=0.65, ge=0, le=1)
    page_preset: str = "landscape"
    page_width: int = Field(default=1600, gt=0)
    page_height: int = Field(default=900, gt=0)


class GenerateResponse(BaseModel):
    image_base64: str
    generation_id: str
    mode: str  # "mock" or "huggingface"
    provider: str  # provider name
