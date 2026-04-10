import base64
import os
import tempfile
import uuid

from fastapi import HTTPException, status
from supabase import create_client

from app.core.config import settings


def _get_supabase_client():
    if not settings.supabase_url or not settings.supabase_service_role_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Supabase storage is not configured",
        )
    return create_client(settings.supabase_url, settings.supabase_service_role_key)


def upload_generation(image_base64: str, user_id: str) -> str:
    """Upload a base64 PNG image to Supabase Storage.

    Returns the public URL of the uploaded file.
    """
    client = _get_supabase_client()
    bucket = settings.supabase_storage_bucket

    file_name = f"{user_id}/{uuid.uuid4()}.png"
    file_bytes = base64.b64decode(image_base64)
    temp_path = None

    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".png") as tmp:
            tmp.write(file_bytes)
            temp_path = tmp.name

        client.storage.from_(bucket).upload(
            path=file_name,
            file=temp_path,
            file_options={"content-type": "image/png"},
        )
    except Exception as exc:
        if "bucket not found" not in str(exc).lower():
            raise

        client.storage.create_bucket(bucket, {"public": True})
        client.storage.from_(bucket).upload(
            path=file_name,
            file=temp_path,
            file_options={"content-type": "image/png"},
        )
    finally:
        if temp_path and os.path.exists(temp_path):
            os.unlink(temp_path)

    public_url = client.storage.from_(bucket).get_public_url(file_name)
    return public_url


def delete_generation_file(image_url: str) -> None:
    """Delete an image file from Supabase Storage by its public URL."""
    client = _get_supabase_client()
    bucket = settings.supabase_storage_bucket

    # Extract path from public URL: .../object/public/bucket-name/path
    marker = f"/object/public/{bucket}/"
    if marker in image_url:
        file_path = image_url.split(marker, 1)[1]
    else:
        return

    client.storage.from_(bucket).remove([file_path])


def save_generation_record(
    user_id: str,
    prompt: str,
    style: str,
    image_url: str,
) -> str:
    """Insert a generation record into the database. Returns the record ID."""
    client = _get_supabase_client()

    result = (
        client.table("generations")
        .insert(
            {
                "user_id": user_id,
                "prompt": prompt,
                "style": style,
                "image_url": image_url,
            }
        )
        .execute()
    )

    return result.data[0]["id"]
