"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

interface MediaItem {
  id: number;
  title: string;
  poster_path: string | null;
  vote_average: number;
  type: string;
  release_date?: string | null;
}

// ── Poster card ───────────────────────────────────────────────────────────────
function PosterCard({ item }: { item: MediaItem }) {
  return (
    <Link
      href={`/show/${item.id}?type=${item.type}`}
      style={{ display: "flex", flexDirection: "column", gap: 6 }}
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

        {/* Type badge top-left */}
        <span style={{ position: "absolute", top: 6, left: 6,
          background: item.type === "tv" ? "#3b82f6" : "#e50914",
          borderRadius: 4, padding: "2px 6px", fontSize: "0.55rem", fontWeight: 800,
          color: "#fff", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          {item.type === "tv" ? "TV" : "Movie"}
        </span>

        {/* Rating badge top-right */}
        <span style={{ position: "absolute", top: 6, right: 6,
          background: "rgba(0,0,0,.75)", borderRadius: "50%", width: 28, height: 28,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "0.58rem", fontWeight: 800, color: "#fff" }}>
          {(item.vote_average ?? 0).toFixed(1)}
        </span>
      </div>

      <p className="line-clamp-1" style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-primary)" }}>
        {item.title}
      </p>
      {item.release_date && (
        <p style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginTop: -4 }}>
          {item.release_date.slice(0, 4)}
        </p>
      )}
    </Link>
  );
}

// ── Poster grid ───────────────────────────────────────────────────────────────
function PosterGrid({ items, loading }: { items: MediaItem[]; loading?: boolean }) {
  if (loading) return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: "1rem" }}>
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="skeleton" style={{ aspectRatio: "2/3", borderRadius: 8 }} />
      ))}
    </div>
  );
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: "1rem" }}>
      {items.map((item) => <PosterCard key={`${item.type}-${item.id}`} item={item} />)}
    </div>
  );
}

// ── Section heading ───────────────────────────────────────────────────────────
function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{ fontSize: "1rem", fontWeight: 500, color: "#fff", display: "flex",
      alignItems: "center", gap: "0.6rem", marginBottom: "1rem", marginTop: "1.75rem" }}>
      <span style={{ display: "inline-block", width: 3, height: "1em",
        background: "#e50914", borderRadius: 2, flexShrink: 0 }} />
      {children}
    </h2>
  );
}

// ── Inner component (uses useSearchParams) ────────────────────────────────────
function SearchInner() {
  const searchParams = useSearchParams();
  const initialQ     = searchParams.get("q") ?? "";

  const [query,    setQuery]    = useState(initialQ);
  const [results,  setResults]  = useState<MediaItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [trendMovies, setTrendMovies] = useState<MediaItem[]>([]);
  const [trendTV,     setTrendTV]     = useState<MediaItem[]>([]);
  const [defaultsLoading, setDefaultsLoading] = useState(true);

  const inputRef  = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-focus
  useEffect(() => { inputRef.current?.focus(); }, []);

  // Load defaults on mount
  useEffect(() => {
    Promise.allSettled([
      fetch(`${API}/tmdb/trending?category=movie&window=day`).then((r) => r.json()),
      fetch(`${API}/tmdb/trending?category=tv&window=week`).then((r) => r.json()),
    ]).then(([movies, tv]) => {
      setTrendMovies(movies.status === "fulfilled" ? movies.value.results ?? [] : []);
      setTrendTV(tv.status     === "fulfilled" ? tv.value.results     ?? [] : []);
    }).finally(() => setDefaultsLoading(false));
  }, []);

  // If initial query from URL, run it once
  useEffect(() => {
    if (initialQ.trim()) runSearch(initialQ.trim());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runSearch = useCallback(async (q: string) => {
    setSearching(true);
    try {
      const res  = await fetch(`${API}/tmdb/search?q=${encodeURIComponent(q)}&type=multi`);
      const data = await res.json();
      setResults(data.results ?? []);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!val.trim()) { setResults([]); return; }
    debounceRef.current = setTimeout(() => runSearch(val.trim()), 400);
  };

  const isSearching = query.trim().length > 0;

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "1.5rem 1.5rem 4rem" }}>
      {/* ── Search input ─────────────────────────────────────────────── */}
      <div style={{ position: "relative", marginBottom: "1.5rem" }}>
        <svg style={{ position: "absolute", left: 18, top: "50%", transform: "translateY(-50%)",
          color: "var(--text-muted)", pointerEvents: "none" }}
          width={20} height={20} fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
          <circle cx={11} cy={11} r={8} />
          <path strokeLinecap="round" d="m21 21-4.35-4.35" />
        </svg>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleChange}
          placeholder="Search movies, series, people…"
          style={{
            width:        "100%",
            padding:      "1rem 1.25rem 1rem 3rem",
            background:   "var(--bg-card)",
            border:       "1px solid var(--border)",
            borderRadius: 12,
            color:        "#fff",
            fontSize:     "1.1rem",
            outline:      "none",
            boxSizing:    "border-box",
            transition:   "border-color 0.2s",
          }}
          onFocus={(e) => (e.target.style.borderColor = "rgba(229,9,20,0.5)")}
          onBlur={(e)  => (e.target.style.borderColor = "var(--border)")}
          autoComplete="off"
          spellCheck="false"
        />

        {/* Clear button */}
        {query && (
          <button
            onClick={() => { setQuery(""); setResults([]); inputRef.current?.focus(); }}
            style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
              background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer",
              fontSize: "1.2rem", lineHeight: 1 }}
            aria-label="Clear search"
          >
            ×
          </button>
        )}
      </div>

      {/* ── Search results ──────────────────────────────────────────── */}
      {isSearching && (
        <>
          {searching ? (
            <PosterGrid items={[]} loading />
          ) : results.length > 0 ? (
            <>
              <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
                {results.length} result{results.length !== 1 ? "s" : ""} for &ldquo;{query}&rdquo;
              </p>
              <PosterGrid items={results} />
            </>
          ) : (
            <div style={{ textAlign: "center", padding: "4rem 2rem", color: "var(--text-muted)" }}>
              <p style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>🔍</p>
              <p>No results for &ldquo;{query}&rdquo;</p>
            </div>
          )}
        </>
      )}

      {/* ── Default state ──────────────────────────────────────────── */}
      {!isSearching && (
        <>
          <SectionHeading>Trending Today</SectionHeading>
          <PosterGrid items={trendMovies.slice(0, 12)} loading={defaultsLoading} />

          <SectionHeading>Popular TV Series</SectionHeading>
          <PosterGrid items={trendTV.slice(0, 12)} loading={defaultsLoading} />
        </>
      )}
    </div>
  );
}

// ── Page (Suspense boundary for useSearchParams) ──────────────────────────────
export default function SearchPage() {
  return (
    <Suspense fallback={
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "1.5rem" }}>
        <div className="skeleton" style={{ height: 56, borderRadius: 12, marginBottom: "1.5rem" }} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: "1rem" }}>
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ aspectRatio: "2/3", borderRadius: 8 }} />
          ))}
        </div>
      </div>
    }>
      <SearchInner />
    </Suspense>
  );
}
