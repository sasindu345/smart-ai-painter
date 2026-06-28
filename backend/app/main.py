from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.database import get_db_pool, close_db_pool


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize connection pool
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        # Create users table
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                email VARCHAR(255) UNIQUE NOT NULL,
                hashed_password VARCHAR(255) NOT NULL,
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
        """)
        # Create sketches table
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS sketches (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                title VARCHAR(255) NOT NULL,
                image_url TEXT NOT NULL,
                page_preset VARCHAR(50) NOT NULL,
                page_width INTEGER NOT NULL,
                page_height INTEGER NOT NULL,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            );
        """)
        # Create generations table
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS generations (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                prompt TEXT NOT NULL,
                style VARCHAR(50) NOT NULL,
                image_url TEXT NOT NULL,
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
        """)
        # Add indexing for efficiency
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_sketches_user_id ON sketches(user_id);")
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_generations_user_id ON generations(user_id);")
    yield
    # Close pool on shutdown
    await close_db_pool()


app = FastAPI(title=settings.app_name, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "version": settings.api_version}
