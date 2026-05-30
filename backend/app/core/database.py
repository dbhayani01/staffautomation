from collections.abc import AsyncIterator

import asyncpg
from fastapi import Request

from app.core.config import Settings


async def create_pool(settings: Settings) -> asyncpg.Pool:
    return await asyncpg.create_pool(
        dsn=settings.database_url,
        min_size=settings.db_min_pool_size,
        max_size=settings.db_max_pool_size,
        command_timeout=30,
    )


async def get_connection(request: Request) -> AsyncIterator[asyncpg.Connection]:
    pool: asyncpg.Pool = request.app.state.db_pool
    async with pool.acquire() as connection:
        yield connection
