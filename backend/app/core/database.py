import logging
import asyncpg
from app.core.config import settings

logger = logging.getLogger(__name__)

_pool = None


async def get_db_pool() -> asyncpg.Pool:
    """Get or initialize the global asyncpg connection pool."""
    global _pool
    if _pool is None:
        if not settings.database_url:
            logger.error("DATABASE_URL is not set!")
            raise ValueError("DATABASE_URL is not configured.")
        
        logger.info("Initializing asyncpg database connection pool...")
        _pool = await asyncpg.create_pool(
            dsn=settings.database_url,
            min_size=2,
            max_size=10,
            command_timeout=60.0
        )
    return _pool


async def close_db_pool():
    """Close the database connection pool on app shutdown."""
    global _pool
    if _pool is not None:
        logger.info("Closing database connection pool...")
        await _pool.close()
        _pool = None
