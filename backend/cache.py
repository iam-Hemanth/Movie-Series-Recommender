import time
import json
import aiosqlite
from typing import Callable, Any, Awaitable

from database import DB_PATH

async def get_or_fetch(key: str, ttl_seconds: int, fetch_fn: Callable[[], Awaitable[Any]]) -> Any:
    now = int(time.time())
    
    # Try to fetch from cache
    async with aiosqlite.connect(DB_PATH) as db:
        async with db.execute(
            "SELECT data, cached_at, ttl_seconds FROM tmdb_cache WHERE cache_key = ?", 
            (key,)
        ) as cursor:
            row = await cursor.fetchone()
            
            if row:
                data, cached_at, row_ttl = row
                # Check expiration
                if now < cached_at + row_ttl:
                    return json.loads(data)
                
    # If not found or expired, call fetch_fn
    result = await fetch_fn()
    
    # Store in cache
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute('''
            INSERT INTO tmdb_cache (cache_key, data, cached_at, ttl_seconds)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(cache_key) DO UPDATE SET
            data = excluded.data,
            cached_at = excluded.cached_at,
            ttl_seconds = excluded.ttl_seconds
        ''', (key, json.dumps(result), now, ttl_seconds))
        await db.commit()
        
    return result
