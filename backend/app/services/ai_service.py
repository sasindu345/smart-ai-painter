"""AI generation service with provider pattern.

Resolves the active provider (mock or huggingface) from config and delegates
generation through a single stable interface.
"""

import base64
import io
import uuid
from dataclasses import dataclass

import httpx
from fastapi import HTTPException
from PIL import Image, ImageDraw, ImageFilter

from app.core.config import settings


@dataclass
class GenerationResult:
    image_base64: str
    generation_id: str
    mode: str
    provider: str


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
    """Create a deterministic gradient placeholder image with metadata overlay.

    The gradient colours are derived from the prompt hash so repeated prompts
    produce the same preview, making frontend development predictable.
    """
    # Scale output to a reasonable size (max 1024 on longest side)
    aspect = page_width / page_height
    if aspect >= 1:
        w, h = 1024, int(1024 / aspect)
    else:
        w, h = int(1024 * aspect), 1024

    # Deterministic colours from prompt
    seed = hash(prompt) & 0xFFFFFF
    r1, g1, b1 = (seed >> 16) & 0xFF, (seed >> 8) & 0xFF, seed & 0xFF
    r2, g2, b2 = 255 - r1, 255 - g1, 255 - b1

    img = Image.new("RGB", (w, h))
    draw = ImageDraw.Draw(img)

    # Vertical gradient
    for y in range(h):
        ratio = y / max(h - 1, 1)
        r = int(r1 + (r2 - r1) * ratio)
        g = int(g1 + (g2 - g1) * ratio)
        b = int(b1 + (b2 - b1) * ratio)
        draw.line([(0, y), (w, y)], fill=(r, g, b))

    # Soft blur to look more like generated art
    img = img.filter(ImageFilter.GaussianBlur(radius=8))

    # Overlay text
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
# Hugging Face provider (prepared — activated when AI_MODE=huggingface)
# ---------------------------------------------------------------------------

async def _huggingface_generate(
    sketch_base64: str,
    prompt: str,
    style: str,
    strength: float,
    page_width: int,
    page_height: int,
) -> GenerationResult:
    """Call Hugging Face Inference API with the configured model."""
    if not settings.hf_api_token:
        raise HTTPException(
            status_code=503,
            detail="Hugging Face API token not configured. Set HF_API_TOKEN in .env.",
        )

    api_url = f"https://api-inference.huggingface.co/models/{settings.hf_model_id}"
    headers = {"Authorization": f"Bearer {settings.hf_api_token}"}

    styled_prompt = f"{prompt}, {style} style" if style else prompt

    payload = {
        "inputs": styled_prompt,
        "parameters": {
            "guidance_scale": 7.5,
            "num_inference_steps": 30,
        },
    }

    try:
        async with httpx.AsyncClient(timeout=settings.hf_timeout_seconds) as client:
            response = await client.post(api_url, headers=headers, json=payload)
            response.raise_for_status()

            image_bytes = response.content
            img = Image.open(io.BytesIO(image_bytes))
            buf = io.BytesIO()
            img.save(buf, format="PNG")
            image_b64 = base64.b64encode(buf.getvalue()).decode("utf-8")

            return GenerationResult(
                image_base64=image_b64,
                generation_id=str(uuid.uuid4()),
                mode="huggingface",
                provider=settings.hf_model_id,
            )
    except httpx.TimeoutException as exc:
        raise HTTPException(
            status_code=504,
            detail="AI provider timed out. Try again or reduce complexity.",
        ) from exc
    except httpx.HTTPStatusError as exc:
        raise HTTPException(
            status_code=502,
            detail=f"AI provider error: {exc.response.status_code} — {exc.response.text[:200]}",
        ) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Unexpected error from AI provider: {exc}",
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
