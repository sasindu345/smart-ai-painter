import base64
import io
import uuid
from PIL import Image, ImageDraw, ImageFilter
from app.services.providers.base import GenerationProvider, BuiltPrompt, GenerationResult


class MockGenerationProvider(GenerationProvider):
    """Mock implementation of the GenerationProvider.

    Generates a deterministic gradient image representing the prompt features,
    overlays details about the generation parameters, and returns it as base64.
    """

    async def generate(
        self,
        sketch_base64: str,
        prompt: BuiltPrompt,
        width: int,
        height: int,
    ) -> GenerationResult:
        # Determine aspect ratio and target canvas size
        aspect = width / height
        if aspect >= 1:
            w, h = 1024, int(1024 / aspect)
        else:
            w, h = int(1024 * aspect), 1024

        # Generate seed colors from prompt string
        seed = hash(prompt.positive) & 0xFFFFFF
        r1, g1, b1 = (seed >> 16) & 0xFF, (seed >> 8) & 0xFF, seed & 0xFF
        r2, g2, b2 = 255 - r1, 255 - g1, 255 - b1

        # Create gradient image
        img = Image.new("RGB", (w, h))
        draw = ImageDraw.Draw(img)

        for y in range(h):
            ratio = y / max(h - 1, 1)
            r = int(r1 + (r2 - r1) * ratio)
            g = int(g1 + (g2 - g1) * ratio)
            b = int(b1 + (b2 - b1) * ratio)
            draw.line([(0, y), (w, y)], fill=(r, g, b))

        # Apply slight blur to make the gradient smooth
        img = img.filter(ImageFilter.GaussianBlur(radius=8))

        # Overlay text description onto the generated image
        draw = ImageDraw.Draw(img)
        label = f"MOCK · cfg {prompt.guidance_scale:.1f} · control {prompt.controlnet_conditioning_scale:.2f}"
        draw.text((20, h - 40), label, fill=(255, 255, 255, 200))
        draw.text((20, 20), prompt.positive[:80], fill=(255, 255, 255, 200))

        # Save to buffer and encode as base64
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        image_b64 = base64.b64encode(buf.getvalue()).decode("utf-8")

        return GenerationResult(
            image_base64=image_b64,
            generation_id=str(uuid.uuid4()),
            provider_name="mock",
        )
