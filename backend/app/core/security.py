import jwt
import httpx
from fastapi import HTTPException, status

from app.core.config import settings

_jwks_cache: dict | None = None


def _fetch_jwks() -> dict:
    """Fetch and cache JWKS from Supabase."""
    global _jwks_cache
    if _jwks_cache is not None:
        return _jwks_cache

    if not settings.supabase_url:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Auth is not configured",
        )

    jwks_url = f"{settings.supabase_url}/auth/v1/.well-known/jwks.json"
    resp = httpx.get(jwks_url)
    resp.raise_for_status()
    _jwks_cache = resp.json()
    return _jwks_cache


def _get_public_key(token: str):
    """Get the matching public key from JWKS for the given token."""
    header = jwt.get_unverified_header(token)
    kid = header.get("kid")
    jwks = _fetch_jwks()

    for key_data in jwks.get("keys", []):
        if key_data.get("kid") == kid:
            return jwt.algorithms.ECAlgorithm.from_jwk(key_data)

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No matching key found",
    )


def verify_supabase_token(token: str) -> dict:
    """Decode and verify a Supabase JWT access token.

    Supports both ES256 (newer Supabase projects) and HS256 (older projects).
    Returns the decoded payload containing sub (user_id), email, etc.
    """
    try:
        header = jwt.get_unverified_header(token)
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token",
        )

    alg = header.get("alg", "")

    try:
        if alg == "ES256":
            public_key = _get_public_key(token)
            payload = jwt.decode(
                token,
                public_key,
                algorithms=["ES256"],
                audience="authenticated",
            )
        else:
            if not settings.supabase_jwt_secret:
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail="Auth is not configured",
                )
            payload = jwt.decode(
                token,
                settings.supabase_jwt_secret,
                algorithms=["HS256"],
                audience="authenticated",
            )
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token",
        )

    return payload
