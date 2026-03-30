"""AI generation service with provider pattern.

Resolves the active provider (mock or huggingface) from config and delegates
generation through a single stable interface.

Strategy: The free HF inference API only supports text-to-image for SDXL.
We analyze the sketch to extract spatial layout (where objects are, density,
composition) and enrich the user's prompt with that context. The result is
a text-to-image generation that respects the sketch's aspect ratio and
composition intent.

When a paid img2img provider becomes available, the `generate_with_ai`
interface stays the same — only the internal provider function changes.
"""

import asyncio
import base64
import io
import logging
import uuid
from dataclasses import dataclass
from functools import partial

from fastapi import HTTPException
from huggingface_hub import InferenceClient
from PIL import Image, ImageDraw, ImageFilter, ImageStat

from app.core.config import settings

logger = logging.getLogger(__name__)


@dataclass
class GenerationResult:
    image_base64: str
    generation_id: str
    mode: str
    provider: str


# ---------------------------------------------------------------------------
# Sketch analysis — extract layout hints from the drawing
# ---------------------------------------------------------------------------

def _analyze_sketch(sketch_base64: str) -> dict:
    """Analyze sketch to extract composition hints for prompt enrichment.

    Returns dict with: density, regions (where content is), aspect description.
    """
    raw = base64.b64decode(sketch_base64)
    img = Image.open(io.BytesIO(raw)).convert("L")  # grayscale
    w, h = img.size

    # Invert: white bg → 0, dark strokes → 255
    pixels = img.load()
    stroke_pixels = []
    for y in range(h):
        for x in range(w):
            if pixels[x, y] < 200:  # non-white = stroke
                stroke_pixels.append((x, y))

    total_pixels = w * h
    density = len(stroke_pixels) / total_pixels if total_pixels > 0 else 0

    # Find content regions (quadrants)
    regions = []
    if stroke_pixels:
        xs = [p[0] for p in stroke_pixels]
        ys = [p[1] for p in stroke_pixels]
        cx, cy = sum(xs) / len(xs), sum(ys) / len(ys)

        # Describe where the content is centered
        h_pos = "left" if cx < w * 0.4 else ("right" if cx > w * 0.6 else "center")
        v_pos = "top" if cy < h * 0.4 else ("bottom" if cy > h * 0.6 else "middle")
        regions.append(f"{v_pos} {h_pos}")

        # Content spread
        spread_x = (max(xs) - min(xs)) / w
        spread_y = (max(ys) - min(ys)) / h
        if spread_x > 0.7 and spread_y > 0.7:
            regions.append("full composition")
        elif spread_x > 0.7:
            regions.append("wide horizontal composition")
        elif spread_y > 0.7:
            regions.append("tall vertical composition")

    # Aspect ratio description
    ratio = w / h
    if ratio > 1.3:
        aspect = "wide landscape format"
    elif ratio < 0.77:
        aspect = "tall portrait format"
    else:
        aspect = "square format"

    # Complexity
    if density > 0.15:
        complexity = "detailed"
    elif density > 0.05:
        complexity = "moderate detail"
    else:
        complexity = "minimal, simple"

    return {
        "density": density,
        "regions": regions,
        "aspect": aspect,
        "complexity": complexity,
    }


def _build_enriched_prompt(prompt: str, style: str, strength: float, sketch_info: dict) -> str:
    """Build a rich prompt combining user input with sketch analysis."""
    parts = [prompt.strip()]

    # Add style
    if style:
        parts.append(f"{style} style")

    # Add composition hints from sketch
    if sketch_info["regions"]:
        composition = ", ".join(sketch_info["regions"])
        parts.append(f"composition: {composition}")

    parts.append(sketch_info["aspect"])

    # Quality boosters scaled by strength
    if strength > 0.5:
        parts.append("highly detailed, professional quality, masterpiece")
    else:
        parts.append("clean, well-composed")

    parts.append(sketch_info["complexity"])

    return ", ".join(parts)


# ---------------------------------------------------------------------------
# Mock provider
# ---------------------------------------------------------------------------

def _generate_mock_image(
    prompt: str,
    style: str,
    strength: float,
    page_width: int,
    page_height: int,
) -> str:
    """Create a deterministic gradient placeholder image with metadata overlay."""
    aspect = page_width / page_height
    if aspect >= 1:
        w, h = 1024, int(1024 / aspect)
    else:
        w, h = int(1024 * aspect), 1024

    seed = hash(prompt) & 0xFFFFFF
    r1, g1, b1 = (seed >> 16) & 0xFF, (seed >> 8) & 0xFF, seed & 0xFF
    r2, g2, b2 = 255 - r1, 255 - g1, 255 - b1

    img = Image.new("RGB", (w, h))
    draw = ImageDraw.Draw(img)

    for y in range(h):
        ratio = y / max(h - 1, 1)
        r = int(r1 + (r2 - r1) * ratio)
        g = int(g1 + (g2 - g1) * ratio)
        b = int(b1 + (b2 - b1) * ratio)
        draw.line([(0, y), (w, y)], fill=(r, g, b))

    img = img.filter(ImageFilter.GaussianBlur(radius=8))

    draw = ImageDraw.Draw(img)
    label = f"MOCK · {style} · strength {strength:.0%}"
    draw.text((20, h - 40), label, fill=(255, 255, 255, 200))
    draw.text((20, 20), prompt[:60], fill=(255, 255, 255, 200))

    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return base64.b64encode(buf.getvalue()).decode("utf-8")


async def _mock_generate(
    sketch_base64: str,
    prompt: str,
    style: str,
    strength: float,
    page_width: int,
    page_height: int,
) -> GenerationResult:
    image_b64 = _generate_mock_image(prompt, style, strength, page_width, page_height)
    return GenerationResult(
        image_base64=image_b64,
        generation_id=str(uuid.uuid4()),
        mode="mock",
        provider="mock",
    )


# ---------------------------------------------------------------------------
# Hugging Face provider — sketch-aware text-to-image (free tier)
# ---------------------------------------------------------------------------

async def _huggingface_generate(
    sketch_base64: str,
    prompt: str,
    style: str,
    strength: float,
    page_width: int,
    page_height: int,
) -> GenerationResult:
    """Generate artwork using HF free inference API.

    Analyzes the sketch for composition/layout, enriches the prompt with
    spatial context, and generates via text-to-image matching the sketch's
    aspect ratio.
    """
    if not settings.hf_api_token:
        raise HTTPException(
            status_code=503,
            detail="Hugging Face API token not configured. Set HF_API_TOKEN in .env.",
        )

    # Step 1: Analyze sketch for composition hints
    sketch_info = _analyze_sketch(sketch_base64)

    # Step 2: Build enriched prompt
    enriched_prompt = _build_enriched_prompt(prompt, style, strength, sketch_info)

    # Step 3: Generate via text-to-image (free tier)
    # InferenceClient is synchronous — run in thread pool to avoid blocking
    def _call_hf():
        client = InferenceClient(token=settings.hf_api_token)
        return client.text_to_image(
            prompt=enriched_prompt,
            model=settings.hf_model_id,
            guidance_scale=7.5 + (strength * 5.0),
            num_inference_steps=30,
        )

    try:
        loop = asyncio.get_event_loop()
        result_image = await loop.run_in_executor(None, _call_hf)

        # Step 4: Resize to match sketch aspect ratio
        aspect = page_width / page_height
        if aspect >= 1:
            target_w, target_h = 1024, int(1024 / aspect)
        else:
            target_w, target_h = int(1024 * aspect), 1024

        result_image = result_image.resize((target_w, target_h), Image.LANCZOS)

        buf = io.BytesIO()
        result_image.save(buf, format="PNG")
        image_b64 = base64.b64encode(buf.getvalue()).decode("utf-8")

        return GenerationResult(
            image_base64=image_b64,
            generation_id=str(uuid.uuid4()),
            mode="huggingface",
            provider=settings.hf_model_id,
        )
    except HTTPException:
        raise
    except Exception as exc:
        error_msg = str(exc)
        logger.error("HF generation failed: %s", error_msg)
        if "402" in error_msg or "Payment" in error_msg:
            raise HTTPException(
                status_code=502,
                detail="This model requires a paid plan. Try a different model in .env.",
            ) from exc
        if "timed out" in error_msg.lower() or "timeout" in error_msg.lower():
            raise HTTPException(
                status_code=504,
                detail="AI provider timed out. Try again.",
            ) from exc
        raise HTTPException(
            status_code=502,
            detail=f"AI provider error: {error_msg[:300]}",
        ) from exc


# ---------------------------------------------------------------------------
# Public interface
# ---------------------------------------------------------------------------

async def generate_with_ai(
    sketch_base64: str,
    prompt: str,
    style: str,
    strength: float,
    page_width: int,
    page_height: int,
) -> GenerationResult:
    """Single entrypoint for the route layer. Provider resolved from config."""
    if settings.ai_mode == "huggingface":
        return await _huggingface_generate(
            sketch_base64, prompt, style, strength, page_width, page_height,
        )
    return await _mock_generate(
        sketch_base64, prompt, style, strength, page_width, page_height,
    )
