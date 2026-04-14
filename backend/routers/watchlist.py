"""
Watchlist router
----------------
  POST   /watchlist          – add item
  DELETE /watchlist/{id}     – remove item
  GET    /watchlist          – list all items
"""

from fastapi import APIRouter, HTTPException
from typing import Optional

from pydantic import BaseModel

from database import watchlist_add, watchlist_list, watchlist_remove

router = APIRouter()


class WatchlistItem(BaseModel):
    tmdb_id: int
    media_type: str  # "movie" | "tv"
    title: str
    poster_path: Optional[str] = None


@router.post("")
async def add_to_watchlist(item: WatchlistItem):
    if item.media_type not in ("movie", "tv"):
        raise HTTPException(status_code=422, detail="media_type must be 'movie' or 'tv'")
    result = await watchlist_add(
        item.tmdb_id, item.media_type, item.title, item.poster_path
    )
    return {"status": "added", **result}


@router.delete("/{tmdb_id}")
async def remove_from_watchlist(tmdb_id: int, media_type: str = "movie"):
    removed = await watchlist_remove(tmdb_id, media_type)
    if not removed:
        raise HTTPException(status_code=404, detail="Item not found in watchlist")
    return {"status": "removed", "tmdb_id": tmdb_id}


@router.get("")
async def get_watchlist():
    items = await watchlist_list()
    return {"results": items, "total": len(items)}
