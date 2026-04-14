"use client";

import { useState } from "react";
import Link from "next/link";

const API = "/api";

interface RatingEntry {
  showId: string;
  showTitle: string;
  season: number;
  episode: number;
  engagement: number;
  emotions: string[];
  keptWatching: boolean;
  note: string;
  isDropout: boolean;
}

const EMOTIONS = ["Hooked", "Bored", "Surprised", "Emotional", "Tense", "Funny", "Confused", "Inspired"];

const engagementLabel: Record<number, string> = {
  1: "😴 Boring",
  2: "😕 Meh",
  3: "🙂 Decent",
  4: "😊 Good",
  5: "🤩 Amazing",
};

export default function RatePage() {
  const [step, setStep] = useState<"search" | "select" | "rate">("search");
  const [query, setQuery]           = useState("");
  const [results, setResults]       = useState<any[]>([]);
  const [searching, setSearching]   = useState(false);
  const [selected, setSelected]     = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess]       = useState(false);

  const [form, setForm] = useState<RatingEntry>({
    showId: "", showTitle: "", season: 1, episode: 1,
    engagement: 3, emotions: [], keptWatching: true, note: "", isDropout: false,
  });

  const doSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    try {
      const res  = await fetch(`${API}/tmdb/search?q=${encodeURIComponent(query)}&type=multi`);
      const data = await res.json();
      setResults(data.results ?? []);
      setStep("select");
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  const selectShow = (item: any) => {
    setSelected(item);
    setForm((f) => ({ ...f, showId: String(item.id), showTitle: item.title }));
    setStep("rate");
  };

  const toggleEmotion = (e: string) =>
    setForm((f) => ({
      ...f,
      emotions: f.emotions.includes(e) ? f.emotions.filter((x) => x !== e) : [...f.emotions, e],
    }));

  const submit = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      // 1. Upsert show into watchlist — backend handles duplicates gracefully
      const showRes = await fetch(`${API}/shows`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tmdb_id:      selected.id,
          title:        selected.title,
          type:         selected.type,
          poster_path:  selected.poster_path ?? null,
          backdrop_path: null,
          status:       "watching",
        }),
      });
      if (!showRes.ok) throw new Error("Could not add show to watchlist");
      const showData = await showRes.json();

      // 2. Post the rating with the real DB id
      const ratingRes = await fetch(`${API}/ratings`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          show_id:       showData.id,
          season:        form.season,
          episode:       form.episode,
          engagement:    form.engagement,
          emotions:      JSON.stringify(form.emotions),
          kept_watching: form.keptWatching,
          note:          form.note,
          is_dropout:    form.isDropout,
          logged_at:     Math.floor(Date.now() / 1000),
        }),
      });
      if (!ratingRes.ok) throw new Error("Could not save rating");
      setSuccess(true);
    } catch (err: any) {
      alert(err?.message ?? "Failed to save rating.");
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setStep("search"); setQuery(""); setResults([]); setSelected(null);
    setSuccess(false);
    setForm({ showId: "", showTitle: "", season: 1, episode: 1, engagement: 3, emotions: [], keptWatching: true, note: "", isDropout: false });
  };

  /* ── Success screen ─────────────────────────────────────── */
  if (success) return (
    <div style={{ maxWidth: 480, margin: "4rem auto", textAlign: "center", padding: "1.5rem" }}>
      <p style={{ fontSize: "3rem", marginBottom: "1rem" }}>✅</p>
      <h2 style={{ fontSize: "1.25rem", fontWeight: 900, color: "#fff", marginBottom: "0.5rem" }}>Rating saved!</h2>
      <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem", fontSize: "0.875rem" }}>
        {form.showTitle} S{form.season}E{form.episode} — {engagementLabel[form.engagement]}
      </p>
      <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
        <button onClick={reset} style={{ padding: "0.55rem 1.25rem", background: "var(--accent)", color: "#fff", fontWeight: 700, fontSize: "0.875rem", borderRadius: 7, border: "none", cursor: "pointer" }}>Rate Another</button>
        <Link href="/for-you" style={{ padding: "0.55rem 1.25rem", background: "var(--bg-card)", color: "var(--text-muted)", fontWeight: 700, fontSize: "0.875rem", borderRadius: 7, border: "1px solid var(--border)" }}>See Recommendations →</Link>
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: "1.5rem 1.5rem 4rem" }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 900, color: "#fff", marginBottom: "0.5rem" }}>Rate an Episode</h1>
      <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginBottom: "1.5rem" }}>
        Log how you felt — this trains your personal recommendations.
      </p>

      {/* Step 1: Search */}
      {step === "search" && (
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && doSearch()}
            placeholder="Search for a movie or series…"
            autoFocus
            style={{ flex: 1, padding: "0.7rem 1rem", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-primary)", fontSize: "0.9rem", outline: "none" }}
          />
          <button onClick={doSearch} disabled={searching} style={{ padding: "0.7rem 1.25rem", background: "var(--accent)", color: "#fff", fontWeight: 700, borderRadius: 8, border: "none", cursor: "pointer" }}>
            {searching ? "…" : "Go"}
          </button>
        </div>
      )}

      {/* Step 2: Pick a show */}
      {step === "select" && (
        <>
          <button onClick={() => setStep("search")} style={{ marginBottom: "1rem", color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", fontSize: "0.8rem" }}>← Back</button>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {results.map((item) => (
              <button key={item.id} onClick={() => selectShow(item)} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.65rem 0.75rem", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, cursor: "pointer", textAlign: "left", transition: "background 0.2s" }}>
                <div style={{ width: 42, height: 62, borderRadius: 5, overflow: "hidden", background: "var(--bg-elevated, #242424)", flexShrink: 0 }}>
                  {item.poster_path && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.poster_path} alt={item.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  )}
                </div>
                <div>
                  <p style={{ fontWeight: 700, fontSize: "0.875rem", color: "#fff" }}>{item.title}</p>
                  <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase" }}>{item.type} · {item.release_date?.slice(0, 4) ?? ""}</p>
                </div>
              </button>
            ))}
          </div>
        </>
      )}

      {/* Step 3: Rate form */}
      {step === "rate" && selected && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem", background: "var(--bg-card)", borderRadius: 8, border: "1px solid var(--border)" }}>
            <div style={{ width: 42, height: 62, borderRadius: 5, overflow: "hidden", flexShrink: 0, background: "var(--bg-elevated, #242424)" }}>
              {selected.poster_path && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={selected.poster_path} alt={selected.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              )}
            </div>
            <div>
              <p style={{ fontWeight: 800, fontSize: "0.95rem", color: "#fff" }}>{selected.title}</p>
              <button onClick={reset} style={{ fontSize: "0.7rem", color: "var(--accent)", background: "none", border: "none", cursor: "pointer", padding: 0 }}>Change show</button>
            </div>
          </div>

          {/* Season / Episode */}
          <div style={{ display: "flex", gap: "0.75rem" }}>
            {["season", "episode"].map((field) => (
              <label key={field} style={{ flex: 1 }}>
                <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 4, textTransform: "capitalize" }}>{field}</span>
                <input
                  type="number"
                  min={1}
                  value={form[field as "season" | "episode"]}
                  onChange={(e) => setForm((f) => ({ ...f, [field]: Number(e.target.value) }))}
                  style={{ width: "100%", padding: "0.55rem 0.75rem", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 7, color: "#fff", fontSize: "0.875rem", outline: "none" }}
                />
              </label>
            ))}
          </div>

          {/* Engagement */}
          <div>
            <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.5rem" }}>Engagement</p>
            <div style={{ display: "flex", gap: "0.4rem" }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setForm((f) => ({ ...f, engagement: n }))}
                  style={{ flex: 1, padding: "0.55rem 0.35rem", borderRadius: 7, fontWeight: 700, fontSize: "0.7rem", border: "1px solid var(--border)", cursor: "pointer", background: form.engagement === n ? "var(--accent)" : "var(--bg-card)", color: form.engagement === n ? "#fff" : "var(--text-muted)", textAlign: "center" }}
                >
                  {engagementLabel[n].split(" ")[0]}<br />{n}
                </button>
              ))}
            </div>
          </div>

          {/* Emotions */}
          <div>
            <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.5rem" }}>How did it feel?</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
              {EMOTIONS.map((e) => (
                <button
                  key={e}
                  onClick={() => toggleEmotion(e)}
                  style={{ padding: "4px 12px", borderRadius: 9999, fontSize: "0.75rem", fontWeight: 600, border: "1px solid var(--border)", cursor: "pointer", background: form.emotions.includes(e) ? "rgba(229,9,20,0.2)" : "var(--bg-card)", color: form.emotions.includes(e) ? "var(--accent)" : "var(--text-muted)" }}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Kept watching / Dropout */}
          <div style={{ display: "flex", gap: "1rem" }}>
            {[
              { label: "Kept watching", key: "keptWatching" },
              { label: "Dropped here",  key: "isDropout" },
            ].map(({ label, key }) => (
              <label key={key} style={{ display: "flex", alignItems: "center", gap: "0.4rem", cursor: "pointer", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                <input
                  type="checkbox"
                  checked={form[key as "keptWatching" | "isDropout"]}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.checked }))}
                  style={{ accentColor: "var(--accent)", width: 15, height: 15 }}
                />
                {label}
              </label>
            ))}
          </div>

          {/* Notes */}
          <div>
            <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.4rem" }}>Notes (optional)</p>
            <textarea
              value={form.note}
              onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
              rows={3}
              placeholder="Any thoughts about this episode…"
              style={{ width: "100%", padding: "0.65rem 0.75rem", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 7, color: "var(--text-primary)", fontSize: "0.85rem", resize: "vertical", outline: "none" }}
            />
          </div>

          <button
            onClick={submit}
            disabled={submitting}
            style={{ padding: "0.7rem", background: "var(--accent)", color: "#fff", fontWeight: 800, fontSize: "1rem", borderRadius: 8, border: "none", cursor: submitting ? "not-allowed" : "pointer" }}
          >
            {submitting ? "Saving…" : "Save Rating"}
          </button>
        </div>
      )}
    </div>
  );
}
