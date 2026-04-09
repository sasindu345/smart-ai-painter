from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.deps import get_current_user
from app.core.config import settings
from app.models.gallery import GalleryItem, GalleryResponse
from app.services.storage_service import delete_generation_file

router = APIRouter()


def _get_supabase():
    from supabase import create_client

    return create_client(settings.supabase_url, settings.supabase_service_role_key)


@router.get("/", response_model=GalleryResponse)
async def get_gallery(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    user: dict = Depends(get_current_user),
) -> GalleryResponse:
    """Get the current user's generations, paginated and newest first."""
    user_id = user["sub"]
    client = _get_supabase()

    offset = (page - 1) * limit

    # Get total count
    count_result = (
        client.table("generations")
        .select("id", count="exact")
        .eq("user_id", user_id)
        .execute()
    )
    total = count_result.count or 0

    # Get page of items
    result = (
        client.table("generations")
        .select("id, prompt, style, image_url, created_at")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .range(offset, offset + limit - 1)
        .execute()
    )

    items = [GalleryItem(**row) for row in result.data]

    return GalleryResponse(
        items=items,
        total=total,
        page=page,
        has_more=(offset + limit) < total,
    )


@router.get("/public/{generation_id}", response_model=GalleryItem)
async def get_public_generation(generation_id: str) -> GalleryItem:
    """Fetch a single generation for public sharing (Open Graph metadata).

    This endpoint returns metadata for a generation without requiring auth so
    that share links can render rich previews. It only returns the publicly
    safe fields (id, prompt, style, image_url, created_at).
    """
    client = _get_supabase()
    result = (
        client.table("generations")
        .select("id, prompt, style, image_url, created_at")
        .eq("id", generation_id)
        .limit(1)
        .execute()
    )

    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Generation not found",
        )

    return GalleryItem(**result.data[0])


@router.delete("/{generation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_generation(
    generation_id: str,
    user: dict = Depends(get_current_user),
) -> None:
    """Delete a generation record and its stored image."""
    user_id = user["sub"]
    client = _get_supabase()

    # Fetch the record to verify ownership and get image_url
    result = (
        client.table("generations")
        .select("id, image_url")
        .eq("id", generation_id)
        .eq("user_id", user_id)
        .execute()
    )

    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Generation not found",
        )

    image_url = result.data[0]["image_url"]

    # Delete storage file and DB record
    delete_generation_file(image_url)
    client.table("generations").delete().eq("id", generation_id).execute()
