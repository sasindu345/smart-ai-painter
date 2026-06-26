import base64
import io
from PIL import Image
from app.services.providers.base import VisionProvider, SceneAnalysis


class MockVisionProvider(VisionProvider):
    """Mock implementation of the VisionProvider.

    Decodes the sketch base64 to analyze stroke density.
    Returns low confidence for blank/near-blank sketches,
    and a default high-confidence mock analysis otherwise.
    """

    async def analyze(self, sketch_base64: str) -> SceneAnalysis:
        # Strip data URL prefix if present
        if "," in sketch_base64:
            _, sketch_base64 = sketch_base64.split(",", 1)

        try:
            image_data = base64.b64decode(sketch_base64)
            image = Image.open(io.BytesIO(image_data))

            # Convert to grayscale to check drawing strokes
            gray_image = image.convert("L")
            extrema = gray_image.getextrema()

            if extrema is None or extrema[0] == extrema[1]:
                # Completely uniform (blank)
                return SceneAnalysis(
                    subject="blank canvas",
                    objects=[],
                    composition="empty space",
                    view="unknown",
                    confidence=0.1,
                    raw_description="Mock analysis: detected a completely blank canvas.",
                )

            # Count non-white pixels (drawing lines are usually dark, e.g. < 240)
            pixels = list(gray_image.getdata())
            non_white_count = sum(1 for p in pixels if p < 240)

            # Check alpha channel if present (transparent background with dark strokes)
            has_alpha = image.mode in ("RGBA", "LA") or (image.mode == "P" and "transparency" in image.info)
            if has_alpha:
                alpha = image.split()[-1]
                alpha_pixels = list(alpha.getdata())
                non_transparent_count = sum(1 for a in alpha_pixels if a > 15)
                stroke_pixels = max(non_white_count, non_transparent_count)
            else:
                stroke_pixels = non_white_count

            total_pixels = len(pixels)
            density = stroke_pixels / total_pixels

            # If stroke density is extremely low, treat as near-blank
            if density < 0.0001:
                return SceneAnalysis(
                    subject="blank canvas",
                    objects=[],
                    composition="empty space",
                    view="unknown",
                    confidence=0.1,
                    raw_description="Mock analysis: detected a near-blank drawing.",
                )

            # Non-blank sketch: return a standard structured description
            return SceneAnalysis(
                subject="sketch of an object",
                objects=["unidentified shape"],
                composition="centered single object",
                view="front view",
                confidence=0.85,
                raw_description="Mock analysis: detected a centered drawing.",
            )

        except Exception as e:
            # Fallback on decoding or processing error
            return SceneAnalysis(
                subject="unknown sketch",
                objects=[],
                composition="centered object",
                view="unknown",
                confidence=0.3,
                raw_description=f"Mock analysis fallback due to error: {str(e)}",
            )
