from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.deps import get_current_user
from app.models.gallery import GalleryItem, GalleryResponse
from app.services.storage_service import (
    get_user_generations,
    get_generation_by_id,
    delete_user_generation,
)

router = APIRouter()


@router.get("/", response_model=GalleryResponse)
async def get_gallery(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    user: dict = Depends(get_current_user),
) -> GalleryResponse:
    """Get the current user's generations, paginated and newest first."""
    user_id = user["sub"]
    offset = (page - 1) * limit

    items_data, total = await get_user_generations(user_id, limit, offset)
    items = [GalleryItem(**row) for row in items_data]

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
    item_data = await get_generation_by_id(generation_id)
    if not item_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Generation not found",
        )

    return GalleryItem(**item_data)


@router.delete("/{generation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_generation(
    generation_id: str,
    user: dict = Depends(get_current_user),
) -> None:
    """Delete a generation record and its stored image."""
    user_id = user["sub"]
    deleted = await delete_user_generation(generation_id, user_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Generation not found",
        )
