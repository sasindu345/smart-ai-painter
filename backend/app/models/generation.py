from pydantic import BaseModel


class GenerateRequest(BaseModel):
    sketch_base64: str
    prompt: str
    style: str
    strength: float


class GenerateResponse(BaseModel):
    image_base64: str
    generation_id: str
