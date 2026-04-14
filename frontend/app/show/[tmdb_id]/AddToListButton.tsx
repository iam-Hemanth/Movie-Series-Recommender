"use client";

import { useState } from "react";

const API = "/api";

type Status = "watching" | "completed" | "plan_to_watch" | "dropped";

const STATUS_OPTIONS: { value: Status; label: string; emoji: string }[] = [
  { value: "watching",      label: "Watching",     emoji: "▶" },
  { value: "plan_to_watch", label: "Plan to Watch", emoji: "🔖" },
  { value: "completed",     label: "Completed",    emoji: "✓" },
  { value: "dropped",       label: "Dropped",      emoji: "✕" },
];

interface Props {
  tmdbId: number;
  title: string;
  type: string;
  posterPath: string | null;
}

export default function AddToListButton({ tmdbId, title, type, posterPath }: Props) {
  const [open,    setOpen]    = useState(false);
  const [saved,   setSaved]   = useState<Status | null>(null);
  const [loading, setLoading] = useState(false);

  const add = async (status: Status) => {
    setLoading(true);
    setOpen(false);
    try {
      await fetch(`${API}/shows`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tmdb_id:     tmdbId,
          title,
          type,
          poster_path: posterPath,
          status,
        }),
      });
      setSaved(status);
    } catch {
      alert("Could not add to list.");
    } finally {
      setLoading(false);
    }
  };

  const current = STATUS_OPTIONS.find((o) => o.value === saved);

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((p) => !p)}
        disabled={loading}
        style={{
          display:      "inline-flex",
          alignItems:   "center",
          gap:          "0.35rem",
          padding:      "0.55rem 1.25rem",
          borderRadius: 7,
          fontWeight:   700,
          fontSize:     "0.875rem",
          background:   saved ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.1)",
          color:        saved ? "#22c55e" : "#fff",
          border:       saved ? "1px solid rgba(34,197,94,0.4)" : "1px solid rgba(255,255,255,0.15)",
          cursor:       loading ? "not-allowed" : "pointer",
          transition:   "all 0.2s",
          whiteSpace:   "nowrap",
        }}
      >
        {loading ? "…" : saved ? `${current?.emoji} ${current?.label}` : "＋ Add to List"}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          style={{
            position:   "absolute",
            top:        "calc(100% + 8px)",
            left:       0,
            zIndex:     50,
            background: "#1a1a1a",
            border:     "1px solid rgba(255,255,255,0.12)",
            borderRadius: 10,
            padding:    "0.35rem 0",
            minWidth:   170,
            boxShadow:  "0 8px 32px rgba(0,0,0,0.7)",
          }}
        >
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => add(opt.value)}
              style={{
                display:    "flex",
                width:      "100%",
                alignItems: "center",
                gap:        "0.5rem",
                padding:    "0.55rem 0.9rem",
                background: saved === opt.value ? "rgba(229,9,20,0.12)" : "none",
                border:     "none",
                color:      saved === opt.value ? "#e50914" : "rgba(255,255,255,0.8)",
                fontSize:   "0.82rem",
                fontWeight: saved === opt.value ? 700 : 500,
                cursor:     "pointer",
                textAlign:  "left",
              }}
            >
              <span>{opt.emoji}</span> {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
