import pytest
import os
from unittest.mock import patch, MagicMock
from app.services.providers.gemini_vision import GeminiVisionProvider
from app.services.providers.base import SceneAnalysis
from app.core.config import settings

@pytest.mark.anyio
async def test_gemini_vision_provider_missing_key():
    # Test that VLM returns a fallback when API key is missing
    with patch.object(settings, "gemini_api_key", ""):
        provider = GeminiVisionProvider()
        result = await provider.analyze("dGVzdF9za2V0Y2hfYmFzZTY0") # base64 for "test_sketch_base64"
        
        assert isinstance(result, SceneAnalysis)
        assert result.confidence == 0.0
        assert result.subject == "unidentified sketch"
        assert "VLM error" in result.raw_description

@pytest.mark.anyio
async def test_gemini_vision_provider_mock_api_call():
    # Test that VLM correctly parses a successful Gemini response
    provider = GeminiVisionProvider()
    
    mock_response = MagicMock()
    mock_response.text = '{"subject": "flower", "objects": ["petal", "stem"], "composition": "centered", "view": "front", "confidence": 0.88}'
    
    with patch("google.genai.Client") as MockClient:
        mock_client_instance = MockClient.return_value
        mock_client_instance.models.generate_content.return_value = mock_response
        
        with patch.object(settings, "gemini_api_key", "test_key"):
            result = await provider.analyze("dGVzdF9za2V0Y2hfYmFzZTY0")
            
            assert isinstance(result, SceneAnalysis)
            assert result.subject == "flower"
            assert result.objects == ["petal", "stem"]
            assert result.composition == "centered"
            assert result.view == "front"
            assert result.confidence == 0.88
            assert result.raw_description == mock_response.text

@pytest.mark.anyio
async def test_gemini_vision_provider_live_if_key_available():
    # If the user sets a live API key, let's run a quick integration test
    api_key = os.environ.get("GEMINI_API_KEY") or settings.gemini_api_key
    if not api_key:
        pytest.skip("Skipping live integration test since GEMINI_API_KEY is not set.")
        
    provider = GeminiVisionProvider()
    # A tiny 1x1 white pixel PNG image base64
    tiny_pixel = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
    
    with patch.object(settings, "gemini_api_key", api_key):
        result = await provider.analyze(tiny_pixel)
        
        assert isinstance(result, SceneAnalysis)
        # A blank/tiny image should result in low confidence
        assert result.confidence <= 0.5
