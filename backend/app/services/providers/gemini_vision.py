import base64
import json
import logging
import socket
from pydantic import BaseModel, Field
from google import genai
from google.genai import types
from app.core.config import settings
from app.services.providers.base import VisionProvider, SceneAnalysis

logger = logging.getLogger(__name__)

# ── IPv4 fix: macOS can fail with IPv6 on some networks ──────────────────────
_original_getaddrinfo = socket.getaddrinfo

def _ipv4_only(host, port, family=0, type=0, proto=0, flags=0):
    return _original_getaddrinfo(host, port, socket.AF_INET, type, proto, flags)

socket.getaddrinfo = _ipv4_only
# ─────────────────────────────────────────────────────────────────────────────


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

            client = genai.Client(
                api_key=api_key,
                http_options=types.HttpOptions(timeout=45000),
            )

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
                        "Your ONLY job is to identify WHAT is drawn as a WHOLE subject.\n\n"
                        "CRITICAL RULES:\n"
                        "- 'subject' must be the WHOLE thing drawn (e.g. 'side view of a car', 'a house', 'a dog').\n"
                        "- Do NOT make a part of the object the subject (e.g. if a car is drawn, subject is 'car', not 'wheel').\n"
                        "- 'objects' lists the visible COMPONENT PARTS only (e.g. for a car: wheels, doors, windows, bumper).\n"
                        "- 'view' describes the angle: front, side, top-down, three-quarter, bird-eye, or unknown.\n"
                        "- 'composition' describes spatial layout in one sentence (e.g. 'single object centered, facing left').\n"
                        "- If the sketch is too abstract to identify, set confidence below 0.3.\n"
                        "- If you can partially identify the sketch, set confidence between 0.3 and 0.7.\n"
                        "- Only set confidence above 0.7 if you are reasonably certain of the WHOLE subject.\n"
                        "- Never invent objects that are not visually present in the sketch.\n"
                        "- The 'objects' list must ONLY contain things you can see drawn."
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
