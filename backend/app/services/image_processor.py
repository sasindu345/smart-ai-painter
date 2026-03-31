"""Image processing service for sketch normalization.

Accepts a base64-encoded sketch image and normalizes it for AI model input
while preserving the original aspect ratio (no forced square cropping).
"""

import base64
import io

from fastapi import HTTPException
from PIL import Image

# Maximum dimension for model input — keeps memory usage predictable
MAX_DIMENSION = 1024


def decode_base64_image(sketch_base64: str) -> Image.Image:
    """Decode a base64 string into a PIL Image. Raises 400 on invalid data."""
    # Strip optional data-URI prefix (e.g. "data:image/png;base64,")
    if "," in sketch_base64:
        sketch_base64 = sketch_base64.split(",", 1)[1]

    try:
        raw = base64.b64decode(sketch_base64)
        img = Image.open(io.BytesIO(raw))
        img.verify()
        # Re-open after verify (verify consumes the stream)
        img = Image.open(io.BytesIO(raw))
        return img
    except Exception as exc:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid image data: {exc}",
        ) from exc


def normalize_image(
    img: Image.Image,
    page_width: int,
    page_height: int,
    max_dim: int = MAX_DIMENSION,
) -> Image.Image:
    """Resize image preserving aspect ratio and pad to the requested page ratio."""
    # Convert to RGB (drop alpha channel, fill transparent areas with white)
    if img.mode == "RGBA":
        background = Image.new("RGB", img.size, (255, 255, 255))
        background.paste(img, mask=img.split()[3])
        img = background
    elif img.mode != "RGB":
        img = img.convert("RGB")

    page_aspect = page_width / page_height
    if page_aspect >= 1:
        target_w = max_dim
        target_h = max(1, round(max_dim / page_aspect))
    else:
        target_h = max_dim
        target_w = max(1, round(max_dim * page_aspect))

    source_w, source_h = img.size
    scale = min(target_w / source_w, target_h / source_h)
    resized_w = max(1, round(source_w * scale))
    resized_h = max(1, round(source_h * scale))

    img_resized = img.resize((resized_w, resized_h), Image.LANCZOS)

    canvas = Image.new("RGB", (target_w, target_h), (255, 255, 255))
    offset_x = (target_w - resized_w) // 2
    offset_y = (target_h - resized_h) // 2
    canvas.paste(img_resized, (offset_x, offset_y))
    return canvas


def encode_image_base64(img: Image.Image) -> str:
    """Encode a PIL Image to a base64 PNG string."""
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return base64.b64encode(buf.getvalue()).decode("utf-8")


def is_blank_image(img: Image.Image, threshold: float = 0.99) -> bool:
    """Check if an image is effectively blank (nearly all white pixels).

    Returns True if more than `threshold` fraction of pixels are white-ish
    (RGB values all above 250).
    """
    rgb = img.convert("RGB")
    pixels = list(rgb.getdata())
    total = len(pixels)
    white_count = sum(1 for r, g, b in pixels if r > 250 and g > 250 and b > 250)
    return (white_count / total) > threshold


def process_sketch(
    sketch_base64: str,
    page_preset: str,
    page_width: int,
    page_height: int,
) -> str:
    """Full pipeline: decode → validate → normalize → re-encode.

    Returns a base64 PNG string ready for AI model consumption.
    """
    img = decode_base64_image(sketch_base64)

    if is_blank_image(img):
        raise HTTPException(
            status_code=400,
            detail="Canvas appears blank. Please draw something before generating.",
        )

    normalized = normalize_image(img, page_width, page_height)
    return encode_image_base64(normalized)
