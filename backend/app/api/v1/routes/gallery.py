from fastapi import APIRouter

router = APIRouter()


@router.get("/")
async def get_gallery() -> dict[str, list]:
    return {"items": []}
