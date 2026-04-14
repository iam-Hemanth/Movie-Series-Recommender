import time
from pathlib import Path
import aiosqlite

DB_PATH = Path(__file__).parent / "app.db"

async def init_db():
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute('''
        CREATE TABLE IF NOT EXISTS shows (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tmdb_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            type TEXT CHECK(type IN ('tv', 'movie')),
            poster_path TEXT,
            backdrop_path TEXT,
            status TEXT CHECK(status IN ('watching', 'completed', 'dropped', 'plan_to_watch')),
            added_at INTEGER NOT NULL
        )
        ''')
        
        await db.execute('''
        CREATE TABLE IF NOT EXISTS episode_ratings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            show_id INTEGER NOT NULL,
            season INTEGER NOT NULL,
            episode INTEGER NOT NULL,
            engagement INTEGER CHECK(engagement BETWEEN 1 AND 5),
            emotions TEXT,
            kept_watching BOOLEAN,
            note TEXT,
            is_dropout BOOLEAN,
            logged_at INTEGER NOT NULL,
            FOREIGN KEY(show_id) REFERENCES shows(id)
        )
        ''')
        
        await db.execute('''
        CREATE TABLE IF NOT EXISTS tmdb_cache (
            cache_key TEXT PRIMARY KEY,
            data TEXT NOT NULL,
            cached_at INTEGER NOT NULL,
            ttl_seconds INTEGER NOT NULL
        )
        ''')
        
        await db.execute('''
        CREATE TABLE IF NOT EXISTS user_settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        )
        ''')
        
        await db.commit()
