import logging
import cloudinary
import cloudinary.uploader
from app.core.config import settings
from fastapi import HTTPException

logger = logging.getLogger(__name__)

if settings.cloudinary_cloud_name:
    cloudinary.config(
        cloud_name=settings.cloudinary_cloud_name,
        api_key=settings.cloudinary_api_key,
        api_secret=settings.cloudinary_api_secret,
        secure=True
    )


def upload_to_cloudinary(image_base64: str, folder: str = "generations") -> str:
    """Upload base64 encoded image to Cloudinary and return secure CDN URL."""
    if not settings.cloudinary_cloud_name:
        raise ValueError("Cloudinary credentials are not configured.")

    if not image_base64.startswith("data:image"):
        image_data = f"data:image/png;base64,{image_base64}"
    else:
        image_data = image_base64

    try:
        response = cloudinary.uploader.upload(
            image_data,
            folder=f"smart_ai_painter/{folder}",
            resource_type="image"
        )
        url = response.get("secure_url")
        if not url:
            raise ValueError("No secure URL returned from Cloudinary upload.")
        return url
    except Exception as e:
        logger.error(f"Cloudinary upload failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=502,
            detail=f"Cloudinary storage upload failed: {str(e)}"
        )


def delete_from_cloudinary(public_id_or_url: str) -> bool:
    """Delete an image asset from Cloudinary using its public ID or URL."""
    if not public_id_or_url:
        return False

    public_id = public_id_or_url
    if "res.cloudinary.com" in public_id_or_url:
        try:
            parts = public_id_or_url.split("/upload/")[-1].split("/")
            path_parts = parts[1:]
            if path_parts:
                last_part = path_parts[-1].split(".")[0]
                path_parts[-1] = last_part
                public_id = "/".join(path_parts)
        except Exception as e:
            logger.warning(f"Could not parse Cloudinary public ID from URL: {public_id_or_url}, error: {e}")

    try:
        result = cloudinary.uploader.destroy(public_id)
        return result.get("result") == "ok"
    except Exception as e:
        logger.error(f"Cloudinary delete failed for {public_id}: {e}", exc_info=True)
        return False
