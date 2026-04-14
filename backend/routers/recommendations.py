import json
import time
from typing import Any, Dict, Optional
from fastapi import APIRouter
import aiosqlite
import httpx

from database import DB_PATH
from cache import get_or_fetch

router = APIRouter()

TMDB_BASE = "https://api.themoviedb.org/3"
POSTER_BASE = "https://image.tmdb.org/t/p/w342"

import os

def _key() -> str:
    return os.getenv("TMDB_KEY", "")


async def _tmdb_get(endpoint: str, params: Optional[Dict] = None) -> Dict:
    async with httpx.AsyncClient(timeout=10) as client:
        res = await client.get(
            f"{TMDB_BASE}{endpoint}",
            params={"api_key": _key(), **(params or {})},
        )
    return res.json() if res.status_code == 200 else {}


@router.get("")
async def get_recommendations() -> Dict[str, Any]:
    """
    Build recs from watchlist:
    - Fetch all shows from DB
    - For each, call TMDB recommendations endpoint
    - De-duplicate, exclude already-watched titles, return top-20
    """
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute("SELECT tmdb_id, type, title FROM shows") as cur:
            shows = [dict(r) for r in await cur.fetchall()]

    if not shows:
        return {"recommendations": [], "message": "Add shows to your watchlist to get recommendations."}

    seen_tmdb_ids = {s["tmdb_id"] for s in shows}
    candidates: list[Dict] = []

    # Take up to 5 shows as seeds (avoid hammering TMDB)
    seeds = shows[:5]
    for show in seeds:
        cache_key = f"recs-seed:{show['type']}:{show['tmdb_id']}"

        async def _fetch(t=show["type"], sid=show["tmdb_id"]):
            data = await _tmdb_get(f"/{t}/{sid}/recommendations")
            results = []
            for item in data.get("results", [])[:8]:
                poster = f"{POSTER_BASE}{item['poster_path']}" if item.get("poster_path") else None
                results.append({
                    "id":           item.get("id"),
                    "title":        item.get("title") or item.get("name"),
                    "overview":     item.get("overview"),
                    "poster_path":  poster,
                    "backdrop_path": None,
                    "vote_average": item.get("vote_average"),
                    "release_date": item.get("release_date") or item.get("first_air_date"),
                    "type":         t,
                })
            return results

        seed_recs = await get_or_fetch(cache_key, 21600, _fetch)
        if isinstance(seed_recs, list):
            candidates.extend(seed_recs)

    # De-duplicate and exclude already-in-watchlist
    seen: set[int] = set(seen_tmdb_ids)
    unique: list[Dict] = []
    for item in candidates:
        if item.get("id") and item["id"] not in seen:
            seen.add(item["id"])
            unique.append(item)

    # Sort by vote_average desc, cap at 20
    unique.sort(key=lambda x: x.get("vote_average") or 0, reverse=True)
    return {"recommendations": unique[:20]}


@router.post("/refresh")
async def refresh_recommendations() -> Dict[str, Any]:
    """Invalidate recommendation cache keys so next GET rebuilds freshly."""
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("DELETE FROM tmdb_cache WHERE cache_key LIKE 'recs-seed:%'")
        await db.commit()
    return {"message": "Recommendation cache cleared. Fetch /recommendations to rebuild."}


@router.get("/taste-profile")
async def get_taste_profile() -> Dict[str, Any]:
    """Aggregate engagement stats per emotion and overall score."""
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            "SELECT engagement, emotions, kept_watching, is_dropout FROM episode_ratings"
        ) as cur:
            rows = [dict(r) for r in await cur.fetchall()]

    if not rows:
        return {"taste_profile": None, "message": "Rate some episodes to build your taste profile."}

    total         = len(rows)
    avg_eng       = sum(r["engagement"] or 0 for r in rows) / total
    dropout_rate  = sum(1 for r in rows if r.get("is_dropout")) / total
    kept_rate     = sum(1 for r in rows if r.get("kept_watching")) / total

    emotion_counts: Dict[str, int] = {}
    for r in rows:
        raw = r.get("emotions") or "[]"
        try:
            emotions = json.loads(raw) if isinstance(raw, str) else raw
        except Exception:
            emotions = []
        for e in (emotions if isinstance(emotions, list) else []):
            emotion_counts[e] = emotion_counts.get(e, 0) + 1

    top_emotions = sorted(emotion_counts.items(), key=lambda x: x[1], reverse=True)[:5]

    return {
        "taste_profile": {
            "total_rated":    total,
            "avg_engagement": round(avg_eng, 2),
            "kept_rate":      round(kept_rate, 2),
            "dropout_rate":   round(dropout_rate, 2),
            "top_emotions":   [{"emotion": e, "count": c} for e, c in top_emotions],
        }
    }
