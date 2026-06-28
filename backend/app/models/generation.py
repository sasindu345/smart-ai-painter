from pydantic import BaseModel, Field


class GenerateRequest(BaseModel):
    sketch_base64: str
    prompt: str = ""                              # OPTIONAL — empty = VLM-driven
    style: str = "realistic"
    strength: float = Field(default=0.65, ge=0, le=1)
    page_preset: str = "landscape"
    page_width: int = Field(default=1600, gt=0)
    page_height: int = Field(default=900, gt=0)


class GenerateResponse(BaseModel):
    image_base64: str
    generation_id: str
    mode: str                                     # "mock" or "replicate"
    provider: str                                 # provider name
    scene_description: str = ""                   # VLM interpretation (display to user)
    confidence: float = 1.0                       # VLM confidence score
    needs_hint: bool = False                      # True if confidence < threshold
    detected_objects: list[str] = Field(default_factory=list)
    generation_time: float = 0.0                  # Latency in seconds
