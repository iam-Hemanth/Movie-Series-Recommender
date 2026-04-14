import json
import time
from typing import Any, Dict, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import aiosqlite

from database import DB_PATH

router = APIRouter()


class RatingIn(BaseModel):
    show_id: int
    season: int
    episode: int
    engagement: int  # 1-5
    emotions: Optional[str] = None   # JSON string array
    kept_watching: Optional[bool] = True
    note: Optional[str] = None
    is_dropout: Optional[bool] = False
    logged_at: Optional[int] = None


@router.get("")
async def list_ratings(show_id: Optional[int] = None) -> Dict[str, Any]:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        if show_id:
            async with db.execute(
                "SELECT * FROM episode_ratings WHERE show_id = ? ORDER BY logged_at DESC",
                (show_id,),
            ) as cur:
                rows = await cur.fetchall()
        else:
            async with db.execute(
                "SELECT * FROM episode_ratings ORDER BY logged_at DESC"
            ) as cur:
                rows = await cur.fetchall()
    return {"ratings": [dict(r) for r in rows]}


@router.post("", status_code=201)
async def add_rating(payload: RatingIn) -> Dict[str, Any]:
    # Validate show exists
    async with aiosqlite.connect(DB_PATH) as db:
        async with db.execute("SELECT id FROM shows WHERE id = ?", (payload.show_id,)) as cur:
            if not await cur.fetchone():
                raise HTTPException(status_code=404, detail="Show not found. Add it to watchlist first.")

        logged_at = payload.logged_at or int(time.time())
        cursor = await db.execute(
            """INSERT INTO episode_ratings
               (show_id, season, episode, engagement, emotions, kept_watching, note, is_dropout, logged_at)
               VALUES (?,?,?,?,?,?,?,?,?)""",
            (
                payload.show_id,
                payload.season,
                payload.episode,
                payload.engagement,
                payload.emotions,
                int(payload.kept_watching or True),
                payload.note,
                int(payload.is_dropout or False),
                logged_at,
            ),
        )
        rating_id = cursor.lastrowid
        await db.commit()

        db.row_factory = aiosqlite.Row
        async with db.execute("SELECT * FROM episode_ratings WHERE id = ?", (rating_id,)) as cur:
            row = await cur.fetchone()

    return dict(row)


@router.get("/{rating_id}")
async def get_rating(rating_id: int) -> Dict[str, Any]:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute("SELECT * FROM episode_ratings WHERE id = ?", (rating_id,)) as cur:
            row = await cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Rating not found")
    return dict(row)


@router.delete("/{rating_id}")
async def delete_rating(rating_id: int) -> Dict[str, Any]:
    async with aiosqlite.connect(DB_PATH) as db:
        async with db.execute("SELECT id FROM episode_ratings WHERE id = ?", (rating_id,)) as cur:
            if not await cur.fetchone():
                raise HTTPException(status_code=404, detail="Rating not found")
        await db.execute("DELETE FROM episode_ratings WHERE id = ?", (rating_id,))
        await db.commit()
    return {"message": f"Rating {rating_id} deleted"}
