from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import List


@dataclass
class SceneAnalysis:
    """Structured output from the vision provider.

    Fields are intentionally minimal and high-confidence.
    No uncertain fields (mood, weather, lighting).
    """
    subject: str            # e.g., "house with chimney"
    objects: List[str]      # e.g., ["house", "chimney", "door"]
    composition: str        # e.g., "centered single object"
    view: str               # e.g., "front view", "side view", "top-down", "three-quarter"
    confidence: float       # 0.0 to 1.0
    raw_description: str    # Full text fallback from the VLM


class VisionProvider(ABC):
    """Interface for sketch scene understanding."""

    @abstractmethod
    async def analyze(self, sketch_base64: str) -> SceneAnalysis:
        """Analyze a sketch image and return structured scene data."""
        pass


@dataclass
class BuiltPrompt:
    """Deterministic prompt built by the prompt builder (not by AI)."""
    positive: str
    negative: str
    guidance_scale: float
    controlnet_conditioning_scale: float


@dataclass
class GenerationResult:
    """Output from the generation provider."""
    image_base64: str
    generation_id: str
    provider_name: str


class GenerationProvider(ABC):
    """Interface for image generation (ControlNet + Diffusion)."""

    @abstractmethod
    async def generate(
        self,
        sketch_base64: str,
        prompt: BuiltPrompt,
        width: int,
        height: int,
    ) -> GenerationResult:
        """Generate an image from sketch + prompt."""
        pass
