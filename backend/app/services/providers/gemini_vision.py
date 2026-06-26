import base64
import json
import logging
from pydantic import BaseModel, Field
from google import genai
from google.genai import types
from app.core.config import settings
from app.services.providers.base import VisionProvider, SceneAnalysis

logger = logging.getLogger(__name__)


class GeminiSceneSchema(BaseModel):
    subject: str = Field(description="main subject of the sketch in 2-5 words")
    objects: list[str] = Field(description="list of identifiable objects present in the sketch")
    composition: str = Field(description="description of spatial layout and object placement")
    view: str = Field(description="camera view: front, side, top-down, three-quarter, bird-eye, or unknown")
    confidence: float = Field(description="confidence score between 0.0 and 1.0 representing how certain you are of the drawing subject")


class GeminiVisionProvider(VisionProvider):
    """Google Gemini Flash implementation of VisionProvider."""

    async def analyze(self, sketch_base64: str) -> SceneAnalysis:
        # Strip data URL prefix if present
        if "," in sketch_base64:
            _, sketch_base64 = sketch_base64.split(",", 1)

        try:
            image_bytes = base64.b64decode(sketch_base64)
            
            api_key = settings.gemini_api_key
            if not api_key:
                logger.warning("GEMINI_API_KEY is not set. Gemini vision provider will fail.")
                raise ValueError("GEMINI_API_KEY config is empty.")

            client = genai.Client(api_key=api_key)

            # Generate content using structured JSON schema
            response = client.models.generate_content(
                model=settings.gemini_model,
                contents=[
                    types.Part.from_bytes(
                        data=image_bytes,
                        mime_type="image/png",
                    ),
                    "Identify what is drawn in this line-sketch drawing.",
                ],
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=GeminiSceneSchema,
                    system_instruction=(
                        "You are a sketch recognition system. You analyze simple hand-drawn line drawings on white backgrounds.\n"
                        "Your ONLY job is to identify WHAT is drawn. Do not guess mood, weather, lighting, or artistic style.\n"
                        "Rules:\n"
                        "- If the sketch is too abstract to identify, set confidence below 0.3.\n"
                        "- If you can partially identify the sketch, set confidence between 0.3 and 0.7.\n"
                        "- Only set confidence above 0.7 if you are reasonably certain.\n"
                        "- Never invent objects that are not visually present in the sketch.\n"
                        "- The 'objects' list must only contain things you can see drawn."
                    )
                ),
            )

            if not response.text:
                raise ValueError("Empty response received from Gemini Vision API.")

            data = json.loads(response.text)
            
            # Construct standard SceneAnalysis result
            return SceneAnalysis(
                subject=data.get("subject", "sketch of an object"),
                objects=data.get("objects", []),
                composition=data.get("composition", "centered"),
                view=data.get("view", "front view"),
                confidence=float(data.get("confidence", 0.5)),
                raw_description=response.text,
            )

        except Exception as e:
            logger.error("Gemini VLM analysis failed: %s", str(e), exc_info=True)
            # Safe fallback if API error or parsing error occurs
            return SceneAnalysis(
                subject="unidentified sketch",
                objects=[],
                composition="unknown",
                view="unknown",
                confidence=0.0,
                raw_description=f"VLM error: {str(e)[:300]}",
            )
