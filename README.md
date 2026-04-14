# Hemanth's Entertainment Zone (HEZ)

> A premium, dark-themed personal streaming & recommendation platform — AI-powered picks, a cinematic custom player, and episode-level taste tracking. Deployed **free forever** on Vercel + Supabase.

---

## ✨ Key Features

- **Immersive Video Player** — Custom edge-to-edge cinematic player with auto-hiding UI, seekable progress bar, source switching (VidLink / VidKing / VidSrc), and keyboard shortcuts.
- **Smart Recommendations** — "For You" suggestions seeded from your watchlist, powered by TMDB's recommendation engine and ranked by vote average.
- **Advanced Discovery** — Trending feeds, genre filters, mood picker, and a full-text search with debounced live results.
- **Episode Rating Flow** — 3-step rating form: pick a show → log season/episode → capture engagement (1–5), emotions, and notes. Builds your personal taste profile.
- **Watchlist Management** — Add, filter, sort by status (Watching / Completed / Dropped / Plan to Watch), with 5-second undo on removes and context menus.
- **Taste Profile Dashboard** — Aggregate stats: avg engagement, kept-watching rate, dropout rate, and top emotion tags.

---

## 🛠 Tech Stack

| Layer | Technology |
|:--|:--|
| **Frontend + API** | Next.js 16 (App Router) · React 19 · TypeScript |
| **Database** | Supabase (PostgreSQL) |  
| **External API** | TMDB (server-side proxy via Next.js Route Handlers) |
| **Hosting** | Vercel (100% free, no CC) |
| **Video** | VidLink / VidKing / VidSrc iframe embeds |
| **Styling** | Vanilla CSS · Dark Mode · Glassmorphism · Micro-animations |

> **No separate backend server.** The old FastAPI/SQLite backend has been fully replaced by Next.js API Routes + Supabase. Everything runs as a single Vercel deployment.

---

## 📂 Project Structure

```text
.
├── backend/                        # Legacy FastAPI (kept for reference, no longer deployed)
├── frontend/
│   ├── app/
│   │   ├── api/                    # Next.js Route Handlers (the new "backend")
│   │   │   ├── tmdb/               # TMDB proxy routes (10 endpoints)
│   │   │   │   ├── trending/
│   │   │   │   ├── search/
│   │   │   │   ├── show-detail/[tmdb_id]/
│   │   │   │   ├── show-trailer/[tmdb_id]/
│   │   │   │   ├── show-logo/[tmdb_id]/
│   │   │   │   ├── show-credits/[tmdb_id]/
│   │   │   │   ├── show-similar/[tmdb_id]/
│   │   │   │   ├── episodes/[tmdb_id]/[season]/
│   │   │   │   ├── browse/
│   │   │   │   └── genres/
│   │   │   ├── shows/              # Watchlist CRUD (GET, POST, PATCH, DELETE)
│   │   │   ├── ratings/            # Episode ratings CRUD
│   │   │   └── recommendations/    # AI recs, refresh, taste-profile
│   │   ├── discover/               # Home / discover page
│   │   ├── browse/                 # Genre + sort browser
│   │   ├── search/                 # Live search
│   │   ├── show/[tmdb_id]/         # Show detail + hero + episodes
│   │   ├── watch/[tmdb_id]/        # Immersive player
│   │   ├── rate/                   # Episode rating wizard
│   │   ├── my-list/                # Watchlist manager
│   │   ├── for-you/                # Personalised recommendations
│   │   └── profile/                # Taste profile & stats
│   ├── components/
│   │   └── Nav.tsx                 # Global navigation bar
│   ├── lib/
│   │   ├── api.ts                  # Shared frontend API client
│   │   ├── supabase.ts             # Server-only Supabase client
│   │   └── tmdb-server.ts          # Server-only TMDB fetch helper
│   ├── .env.local                  # Local environment variables (gitignored)
│   └── package.json
├── .env.example                    # Template for required env vars
├── DESIGN.md                       # Design system tokens & philosophy
└── README.md
```

---

## 🗄 Database Schema (Supabase)

Run once in the Supabase SQL Editor after creating your project:

```sql
-- Watchlist
CREATE TABLE shows (
  id            BIGSERIAL PRIMARY KEY,
  tmdb_id       INTEGER   NOT NULL,
  title         TEXT      NOT NULL,
  type          TEXT      CHECK (type IN ('tv','movie')),
  poster_path   TEXT,
  backdrop_path TEXT,
  status        TEXT      CHECK (status IN ('watching','completed','dropped','plan_to_watch')),
  added_at      BIGINT    NOT NULL,
  UNIQUE (tmdb_id, type)
);

-- Episode ratings
CREATE TABLE episode_ratings (
  id            BIGSERIAL PRIMARY KEY,
  show_id       BIGINT    NOT NULL REFERENCES shows(id) ON DELETE CASCADE,
  season        INTEGER   NOT NULL,
  episode       INTEGER   NOT NULL,
  engagement    INTEGER   CHECK (engagement BETWEEN 1 AND 5),
  emotions      TEXT,
  kept_watching BOOLEAN,
  note          TEXT,
  is_dropout    BOOLEAN,
  logged_at     BIGINT    NOT NULL
);
```

---

## 🚀 Deployment (Vercel + Supabase — Free Forever)

### Step 1 — Supabase Setup
1. Go to [supabase.com](https://supabase.com) → **New Project** (GitHub login, no CC required)
2. Open **SQL Editor** → paste and run the schema above
3. Go to **Settings → API** → copy:
   - **Project URL** → `SUPABASE_URL`
   - **service_role** key → `SUPABASE_SERVICE_KEY`

### Step 2 — Vercel Setup
1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → **New Project** → import the repo
3. Set **Root Directory** to `frontend`
4. Add **Environment Variables**:

| Variable | Value |
|:--|:--|
| `TMDB_KEY` | Your TMDB API key |
| `SUPABASE_URL` | From Supabase Settings → API |
| `SUPABASE_SERVICE_KEY` | service_role key from Supabase |
| `NEXT_PUBLIC_SITE_URL` | `https://your-app.vercel.app` (your Vercel URL) |

5. Click **Deploy** — done ✅

---

## 🔑 Environment Variables

Copy `.env.example` → `frontend/.env.local` for local development:

```bash
cp .env.example frontend/.env.local
# Then fill in your real values
```

| Variable | Required | Description |
|:--|:--|:--|
| `TMDB_KEY` | ✅ | TMDB API v3 key — [get one free](https://developer.themoviedb.org/docs/getting-started) |
| `SUPABASE_URL` | ✅ | Supabase project URL |
| `SUPABASE_SERVICE_KEY` | ✅ | Supabase service role key (server-side only) |
| `NEXT_PUBLIC_SITE_URL` | ✅ | Full origin URL — used by server components to call own API routes |

---

## 🎨 Design System

HEZ follows a premium cinematic design philosophy:
- **Palette**: Deep charcoal / true black (`#0f0f0f` → `#1a1a1a`) — content pops
- **Accent**: Signature Netflix-red (`#e50914`) for CTAs, progress, and active states
- **Typography**: System sans-serif, high-contrast, tight letter-spacing for scannability
- **Borders**: Low-opacity white (`rgba(255,255,255,0.08)`) for depth without noise

See [`DESIGN.md`](./DESIGN.md) for full token specification.

---

## 🏗 Architecture

```
Browser → Vercel Edge
             │
             ├── /app/*              Next.js pages (SSR + Client Components)
             └── /api/tmdb/*         Server → TMDB (key never exposed to client)
             └── /api/shows/*        Server → Supabase PostgreSQL
             └── /api/ratings/*      Server → Supabase PostgreSQL
             └── /api/recommendations/* Server → Supabase + TMDB
```

All API calls are **server-side** — the TMDB key and Supabase service key never reach the browser.
