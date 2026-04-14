"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

interface Stats {
  watching:      number;
  completed:     number;
  dropped:       number;
  plan_to_watch: number;
  total:         number;
}

export default function ProfilePage() {
  const [shows,   setShows]   = useState<any[]>([]);
  const [ratings, setRatings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      fetch(`${API}/shows`).then((r) => r.json()),
      fetch(`${API}/ratings`).then((r) => r.json()),
    ]).then(([showsRes, ratingsRes]) => {
      setShows(showsRes.status  === "fulfilled" ? showsRes.value.shows    ?? [] : []);
      setRatings(ratingsRes.status === "fulfilled" ? ratingsRes.value.ratings ?? [] : []);
    }).finally(() => setLoading(false));
  }, []);

  const stats: Stats = {
    watching:      shows.filter((s) => s.status === "watching").length,
    completed:     shows.filter((s) => s.status === "completed").length,
    dropped:       shows.filter((s) => s.status === "dropped").length,
    plan_to_watch: shows.filter((s) => s.status === "plan_to_watch").length,
    total:         shows.length,
  };

  const avgEngagement =
    ratings.length > 0
      ? (ratings.reduce((acc: number, r: any) => acc + (r.engagement ?? 0), 0) / ratings.length).toFixed(1)
      : "—";

  const STAT_CARDS = [
    { label: "Watching",    value: stats.watching,      color: "#3b82f6" },
    { label: "Completed",   value: stats.completed,     color: "#22c55e" },
    { label: "Dropped",     value: stats.dropped,       color: "#ef4444" },
    { label: "Planned",     value: stats.plan_to_watch, color: "#a855f7" },
    { label: "Episodes rated", value: ratings.length,  color: "#f59e0b" },
    { label: "Avg engagement", value: avgEngagement,   color: "#e50914" },
  ];

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "1.5rem 1.5rem 4rem" }}>
      {/* Avatar + name */}
      <div style={{ display: "flex", alignItems: "center", gap: "1.25rem", marginBottom: "2rem" }}>
        <div
          style={{
            width:           80,
            height:          80,
            borderRadius:    "50%",
            background:      "var(--accent)",
            display:         "flex",
            alignItems:      "center",
            justifyContent:  "center",
            fontSize:        "2rem",
            fontWeight:      900,
            color:           "#fff",
          }}
        >
          H
        </div>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 900, color: "#fff", marginBottom: "0.2rem" }}>Hemanth</h1>
          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Personal streaming tracker</p>
        </div>
      </div>

      {/* Stats grid */}
      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginBottom: "2rem" }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 80, borderRadius: 10 }} />
          ))}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginBottom: "2rem" }}>
          {STAT_CARDS.map(({ label, value, color }) => (
            <div
              key={label}
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, padding: "1rem", display: "flex", flexDirection: "column", gap: 4 }}
            >
              <span style={{ fontSize: "1.75rem", fontWeight: 900, color, lineHeight: 1 }}>{value}</span>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600 }}>{label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Quick links */}
      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 800, color: "#fff", marginBottom: "0.75rem" }}>Quick Actions</h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem" }}>
          {[
            { label: "📋 My List",            href: "/my-list" },
            { label: "⭐ Rate an episode",    href: "/rate" },
            { label: "🤖 Get recommendations", href: "/for-you" },
            { label: "🔍 Search",             href: "/search" },
            { label: "🎬 Browse movies",       href: "/browse?type=movie" },
            { label: "📺 Browse series",       href: "/browse?type=tv" },
          ].map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              style={{ padding: "0.5rem 1rem", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: "0.8rem", fontWeight: 600, color: "var(--text-muted)", transition: "all 0.2s", textDecoration: "none" }}
            >
              {label}
            </Link>
          ))}
        </div>
      </section>

      {/* Recent ratings */}
      {ratings.length > 0 && (
        <section>
          <h2 style={{ fontSize: "1rem", fontWeight: 800, color: "#fff", marginBottom: "0.75rem" }}>Recent Ratings</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {ratings.slice(-8).reverse().map((r: any, i: number) => (
              <div
                key={i}
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.65rem 0.75rem", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8 }}
              >
                <div>
                  <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#fff" }}>
                    S{r.season}E{r.episode}
                  </span>
                  {r.emotions && (
                    <span style={{ marginLeft: "0.5rem", fontSize: "0.7rem", color: "var(--text-muted)" }}>
                      {(() => { try { return JSON.parse(r.emotions).join(", "); } catch { return r.emotions; } })()}
                    </span>
                  )}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <div style={{ display: "flex", gap: 2 }}>
                    {[1,2,3,4,5].map((n) => (
                      <span key={n} style={{ width: 6, height: 6, borderRadius: "50%", background: n <= (r.engagement ?? 0) ? "var(--accent)" : "var(--border)" }} />
                    ))}
                  </div>
                  <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{r.engagement}/5</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
