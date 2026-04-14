"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

interface Episode {
  episode_number: number;
  name: string;
  overview: string;
  runtime: number | null;
  still_path: string | null;
}

interface Props {
  tmdbId:          number;
  totalSeasons:    number;
  initialEpisodes: Episode[];
  watchingSeason?: number;
  watchingEpisode?: number;
}

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export default function EpisodesSection({
  tmdbId,
  totalSeasons,
  initialEpisodes,
  watchingSeason  = 1,
  watchingEpisode,
}: Props) {
  const [season,   setSeason]   = useState(1);
  const [episodes, setEpisodes] = useState<Episode[]>(initialEpisodes);
  const [loading,  setLoading]  = useState(false);
  const [query,    setQuery]    = useState("");

  const loadSeason = async (s: number) => {
    setSeason(s);
    setQuery("");
    setLoading(true);
    try {
      const res  = await fetch(`${API}/tmdb/episodes/${tmdbId}/${s}`);
      const data = await res.json();
      setEpisodes(data.episodes ?? []);
    } catch {
      setEpisodes([]);
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(
    () =>
      episodes.filter(
        (ep) =>
          !query ||
          ep.name.toLowerCase().includes(query.toLowerCase()) ||
          String(ep.episode_number).includes(query)
      ),
    [episodes, query]
  );

  return (
    <section>
      <div style={{
        display: "flex", alignItems: "center", gap: "0.75rem",
        marginBottom: "1rem", flexWrap: "wrap",
      }}>
        <h2 style={{
          fontSize: "1.1rem", fontWeight: 800, color: "#fff",
          paddingLeft: "0.75rem", borderLeft: "3px solid #e50914",
          margin: 0,
        }}>
          Episodes
        </h2>

        {/* Season dropdown */}
        <div style={{ position: "relative" }}>
          <select
            value={season}
            onChange={(e) => loadSeason(Number(e.target.value))}
            style={{
              appearance: "none", WebkitAppearance: "none",
              padding: "0.35rem 2rem 0.35rem 0.65rem",
              background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 7, color: "#fff", fontSize: "0.8rem",
              cursor: "pointer", outline: "none",
            }}
          >
            {Array.from({ length: totalSeasons }, (_, i) => i + 1).map((s) => (
              <option key={s} value={s}>Season {s}</option>
            ))}
          </select>
          <svg style={{ position: "absolute", right: 7, top: "50%", transform: "translateY(-50%)",
            pointerEvents: "none", color: "rgba(255,255,255,0.4)" }}
            width={11} height={11} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
          </svg>
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="Search episodes…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{
            flex: "1 1 180px", padding: "0.35rem 0.65rem",
            background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 7, color: "#fff", fontSize: "0.8rem", outline: "none",
          }}
        />
      </div>

      {/* Scrollable episode list — no "Show more" button */}
      <div style={{
        maxHeight:     "520px",
        overflowY:     "auto",
        scrollbarWidth: "thin",
        scrollbarColor: "rgba(229,9,20,0.4) transparent",
        display:       "flex",
        flexDirection: "column",
        gap:           "0.4rem",
        paddingRight:  "0.25rem",
      }}>
        {loading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 88, borderRadius: 8 }} />
            ))
          : filtered.map((ep) => {
              const isCurrent =
                season === watchingSeason && ep.episode_number === watchingEpisode;
              return (
                <Link
                  key={ep.episode_number}
                  href={`/watch/${tmdbId}?type=tv&s=${season}&e=${ep.episode_number}`}
                  style={{
                    display:        "flex",
                    gap:            "0.75rem",
                    alignItems:     "flex-start",
                    padding:        "0.7rem",
                    borderRadius:   8,
                    background:     isCurrent ? "rgba(229,9,20,0.08)" : "#1a1a1a",
                    border:         "1px solid rgba(255,255,255,0.06)",
                    borderLeft:     isCurrent ? "3px solid #e50914" : "3px solid transparent",
                    textDecoration: "none",
                    transition:     "background 0.15s",
                    flexShrink:     0,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = isCurrent
                      ? "rgba(229,9,20,0.12)"
                      : "rgba(255,255,255,0.05)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = isCurrent
                      ? "rgba(229,9,20,0.08)"
                      : "#1a1a1a";
                  }}
                >
                  {/* Still image — 16:9 */}
                  <div style={{
                    flexShrink: 0, width: 120, height: 68,
                    borderRadius: 6, overflow: "hidden",
                    background: "#242424", position: "relative",
                  }}>
                    {ep.still_path ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={ep.still_path} alt={ep.name} loading="lazy"
                        style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <div style={{ width: "100%", height: "100%", display: "flex",
                        alignItems: "center", justifyContent: "center",
                        color: "rgba(255,255,255,0.15)", fontSize: "1.5rem" }}>🎬</div>
                    )}
                    <span style={{
                      position: "absolute", bottom: 4, left: 4,
                      background: "rgba(0,0,0,0.85)", borderRadius: 3,
                      padding: "1px 5px", fontSize: "0.58rem", fontWeight: 800, color: "#fff",
                    }}>
                      E{ep.episode_number}
                    </span>
                    {isCurrent && (
                      <span style={{
                        position: "absolute", top: 4, right: 4,
                        background: "#e50914", borderRadius: 3,
                        padding: "1px 5px", fontSize: "0.55rem",
                        fontWeight: 800, color: "#fff", textTransform: "uppercase",
                      }}>
                        ▶
                      </span>
                    )}
                  </div>

                  {/* Text */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "baseline",
                      gap: "0.5rem", marginBottom: "0.2rem" }}>
                      <span className="line-clamp-1" style={{
                        fontWeight: isCurrent ? 700 : 600,
                        fontSize: "0.855rem",
                        color: isCurrent ? "#fff" : "rgba(255,255,255,0.85)",
                        flex: 1,
                      }}>
                        {ep.name}
                      </span>
                      {ep.runtime && (
                        <span style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.35)",
                          flexShrink: 0 }}>
                          {ep.runtime}m
                        </span>
                      )}
                    </div>
                    <p className="line-clamp-2" style={{
                      fontSize: "0.73rem", color: "rgba(255,255,255,0.4)", lineHeight: 1.5,
                    }}>
                      {ep.overview || "No description available."}
                    </p>
                  </div>
                </Link>
              );
            })}

        {!loading && filtered.length === 0 && (
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.875rem", padding: "1rem 0" }}>
            No episodes match &ldquo;{query}&rdquo;
          </p>
        )}
      </div>
    </section>
  );
}
