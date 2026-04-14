import os
import httpx
from typing import Any, Dict, Optional, List
from fastapi import APIRouter, HTTPException, Query, Request

from cache import get_or_fetch

router = APIRouter()

TMDB_BASE_URL = "https://api.themoviedb.org/3"
POSTER_BASE = "https://image.tmdb.org/t/p/w342"
BACKDROP_BASE = "https://image.tmdb.org/t/p/w1280"
STILL_BASE = "https://image.tmdb.org/t/p/w300"
PROFILE_BASE = "https://image.tmdb.org/t/p/w185"
LOGO_BASE = "https://image.tmdb.org/t/p/w500"

def get_tmdb_key() -> str:
    key = os.getenv("TMDB_KEY")
    if not key:
        raise HTTPException(status_code=500, detail="TMDB_KEY is not set in run configuration.")
    return key

async def tmdb_request(endpoint: str, params: Optional[Dict[str, Any]] = None) -> Any:
    url = f"{TMDB_BASE_URL}{endpoint}"
    query_params = {"api_key": get_tmdb_key()}
    if params:
        query_params.update(params)
        
    async with httpx.AsyncClient() as client:
        response = await client.get(url, params=query_params)
        
    if response.status_code != 200:
        raise HTTPException(status_code=response.status_code, detail=f"TMDB Error: {response.text}")
        
    return response.json()

def format_media(item: dict, media_type: str) -> dict:
    poster = f"{POSTER_BASE}{item['poster_path']}" if item.get('poster_path') else None
    backdrop = f"{BACKDROP_BASE}{item['backdrop_path']}" if item.get('backdrop_path') else None
    
    return {
        "id": item.get("id"),
        "title": item.get("title") or item.get("name"),
        "overview": item.get("overview"),
        "poster_path": poster,
        "backdrop_path": backdrop,
        "vote_average": item.get("vote_average"),
        "release_date": item.get("release_date") or item.get("first_air_date"),
        "type": media_type
    }

@router.get("/search")
async def search_tmdb(q: str, type: str = "multi"):
    cache_key = f"search:{type}:{q}"
    
    async def fetch():
        endpoint = f"/search/{type}"
        data = await tmdb_request(endpoint, {"query": q})
        results = []
        for item in data.get("results", []):
            item_type = item.get("media_type", type if type != "multi" else "movie")
            if item_type in ["movie", "tv"]:
                results.append(format_media(item, item_type))
        return {"results": results}

    return await get_or_fetch(cache_key, 3600, fetch)

@router.get("/show-detail/{tmdb_id}")
async def get_show_detail(tmdb_id: int, type: str):
    cache_key = f"detail:{type}:{tmdb_id}"
    
    async def fetch():
        endpoint = f"/{type}/{tmdb_id}"
        data = await tmdb_request(endpoint)
        
        poster = f"{POSTER_BASE}{data['poster_path']}" if data.get('poster_path') else None
        backdrop = f"{BACKDROP_BASE}{data['backdrop_path']}" if data.get('backdrop_path') else None
        
        return {
            "id": data.get("id"),
            "title": data.get("title") or data.get("name"),
            "overview": data.get("overview"),
            "genres": data.get("genres", []),
            "vote_average": data.get("vote_average"),
            "dates": {
                "start": data.get("release_date") or data.get("first_air_date"),
                "end": data.get("last_air_date")
            },
            "seasons": data.get("number_of_seasons"),
            "runtime": data.get("runtime") or (data.get("episode_run_time")[0] if data.get("episode_run_time") else None),
            "paths": {
                "poster": poster,
                "backdrop": backdrop
            },
            "status": data.get("status"),
            "type": type
        }
        
    return await get_or_fetch(cache_key, 86400, fetch)

@router.get("/show-trailer/{tmdb_id}")
async def get_show_trailer(tmdb_id: int, type: str):
    cache_key = f"trailer:{type}:{tmdb_id}"
    
    async def fetch():
        endpoint = f"/{type}/{tmdb_id}/videos"
        data = await tmdb_request(endpoint)
        for vid in data.get("results", []):
            if vid.get("site") == "YouTube" and vid.get("type") == "Trailer":
                return {"key": vid.get("key")}
        return {"key": None}
        
    return await get_or_fetch(cache_key, 604800, fetch)

@router.get("/show-logo/{tmdb_id}")
async def get_show_logo(tmdb_id: int, type: str):
    cache_key = f"logo:{type}:{tmdb_id}"
    
    async def fetch():
        endpoint = f"/{type}/{tmdb_id}/images"
        data = await tmdb_request(endpoint, {"include_image_language": "en,null"})
        logos = data.get("logos", [])
        if logos:
            return {"logo_path": f"{LOGO_BASE}{logos[0]['file_path']}"}
        return {"logo_path": None}
        
    return await get_or_fetch(cache_key, 604800, fetch)

@router.get("/show-credits/{tmdb_id}")
async def get_show_credits(tmdb_id: int, type: str):
    cache_key = f"credits:{type}:{tmdb_id}"
    
    async def fetch():
        endpoint = f"/{type}/{tmdb_id}/credits"
        data = await tmdb_request(endpoint)
        cast = []
        for person in data.get("cast", [])[:12]:
            profile = f"{PROFILE_BASE}{person['profile_path']}" if person.get('profile_path') else None
            cast.append({
                "person_id": person.get("id"),
                "name": person.get("name"),
                "character": person.get("character"),
                "profile_path": profile
            })
        return {"cast": cast}
        
    return await get_or_fetch(cache_key, 604800, fetch)

@router.get("/show-similar/{tmdb_id}")
async def get_show_similar(tmdb_id: int, type: str):
    cache_key = f"similar:{type}:{tmdb_id}"
    
    async def fetch():
        # Fallback to recommendations first as typically more accurate, else similar.
        endpoint = f"/{type}/{tmdb_id}/recommendations"
        data = await tmdb_request(endpoint)
        results = []
        for item in data.get("results", [])[:18]:
            results.append(format_media(item, type))
        return {"results": results}
        
    return await get_or_fetch(cache_key, 21600, fetch)

@router.get("/episodes/{tmdb_id}/{season}")
async def get_episodes(tmdb_id: int, season: int):
    cache_key = f"episodes:{tmdb_id}:{season}"
    
    async def fetch():
        endpoint = f"/tv/{tmdb_id}/season/{season}"
        data = await tmdb_request(endpoint)
        episodes = []
        for ep in data.get("episodes", []):
            still = f"{STILL_BASE}{ep['still_path']}" if ep.get('still_path') else None
            episodes.append({
                "episode_number": ep.get("episode_number"),
                "name": ep.get("name"),
                "overview": ep.get("overview"),
                "runtime": ep.get("runtime"),
                "still_path": still
            })
        return {"episodes": episodes}
        
    return await get_or_fetch(cache_key, 86400, fetch)

@router.get("/trending")
async def get_trending(category: str = "all", window: str = "day"):
    cache_key = f"trending:{category}:{window}"
    
    async def fetch():
        endpoint = f"/trending/{category}/{window}"
        data = await tmdb_request(endpoint)
        results = []
        for item in data.get("results", []):
            item_type = item.get("media_type", category if category != "all" else "movie")
            if item_type in ["movie", "tv"]:
                results.append(format_media(item, item_type))
        return {"results": results}
        
    return await get_or_fetch(cache_key, 3600, fetch)

@router.get("/browse")
async def browse_library(request: Request, type: str = "movie"):
    params = dict(request.query_params)
    if "type" in params:
        del params["type"]
        
    params_str = "-".join([f"{k}={v}" for k,v in sorted(params.items())])
    cache_key = f"browse:{type}:{params_str}"
    
    async def fetch():
        endpoint = f"/discover/{type}"
        data = await tmdb_request(endpoint, params)
        results = []
        for item in data.get("results", []):
            results.append(format_media(item, type))
        return {"results": results, "total_pages": data.get("total_pages")}
        
    return await get_or_fetch(cache_key, 3600, fetch)

@router.get("/genres")
async def get_genres(type: str = "movie"):
    cache_key = f"genres:{type}"
    
    async def fetch():
        endpoint = f"/genre/{type}/list"
        data = await tmdb_request(endpoint)
        return {"genres": data.get("genres", [])}
        
    return await get_or_fetch(cache_key, 2592000, fetch)
