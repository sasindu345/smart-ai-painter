import base64
import json
import logging
import requests
import anyio
from fastapi import HTTPException
from app.core.config import settings
from app.services.providers.base import VisionProvider, SceneAnalysis

logger = logging.getLogger(__name__)


class GroqVisionProvider(VisionProvider):
    """Groq Llama Vision implementation of VisionProvider."""

    async def analyze(self, sketch_base64: str) -> SceneAnalysis:
        # Strip data URL prefix if present
        if "," in sketch_base64:
            _, clean_b64 = sketch_base64.split(",", 1)
        else:
            clean_b64 = sketch_base64

        try:
            api_key = settings.groq_api_key
            if not api_key:
                logger.warning("GROQ_API_KEY is not set. Groq vision provider will fail.")
                raise ValueError("GROQ_API_KEY config is empty.")

            # Detect format (PNG / JPEG)
            mime_type = "image/png"
            if clean_b64.startswith("/9j/"):
                mime_type = "image/jpeg"

            headers = {
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            }

            system_instruction = (
                "You are a sketch recognition system. You analyze simple hand-drawn line drawings on white backgrounds.\n"
                "Your ONLY job is to identify WHAT is drawn. Do not guess mood, weather, lighting, or artistic style.\n"
                "Return your response ONLY in JSON format matching this schema:\n"
                "{\n"
                "  \"subject\": \"main subject of the sketch in 2-5 words\",\n"
                "  \"objects\": [\"list of identifiable objects present in the sketch\"],\n"
                "  \"composition\": \"description of spatial layout and object placement\",\n"
                "  \"view\": \"camera view: front, side, top-down, three-quarter, bird-eye, or unknown\",\n"
                "  \"confidence\": float value between 0.0 and 1.0 representing how certain you are of the drawing subject\n"
                "}\n"
                "Rules:\n"
                "- If the sketch is too abstract to identify, set confidence below 0.3.\n"
                "- If you can partially identify the sketch, set confidence between 0.3 and 0.7.\n"
                "- Only set confidence above 0.7 if you are reasonably certain.\n"
                "- Never invent objects that are not visually present in the sketch.\n"
                "- The 'objects' list must only contain things you can see drawn."
            )

            payload = {
                "model": settings.groq_model or "llama-3.2-11b-vision-preview",
                "messages": [
                    {
                        "role": "system",
                        "content": system_instruction
                    },
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": "Identify what is drawn in this line-sketch drawing. Return the output as JSON."
                            },
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:{mime_type};base64,{clean_b64}"
                                }
                            }
                        ]
                    }
                ],
                "response_format": {"type": "json_object"},
                "temperature": 0.1
            }

            url = "https://api.groq.com/openai/v1/chat/completions"

            def perform_post():
                return requests.post(url, headers=headers, json=payload, timeout=30.0)

            response = await anyio.to_thread.run_sync(perform_post)

            if response.status_code != 200:
                logger.error(f"Groq API returned error status {response.status_code}: {response.text}")
                raise ValueError(f"Groq API error: {response.text[:200]}")

            result_data = response.json()
            message_content = result_data["choices"][0]["message"]["content"]
            
            data = json.loads(message_content)

            # Construct standard SceneAnalysis result
            return SceneAnalysis(
                subject=data.get("subject", "sketch of an object"),
                objects=data.get("objects", []),
                composition=data.get("composition", "centered"),
                view=data.get("view", "front view"),
                confidence=float(data.get("confidence", 0.5)),
                raw_description=message_content,
            )

        except Exception as e:
            logger.error("Groq VLM analysis failed: %s", str(e), exc_info=True)
            # Safe fallback if API error or parsing error occurs
            return SceneAnalysis(
                subject="unidentified sketch",
                objects=[],
                composition="unknown",
                view="unknown",
                confidence=0.0,
                raw_description=f"Groq VLM error: {str(e)[:300]}",
            )
