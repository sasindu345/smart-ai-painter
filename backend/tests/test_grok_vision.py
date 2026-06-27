import pytest
from unittest.mock import patch, MagicMock
from app.services.providers.grok_vision import GrokVisionProvider
from app.services.providers.base import SceneAnalysis
from app.core.config import settings
import requests

@pytest.mark.anyio
async def test_grok_vision_provider_missing_key():
    with patch.object(settings, "grok_api_key", ""):
        provider = GrokVisionProvider()
        result = await provider.analyze("dGVzdF9za2V0Y2hfYmFzZTY0")
        
        assert isinstance(result, SceneAnalysis)
        assert result.confidence == 0.0
        assert result.subject == "unidentified sketch"
        assert "Grok VLM error" in result.raw_description

@pytest.mark.anyio
async def test_grok_vision_provider_success():
    provider = GrokVisionProvider()
    
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "choices": [
            {
                "message": {
                    "content": '{"subject": "airplane", "objects": ["wings", "engines"], "composition": "centered", "view": "three-quarter", "confidence": 0.92}'
                }
            }
        ]
    }
    
    with patch.object(settings, "grok_api_key", "xai-test-key"):
        with patch("app.services.providers.grok_vision.requests.post", return_value=mock_response) as mock_post:
            result = await provider.analyze("dGVzdF9za2V0Y2hfYmFzZTY0")
            
            assert isinstance(result, SceneAnalysis)
            assert result.subject == "airplane"
            assert result.objects == ["wings", "engines"]
            assert result.composition == "centered"
            assert result.view == "three-quarter"
            assert result.confidence == 0.92
            
            # Verify request headers and model payload
            args, kwargs = mock_post.call_args
            assert kwargs["headers"]["Authorization"] == "Bearer xai-test-key"
            assert kwargs["json"]["model"] == "grok-2-vision-1212"

@pytest.mark.anyio
async def test_grok_vision_provider_error():
    provider = GrokVisionProvider()
    
    mock_response = MagicMock()
    mock_response.status_code = 401
    mock_response.text = "Unauthorized key"
    
    with patch.object(settings, "grok_api_key", "xai-invalid-key"):
        with patch("app.services.providers.grok_vision.requests.post", return_value=mock_response):
            result = await provider.analyze("dGVzdF9za2V0Y2hfYmFzZTY0")
            
            assert isinstance(result, SceneAnalysis)
            assert result.confidence == 0.0
            assert result.subject == "unidentified sketch"
            assert "Unauthorized key" in result.raw_description
