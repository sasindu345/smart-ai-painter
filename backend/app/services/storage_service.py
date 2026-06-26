import logging
import uuid
import asyncio
from fastapi import HTTPException, status
from app.core.database import get_db_pool
from app.services.cloudinary_service import upload_to_cloudinary, delete_from_cloudinary

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Generations Storage & DB Operations
# ---------------------------------------------------------------------------

async def upload_generation(image_base64: str, user_id: str) -> str:
    """Upload a base64 PNG image to Cloudinary. Returns the secure URL."""
    try:
        url = await asyncio.to_thread(
            upload_to_cloudinary, image_base64, "generations"
        )
        return url
    except Exception as exc:
        logger.error("Cloudinary upload failed: %s", exc, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to upload generation image: {exc}",
        )


async def delete_generation_file(image_url: str) -> None:
    """Delete an image file from Cloudinary storage by its URL."""
    try:
        await asyncio.to_thread(delete_from_cloudinary, image_url)
    except Exception as exc:
        logger.warning("Cloudinary deletion failed for URL %s: %s", image_url, exc)


async def save_generation_record(
    user_id: str,
    prompt: str,
    style: str,
    image_url: str,
) -> str:
    """Insert a generation record into the Neon DB. Returns the record ID."""
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        try:
            row = await conn.fetchrow(
                """
                INSERT INTO generations (user_id, prompt, style, image_url)
                VALUES ($1, $2, $3, $4)
                RETURNING id
                """,
                uuid.UUID(user_id) if isinstance(user_id, str) else user_id,
                prompt,
                style,
                image_url,
            )
            if not row:
                raise ValueError("No database row returned after insert.")
            return str(row["id"])
        except Exception as exc:
            logger.error("DB generations insert failed: %s", exc, exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Failed to save generation record: {exc}",
            )


async def get_user_generations(user_id: str, limit: int, offset: int) -> tuple[list[dict], int]:
    """Retrieve user generations and total count from Neon DB."""
    pool = await get_db_pool()
    uid = uuid.UUID(user_id) if isinstance(user_id, str) else user_id
    async with pool.acquire() as conn:
        try:
            total = await conn.fetchval(
                "SELECT COUNT(*) FROM generations WHERE user_id = $1", uid
            )
            rows = await conn.fetch(
                """
                SELECT id, prompt, style, image_url, created_at 
                FROM generations 
                WHERE user_id = $1 
                ORDER BY created_at DESC 
                LIMIT $2 OFFSET $3
                """,
                uid, limit, offset
            )
            items = []
            for r in rows:
                d = dict(r)
                d["id"] = str(d["id"])
                items.append(d)
            return items, total
        except Exception as exc:
            logger.error("DB generations fetch failed: %s", exc, exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Failed to fetch generations: {exc}",
            )


async def get_generation_by_id(generation_id: str) -> dict | None:
    """Retrieve a single generation by ID from Neon DB."""
    pool = await get_db_pool()
    try:
        gid = uuid.UUID(generation_id) if isinstance(generation_id, str) else generation_id
    except ValueError:
        return None
        
    async with pool.acquire() as conn:
        try:
            row = await conn.fetchrow(
                """
                SELECT id, prompt, style, image_url, created_at 
                FROM generations 
                WHERE id = $1
                """,
                gid
            )
            if row:
                d = dict(row)
                d["id"] = str(d["id"])
                return d
            return None
        except Exception as exc:
            logger.error("DB generation fetch failed: %s", exc, exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Failed to fetch generation record: {exc}",
            )


async def delete_user_generation(generation_id: str, user_id: str) -> bool:
    """Delete a user generation from Neon DB and Cloudinary."""
    pool = await get_db_pool()
    try:
        gid = uuid.UUID(generation_id) if isinstance(generation_id, str) else generation_id
        uid = uuid.UUID(user_id) if isinstance(user_id, str) else user_id
    except ValueError:
        return False
        
    async with pool.acquire() as conn:
        try:
            row = await conn.fetchrow(
                "SELECT image_url FROM generations WHERE id = $1 AND user_id = $2", gid, uid
            )
            if not row:
                return False
            image_url = row["image_url"]
            
            await conn.execute("DELETE FROM generations WHERE id = $1 AND user_id = $2", gid, uid)
            await delete_generation_file(image_url)
            return True
        except Exception as exc:
            logger.error("DB generation delete failed: %s", exc, exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Failed to delete generation: {exc}",
            )


# ---------------------------------------------------------------------------
# Sketches Storage & DB Operations
# ---------------------------------------------------------------------------

async def upload_sketch(image_base64: str, user_id: str) -> str:
    """Upload a base64 PNG sketch to Cloudinary. Returns the secure URL."""
    try:
        url = await asyncio.to_thread(
            upload_to_cloudinary, image_base64, "sketches"
        )
        return url
    except Exception as exc:
        logger.error("Cloudinary sketch upload failed: %s", exc, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to upload sketch image: {exc}",
        )


async def save_sketch_record(
    user_id: str,
    title: str,
    image_url: str,
    page_preset: str,
    page_width: int,
    page_height: int,
) -> dict:
    """Insert a sketch record into the Neon DB. Returns the created row as a dict."""
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        try:
            row = await conn.fetchrow(
                """
                INSERT INTO sketches (user_id, title, image_url, page_preset, page_width, page_height)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING id, user_id, title, image_url, page_preset, page_width, page_height, created_at, updated_at
                """,
                uuid.UUID(user_id) if isinstance(user_id, str) else user_id,
                title,
                image_url,
                page_preset,
                page_width,
                page_height,
            )
            if not row:
                raise ValueError("No database row returned after insert.")
            
            data = dict(row)
            data["id"] = str(data["id"])
            data["user_id"] = str(data["user_id"])
            return data
        except Exception as exc:
            logger.error("DB sketches insert failed: %s", exc, exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Failed to save sketch record: {exc}",
            )


async def get_user_sketches(user_id: str, limit: int, offset: int) -> tuple[list[dict], int]:
    """Retrieve user sketches and total count from Neon DB."""
    pool = await get_db_pool()
    uid = uuid.UUID(user_id) if isinstance(user_id, str) else user_id
    async with pool.acquire() as conn:
        try:
            total = await conn.fetchval(
                "SELECT COUNT(*) FROM sketches WHERE user_id = $1", uid
            )
            rows = await conn.fetch(
                """
                SELECT id, title, image_url, page_preset, page_width, page_height, created_at, updated_at 
                FROM sketches 
                WHERE user_id = $1 
                ORDER BY created_at DESC 
                LIMIT $2 OFFSET $3
                """,
                uid, limit, offset
            )
            items = []
            for r in rows:
                d = dict(r)
                d["id"] = str(d["id"])
                d["user_id"] = str(uid)
                items.append(d)
            return items, total
        except Exception as exc:
            logger.error("DB sketches fetch failed: %s", exc, exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Failed to fetch sketches: {exc}",
            )


async def get_sketch_by_id(sketch_id: str, user_id: str) -> dict | None:
    """Retrieve a single user sketch by ID from Neon DB."""
    pool = await get_db_pool()
    try:
        sid = uuid.UUID(sketch_id) if isinstance(sketch_id, str) else sketch_id
        uid = uuid.UUID(user_id) if isinstance(user_id, str) else user_id
    except ValueError:
        return None
        
    async with pool.acquire() as conn:
        try:
            row = await conn.fetchrow(
                """
                SELECT id, title, image_url, page_preset, page_width, page_height, created_at, updated_at 
                FROM sketches 
                WHERE id = $1 AND user_id = $2
                """,
                sid, uid
            )
            if row:
                d = dict(row)
                d["id"] = str(d["id"])
                d["user_id"] = str(uid)
                return d
            return None
        except Exception as exc:
            logger.error("DB sketch fetch failed: %s", exc, exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Failed to fetch sketch record: {exc}",
            )


async def delete_user_sketch(sketch_id: str, user_id: str) -> bool:
    """Delete a sketch record from Neon DB and remove its image from Cloudinary."""
    pool = await get_db_pool()
    try:
        sid = uuid.UUID(sketch_id) if isinstance(sketch_id, str) else sketch_id
        uid = uuid.UUID(user_id) if isinstance(user_id, str) else user_id
    except ValueError:
        return False
        
    async with pool.acquire() as conn:
        try:
            row = await conn.fetchrow(
                "SELECT image_url FROM sketches WHERE id = $1 AND user_id = $2", sid, uid
            )
            if not row:
                return False
            image_url = row["image_url"]
            
            await conn.execute("DELETE FROM sketches WHERE id = $1 AND user_id = $2", sid, uid)
            await asyncio.to_thread(delete_from_cloudinary, image_url)
            return True
        except Exception as exc:
            logger.error("DB sketch delete failed: %s", exc, exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Failed to delete sketch: {exc}",
            )
