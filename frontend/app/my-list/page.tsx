"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Show {
  id: number;
  tmdb_id: number;
  title: string;
  type: "movie" | "tv";
  poster_path: string | null;
  status: "watching" | "completed" | "dropped" | "plan_to_watch";
  added_at: number;
  episodes_watched: number | null;
  avg_rating: number | null;
  last_season: number | null;
  last_episode: number | null;
}

interface Toast { id: number; show: Show }

// ── Constants ─────────────────────────────────────────────────────────────────
type StatusKey = Show["status"];

const STATUS_META: Record<StatusKey, { label: string; color: string; bg: string }> = {
  watching:      { label: "Watching",   color: "#3b82f6", bg: "rgba(59,130,246,0.15)" },
  completed:     { label: "Completed",  color: "#22c55e", bg: "rgba(34,197,94,0.15)" },
  dropped:       { label: "Dropped",    color: "#ef4444", bg: "rgba(239,68,68,0.15)" },
  plan_to_watch: { label: "Plan",       color: "#f59e0b", bg: "rgba(245,158,11,0.15)" },
};

const FILTERS: { label: string; value: StatusKey | "all" }[] = [
  { label: "All",       value: "all" },
  { label: "Watching",  value: "watching" },
  { label: "Completed", value: "completed" },
  { label: "Dropped",   value: "dropped" },
  { label: "Plan",      value: "plan_to_watch" },
];

const SORT_OPTIONS = [
  { label: "Recently Added", value: "added_at" },
  { label: "Title A–Z",      value: "title_asc" },
  { label: "Title Z–A",      value: "title_desc" },
  { label: "Avg Rating",     value: "avg_rating" },
  { label: "Progress",       value: "progress" },
];

// ── Context menu ──────────────────────────────────────────────────────────────
interface CtxMenu { x: number; y: number; show: Show }

// ── Progress helper (rough estimate from last ep) ─────────────────────────────
function calcProgress(show: Show): number {
  if (show.status === "completed") return 100;
  if (show.status === "plan_to_watch") return 0;
  if (!show.last_season || !show.last_episode) return 0;
  // Rough: (season-1)*13 + episode / totalEst
  const watched = (show.last_season - 1) * 13 + show.last_episode;
  return Math.min(95, Math.round((watched / 52) * 100)); // assume ~4 seasons
}

// ── Sort function ─────────────────────────────────────────────────────────────
function sortShows(shows: Show[], sortBy: string): Show[] {
  return [...shows].sort((a, b) => {
    switch (sortBy) {
      case "title_asc":  return a.title.localeCompare(b.title);
      case "title_desc": return b.title.localeCompare(a.title);
      case "avg_rating": return (b.avg_rating ?? 0) - (a.avg_rating ?? 0);
      case "progress":   return calcProgress(b) - calcProgress(a);
      default:           return b.added_at - a.added_at;
    }
  });
}

// ── Poster card ───────────────────────────────────────────────────────────────
function PosterCard({
  show,
  onContextMenu,
  onWatch,
}: {
  show: Show;
  onContextMenu: (e: React.MouseEvent, s: Show) => void;
  onWatch: (s: Show) => void;
}) {
  const meta     = STATUS_META[show.status];
  const progress = calcProgress(show);
  const initial  = show.title.charAt(0).toUpperCase();

  return (
    <div
      onContextMenu={(e) => { e.preventDefault(); onContextMenu(e, show); }}
      style={{ display: "flex", flexDirection: "column", gap: 0 }}
    >
      {/* Poster */}
      <Link href={`/show/${show.tmdb_id}?type=${show.type}`}>
        <div
          style={{
            position:     "relative",
            aspectRatio:  "2/3",
            borderRadius: "8px 8px 0 0",
            overflow:     "hidden",
            background:   "#1a1a1a",
            border:       "1px solid rgba(255,255,255,0.08)",
            borderBottom: "none",
            transition:   "transform 0.25s ease",
          }}
        >
          {show.poster_path ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={show.poster_path}
              alt={show.title}
              loading="lazy"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <div style={{
              width: "100%", height: "100%",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "3rem", fontWeight: 900, color: "rgba(255,255,255,0.15)",
              background: "linear-gradient(135deg,#1a1a1a,#222)",
            }}>
              {initial}
            </div>
          )}

          {/* Status badge top-left */}
          <span style={{
            position:     "absolute",
            top:          8,
            left:         8,
            background:   meta.color,
            color:        "#fff",
            fontSize:     "0.6rem",
            fontWeight:   800,
            padding:      "2px 7px",
            borderRadius: 4,
            textTransform: "uppercase",
            letterSpacing: "0.04em",
          }}>
            {meta.label}
          </span>

          {/* Avg rating top-right */}
          {show.avg_rating != null && (
            <span style={{
              position:       "absolute",
              top:            8,
              right:          8,
              background:     "rgba(0,0,0,0.75)",
              backdropFilter: "blur(4px)",
              color:          "#f5c518",
              fontSize:       "0.6rem",
              fontWeight:     800,
              padding:        "2px 6px",
              borderRadius:   4,
            }}>
              ★ {show.avg_rating}
            </span>
          )}

          {/* Red progress bar — very bottom of image */}
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0,
            height: 3, background: "rgba(255,255,255,0.1)",
          }}>
            {progress > 0 && (
              <div style={{
                height: "100%",
                width:  `${progress}%`,
                background: "#e50914",
                borderRadius: "0 2px 2px 0",
              }} />
            )}
          </div>
        </div>
      </Link>

      {/* Info + button */}
      <div style={{
        background:   "#1a1a1a",
        border:       "1px solid rgba(255,255,255,0.08)",
        borderTop:    "none",
        borderRadius: "0 0 8px 8px",
        padding:      "0.6rem 0.65rem 0.65rem",
        display:      "flex",
        flexDirection: "column",
        gap:          4,
      }}>
        <p className="line-clamp-1"
          style={{ fontSize: "0.8rem", fontWeight: 700, color: "#fff" }}>
          {show.title}
        </p>

        <p style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.45)" }}>
          {show.type === "tv"
            ? show.last_season
              ? `S${show.last_season}E${show.last_episode}`
              : `TV Series`
            : "Movie"}
          {show.episodes_watched ? ` · ${show.episodes_watched} ep${show.episodes_watched > 1 ? "s" : ""} rated` : ""}
        </p>

        {/* Watch button */}
        <button
          onClick={() => onWatch(show)}
          style={{
            marginTop:    4,
            width:        "100%",
            padding:      "0.45rem",
            background:   "#e50914",
            color:        "#fff",
            fontWeight:   700,
            fontSize:     "0.75rem",
            border:       "none",
            borderRadius: 6,
            cursor:       "pointer",
            transition:   "opacity 0.2s",
          }}
        >
          ▶ Watch
        </button>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function MyListPage() {
  const router = useRouter();

  const [shows,   setShows]   = useState<Show[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState<StatusKey | "all">("all");
  const [sortBy,  setSortBy]  = useState("added_at");
  const [ctx,     setCtx]     = useState<CtxMenu | null>(null);
  const [toasts,  setToasts]  = useState<Toast[]>([]);
  const undoRefs  = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  // Load
  useEffect(() => {
    fetch(`${API}/shows`)
      .then((r) => r.json())
      .then((d) => setShows(d.shows ?? []))
      .catch(() => setShows([]))
      .finally(() => setLoading(false));
  }, []);

  // Close context menu on click-away
  useEffect(() => {
    const close = () => setCtx(null);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, []);

  // Counts per status
  const counts = shows.reduce<Record<string, number>>(
    (acc, s) => { acc[s.status] = (acc[s.status] ?? 0) + 1; return acc; },
    {}
  );

  // Derived list
  const filtered = filter === "all" ? shows : shows.filter((s) => s.status === filter);
  const sorted   = sortShows(filtered, sortBy);

  // Update status
  const patchStatus = async (show: Show, status: StatusKey) => {
    setShows((prev) => prev.map((s) => s.id === show.id ? { ...s, status } : s));
    setCtx(null);
    await fetch(`${API}/shows/${show.id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ status }),
    });
  };

  // Remove with 5s undo
  const removeShow = useCallback((show: Show) => {
    setCtx(null);
    // Immediately hide from list
    setShows((prev) => prev.filter((s) => s.id !== show.id));

    const toastId = Date.now();
    setToasts((prev) => [...prev, { id: toastId, show }]);

    // After 5s, commit DELETE
    const timer = setTimeout(async () => {
      await fetch(`${API}/shows/${show.id}`, { method: "DELETE" });
      setToasts((prev) => prev.filter((t) => t.id !== toastId));
      undoRefs.current.delete(toastId);
    }, 5000);

    undoRefs.current.set(toastId, timer);
  }, []);

  const undoRemove = (toast: Toast) => {
    const timer = undoRefs.current.get(toast.id);
    if (timer) clearTimeout(timer);
    undoRefs.current.delete(toast.id);
    setShows((prev) => [toast.show, ...prev]);
    setToasts((prev) => prev.filter((t) => t.id !== toast.id));
  };

  // Watch
  const handleWatch = useCallback((show: Show) => {
    const href = show.type === "tv"
      ? `/watch/${show.tmdb_id}?type=tv${show.last_season ? `&s=${show.last_season}&e=${show.last_episode ?? 1}` : "&s=1&e=1"}`
      : `/watch/${show.tmdb_id}?type=movie`;
    router.push(href);
  }, [router]);

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "1.5rem 1.5rem 4rem", position: "relative" }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 900, color: "#fff", marginBottom: "1.5rem" }}>My List</h1>

      {/* ── Filter + Sort row ───────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap",
        gap: "0.6rem", marginBottom: "1.5rem", justifyContent: "space-between" }}>

        {/* Filter pills */}
        <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
          {FILTERS.map(({ label, value }) => {
            const count = value === "all" ? shows.length : (counts[value] ?? 0);
            const active = filter === value;
            return (
              <button
                key={value}
                onClick={() => setFilter(value)}
                style={{
                  display:      "inline-flex",
                  alignItems:   "center",
                  gap:          "0.35rem",
                  padding:      "5px 12px",
                  borderRadius: 9999,
                  fontSize:     "0.8rem",
                  fontWeight:   600,
                  border:       active ? "1px solid transparent" : "1px solid rgba(255,255,255,0.1)",
                  background:   active ? "#e50914" : "#1a1a1a",
                  color:        active ? "#fff" : "rgba(255,255,255,0.55)",
                  cursor:       "pointer",
                  transition:   "all 0.2s",
                }}
              >
                {label}
                {count > 0 && (
                  <span style={{
                    background:   active ? "rgba(255,255,255,0.25)" : "#e50914",
                    color:        "#fff",
                    fontSize:     "0.6rem",
                    fontWeight:   800,
                    borderRadius: 9999,
                    padding:      "1px 5px",
                    lineHeight:   1.4,
                  }}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Sort dropdown — custom single-arrow */}
        <div style={{ position: "relative", flexShrink: 0 }}>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              appearance:    "none",
              WebkitAppearance: "none",
              padding:       "0.45rem 2rem 0.45rem 0.75rem",
              background:    "#1a1a1a",
              border:        "1px solid rgba(255,255,255,0.1)",
              borderRadius:  8,
              color:         "rgba(255,255,255,0.7)",
              fontSize:      "0.8rem",
              cursor:        "pointer",
              outline:       "none",
            }}
          >
            {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          {/* Custom down arrow */}
          <svg style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
            pointerEvents: "none", color: "rgba(255,255,255,0.4)" }}
            width={12} height={12} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
          </svg>
        </div>
      </div>

      {/* ── Loading ─────────────────────────────────────────────────────── */}
      {loading && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "1.25rem" }}>
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ aspectRatio: "2/3", borderRadius: 8 }} />
          ))}
        </div>
      )}

      {/* ── Empty state ──────────────────────────────────────────────────── */}
      {!loading && sorted.length === 0 && (
        <div style={{ textAlign: "center", padding: "4rem 2rem" }}>
          <p style={{ fontSize: "3rem", marginBottom: "0.75rem" }}>🎬</p>
          <p style={{ fontWeight: 700, fontSize: "1rem", color: "#fff", marginBottom: "0.4rem" }}>
            {filter === "all" ? "Your list is empty" : `No "${FILTERS.find(f=>f.value===filter)?.label}" titles`}
          </p>
          <p style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.4)", marginBottom: "1.25rem" }}>
            Discover something great to watch.
          </p>
          <Link href="/discover"
            style={{ display: "inline-flex", padding: "0.6rem 1.4rem", background: "#e50914",
              color: "#fff", fontWeight: 700, fontSize: "0.875rem", borderRadius: 7 }}>
            Browse content →
          </Link>
        </div>
      )}

      {/* ── 3-column grid ───────────────────────────────────────────────── */}
      {!loading && sorted.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "1.25rem" }}>
          {sorted.map((show) => (
            <PosterCard
              key={show.id}
              show={show}
              onContextMenu={(e, s) => {
                e.stopPropagation();
                setCtx({ x: e.clientX, y: e.clientY, show: s });
              }}
              onWatch={handleWatch}
            />
          ))}
        </div>
      )}

      {/* ── Context menu ─────────────────────────────────────────────────── */}
      {ctx && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position:       "fixed",
            top:            ctx.y,
            left:           ctx.x,
            zIndex:         200,
            background:     "#1a1a1a",
            border:         "1px solid rgba(255,255,255,0.12)",
            borderRadius:   10,
            padding:        "0.4rem 0",
            minWidth:       180,
            boxShadow:      "0 8px 32px rgba(0,0,0,0.7)",
          }}
        >
          <p style={{ fontSize: "0.7rem", fontWeight: 700, color: "rgba(255,255,255,0.3)",
            padding: "0.3rem 0.9rem 0.4rem", textTransform: "uppercase", letterSpacing: "0.07em" }}>
            Move to
          </p>
          {(["watching","completed","dropped","plan_to_watch"] as StatusKey[]).map((s) => (
            <button
              key={s}
              onClick={() => patchStatus(ctx.show, s)}
              style={{
                display:    "flex",
                alignItems: "center",
                gap:        "0.5rem",
                width:      "100%",
                padding:    "0.5rem 0.9rem",
                background: ctx.show.status === s ? "rgba(229,9,20,0.12)" : "none",
                border:     "none",
                color:      ctx.show.status === s ? "#e50914" : "rgba(255,255,255,0.75)",
                fontSize:   "0.82rem",
                fontWeight: ctx.show.status === s ? 700 : 500,
                cursor:     "pointer",
              }}
            >
              <span style={{ width: 8, height: 8, borderRadius: "50%",
                background: STATUS_META[s].color, flexShrink: 0 }} />
              {STATUS_META[s].label}
            </button>
          ))}
          <div style={{ height: 1, background: "rgba(255,255,255,0.08)", margin: "0.3rem 0" }} />
          <button
            onClick={() => removeShow(ctx.show)}
            style={{ display: "flex", alignItems: "center", gap: "0.5rem", width: "100%",
              padding: "0.5rem 0.9rem", background: "none", border: "none",
              color: "#ef4444", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer" }}
          >
            🗑 Remove from list
          </button>
        </div>
      )}

      {/* ── Undo toasts ──────────────────────────────────────────────────── */}
      <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
        display: "flex", flexDirection: "column", gap: "0.5rem", zIndex: 300, alignItems: "center" }}>
        {toasts.map((toast) => (
          <div key={toast.id}
            style={{
              display:        "flex",
              alignItems:     "center",
              gap:            "1rem",
              padding:        "0.7rem 1.1rem",
              background:     "#1a1a1a",
              border:         "1px solid rgba(255,255,255,0.15)",
              borderRadius:   10,
              boxShadow:      "0 8px 32px rgba(0,0,0,0.6)",
              animation:      "fadeUp 0.25s ease",
            }}>
            <span style={{ fontSize: "0.85rem", color: "#fff" }}>
              <span style={{ color: "rgba(255,255,255,0.55)" }}>Removed</span> {toast.show.title}
            </span>
            <button
              onClick={() => undoRemove(toast)}
              style={{ padding: "0.35rem 0.85rem", background: "#e50914", color: "#fff",
                fontWeight: 700, fontSize: "0.78rem", borderRadius: 6, border: "none", cursor: "pointer" }}
            >
              Undo
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
