import logging

from fastapi import APIRouter, Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.config import settings
from app.core.security import verify_supabase_token
from app.models.generation import GenerateRequest, GenerateResponse
from app.services.ai_service import generate_with_ai
from app.services.image_processor import process_sketch
from app.services.storage_service import save_generation_record, upload_generation

router = APIRouter()
logger = logging.getLogger(__name__)

# Optional auth — generation works without login, but saves to gallery if logged in
optional_bearer = HTTPBearer(auto_error=False)


@router.post("/", response_model=GenerateResponse)
async def generate_image(
    req: GenerateRequest,
    credentials: HTTPAuthorizationCredentials | None = Depends(optional_bearer),
) -> GenerateResponse:
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
        style=req.style,
        strength=req.strength,
        user_hint=req.prompt,
        page_width=req.page_width,
        page_height=req.page_height,
    )

    # 3. If user is authenticated, save to gallery
    generation_id = result.generation_id
    if credentials:
        try:
            payload = verify_supabase_token(credentials.credentials)
            user_id = payload["sub"]
            image_url = await upload_generation(result.image_base64, user_id)
            prompt_to_save = req.prompt if req.prompt else result.scene.subject
            generation_id = await save_generation_record(
                user_id=user_id,
                prompt=prompt_to_save,
                style=req.style,
                image_url=image_url,
            )
        except Exception:
            # Don't fail the generation if gallery save fails
            logger.warning("Failed to save generation to gallery", exc_info=True)

    return GenerateResponse(
        image_base64=result.image_base64,
        generation_id=generation_id,
        mode=settings.ai_mode,
        provider=result.provider_name,
        scene_description=result.scene.raw_description,
        confidence=result.scene.confidence,
        needs_hint=result.needs_hint,
    )
