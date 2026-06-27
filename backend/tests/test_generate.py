import base64
import io
import os

import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient
from PIL import Image

# Force mock mode for tests regardless of .env
os.environ["AI_MODE"] = "mock"
os.environ["VLM_PROVIDER"] = "mock"

from app.core.config import settings
from app.main import app
from app.api.v1.routes import generate as generate_route

@pytest.fixture(autouse=True)
def force_mock_settings():
    settings.ai_mode = "mock"
    settings.vlm_provider = "mock"

client = TestClient(app)


def _make_sketch_b64(w: int = 200, h: int = 100) -> str:
    img = Image.new("RGB", (w, h), "blue")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return base64.b64encode(buf.getvalue()).decode("utf-8")


class TestGenerateEndpoint:
    def test_success_mock_mode(self):
        resp = client.post(
            "/api/v1/generate/",
            json={
                "sketch_base64": _make_sketch_b64(),
                "prompt": "a beautiful sunset",
                "style": "watercolor",
                "strength": 0.65,
                "page_preset": "landscape",
                "page_width": 1600,
                "page_height": 900,
            },
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["mode"] == "mock"
        assert data["provider"] == "mock"
        assert len(data["image_base64"]) > 0
        assert len(data["generation_id"]) > 0

    def test_invalid_image_rejected(self):
        resp = client.post(
            "/api/v1/generate/",
            json={
                "sketch_base64": "not-a-real-image",
                "prompt": "test prompt",
                "style": "realistic",
                "strength": 0.5,
                "page_preset": "square",
                "page_width": 1024,
                "page_height": 1024,
            },
        )
        assert resp.status_code == 400

    def test_empty_prompt_allowed(self):
        resp = client.post(
            "/api/v1/generate/",
            json={
                "sketch_base64": _make_sketch_b64(),
                "prompt": "",
                "style": "realistic",
                "strength": 0.5,
                "page_preset": "square",
                "page_width": 1024,
                "page_height": 1024,
            },
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["mode"] == "mock"
        assert data["provider"] == "mock"
        assert len(data["image_base64"]) > 0
        assert "scene_description" in data
        assert "confidence" in data
        assert "needs_hint" in data

    def test_strength_out_of_range_rejected(self):
        resp = client.post(
            "/api/v1/generate/",
            json={
                "sketch_base64": _make_sketch_b64(),
                "prompt": "test",
                "style": "oil",
                "strength": 1.5,
                "page_preset": "square",
                "page_width": 1024,
                "page_height": 1024,
            },
        )
        assert resp.status_code == 422

    def test_blank_canvas_rejected(self):
        """Sending a blank white canvas should return 400."""
        # Create all-white image
        img = Image.new("RGB", (200, 100), "white")
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        blank_b64 = base64.b64encode(buf.getvalue()).decode("utf-8")

        resp = client.post(
            "/api/v1/generate/",
            json={
                "sketch_base64": blank_b64,
                "prompt": "a sunset",
                "style": "realistic",
                "strength": 0.65,
                "page_preset": "landscape",
                "page_width": 1600,
                "page_height": 900,
            },
        )
        assert resp.status_code == 400
        assert "blank" in resp.json()["detail"].lower()

    def test_provider_failure_maps_to_user_friendly_error(self, monkeypatch):
        async def _fail(**_kwargs):
            raise HTTPException(status_code=502, detail="AI provider timed out. Try again.")

        monkeypatch.setattr(generate_route, "generate_with_ai", _fail)

        resp = client.post(
            "/api/v1/generate/",
            json={
                "sketch_base64": _make_sketch_b64(),
                "prompt": "a sunset",
                "style": "realistic",
                "strength": 0.65,
                "page_preset": "landscape",
                "page_width": 1600,
                "page_height": 900,
            },
        )

        assert resp.status_code == 502
        assert resp.json()["detail"] == "AI provider timed out. Try again."


class TestHealthEndpoint:
    def test_health_ok(self):
        resp = client.get("/health")
        assert resp.status_code == 200
        assert resp.json()["status"] == "ok"
