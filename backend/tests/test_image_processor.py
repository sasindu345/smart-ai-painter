import base64
import io

import pytest
from PIL import Image

from app.services.image_processor import (
    decode_base64_image,
    encode_image_base64,
    normalize_image,
    process_sketch,
)


def _make_test_image(w: int = 200, h: int = 100, color: str = "red") -> str:
    """Create a small test image and return its base64 string."""
    img = Image.new("RGB", (w, h), color)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return base64.b64encode(buf.getvalue()).decode("utf-8")


def _make_rgba_image(w: int = 200, h: int = 100) -> str:
    """Create an RGBA image with transparency."""
    img = Image.new("RGBA", (w, h), (255, 0, 0, 128))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return base64.b64encode(buf.getvalue()).decode("utf-8")


class TestDecodeBase64Image:
    def test_valid_image(self):
        b64 = _make_test_image()
        img = decode_base64_image(b64)
        assert img.size == (200, 100)

    def test_with_data_uri_prefix(self):
        b64 = _make_test_image()
        img = decode_base64_image(f"data:image/png;base64,{b64}")
        assert img.size == (200, 100)

    def test_invalid_data_raises_400(self):
        from fastapi import HTTPException

        with pytest.raises(HTTPException) as exc_info:
            decode_base64_image("not-valid-base64!!!")
        assert exc_info.value.status_code == 400


class TestNormalizeImage:
    def test_landscape_preserves_aspect(self):
        img = Image.new("RGB", (1600, 900), "blue")
        result = normalize_image(img, page_width=1600, page_height=900)
        assert result.size[0] == 1024
        # Height should be proportional: 1024 * (900/1600) = 576
        assert result.size[1] == 576

    def test_portrait_preserves_aspect(self):
        img = Image.new("RGB", (1080, 1350), "green")
        result = normalize_image(img, page_width=1080, page_height=1350)
        assert result.size[1] == 1024
        assert result.size[0] == int(1024 * (1080 / 1350))

    def test_square(self):
        img = Image.new("RGB", (1024, 1024), "yellow")
        result = normalize_image(img, page_width=1024, page_height=1024)
        assert result.size == (1024, 1024)

    def test_rgba_converted_to_rgb(self):
        img = Image.new("RGBA", (200, 200), (255, 0, 0, 128))
        result = normalize_image(img, page_width=200, page_height=200)
        assert result.mode == "RGB"


class TestEncodeImageBase64:
    def test_round_trip(self):
        img = Image.new("RGB", (50, 50), "purple")
        b64 = encode_image_base64(img)
        raw = base64.b64decode(b64)
        restored = Image.open(io.BytesIO(raw))
        assert restored.size == (50, 50)


class TestProcessSketch:
    def test_full_pipeline(self):
        b64 = _make_test_image(800, 600)
        result = process_sketch(b64, "landscape", 800, 600)
        # Result should be a valid base64 PNG
        raw = base64.b64decode(result)
        img = Image.open(io.BytesIO(raw))
        assert img.mode == "RGB"
        assert img.size[0] == 1024

    def test_invalid_image_raises(self):
        from fastapi import HTTPException

        with pytest.raises(HTTPException):
            process_sketch("garbage", "square", 1024, 1024)

    def test_blank_canvas_rejected(self):
        """A fully white canvas should be rejected as blank."""
        from fastapi import HTTPException

        # All-white image simulates a blank canvas
        blank_b64 = _make_test_image(800, 600, color="white")
        with pytest.raises(HTTPException) as exc_info:
            process_sketch(blank_b64, "landscape", 800, 600)
        assert exc_info.value.status_code == 400
        assert "blank" in exc_info.value.detail.lower()

    def test_non_blank_canvas_accepted(self):
        """A colored image should pass the blank check."""
        b64 = _make_test_image(800, 600, color="red")
        result = process_sketch(b64, "landscape", 800, 600)
        assert len(result) > 0
