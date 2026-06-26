from app.core.config import settings
from app.services.providers.base import VisionProvider, GenerationProvider
from app.services.providers.mock_vision import MockVisionProvider
from app.services.providers.mock_generation import MockGenerationProvider


def get_vision_provider() -> VisionProvider:
    """Resolve the active vision provider from config."""
    if settings.vlm_provider == "gemini":
        try:
            from app.services.providers.gemini_vision import GeminiVisionProvider
            return GeminiVisionProvider()
        except ImportError:
            # Fallback during Phase 1 if not yet implemented
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
            # Fallback during Phase 1 if not yet implemented
            return MockGenerationProvider()
    return MockGenerationProvider()
