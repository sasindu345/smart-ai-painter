from dataclasses import dataclass
from app.core.config import settings
from app.services.providers.base import SceneAnalysis
from app.services.providers.registry import get_vision_provider, get_generation_provider
from app.services.prompt_builder import build_prompt


@dataclass
class PipelineResult:
    """Structured result returned by the orchestrator pipeline."""
    image_base64: str
    generation_id: str
    provider_name: str
    scene: SceneAnalysis
    needs_hint: bool


async def generate_with_ai(
    sketch_base64: str,
    style: str,
    strength: float,
    user_hint: str,
    page_width: int,
    page_height: int,
) -> PipelineResult:
    """Main pipeline orchestrator. Provider-agnostic."""

    vision = get_vision_provider()
    generator = get_generation_provider()

    # Step 1: VLM scene understanding
    scene = await vision.analyze(sketch_base64)

    # Step 2: Confidence gate
    needs_hint = scene.confidence < settings.vlm_confidence_threshold

    # Step 3: Build prompt (deterministic, no AI)
    prompt = build_prompt(
        scene=scene,
        style=style,
        strength=strength,
        user_hint=user_hint if user_hint else None,
    )

    # Step 4: Generate via ControlNet provider
    result = await generator.generate(
        sketch_base64=sketch_base64,
        prompt=prompt,
        width=page_width,
        height=page_height,
    )

    return PipelineResult(
        image_base64=result.image_base64,
        generation_id=result.generation_id,
        provider_name=result.provider_name,
        scene=scene,
        needs_hint=needs_hint,
    )
