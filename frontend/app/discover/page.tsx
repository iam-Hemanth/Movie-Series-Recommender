"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// ── Types ─────────────────────────────────────────────────────────────────────
interface MediaItem {
  id: number;
  title: string;
  poster_path: string | null;
  vote_average: number;
  type: string;
}
interface WatchlistShow {
  id: number;
  tmdb_id: number;
  title: string;
  type: string;
  poster_path: string | null;
  status: string;
}

// ── Mood config ───────────────────────────────────────────────────────────────
const MOODS = [
  { label: "Tense",        emoji: "😰", color: "#ef4444", genres: "53,28" },
  { label: "Funny",        emoji: "😂", color: "#f97316", genres: "35" },
  { label: "Dark",         emoji: "🌑", color: "#374151", genres: "80,27" },
  { label: "Wholesome",    emoji: "🥰", color: "#22c55e", genres: "10751,16" },
  { label: "Mind-bending", emoji: "🌀", color: "#a855f7", genres: "878,9648" },
  { label: "Emotional",    emoji: "😢", color: "#ec4899", genres: "18,10749" },
  { label: "Action",       emoji: "💥", color: "#f97316", genres: "28,12" },
  { label: "Chill",        emoji: "🌊", color: "#14b8a6", genres: "99,10402" },
] as const;

// ── Section heading ───────────────────────────────────────────────────────────
function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2
      style={{
        fontSize:    "1rem",
        fontWeight:  500,
        color:       "#fff",
        display:     "flex",
        alignItems:  "center",
        gap:         "0.6rem",
        marginBottom: "0.875rem",
      }}
    >
      <span
        style={{
          display:      "inline-block",
          width:        3,
          height:       "1em",
          background:   "#e50914",
          borderRadius: 2,
          flexShrink:   0,
        }}
      />
      {children}
    </h2>
  );
}

// ── Poster card with rank badge ───────────────────────────────────────────────
function TrendingCard({ item, rank }: { item: MediaItem; rank: number }) {
  return (
    <Link
      href={`/show/${item.id}?type=${item.type}`}
      style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0, width: 130 }}
    >
      <div
        style={{
          position:     "relative",
          aspectRatio:  "2/3",
          borderRadius: 8,
          overflow:     "hidden",
          background:   "var(--bg-card)",
          border:       "1px solid var(--border)",
        }}
      >
        {item.poster_path ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.poster_path} alt={item.title} loading="lazy"
            style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: "2rem", fontWeight: 900, color: "var(--text-hint)" }}>
            {item.title.charAt(0)}
          </div>
        )}

        {/* Rating badge top-right */}
        <span style={{ position: "absolute", top: 5, right: 5, background: "rgba(0,0,0,.75)",
          borderRadius: "50%", width: 28, height: 28, display: "flex", alignItems: "center",
          justifyContent: "center", fontSize: "0.58rem", fontWeight: 800, color: "#fff" }}>
          {(item.vote_average ?? 0).toFixed(1)}
        </span>

        {/* Rank number bottom-left */}
        <span style={{
          position:    "absolute",
          bottom:      -4,
          left:        4,
          fontSize:    48,
          fontWeight:  900,
          lineHeight:  1,
          color:       "#fff",
          textShadow:  "-2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000",
          userSelect:  "none",
        }}>
          {rank}
        </span>
      </div>
      <p className="line-clamp-1" style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-primary)", paddingTop: 8 }}>
        {item.title}
      </p>
    </Link>
  );
}

// ── Scroll row wrapper ────────────────────────────────────────────────────────
function ScrollRow({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", gap: "0.75rem", overflowX: "auto",
      paddingBottom: "0.5rem", scrollbarWidth: "none" }}>
      {children}
    </div>
  );
}

// ── Simple poster card (continue watching / mood results) ─────────────────────
function PosterCard({ item, progress, caption }: {
  item: MediaItem | WatchlistShow;
  progress?: number;
  caption?: string;
}) {
  const tmdbId = "tmdb_id" in item ? item.tmdb_id : item.id;
  return (
    <Link
      href={`/show/${tmdbId}?type=${item.type}`}
      style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0, width: 130 }}
    >
      <div style={{ position: "relative", aspectRatio: "2/3", borderRadius: 8, overflow: "hidden",
        background: "var(--bg-card)", border: "1px solid var(--border)" }}>
        {item.poster_path ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.poster_path} alt={item.title} loading="lazy"
            style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: "2rem", fontWeight: 900, color: "var(--text-hint)" }}>
            {item.title.charAt(0)}
          </div>
        )}
        {/* Progress bar */}
        {progress != null && (
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 3,
            background: "rgba(255,255,255,0.15)" }}>
            <div style={{ width: `${progress}%`, height: "100%", background: "#e50914", borderRadius: 2 }} />
          </div>
        )}
      </div>
      <p className="line-clamp-1" style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-primary)" }}>
        {item.title}
      </p>
      {caption && (
        <p style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginTop: -4 }}>{caption}</p>
      )}
    </Link>
  );
}

// ── Match% card (mood results) ────────────────────────────────────────────────
function MatchCard({ item, match }: { item: MediaItem; match: number }) {
  return (
    <Link href={`/show/${item.id}?type=${item.type}`}
      style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ position: "relative", aspectRatio: "2/3", borderRadius: 8, overflow: "hidden",
        background: "var(--bg-card)", border: "1px solid var(--border)" }}>
        {item.poster_path ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.poster_path} alt={item.title} loading="lazy"
            style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: "1.5rem", fontWeight: 900, color: "var(--text-hint)" }}>
            {item.title.charAt(0)}
          </div>
        )}
        {/* Match% badge */}
        <span style={{ position: "absolute", bottom: 6, left: 6, background: "rgba(0,0,0,0.8)",
          borderRadius: 4, padding: "2px 6px", fontSize: "0.6rem", fontWeight: 800, color: "#22c55e" }}>
          {match}% match
        </span>
      </div>
      <p className="line-clamp-1" style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-primary)" }}>
        {item.title}
      </p>
    </Link>
  );
}

// ── Pill button ───────────────────────────────────────────────────────────────
function Pill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      style={{ padding: "4px 14px", borderRadius: 9999, fontSize: "0.8rem", fontWeight: 600,
        border: active ? "1px solid transparent" : "1px solid var(--border)",
        background: active ? "#e50914" : "var(--bg-card)",
        color: active ? "#fff" : "var(--text-muted)",
        cursor: "pointer", transition: "all 0.2s", flexShrink: 0 }}>
      {label}
    </button>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function DiscoverPage() {
  const router = useRouter();

  // Trending state
  const [mediaTab, setMediaTab] = useState<"movie" | "tv">("movie");
  const [windowTab, setWindowTab] = useState<"day" | "week">("day");
  const [trending, setTrending]   = useState<MediaItem[]>([]);
  const [trendLoading, setTrendLoading] = useState(false);

  // Watchlist / Continue Watching
  const [watching, setWatching] = useState<WatchlistShow[]>([]);

  // Mood
  const [activeMood, setActiveMood] = useState<number | null>(null);
  const [moodResults, setMoodResults] = useState<MediaItem[]>([]);
  const [moodLoading, setMoodLoading] = useState(false);

  // Search bar
  const [searchQ, setSearchQ] = useState("");

  // Load trending
  useEffect(() => {
    setTrendLoading(true);
    fetch(`${API}/tmdb/trending?category=${mediaTab}&window=${windowTab}`)
      .then((r) => r.json())
      .then((d) => setTrending(d.results ?? []))
      .catch(() => setTrending([]))
      .finally(() => setTrendLoading(false));
  }, [mediaTab, windowTab]);

  // Load watchlist on mount
  useEffect(() => {
    fetch(`${API}/shows`)
      .then((r) => r.json())
      .then((d) => setWatching((d.shows ?? []).filter((s: WatchlistShow) => s.status === "watching")))
      .catch(() => setWatching([]));
  }, []);

  // Mood filter
  const pickMood = useCallback(async (idx: number) => {
    if (activeMood === idx) { setActiveMood(null); setMoodResults([]); return; }
    setActiveMood(idx);
    setMoodLoading(true);
    try {
      const mood = MOODS[idx];
      const res  = await fetch(`${API}/tmdb/browse?type=movie&with_genres=${mood.genres}&sort_by=popularity.desc`);
      const data = await res.json();
      setMoodResults(data.results ?? []);
    } catch {
      setMoodResults([]);
    } finally {
      setMoodLoading(false);
    }
  }, [activeMood]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQ.trim()) router.push(`/search?q=${encodeURIComponent(searchQ.trim())}`);
    else router.push("/search");
  };

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "1.5rem 1.5rem 4rem" }}>

      {/* ── Search bar ──────────────────────────────────────────────────── */}
      <form onSubmit={handleSearch} style={{ marginBottom: "2rem" }}>
        <div style={{ position: "relative" }}>
          <svg style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
            color: "var(--text-muted)", pointerEvents: "none" }}
            width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
            <circle cx={11} cy={11} r={8} /><path strokeLinecap="round" d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            placeholder="Search movies, series…"
            style={{
              width:        "100%",
              padding:      "0.75rem 1rem 0.75rem 2.5rem",
              background:   "var(--bg-card)",
              border:       "1px solid var(--border)",
              borderRadius: 10,
              color:        "var(--text-primary)",
              fontSize:     "0.9rem",
              outline:      "none",
              boxSizing:    "border-box",
              transition:   "border-color 0.2s",
            }}
          />
        </div>
      </form>

      {/* ── Continue Watching ────────────────────────────────────────────── */}
      {watching.length > 0 && (
        <section style={{ marginBottom: "2rem" }}>
          <SectionHeading>Continue Watching</SectionHeading>
          <ScrollRow>
            {watching.map((show) => (
              <PosterCard
                key={show.id}
                item={show}
                progress={Math.floor(Math.random() * 60) + 20} // TODO: real progress from episode_ratings
                caption="Last watched"
              />
            ))}
          </ScrollRow>
        </section>
      )}

      {/* ── Trending ─────────────────────────────────────────────────────── */}
      <section style={{ marginBottom: "2rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
          marginBottom: "0.875rem", flexWrap: "wrap", gap: "0.5rem" }}>
          <SectionHeading>Trending</SectionHeading>

          {/* Tab row */}
          <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
            <Pill label="Movies" active={mediaTab === "movie"} onClick={() => setMediaTab("movie")} />
            <Pill label="TV"     active={mediaTab === "tv"}    onClick={() => setMediaTab("tv")} />
            <span style={{ width: 1, background: "var(--border)", margin: "0 4px" }} />
            <Pill label="Today"     active={windowTab === "day"}  onClick={() => setWindowTab("day")} />
            <Pill label="This Week" active={windowTab === "week"} onClick={() => setWindowTab("week")} />
          </div>
        </div>

        {trendLoading ? (
          <ScrollRow>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="skeleton"
                style={{ flexShrink: 0, width: 130, aspectRatio: "2/3", borderRadius: 8 }} />
            ))}
          </ScrollRow>
        ) : (
          <ScrollRow>
            {trending.map((item, i) => (
              <TrendingCard key={`${item.type}-${item.id}`} item={item} rank={i + 1} />
            ))}
          </ScrollRow>
        )}
      </section>

      {/* ── Mood Picker ───────────────────────────────────────────────────── */}
      <section style={{ marginBottom: "2rem" }}>
        <SectionHeading>What&apos;s your mood?</SectionHeading>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.6rem",
          marginBottom: activeMood !== null ? "1.5rem" : 0 }}>
          {MOODS.map((mood, i) => (
            <button
              key={mood.label}
              onClick={() => pickMood(i)}
              style={{
                padding:      "0.75rem 0.5rem",
                borderRadius: 10,
                border:       activeMood === i ? `2px solid ${mood.color}` : "1px solid var(--border)",
                background:   activeMood === i ? `${mood.color}22` : "var(--bg-card)",
                cursor:       "pointer",
                display:      "flex",
                flexDirection: "column",
                alignItems:   "center",
                gap:          "0.3rem",
                transition:   "all 0.2s",
              }}
            >
              <span style={{ fontSize: "1.25rem" }}>{mood.emoji}</span>
              <span style={{ fontSize: "0.7rem", fontWeight: 600, color: activeMood === i ? mood.color : "var(--text-muted)" }}>
                {mood.label}
              </span>
            </button>
          ))}
        </div>

        {/* Mood results */}
        {activeMood !== null && (
          moodLoading ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: "1rem" }}>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="skeleton" style={{ aspectRatio: "2/3", borderRadius: 8 }} />
              ))}
            </div>
          ) : (
            <div>
              <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.75rem" }}>
                Because you want something {MOODS[activeMood].label.toLowerCase()}:
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: "1rem" }}>
                {moodResults.slice(0, 12).map((item, i) => (
                  <MatchCard
                    key={item.id}
                    item={item}
                    match={Math.max(72, 99 - i * 3)}
                  />
                ))}
              </div>
            </div>
          )
        )}
      </section>

    </div>
  );
}
