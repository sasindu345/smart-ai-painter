from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from app.api.deps import get_current_user
from app.core.security import create_access_token
from app.services import user_service

router = APIRouter()


class UserAuthSchema(BaseModel):
    email: str
    password: str


@router.post("/signup", status_code=status.HTTP_201_CREATED)
async def signup(req: UserAuthSchema) -> dict:
    """Register a new user and return a JWT access token."""
    existing = await user_service.get_user_by_email(req.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists.",
        )

    user = await user_service.create_user(req.email, req.password)
    token = create_access_token(data={"sub": user["id"], "email": user["email"]})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "email": user["email"]
        }
    }


@router.post("/login")
async def login(req: UserAuthSchema) -> dict:
    """Authenticate user credentials and return a JWT access token."""
    user = await user_service.get_user_by_email(req.email)
    if not user or not user_service.verify_password(req.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
        )

    token = create_access_token(data={"sub": user["id"], "email": user["email"]})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "email": user["email"]
        }
    }


@router.get("/me")
async def get_me(user: dict = Depends(get_current_user)) -> dict:
    """Return the current authenticated user's info."""
    return {
        "id": user.get("sub"),
        "email": user.get("email"),
    }
