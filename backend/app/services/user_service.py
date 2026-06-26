import hashlib
import logging
import secrets
import uuid
from app.core.database import get_db_pool

logger = logging.getLogger(__name__)


def hash_password(password: str) -> str:
    """Hash password using pbkdf2_hmac with a random salt."""
    salt = secrets.token_hex(16)
    dk = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), 100000)
    return f"{salt}:{dk.hex()}"


def verify_password(password: str, hashed: str) -> bool:
    """Verify password by matching its pbkdf2_hmac hash against the stored hash."""
    try:
        salt, key_hex = hashed.split(":")
        dk = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), 100000)
        return secrets.compare_digest(dk.hex(), key_hex)
    except Exception:
        return False


async def create_user(email: str, password: str) -> dict:
    """Insert a new user record in Neon database."""
    pool = await get_db_pool()
    hashed = hash_password(password)
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            INSERT INTO users (email, hashed_password)
            VALUES ($1, $2)
            RETURNING id, email, created_at
            """,
            email.lower().strip(),
            hashed,
        )
        data = dict(row)
        data["id"] = str(data["id"])
        return data


async def get_user_by_email(email: str) -> dict | None:
    """Retrieve user record by email."""
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT id, email, hashed_password FROM users WHERE email = $1",
            email.lower().strip(),
        )
        if row:
            data = dict(row)
            data["id"] = str(data["id"])
            return data
        return None


async def get_user_by_id(user_id: str) -> dict | None:
    """Retrieve user record by user UUID."""
    pool = await get_db_pool()
    try:
        uid = uuid.UUID(user_id) if isinstance(user_id, str) else user_id
    except ValueError:
        return None
        
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT id, email FROM users WHERE id = $1",
            uid,
        )
        if row:
            data = dict(row)
            data["id"] = str(data["id"])
            return data
        return None
