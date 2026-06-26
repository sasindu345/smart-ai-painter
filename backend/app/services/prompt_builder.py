from app.services.providers.base import SceneAnalysis, BuiltPrompt

STYLE_PROMPTS = {
    "realistic": "photorealistic, highly detailed, professional quality, 8k",
    "watercolor": "watercolor painting, soft colors, flowing brushwork, artistic",
    "oil": "oil painting on canvas, rich textures, visible brushstrokes, masterpiece",
    "anime": "anime style, cel shading, vibrant colors, clean lines, studio quality",
    "sketch": "detailed pencil sketch, cross-hatching, graphite drawing, paper texture",
}

DEFAULT_NEGATIVE = (
    "blurry, low quality, distorted, deformed, ugly, "
    "extra limbs, bad anatomy, watermark, text, signature"
)


def build_prompt(
    scene: SceneAnalysis,
    style: str,
    strength: float,
    user_hint: str | None = None,
) -> BuiltPrompt:
    """Build a deterministic SDXL prompt from structured scene data.

    This function contains NO AI calls. It is a pure mapping.
    """
    # Determine subject: prefer user hint if confidence is low
    if user_hint and scene.confidence < 0.5:
        subject = user_hint.strip()
    else:
        subject = scene.subject.strip()

    # Build prompt parts
    parts = [subject]

    # Only include objects from VLM if confidence is reasonable
    if scene.objects and scene.confidence >= 0.5:
        detail = ", ".join(obj.strip() for obj in scene.objects[:5] if obj.strip())
        if detail:
            parts.append(f"featuring {detail}")

    if scene.view and scene.view != "unknown":
        parts.append(scene.view.strip())

    if scene.composition:
        parts.append(scene.composition.strip())

    # Style description addition
    style_suffix = STYLE_PROMPTS.get(style, STYLE_PROMPTS["realistic"])
    parts.append(style_suffix)

    positive = ", ".join(parts)
    
    # Calculate guidance and controlnet conditioning scales based on strength
    # guidance scale: 7.0 at strength=0, 13.0 at strength=1
    guidance = 7.0 + (strength * 6.0)
    # controlnet scale: 0.5 at strength=0, 1.0 at strength=1
    controlnet_scale = 0.5 + (strength * 0.5)

    return BuiltPrompt(
        positive=positive,
        negative=DEFAULT_NEGATIVE,
        guidance_scale=guidance,
        controlnet_conditioning_scale=controlnet_scale,
    )
