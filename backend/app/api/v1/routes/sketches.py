import base64
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.deps import get_current_user
from app.core.config import settings
from app.models.sketch import SketchItem, SketchListResponse, SketchSaveRequest

router = APIRouter()


def _get_supabase():
    from supabase import create_client

    return create_client(settings.supabase_url, settings.supabase_service_role_key)


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
    file_bytes = base64.b64decode(req.image_base64)

    client.storage.from_(bucket).upload(
        path=file_name,
        file=file_bytes,
        file_options={"content-type": "image/png"},
    )

    image_url = client.storage.from_(bucket).get_public_url(file_name)

    # Insert DB record
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
