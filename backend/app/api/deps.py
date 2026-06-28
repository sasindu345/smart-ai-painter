from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.security import verify_jwt_token

bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> dict:
    """Extract and verify the current user from the Authorization header, or fallback to local user UUID."""
    if not credentials:
        return {"sub": "00000000-0000-0000-0000-000000000000", "email": "local@example.com"}

    try:
        payload = verify_jwt_token(credentials.credentials)
        user_id = payload.get("sub")
        if not user_id:
            return {"sub": "00000000-0000-0000-0000-000000000000", "email": "local@example.com"}
        return payload
    except Exception:
        return {"sub": "00000000-0000-0000-0000-000000000000", "email": "local@example.com"}
