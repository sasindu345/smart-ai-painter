from fastapi import APIRouter

from app.models.generation import GenerateRequest, GenerateResponse
from app.services.ai_service import generate_with_ai
from app.services.image_processor import process_sketch

router = APIRouter()


@router.post("/", response_model=GenerateResponse)
async def generate_image(req: GenerateRequest) -> GenerateResponse:
    # 1. Normalize the sketch image for model input
    normalized_b64 = process_sketch(
        sketch_base64=req.sketch_base64,
        page_preset=req.page_preset,
        page_width=req.page_width,
        page_height=req.page_height,
    )

    # 2. Generate via the active AI provider
    result = await generate_with_ai(
        sketch_base64=normalized_b64,
        prompt=req.prompt,
        style=req.style,
        strength=req.strength,
        page_width=req.page_width,
        page_height=req.page_height,
    )

    return GenerateResponse(
        image_base64=result.image_base64,
        generation_id=result.generation_id,
        mode=result.mode,
        provider=result.provider,
    )
