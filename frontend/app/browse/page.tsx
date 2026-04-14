"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface MediaItem {
  id: number;
  title: string;
  poster_path: string | null;
  vote_average: number;
  type: "movie" | "tv";
  release_date?: string | null;
}

interface Genre { id: number; name: string }

const API = "/api";

export default function BrowsePage() {
  const [type,       setType]       = useState<"movie" | "tv">("movie");
  const [sortBy,     setSortBy]     = useState("popularity.desc");
  const [genres,     setGenres]     = useState<Genre[]>([]);
  const [selGenre,   setSelGenre]   = useState<number | null>(null);
  const [results,    setResults]    = useState<MediaItem[]>([]);
  const [page,       setPage]       = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading,    setLoading]    = useState(false);

  // Load genres when type changes
  useEffect(() => {
    setSelGenre(null);
    fetch(`${API}/tmdb/genres?type=${type}`)
      .then((r) => r.json())
      .then((d) => setGenres(d.genres ?? []))
      .catch(() => setGenres([]));
  }, [type]);

  const fetchPage = useCallback(async (p: number, reset = false) => {
    setLoading(true);
    try {
      let url = `${API}/tmdb/browse?type=${type}&sort_by=${sortBy}&page=${p}`;
      if (selGenre) url += `&with_genres=${selGenre}`;
      const res  = await fetch(url);
      const data = await res.json();
      setResults((prev) => (reset ? data.results ?? [] : [...prev, ...(data.results ?? [])]));
      setTotalPages(data.total_pages ?? 1);
    } catch {
      if (reset) setResults([]);
    } finally {
      setLoading(false);
    }
  }, [type, sortBy, selGenre]);

  // Re-fetch on filter change
  useEffect(() => {
    setPage(1);
    fetchPage(1, true);
  }, [fetchPage]);

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchPage(next, false);
  };

  const SORTS = [
    { label: "Popularity",    value: "popularity.desc" },
    { label: "Rating",        value: "vote_average.desc" },
    { label: "Release Date",  value: "primary_release_date.desc" },
    { label: "Revenue",       value: "revenue.desc" },
  ];

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "1.5rem 1.5rem 4rem" }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 900, color: "#fff", marginBottom: "1.25rem" }}>Browse</h1>

      {/* ── Filters ────────────────────────────────────────── */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", marginBottom: "1.5rem", alignItems: "center" }}>
        {/* Type toggle */}
        <div style={{ display: "flex", border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
          {(["movie", "tv"] as const).map((t) => (
            <button
              key={t}
              onClick={() => { setType(t); setPage(1); }}
              style={{ padding: "0.45rem 1rem", background: type === t ? "var(--accent)" : "var(--bg-card)", color: type === t ? "#fff" : "var(--text-muted)", fontWeight: 600, fontSize: "0.8rem", border: "none", cursor: "pointer" }}
            >
              {t === "movie" ? "Movies" : "Series"}
            </button>
          ))}
        </div>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          style={{ padding: "0.45rem 0.75rem", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-primary)", fontSize: "0.8rem", cursor: "pointer", outline: "none" }}
        >
          {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>

        {/* Genre pills */}
        <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
          <button
            onClick={() => setSelGenre(null)}
            style={{ padding: "4px 12px", borderRadius: 9999, fontSize: "0.75rem", fontWeight: 600, background: selGenre === null ? "var(--accent)" : "var(--bg-card)", color: selGenre === null ? "#fff" : "var(--text-muted)", border: "1px solid var(--border)", cursor: "pointer" }}
          >
            All
          </button>
          {genres.slice(0, 12).map((g) => (
            <button
              key={g.id}
              onClick={() => setSelGenre(g.id)}
              style={{ padding: "4px 12px", borderRadius: 9999, fontSize: "0.75rem", fontWeight: 600, background: selGenre === g.id ? "var(--accent)" : "var(--bg-card)", color: selGenre === g.id ? "#fff" : "var(--text-muted)", border: "1px solid var(--border)", cursor: "pointer" }}
            >
              {g.name}
            </button>
          ))}
        </div>
      </div>

      {/* ── Grid ────────────────────────────────────────────── */}
      {loading && results.length === 0 ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "1rem" }}>
          {Array.from({ length: 18 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ aspectRatio: "2/3", borderRadius: 8 }} />
          ))}
        </div>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
            {results.map((item) => (
              <Link key={`${item.type}-${item.id}`} href={`/show/${item.id}?type=${item.type}`} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ position: "relative", aspectRatio: "2/3", borderRadius: 8, overflow: "hidden", background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                  {item.poster_path ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.poster_path} alt={item.title} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem", fontWeight: 900, color: "var(--text-hint)" }}>
                      {item.title.charAt(0)}
                    </div>
                  )}
                  {item.vote_average != null && (
                    <span style={{ position: "absolute", top: 5, right: 5, background: "rgba(0,0,0,.75)", borderRadius: "50%", width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.55rem", fontWeight: 800, color: "#fff" }}>
                      {item.vote_average.toFixed(1)}
                    </span>
                  )}
                </div>
                <p className="line-clamp-1" style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-primary)" }}>{item.title}</p>
                {item.release_date && <p style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>{item.release_date.slice(0, 4)}</p>}
              </Link>
            ))}
          </div>

          {page < totalPages && (
            <div style={{ textAlign: "center" }}>
              <button
                onClick={loadMore}
                disabled={loading}
                style={{ padding: "0.65rem 2rem", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-muted)", fontWeight: 600, fontSize: "0.875rem", cursor: loading ? "not-allowed" : "pointer", transition: "background 0.2s" }}
              >
                {loading ? "Loading…" : "Load More"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
