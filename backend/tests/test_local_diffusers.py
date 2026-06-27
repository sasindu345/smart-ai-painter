import pytest
from unittest.mock import patch, MagicMock
from fastapi import HTTPException
import httpx
from app.services.providers.local_diffusers import LocalDiffusersProvider
from app.services.providers.base import BuiltPrompt, GenerationResult
from app.core.config import settings

@pytest.mark.anyio
async def test_local_diffusers_provider_missing_url():
    with patch.object(settings, "local_diffusers_url", ""):
        provider = LocalDiffusersProvider()
        prompt = BuiltPrompt(
            positive="a simple prompt",
            negative="negative prompt",
            guidance_scale=7.5,
            controlnet_conditioning_scale=0.8
        )
        with pytest.raises(HTTPException) as exc:
            await provider.generate("dGVzdF9iNjQ=", prompt, 512, 512)
        assert exc.value.status_code == 500
        assert "not configured" in exc.value.detail

@pytest.mark.anyio
async def test_local_diffusers_provider_success():
    provider = LocalDiffusersProvider()
    prompt = BuiltPrompt(
        positive="a simple prompt",
        negative="negative prompt",
        guidance_scale=7.5,
        controlnet_conditioning_scale=0.8
    )
    
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {"image": "generated_image_b64"}
    
    with patch.object(settings, "local_diffusers_url", "http://colab-tunnel.ngrok-free.app"):
        with patch("app.services.providers.local_diffusers.requests.post", return_value=mock_response) as mock_post:
            result = await provider.generate("dGVzdF9iNjQ=", prompt, 512, 512)
            
            assert isinstance(result, GenerationResult)
            assert result.image_base64 == "generated_image_b64"
            assert result.provider_name == "local-diffusers-controlnet"
            
            # Assert correct arguments were sent (e.g. coordinates are multiple of 8)
            args, kwargs = mock_post.call_args
            payload = kwargs["json"]
            assert payload["width"] == 512
            assert payload["height"] == 512
            assert payload["prompt"] == "a simple prompt"

@pytest.mark.anyio
async def test_local_diffusers_provider_connect_error():
    import requests
    provider = LocalDiffusersProvider()
    prompt = BuiltPrompt(
        positive="a simple prompt",
        negative="negative prompt",
        guidance_scale=7.5,
        controlnet_conditioning_scale=0.8
    )
    
    with patch.object(settings, "local_diffusers_url", "http://invalid-url.local"):
        with patch("app.services.providers.local_diffusers.requests.post", side_effect=requests.exceptions.ConnectionError("Connection refused")):
            with pytest.raises(HTTPException) as exc:
                await provider.generate("dGVzdF9iNjQ=", prompt, 512, 512)
            assert exc.value.status_code == 503
            assert "Could not connect to the free GPU server" in exc.value.detail

@pytest.mark.anyio
async def test_local_diffusers_provider_timeout():
    import requests
    provider = LocalDiffusersProvider()
    prompt = BuiltPrompt(
        positive="a simple prompt",
        negative="negative prompt",
        guidance_scale=7.5,
        controlnet_conditioning_scale=0.8
    )
    
    with patch.object(settings, "local_diffusers_url", "http://timeout-url.local"):
        with patch("app.services.providers.local_diffusers.requests.post", side_effect=requests.exceptions.Timeout("Request timed out")):
            with pytest.raises(HTTPException) as exc:
                await provider.generate("dGVzdF9iNjQ=", prompt, 512, 512)
            assert exc.value.status_code == 504
            assert "timed out" in exc.value.detail
