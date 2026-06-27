import pytest
from unittest.mock import patch, MagicMock
from app.services.ai_service import generate_with_ai
from app.core.config import settings

@pytest.mark.anyio
async def test_pipeline_e2e_gemini_and_local_diffusers():
    # Mock VLM (Gemini) response
    mock_vlm_resp = MagicMock()
    mock_vlm_resp.text = '{"subject": "airplane", "objects": ["wings", "tail"], "composition": "centered", "view": "top-down", "confidence": 0.95}'
    
    # Mock Generator (LocalDiffusers) response
    mock_gen_resp = MagicMock()
    mock_gen_resp.status_code = 200
    mock_gen_resp.json.return_value = {"image": "mocked_local_diffusers_image_base64"}
    
    with patch.object(settings, "vlm_provider", "gemini"), \
         patch.object(settings, "ai_mode", "local_diffusers"), \
         patch.object(settings, "gemini_api_key", "test_key"), \
         patch.object(settings, "local_diffusers_url", "http://colab-tunnel.ngrok-free.app"):
             
        with patch("google.genai.Client") as MockClient, \
             patch("app.services.providers.local_diffusers.requests.post", return_value=mock_gen_resp):
                 
            MockClient.return_value.models.generate_content.return_value = mock_vlm_resp
            
            result = await generate_with_ai(
                sketch_base64="dGVzdF9za2V0Y2hfYmFzZTY0", # "test_sketch_base64"
                style="anime",
                strength=0.8,
                user_hint="",
                page_width=800,
                page_height=600
            )
            
            assert result.image_base64 == "mocked_local_diffusers_image_base64"
            assert result.provider_name == "local-diffusers-controlnet"
            assert result.scene.subject == "airplane"
            assert result.scene.confidence == 0.95
            assert result.needs_hint is False
