import base64
import logging
import uuid
import httpx
import requests
import anyio
from fastapi import HTTPException
from app.core.config import settings
from app.services.providers.base import GenerationProvider, BuiltPrompt, GenerationResult

logger = logging.getLogger(__name__)


class LocalDiffusersProvider(GenerationProvider):
    """Local / Colab Diffusers implementation of GenerationProvider."""

    async def generate(
        self,
        sketch_base64: str,
        prompt: BuiltPrompt,
        width: int,
        height: int,
    ) -> GenerationResult:
        url = settings.local_diffusers_url
        if not url:
            logger.warning("LOCAL_DIFFUSERS_URL is not set.")
            raise HTTPException(
                status_code=500,
                detail="Local diffusers generation URL is not configured.",
            )

        if "," in sketch_base64:
            _, clean_b64 = sketch_base64.split(",", 1)
        else:
            clean_b64 = sketch_base64

        # Prepare payload matching Colab FastAPI structure
        payload = {
            "image": clean_b64,
            "prompt": prompt.positive,
            "negative_prompt": prompt.negative,
            "num_inference_steps": 25,
            "guidance_scale": prompt.guidance_scale,
            "controlnet_scale": prompt.controlnet_conditioning_scale,
            # Cap dimensions at a safe max_dim for VRAM usage (e.g. 768px for SD 1.5)
            "width": min(width, 768),
            "height": min(height, 768),
        }

        # Ensure width/height are multiples of 8 (required by Stable Diffusion)
        payload["width"] = max(8, (payload["width"] // 8) * 8)
        payload["height"] = max(8, (payload["height"] // 8) * 8)

        generate_endpoint = f"{url.rstrip('/')}/generate"
        logger.info(f"Sending generation request to local diffusers server: {generate_endpoint}")

        try:
            def make_request():
                return requests.post(generate_endpoint, json=payload, timeout=90.0)

            response = await anyio.to_thread.run_sync(make_request)

            if response.status_code != 200:
                logger.error(f"Local diffusers returned error {response.status_code}: {response.text}")
                raise HTTPException(
                    status_code=502,
                    detail=f"Local diffusers GPU server error: {response.text[:200]}"
                )

            data = response.json()
            image_b64 = data.get("image")
            if not image_b64:
                raise ValueError("No image base64 returned in JSON response.")

            return GenerationResult(
                image_base64=image_b64,
                generation_id=str(uuid.uuid4()),
                provider_name="local-diffusers-controlnet",
            )

        except requests.exceptions.ConnectionError as e:
            logger.error(f"Failed to connect to local diffusers server at {url}: {e}")
            raise HTTPException(
                status_code=503,
                detail="Could not connect to the free GPU server. Make sure your Colab/Kaggle notebook is running and the tunnel URL is correct."
            )
        except requests.exceptions.Timeout as e:
            logger.error(f"Timeout connecting to local diffusers server: {e}")
            raise HTTPException(
                status_code=504,
                detail="Generation timed out on the GPU server. Try reducing steps or resolution."
            )
        except Exception as e:
            logger.error(f"Local diffusers generation failed: {e}", exc_info=True)
            raise HTTPException(
                status_code=500,
                detail=f"Internal error running generation: {str(e)}"
            )
