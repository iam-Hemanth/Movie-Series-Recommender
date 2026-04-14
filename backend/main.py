import os
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from dotenv import load_dotenv
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", ".env"))


from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import init_db
from routers import tmdb, shows, ratings, recommendations

@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator:
    """Initialize database on startup."""
    await init_db()
    yield

app = FastAPI(
    title="Streaming Recommendation API",
    description="Backend API for personal streaming app with ratings and TMDB cache",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(tmdb.router, prefix="/tmdb", tags=["TMDB"])
app.include_router(shows.router, prefix="/shows", tags=["Shows"])
app.include_router(ratings.router, prefix="/ratings", tags=["Ratings"])
app.include_router(recommendations.router, prefix="/recommendations", tags=["Recommendations"])

@app.get("/", tags=["Health"])
async def root() -> dict:
    return {"message": "Streaming Recommendation API is running 🍿"}
