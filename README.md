# Hemanth's Entertainment Zone (HEZ)

> A premium, dark-themed personal streaming & recommendation platform offering AI-powered personalized movie and series picks, a custom cinematic player interface, and robust rating tracking.

---

## 🚀 Overview

**HEZ** (Hemanth's Entertainment Zone) is a comprehensive full-stack platform designed to emulate the premium feel of modern streaming services. Beyond standard browsing and search, it provides an edge-to-edge viewing experience, detailed progress tracking, and intelligent content suggestions based on user taste profiles and behavioral engagement.

The system leverages a responsive Next.js frontend seamlessly integrated with a highly optimized Python/FastAPI backend, functioning as a caching proxy for the TMDB API to ensure lightning-fast metadata delivery.

## ✨ Key Features

- **Immersive Video Player**: A custom, edge-to-edge cinematic player with auto-hiding UI, seekable progress, time tracking, and robust settings interfaces.
- **Smart Recommendations**: AI-driven "For You" suggestions tailored dynamically based on a multi-step episode rating flow (incorporating emotional tags, 1-5 scale ratings, and watch status).
- **Advanced Content Discovery**: Browse, search, and filter TMDB's massive database in real-time. Features include weekly trending lists, genre filtering, and full title detail pages (with trailers, similar shows, and top credits).
- **Taste Profiling & Stats**: A dedicated profile dashboard visualizing watch statistics, recent ratings, and engagement metrics.
- **Watchlist Management**: Track shows effortlessly, categorize by watch status, and manage your up-next queue.
- **Optimized Caching Layer**: Backend utilizes local SQLite caching (`aiosqlite`) to proxy TMDB requests, drastically reducing API latency, resolving optimized image assets, and preventing rate limiting.

## 🛠 Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | Next.js 16 (App Router) · React · TypeScript · Tailwind CSS |
| **Backend** | FastAPI · Python 3.9 · SQLite (`aiosqlite`) |
| **Data Integration** | TMDB API (Proxied & SQLite Cached) |
| **Video Playback** | VidSrc / Custom IFrame Integration |
| **Styling** | Dark Mode (`#0f0f0f`), Glassmorphism, Micro-animations |

---

## 📂 Project Structure

```text
.
├── backend/
│   ├── main.py          # FastAPI application & routing
│   ├── cache.py         # SQLite caching layer for TMDB requests
│   └── requirements.txt # Python dependencies
├── frontend/
│   ├── app/             # Next.js 16 App Router (pages: discover, watch, rate, etc.)
│   ├── components/      # Reusable UI components (Nav, PosterCard, etc.)
│   ├── lib/             # Utility functions & TMDB API client
│   ├── tailwind.config.ts  # Tailwind CSS configuration
│   └── package.json     # Node dependencies
├── DESIGN.md            # Core design system and UI tokens
└── README.md
```

---

## 🏗 Architecture & Application Routes

### Frontend Routing
The application follows a strictly modular architecture utilizing Next.js app routing:
- `/` - **Home**: Hero banner featuring trending content and scrollable categorised carousels.
- `/discover` & `/browse` - **Exploration**: Filter by type, genre, and sort real-time feeds.
- `/show/[tmdb_id]` - **Title Details**: Deep dive into individual movies/series, episodes, and trailers.
- `/watch/[tmdb_id]` - **Theater**: Dedicated immersive video player route emphasizing edge-to-edge layout.
- `/rate` - **Engagement**: Bespoke 3-step episode rating flow capturing detailed viewer sentiment.
- `/for-you` & `/profile` - **Personalization**: Dedicated user dashboards for AI recommendations and taste profiling.
- `/my-list` - **Watchlist**: Track your backlog and active shows.

### Backend Infrastructure
A high-performance FastAPI service decoupling the client from direct third-party data layers:
- **Proxy Endpoints**: `GET /tmdb/*` (Trending, Search, Details, Credits, Trailers) configured with intelligent expiry and caching.
- **User Data**: `GET|POST /shows` and `/ratings` for managing watchlists and individual episode engagement tracking.
- **Engine**: `GET /recommendations` dynamically resolving TMDB seeds against user preference and emotional tags.

---

## 🎨 Design System

HEZ strictly adheres to a premium, cinematic design philosophy aiming to maximize immersion and visual excellence:
- **Background Palette**: Deep charcoal and true blacks (`#0f0f0f` to `#1a1a1a`) ensuring video content pops.
- **Typography & Accents**: High-contrast text against a signature vibrant red accent (`#e50914`).
- **Borders & Elevation**: Subtle demarcations using low-opacity whites (`rgba(255,255,255,0.08)`) to create depth without visual noise.

---


## Quick Start

### 1. Backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 2. Frontend (new terminal)
```bash
cd frontend
npm install
npm run dev
# → http://localhost:3000
```
---

## 🌍 Readiness & Deployment

This repository is optimized and structured for production deployment. The decoupled architecture ensures:
- The **backend** can be containerized or hosted on scalable Python environments (e.g., Render, Railway, Fly.io) with persistent volume support for the SQLite cache.
- The **frontend** natively supports edge-deployment onto Vercel or similar frameworks, securely communicating with the backend API without exposing third-party TMDB access keys to the client.
