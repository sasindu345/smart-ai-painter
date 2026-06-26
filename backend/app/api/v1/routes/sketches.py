from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.deps import get_current_user
from app.models.sketch import SketchItem, SketchListResponse, SketchSaveRequest
from app.services.storage_service import (
    upload_sketch,
    save_sketch_record,
    get_user_sketches,
    get_sketch_by_id,
    delete_user_sketch,
)

router = APIRouter()


@router.post("/", response_model=SketchItem, status_code=status.HTTP_201_CREATED)
async def save_sketch(
    req: SketchSaveRequest,
    user: dict = Depends(get_current_user),
) -> SketchItem:
    """Save a sketch image to storage and create a DB record."""
    user_id = user["sub"]

    # Upload image to storage
    image_url = await upload_sketch(req.image_base64, user_id)

    # Insert DB record
    row = await save_sketch_record(
        user_id=user_id,
        title=req.title,
        image_url=image_url,
        page_preset=req.page_preset,
        page_width=req.page_width,
        page_height=req.page_height,
    )
    return SketchItem(**row)


@router.get("/", response_model=SketchListResponse)
async def get_sketches(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    user: dict = Depends(get_current_user),
) -> SketchListResponse:
    """Get the current user's sketches, paginated and newest first."""
    user_id = user["sub"]
    offset = (page - 1) * limit

    items_data, total = await get_user_sketches(user_id, limit, offset)
    items = [SketchItem(**row) for row in items_data]

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
    row = await get_sketch_by_id(sketch_id, user_id)
    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sketch not found",
        )
    return SketchItem(**row)


@router.delete("/{sketch_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_sketch(
    sketch_id: str,
    user: dict = Depends(get_current_user),
) -> None:
    """Delete a sketch record and its stored image."""
    user_id = user["sub"]
    deleted = await delete_user_sketch(sketch_id, user_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sketch not found",
        )
