import json
import os
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.emails import router as emails_router
from app.core.config import get_settings
from app.core.database import create_pool


def cors_origins_from_env() -> list[str]:
    raw = os.getenv("CORS_ORIGINS", "http://localhost:3000")
    if raw.startswith("["):
        return json.loads(raw)
    return [origin.strip() for origin in raw.split(",") if origin.strip()]


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    settings = get_settings()
    app.state.settings = settings
    app.state.db_pool = await create_pool(settings)
    try:
        yield
    finally:
        await app.state.db_pool.close()


app = FastAPI(title="Parakhiya & Co. Shared Inbox API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins_from_env(),
    allow_credentials=True,
    allow_methods=["GET", "PATCH", "POST", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Staff-Email", "X-Staff-Id"],
)


@app.get("/health", tags=["health"])
async def health() -> dict[str, str]:
    return {"status": "ok"}


app.include_router(emails_router)
