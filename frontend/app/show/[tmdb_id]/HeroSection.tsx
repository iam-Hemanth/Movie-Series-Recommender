"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import BackButton from "@/components/BackButton";
import AddToListButton from "./AddToListButton";

interface Props {
  tmdbId:      number;
  type:        string;
  title:       string;
  logoPath:    string | null;
  backdrop:    string | null;
  trailerKey:  string | null;
  year:        string;
  runtimeStr:  string | null;   // pre-formatted e.g. "2h 3m"
  seasons:     number | null;
  voteAverage: number | null;
  genres:      { id: number; name: string }[];
  overview:    string;
  posterPath:  string | null;
}

export default function HeroSection({
  tmdbId, type, title, logoPath, backdrop, trailerKey,
  year, runtimeStr, seasons, voteAverage, genres, overview, posterPath,
}: Props) {
  const heroRef  = useRef<HTMLDivElement>(null);
  const [muted,  setMuted]  = useState(true);
  const [ytKey,  setYtKey]  = useState(0);       // forces iframe reload on un/mute

  // ── Scroll-linked fade (direct DOM write → zero re-renders) ───────────────
  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    const onScroll = () => {
      const heroH   = el.offsetHeight;
      const scrollY = window.scrollY;
      const start   = heroH * 0.15;
      const end     = heroH * 0.70;
      const opacity = scrollY < start
        ? 1
        : scrollY > end
          ? 0
          : 1 - (scrollY - start) / (end - start);
      el.style.opacity = String(Math.max(0, Math.min(1, opacity)));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const toggleMute = () => { setMuted((m) => !m); setYtKey((k) => k + 1); };

  const ytSrc = trailerKey
    ? `https://www.youtube.com/embed/${trailerKey}?autoplay=1&mute=${muted ? 1 : 0}&controls=0&loop=1&playlist=${trailerKey}&rel=0&iv_load_policy=3&modestbranding=1&playsinline=1&disablekb=1`
    : null;

  return (
    <div
      ref={heroRef}
      style={{
        position: "relative",
        width:    "100%",
        height:   "88vh",
        minHeight: 460,
        overflow:  "hidden",
        willChange: "opacity",
        // sticky so it visually stays while content scrolls underneath
      }}
    >
      {/* ── VIDEO / BACKDROP ─────────────────────────────────────────────── */}
      {ytSrc ? (
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0, background: "#000" }}>
          <iframe
            key={ytKey}
            src={ytSrc}
            allow="autoplay; fullscreen"
            style={{
              position:   "absolute",
              top:        "50%",
              left:       "50%",
              transform:  "translate(-50%, -50%)",
              // Cover trick: whichever dimension is larger, win
              width:      "177.78vh",   // 16/9 × 100vh
              height:     "56.25vw",    // 9/16 × 100vw
              minWidth:   "100%",
              minHeight:  "100%",
              border:     "none",
              pointerEvents: "none",
            }}
            title="Trailer"
          />
        </div>
      ) : backdrop ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={backdrop}
          alt={title}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%",
            objectFit: "cover", objectPosition: "center 25%", zIndex: 0 }}
        />
      ) : (
        <div style={{ position: "absolute", inset: 0, background: "#111", zIndex: 0 }} />
      )}

      {/* ── GRADIENT SCRIM ───────────────────────────────────────────────── */}
      <div style={{
        position:   "absolute",
        inset:      0,
        zIndex:     1,
        background: [
          "linear-gradient(to right, rgba(10,10,10,0.90) 28%, rgba(10,10,10,0.35) 65%, transparent 100%)",
          "linear-gradient(to top,   #0a0a0a 0%,  rgba(10,10,10,0.5) 35%, transparent 65%)",
        ].join(", "),
      }} />

      {/* ── BACK ─────────────────────────────────────────────────────────── */}
      <div style={{ position: "absolute", top: 16, left: 20, zIndex: 5 }}>
        <BackButton fallback="/discover" />
      </div>

      {/* ── MUTE TOGGLE ──────────────────────────────────────────────────── */}
      {trailerKey && (
        <button
          onClick={toggleMute}
          aria-label={muted ? "Unmute trailer" : "Mute trailer"}
          style={{
            position:       "absolute",
            top:            16,
            right:          20,
            zIndex:         5,
            width:          38,
            height:         38,
            borderRadius:   "50%",
            background:     "rgba(0,0,0,0.55)",
            backdropFilter: "blur(8px)",
            border:         "1px solid rgba(255,255,255,0.25)",
            color:          "#fff",
            cursor:         "pointer",
            display:        "flex",
            alignItems:     "center",
            justifyContent: "center",
          }}
        >
          {muted ? (
            /* muted icon */
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <line x1="23" y1="9" x2="17" y2="15" />
              <line x1="17" y1="9" x2="23" y2="15" />
            </svg>
          ) : (
            /* volume icon */
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07" />
            </svg>
          )}
        </button>
      )}

      {/* ── CONTENT ──────────────────────────────────────────────────────── */}
      <div style={{
        position: "absolute",
        bottom:   0,
        left:     0,
        right:    0,
        zIndex:   2,
        padding:  "0 3rem 3rem",
      }}>
        {/* Logo or H1 */}
        {logoPath ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoPath} alt={title}
            style={{ maxWidth: 340, maxHeight: 120, objectFit: "contain",
              marginBottom: "1rem", filter: "drop-shadow(0 2px 12px rgba(0,0,0,0.9))" }} />
        ) : (
          <h1 style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 900, color: "#fff",
            lineHeight: 1.1, letterSpacing: "-0.02em", maxWidth: 700,
            marginBottom: "0.9rem", textShadow: "0 2px 24px rgba(0,0,0,0.9)" }}>
            {title}
          </h1>
        )}

        {/* Meta */}
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center",
          gap: "0.4rem 0.6rem", marginBottom: "0.8rem" }}>
          {voteAverage != null && (
            <span style={{ fontSize: 13, fontWeight: 700, color: "#f5c518" }}>
              ★ {voteAverage.toFixed(1)}
            </span>
          )}
          {year && <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>{year}</span>}
          {runtimeStr && <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>{runtimeStr}</span>}
          {!runtimeStr && seasons != null && (
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>
              {seasons} season{seasons > 1 ? "s" : ""}
            </span>
          )}
          {genres.slice(0, 3).map((g) => (
            <span key={g.id} style={{
              fontSize: "0.68rem", fontWeight: 600, padding: "2px 9px",
              borderRadius: 9999, background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.65)",
            }}>
              {g.name}
            </span>
          ))}
        </div>

        {/* Overview */}
        <p className="line-clamp-3" style={{
          fontSize: "0.9rem", color: "rgba(255,255,255,0.68)", lineHeight: 1.7,
          maxWidth: 580, marginBottom: "1.35rem",
        }}>
          {overview}
        </p>

        {/* Action buttons */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem", alignItems: "center" }}>
          {/* White Play — matches reference screenshot */}
          <Link href={`/watch/${tmdbId}?type=${type}&s=1&e=1`}
            style={{
              display: "inline-flex", alignItems: "center", gap: "0.45rem",
              padding: "0.6rem 1.6rem", borderRadius: 7, fontWeight: 800,
              fontSize: "0.9rem", background: "#fff", color: "#000",
              letterSpacing: "0.01em",
            }}>
            ▶ Play
          </Link>

          <AddToListButton tmdbId={tmdbId} title={title} type={type} posterPath={posterPath} />

          {type === "tv" && (
            <a href="#episodes"
              style={{
                display: "inline-flex", alignItems: "center", gap: "0.4rem",
                padding: "0.6rem 1.25rem", borderRadius: 7, fontWeight: 700,
                fontSize: "0.875rem", background: "rgba(255,255,255,0.1)",
                color: "#fff", border: "1px solid rgba(255,255,255,0.15)",
                textDecoration: "none",
              }}>
              ☰ Episodes
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
