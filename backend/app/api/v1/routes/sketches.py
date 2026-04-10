import base64
import logging
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.deps import get_current_user
from app.core.config import settings
from app.models.sketch import SketchItem, SketchListResponse, SketchSaveRequest

router = APIRouter()
logger = logging.getLogger(__name__)


def _upload_with_bucket_retry(client, bucket: str, file_name: str, file_bytes: bytes):
    """Upload once, and if bucket is missing create it and retry."""
    try:
        return client.storage.from_(bucket).upload(
            path=file_name,
            file=file_bytes,
            file_options={"content-type": "image/png"},
        )
    except Exception as exc:
        message = str(exc).lower()
        if "bucket not found" not in message:
            raise

        logger.warning("Bucket '%s' not found, creating and retrying upload", bucket)
        client.storage.create_bucket(bucket, {"public": True})
        return client.storage.from_(bucket).upload(
            path=file_name,
            file=file_bytes,
            file_options={"content-type": "image/png"},
        )


def _get_supabase():
    from supabase import create_client

    if not settings.supabase_url or not settings.supabase_service_role_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Supabase is not configured on the server",
        )
    if not settings.supabase_storage_bucket:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Supabase storage bucket is not configured on the server",
        )

    try:
        return create_client(settings.supabase_url, settings.supabase_service_role_key)
    except Exception as exc:
        logger.error("Failed to initialize Supabase client: %s", exc, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Failed to initialize Supabase client",
        )


@router.post("/", response_model=SketchItem, status_code=status.HTTP_201_CREATED)
async def save_sketch(
    req: SketchSaveRequest,
    user: dict = Depends(get_current_user),
) -> SketchItem:
    """Save a sketch image to storage and create a DB record."""
    user_id = user["sub"]
    client = _get_supabase()
    bucket = settings.supabase_storage_bucket

    # Upload image to storage
    file_name = f"{user_id}/sketches/{uuid.uuid4()}.png"
    try:
        file_bytes = base64.b64decode(req.image_base64)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid base64 image data",
        )

    try:
        upload_result = _upload_with_bucket_retry(client, bucket, file_name, file_bytes)
        logger.info("Storage upload result: %s", upload_result)
    except Exception as exc:
        logger.error("Storage upload failed: %s", exc, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to upload sketch to storage: {exc}",
        )

    image_url = client.storage.from_(bucket).get_public_url(file_name)

    # Insert DB record
    try:
        result = (
            client.table("sketches")
            .insert(
                {
                    "user_id": user_id,
                    "title": req.title,
                    "image_url": image_url,
                    "page_preset": req.page_preset,
                    "page_width": req.page_width,
                    "page_height": req.page_height,
                }
            )
            .execute()
        )
    except Exception as exc:
        logger.error("DB insert failed: %s", exc, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to save sketch record: {exc}",
        )

    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Sketch record was not returned after insert",
        )

    row = result.data[0]
    return SketchItem(**row)


@router.get("/", response_model=SketchListResponse)
async def get_sketches(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    user: dict = Depends(get_current_user),
) -> SketchListResponse:
    """Get the current user's sketches, paginated and newest first."""
    user_id = user["sub"]
    client = _get_supabase()

    offset = (page - 1) * limit

    # Count
    count_result = (
        client.table("sketches")
        .select("id", count="exact")
        .eq("user_id", user_id)
        .execute()
    )
    total = count_result.count or 0

    # Fetch page
    result = (
        client.table("sketches")
        .select("id, title, image_url, page_preset, page_width, page_height, created_at, updated_at")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .range(offset, offset + limit - 1)
        .execute()
    )

    items = [SketchItem(**row) for row in result.data]

    return SketchListResponse(
        items=items,
        total=total,
        page=page,
        has_more=(offset + limit) < total,
    )


@router.get("/{sketch_id}", response_model=SketchItem)
async def get_sketch(
    sketch_id: str,
    user: dict = Depends(get_current_user),
) -> SketchItem:
    """Get a single sketch by ID (must belong to the current user)."""
    user_id = user["sub"]
    client = _get_supabase()

    result = (
        client.table("sketches")
        .select("id, title, image_url, page_preset, page_width, page_height, created_at, updated_at")
        .eq("id", sketch_id)
        .eq("user_id", user_id)
        .execute()
    )

    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sketch not found",
        )

    return SketchItem(**result.data[0])


@router.delete("/{sketch_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_sketch(
    sketch_id: str,
    user: dict = Depends(get_current_user),
) -> None:
    """Delete a sketch record and its stored image."""
    user_id = user["sub"]
    client = _get_supabase()
    bucket = settings.supabase_storage_bucket

    # Verify ownership
    result = (
        client.table("sketches")
        .select("id, image_url")
        .eq("id", sketch_id)
        .eq("user_id", user_id)
        .execute()
    )

    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sketch not found",
        )

    image_url = result.data[0]["image_url"]

    # Delete storage file
    marker = f"/object/public/{bucket}/"
    if marker in image_url:
        file_path = image_url.split(marker, 1)[1]
        client.storage.from_(bucket).remove([file_path])

    # Delete DB record
    client.table("sketches").delete().eq("id", sketch_id).execute()
