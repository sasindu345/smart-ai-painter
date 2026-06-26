import base64
import io
import pytest
from PIL import Image
from app.services.providers.mock_vision import MockVisionProvider
from app.services.providers.mock_generation import MockGenerationProvider
from app.services.providers.base import BuiltPrompt
from app.services.ai_service import generate_with_ai


def _make_sketch_b64(blank: bool = False) -> str:
    # A simple image. If blank, fill with white. If not, draw a line/rectangle.
    img = Image.new("RGB", (200, 200), "white")
    if not blank:
        # Draw some non-white pixels
        for i in range(10, 50):
            img.putpixel((i, i), (0, 0, 0)) # black stroke
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return base64.b64encode(buf.getvalue()).decode("utf-8")


@pytest.mark.anyio
async def test_mock_vision_provider_non_blank():
    provider = MockVisionProvider()
    sketch = _make_sketch_b64(blank=False)
    analysis = await provider.analyze(sketch)
    
    assert analysis.confidence == 0.85
    assert analysis.subject == "sketch of an object"
    assert "unidentified shape" in analysis.objects
    assert "centered" in analysis.composition


@pytest.mark.anyio
async def test_mock_vision_provider_blank():
    provider = MockVisionProvider()
    sketch = _make_sketch_b64(blank=True)
    analysis = await provider.analyze(sketch)
    
    assert analysis.confidence == 0.1
    assert analysis.subject == "blank canvas"
    assert len(analysis.objects) == 0


@pytest.mark.anyio
async def test_mock_generation_provider():
    provider = MockGenerationProvider()
    prompt = BuiltPrompt(
        positive="a realistic house with chimney",
        negative="ugly, blurry",
        guidance_scale=8.5,
        controlnet_conditioning_scale=0.75
    )
    result = await provider.generate(
        sketch_base64=_make_sketch_b64(blank=False),
        prompt=prompt,
        width=1000,
        height=800
    )
    
    assert result.provider_name == "mock"
    assert len(result.image_base64) > 0
    assert len(result.generation_id) > 0
    
    # Try decoding back to verify it's a valid image
    img_data = base64.b64decode(result.image_base64)
    img = Image.open(io.BytesIO(img_data))
    assert img.size[0] > 0


@pytest.mark.anyio
async def test_end_to_end_mock_pipeline():
    from unittest.mock import patch
    from app.core.config import settings
    
    with patch.object(settings, "vlm_provider", "mock"), \
         patch.object(settings, "ai_mode", "mock"):
        sketch = _make_sketch_b64(blank=False)
        result = await generate_with_ai(
            sketch_base64=sketch,
            style="watercolor",
            strength=0.7,
            user_hint="a tree",
            page_width=800,
            page_height=600
        )
        
        assert result.provider_name == "mock"
        assert len(result.image_base64) > 0
        assert result.scene.confidence == 0.85
        assert result.needs_hint is False  # threshold is 0.5, confidence is 0.85
