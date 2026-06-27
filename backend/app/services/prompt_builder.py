from app.services.providers.base import SceneAnalysis, BuiltPrompt

STYLE_PROMPTS = {
    "realistic": "photorealistic, highly detailed, professional photography, sharp focus, 8k",
    "watercolor": "watercolor painting, soft colors, flowing brushwork, artistic, painterly",
    "oil": "oil painting on canvas, rich textures, visible brushstrokes, masterpiece",
    "anime": "anime style, cel shading, vibrant colors, clean lines, studio quality",
    "sketch": "detailed pencil sketch, cross-hatching, graphite drawing, paper texture",
    "cartoon": "cartoon illustration, bold outlines, flat colors, clean linework",
}

# Maps VLM view names → diffusion-model-friendly camera descriptions
VIEW_MAP = {
    "front": "front view, facing camera",
    "side": "side view, lateral perspective",
    "top-down": "top-down view, aerial perspective",
    "bird-eye": "bird's-eye view, aerial perspective",
    "three-quarter": "three-quarter view, dynamic angle",
    "unknown": "",
}

DEFAULT_NEGATIVE = (
    "blurry, low quality, distorted, deformed, ugly, "
    "extra limbs, bad anatomy, watermark, text, signature, "
    "cropped, partial, close-up, zoomed in, cut off, out of frame, "
    "duplicate, tiling, mutation"
)


def build_prompt(
    scene: SceneAnalysis,
    style: str,
    strength: float,
    user_hint: str | None = None,
) -> BuiltPrompt:
    """Build a deterministic SDXL prompt from structured scene data.

    This function contains NO AI calls. It is a pure mapping.

    Strategy:
    - Subject is ALWAYS the anchor (first token, highest weight).
    - Objects describe parts/details, NOT alternative subjects.
    - View and composition set the scene framing.
    - Style suffix comes last.
    """
    parts: list[str] = []

    # 1. Subject anchor — user hint takes absolute priority
    if user_hint and user_hint.strip():
        subject = user_hint.strip()
    else:
        subject = scene.subject.strip()

    # Wrap subject in emphasis so diffusion model treats it as the primary concept
    parts.append(subject)

    # 2. Supporting object details — filter out objects that ARE the subject
    #    (e.g. if subject is "car", don't add "car" again as a detail)
    if scene.objects and scene.confidence >= 0.5:
        subject_lower = subject.lower()
        supporting = [
            obj.strip()
            for obj in scene.objects[:4]
            if obj.strip() and obj.strip().lower() not in subject_lower
        ]
        if supporting:
            parts.append(f"with {', '.join(supporting)}")

    # 3. View framing — map VLM view name to diffusion-friendly camera description
    view_key = scene.view.lower().strip() if scene.view else "unknown"
    view_text = VIEW_MAP.get(view_key, "")
    if view_text:
        parts.append(view_text)

    # 4. Composition context (abbreviated — keep it concise)
    if scene.composition and scene.composition.strip() not in ("unknown", ""):
        # Use only first clause to avoid overly verbose prompts
        comp = scene.composition.split(".")[0].strip()
        if len(comp) < 80:
            parts.append(comp)

    # 5. Quality + style suffix
    style_suffix = STYLE_PROMPTS.get(style.lower(), STYLE_PROMPTS["realistic"])
    parts.append(style_suffix)

    positive = ", ".join(p for p in parts if p)

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
