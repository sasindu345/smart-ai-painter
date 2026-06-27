import logging
from app.core.config import settings
from app.services.providers.base import VisionProvider, GenerationProvider, SceneAnalysis
from app.services.providers.mock_vision import MockVisionProvider
from app.services.providers.mock_generation import MockGenerationProvider

logger = logging.getLogger(__name__)


class ChainedVisionProvider(VisionProvider):
    """VLM Provider that chains primary and secondary providers for automatic fallback."""

    def __init__(self, primary: VisionProvider, secondary: VisionProvider):
        self.primary = primary
        self.secondary = secondary

    async def analyze(self, sketch_base64: str) -> SceneAnalysis:
        logger.info(f"Running primary VLM analysis: {self.primary.__class__.__name__}")
        result = await self.primary.analyze(sketch_base64)
        
        # Check if primary failed (e.g. confidence <= 0.0 or raw_description contains VLM error or unidentified sketch)
        if result.confidence <= 0.0 or "error" in result.raw_description.lower() or result.subject == "unidentified sketch":
            logger.warning(
                f"Primary VLM analysis failed: {result.raw_description[:100]}. "
                f"Falling back to secondary VLM: {self.secondary.__class__.__name__}"
            )
            return await self.secondary.analyze(sketch_base64)
            
        return result


def get_vision_provider() -> VisionProvider:
    """Resolve the active vision provider from config."""
    if settings.vlm_provider == "gemini":
        try:
            from app.services.providers.gemini_vision import GeminiVisionProvider
            primary = GeminiVisionProvider()
            if settings.groq_api_key:
                from app.services.providers.groq_vision import GroqVisionProvider
                secondary = GroqVisionProvider()
                return ChainedVisionProvider(primary, secondary)
            return primary
        except ImportError:
            return MockVisionProvider()
    elif settings.vlm_provider == "groq":
        try:
            from app.services.providers.groq_vision import GroqVisionProvider
            return GroqVisionProvider()
        except ImportError:
            return MockVisionProvider()
    elif settings.vlm_provider == "grok":
        try:
            from app.services.providers.grok_vision import GrokVisionProvider
            return GrokVisionProvider()
        except ImportError:
            return MockVisionProvider()
    return MockVisionProvider()


def get_generation_provider() -> GenerationProvider:
    """Resolve the active generation provider from config."""
    if settings.ai_mode == "local_diffusers":
        try:
            from app.services.providers.local_diffusers import LocalDiffusersProvider
            return LocalDiffusersProvider()
        except ImportError:
            return MockGenerationProvider()
    elif settings.ai_mode == "replicate":
        try:
            from app.services.providers.replicate_generation import ReplicateGenerationProvider
            return ReplicateGenerationProvider()
        except ImportError:
            return MockGenerationProvider()
    return MockGenerationProvider()

