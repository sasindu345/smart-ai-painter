import logging

from fastapi import APIRouter
from pydantic import BaseModel

from app.services.image_processor import process_sketch
from app.services.providers.registry import get_vision_provider

router = APIRouter()
logger = logging.getLogger(__name__)


class AnalyzeRequest(BaseModel):
    sketch_base64: str
    page_preset: str = "square"
    page_width: int = 512
    page_height: int = 512


class AnalyzeResponse(BaseModel):
    subject: str
    objects: list[str]
    composition: str
    view: str
    confidence: float
    raw_description: str
    provider: str


@router.post("/", response_model=AnalyzeResponse)
async def analyze_sketch(req: AnalyzeRequest) -> AnalyzeResponse:
    """
    Analyze a sketch with the active VLM (Gemini → Groq fallback) and return
    the full scene analysis as text. Use this endpoint to verify VLM accuracy
    without triggering image generation.
    """
    # Normalize the sketch the same way as generation does
    normalized_b64 = process_sketch(
        sketch_base64=req.sketch_base64,
        page_preset=req.page_preset,
        page_width=req.page_width,
        page_height=req.page_height,
    )

    vision = get_vision_provider()
    scene = await vision.analyze(normalized_b64)

    # Determine which provider actually ran
    provider_name = vision.__class__.__name__
    # If chained, identify which leg actually succeeded
    if hasattr(vision, "primary"):
        if scene.confidence > 0.0 and "error" not in scene.raw_description.lower():
            provider_name = vision.primary.__class__.__name__
        else:
            provider_name = getattr(vision, "secondary", vision).__class__.__name__

    logger.info(
        "Sketch analyzed by %s — subject=%r confidence=%.2f",
        provider_name,
        scene.subject,
        scene.confidence,
    )

    return AnalyzeResponse(
        subject=scene.subject,
        objects=scene.objects,
        composition=scene.composition,
        view=scene.view,
        confidence=scene.confidence,
        raw_description=scene.raw_description,
        provider=provider_name,
    )
