from fastapi import APIRouter

router = APIRouter()


@router.post("/")
async def generate_image() -> dict[str, str]:
    return {"message": "Generate endpoint placeholder"}
