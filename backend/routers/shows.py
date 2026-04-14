import time
from typing import Any, Dict, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import aiosqlite

from database import DB_PATH

router = APIRouter()

# ── Pydantic models ───────────────────────────────────────────────────────────

class ShowIn(BaseModel):
    tmdb_id: int
    title: str
    type: str                        # "movie" | "tv"
    poster_path: Optional[str] = None
    backdrop_path: Optional[str] = None
    status: str = "plan_to_watch"    # watching | completed | dropped | plan_to_watch

class ShowUpdate(BaseModel):
    status: Optional[str] = None
    poster_path: Optional[str] = None
    backdrop_path: Optional[str] = None

# ── Aggregation SQL ───────────────────────────────────────────────────────────

_SELECT_SHOWS = """
SELECT
  s.*,
  COUNT(er.id)                 AS episodes_watched,
  ROUND(AVG(er.engagement), 1) AS avg_rating,
  (SELECT er2.season
   FROM episode_ratings er2
   WHERE er2.show_id = s.id
   ORDER BY er2.logged_at DESC LIMIT 1) AS last_season,
  (SELECT er2.episode
   FROM episode_ratings er2
   WHERE er2.show_id = s.id
   ORDER BY er2.logged_at DESC LIMIT 1) AS last_episode
FROM shows s
LEFT JOIN episode_ratings er ON er.show_id = s.id
"""

async def _fetch_shows(where: str = "", params: tuple = ()) -> list[Dict]:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        sql = _SELECT_SHOWS + where + " GROUP BY s.id ORDER BY s.added_at DESC"
        async with db.execute(sql, params) as cur:
            rows = await cur.fetchall()
    return [dict(r) for r in rows]

# ── Routes ────────────────────────────────────────────────────────────────────

@router.get("")
async def list_shows(status: Optional[str] = None) -> Dict[str, Any]:
    if status:
        rows = await _fetch_shows("WHERE s.status = ?", (status,))
    else:
        rows = await _fetch_shows()
    return {"shows": rows}


@router.get("/continue-watching")
async def continue_watching() -> Dict[str, Any]:
    """Shows with status=watching that have at least one episode rating."""
    rows = await _fetch_shows(
        "WHERE s.status = 'watching'"
    )
    # Only return those with progress data
    in_progress = [r for r in rows if r.get("last_season") is not None]
    return {"shows": in_progress}


@router.post("", status_code=201)
async def add_show(payload: ShowIn) -> Dict[str, Any]:
    added_at = int(time.time())
    async with aiosqlite.connect(DB_PATH) as db:
        # Upsert: if same tmdb_id + type exists, update status / paths
        async with db.execute(
            "SELECT id FROM shows WHERE tmdb_id = ? AND type = ?",
            (payload.tmdb_id, payload.type),
        ) as cur:
            existing = await cur.fetchone()

        if existing:
            await db.execute(
                "UPDATE shows SET status=?, poster_path=?, backdrop_path=? WHERE id=?",
                (payload.status, payload.poster_path, payload.backdrop_path, existing[0]),
            )
            show_id = existing[0]
        else:
            cur2 = await db.execute(
                "INSERT INTO shows (tmdb_id, title, type, poster_path, backdrop_path, status, added_at) "
                "VALUES (?,?,?,?,?,?,?)",
                (payload.tmdb_id, payload.title, payload.type,
                 payload.poster_path, payload.backdrop_path, payload.status, added_at),
            )
            show_id = cur2.lastrowid

        await db.commit()

    # Return with aggregated fields
    rows = await _fetch_shows("WHERE s.id = ?", (show_id,))
    if not rows:
        raise HTTPException(status_code=500, detail="Insert failed")
    return rows[0]


@router.get("/{show_id}")
async def get_show(show_id: int) -> Dict[str, Any]:
    rows = await _fetch_shows("WHERE s.id = ?", (show_id,))
    if not rows:
        raise HTTPException(status_code=404, detail="Show not found")
    return rows[0]


@router.patch("/{show_id}")
async def update_show(show_id: int, payload: ShowUpdate) -> Dict[str, Any]:
    async with aiosqlite.connect(DB_PATH) as db:
        async with db.execute("SELECT id FROM shows WHERE id = ?", (show_id,)) as cur:
            if not await cur.fetchone():
                raise HTTPException(status_code=404, detail="Show not found")
        updates, vals = [], []
        if payload.status is not None:
            updates.append("status = ?");     vals.append(payload.status)
        if payload.poster_path is not None:
            updates.append("poster_path = ?"); vals.append(payload.poster_path)
        if payload.backdrop_path is not None:
            updates.append("backdrop_path = ?"); vals.append(payload.backdrop_path)
        if updates:
            vals.append(show_id)
            await db.execute(f"UPDATE shows SET {', '.join(updates)} WHERE id = ?", vals)
            await db.commit()

    rows = await _fetch_shows("WHERE s.id = ?", (show_id,))
    return rows[0]


@router.delete("/{show_id}")
async def delete_show(show_id: int) -> Dict[str, Any]:
    async with aiosqlite.connect(DB_PATH) as db:
        async with db.execute("SELECT id FROM shows WHERE id = ?", (show_id,)) as cur:
            if not await cur.fetchone():
                raise HTTPException(status_code=404, detail="Show not found")
        # Cascade — delete ratings first (SQLite may not enforce FK)
        await db.execute("DELETE FROM episode_ratings WHERE show_id = ?", (show_id,))
        await db.execute("DELETE FROM shows WHERE id = ?", (show_id,))
        await db.commit()
    return {"message": f"Show {show_id} and all its ratings deleted"}
