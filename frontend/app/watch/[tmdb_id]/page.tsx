"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";

const API = "/api";

// ── Sources — VidLink first: best postMessage support (timeupdate/play/pause) ──
const SOURCES = [
  {
    name: "VidLink",
    url: (id: string, s: string, e: string, t: string, start?: number) =>
      t === "tv"
        ? `https://vidlink.pro/tv/${id}/${s}/${e}?primaryColor=e50914&autoplay=true${start ? `&start=${start}` : ""}`
        : `https://vidlink.pro/movie/${id}?primaryColor=e50914&autoplay=true${start ? `&start=${start}` : ""}`,
  },
  {
    name: "VidKing",
    url: (id: string, s: string, e: string, t: string) =>
      t === "tv"
        ? `https://www.vidking.net/embed/tv/${id}/${s}/${e}`
        : `https://www.vidking.net/embed/movie/${id}`,
  },
  {
    name: "VidSrc",
    url: (id: string, s: string, e: string, t: string) =>
      t === "tv"
        ? `https://vidsrc.cc/v2/embed/tv/${id}/${s}/${e}`
        : `https://vidsrc.cc/v2/embed/movie/${id}`,
  },
];

// ── Types ─────────────────────────────────────────────────────────────────────
interface Episode {
  episode_number: number;
  name: string;
  overview: string;
  runtime: number | null;
  still_path: string | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtTime(s: number): string {
  if (!isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60), sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, "0")}`;
}
function fmtRuntime(m: number) {
  const h = Math.floor(m / 60), min = m % 60;
  return h > 0 ? `${h}h${min > 0 ? ` ${min}m` : ""}` : `${m}m`;
}

// ── WatchInner ────────────────────────────────────────────────────────────────
function WatchInner() {
  const router       = useRouter();
  const params       = useParams();
  const searchParams = useSearchParams();

  const tmdbId = String(params.tmdb_id ?? "");
  const type   = searchParams.get("type") === "tv" ? "tv" : "movie";
  const initS  = searchParams.get("s") ?? "1";
  const initE  = searchParams.get("e") ?? "1";

  // ── Core state ──────────────────────────────────────────────────────────────
  const [serverIdx,    setServerIdx]    = useState(0);
  const [season,       setSeason]       = useState(Number(initS));
  const [episode,      setEpisode]      = useState(Number(initE));

  // Playback state
  const [isPaused,     setIsPaused]     = useState(true);
  const [ctrlVisible,  setCtrlVisible]  = useState(true);
  const [currentTime,  setCurrentTime]  = useState(0);   // seconds
  const [duration,     setDuration]     = useState(0);   // seconds
  const [seekStart,    setSeekStart]    = useState<number | undefined>(undefined);

  // UI panels
  const [panelOpen,    setPanelOpen]    = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [ccOpen,       setCcOpen]       = useState(false);
  const [autoNext,     setAutoNext]     = useState(false);
  const [countdown,    setCountdown]    = useState(-1);
  const [speed,        setSpeed]        = useState(1);

  // Episode list
  const [panelSeason,  setPanelSeason]  = useState(Number(initS));
  const [epSearch,     setEpSearch]     = useState("");
  const [episodes,     setEpisodes]     = useState<Episode[]>([]);
  const [totalSeasons, setTotalSeasons] = useState(1);

  // Show meta
  const [showTitle,    setShowTitle]    = useState("");
  const [logoPath,     setLogoPath]     = useState<string | null>(null);
  const [epMeta,       setEpMeta]       = useState<{ name: string; overview: string; runtime: number | null } | null>(null);

  // Refs
  const iframeRef     = useRef<HTMLIFrameElement>(null);
  const ctrlTimer     = useRef<ReturnType<typeof setTimeout> | null>(null);
  const titleTimer    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const playTimer     = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentEpRef  = useRef<HTMLDivElement>(null);
  const progressRef   = useRef<HTMLDivElement>(null);

  // ── Show meta ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!tmdbId) return;
    fetch(`${API}/tmdb/show-detail/${tmdbId}?type=${type}`)
      .then((r) => r.json())
      .then((d) => { setShowTitle(d.title ?? ""); setTotalSeasons(d.seasons ?? 1); })
      .catch(() => {});
    fetch(`${API}/tmdb/show-logo/${tmdbId}?type=${type}`)
      .then((r) => r.json())
      .then((d) => setLogoPath(d.logo_path ?? null))
      .catch(() => {});
  }, [tmdbId, type]);

  // ── Load episodes ──────────────────────────────────────────────────────────
  const loadEpisodes = useCallback(async (s: number) => {
    if (type !== "tv") return;
    try {
      const d = await fetch(`${API}/tmdb/episodes/${tmdbId}/${s}`).then((r) => r.json());
      setEpisodes(d.episodes ?? []);
    } catch { setEpisodes([]); }
  }, [tmdbId, type]);

  useEffect(() => { loadEpisodes(panelSeason); }, [panelSeason, loadEpisodes]);

  // ── Sync episode meta + duration ───────────────────────────────────────────
  useEffect(() => {
    const ep = episodes.find((e) => e.episode_number === episode);
    setEpMeta(ep ? { name: ep.name, overview: ep.overview, runtime: ep.runtime ?? null } : null);
    if (ep?.runtime) setDuration(ep.runtime * 60);
  }, [episodes, episode]);

  // ── Auto-hide title card after 5s (VidKing may not fire play events) ───────
  useEffect(() => {
    setIsPaused(true);
    setCurrentTime(0);
    if (titleTimer.current) clearTimeout(titleTimer.current);
    titleTimer.current = setTimeout(() => setIsPaused(false), 5000);
    return () => { if (titleTimer.current) clearTimeout(titleTimer.current); };
  }, [tmdbId, season, episode, serverIdx]);

  // ── Fake elapsed timer (ticks while playing) ───────────────────────────────
  useEffect(() => {
    if (playTimer.current) clearInterval(playTimer.current);
    if (!isPaused) {
      playTimer.current = setInterval(() => setCurrentTime((t) => Math.min(t + 1, duration || Infinity)), 1000);
    }
    return () => { if (playTimer.current) clearInterval(playTimer.current); };
  }, [isPaused, duration]);

  // ── postMessage: comprehensive listener for VidLink / VidKing / VidSrc ──────
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      const d = e.data;
      if (!d) return;

      // ── VidLink format: { source:'vidlink', type:'play'|'pause'|'timeupdate'|'ended', ... }
      if (d?.source === "vidlink" || d?.source === "VidLink") {
        const t = d.type ?? d.event;
        if (t === "play" || t === "playing") { setIsPaused(false); if (titleTimer.current) clearTimeout(titleTimer.current); startHideCtrl(); }
        if (t === "pause" || t === "paused")  { setIsPaused(true);  setCtrlVisible(true); }
        if (t === "ended" || t === "end")     { handleEnded(); }
        if (t === "timeupdate") {
          const ct = d.currentTime ?? d.data?.currentTime ?? 0;
          const du = d.duration   ?? d.data?.duration   ?? 0;
          if (ct > 0)  setCurrentTime(Math.floor(ct));
          if (du > 0)  { setDuration(Math.floor(du)); setIsPaused(false); if (titleTimer.current) clearTimeout(titleTimer.current); }
        }
        return;
      }

      // ── Generic type field (VidLink also sends these without source field)
      if (typeof d === "object" && d?.type) {
        const t = d.type;
        if (t === "play" || t === "playing")  { setIsPaused(false); if (titleTimer.current) clearTimeout(titleTimer.current); startHideCtrl(); }
        if (t === "pause" || t === "paused")   { setIsPaused(true); setCtrlVisible(true); }
        if (t === "ended" || t === "end")      { handleEnded(); }
        if (t === "timeupdate" || t === "media:timeupdate") {
          const ct = d.currentTime ?? d.time ?? d.data?.currentTime ?? 0;
          const du = d.duration   ?? d.totalTime ?? d.data?.duration ?? 0;
          if (ct > 0) { setCurrentTime(Math.floor(ct)); setIsPaused(false); if (titleTimer.current) clearTimeout(titleTimer.current); }
          if (du > 0) setDuration(Math.floor(du));
        }
        // VidKing PLAYER_EVENT
        if (t === "PLAYER_EVENT") {
          const ev2 = d.event;
          if (ev2 === "play" || ev2 === "playing")  { setIsPaused(false); startHideCtrl(); }
          if (ev2 === "pause" || ev2 === "paused")   { setIsPaused(true); setCtrlVisible(true); }
          if (ev2 === "ended" || ev2 === "end")      { handleEnded(); }
        }
      }

      // ── Generic event field
      if (typeof d === "object" && d?.event && !d?.type) {
        const ev = d.event;
        if (ev === "play" || ev === "playing")  { setIsPaused(false); startHideCtrl(); }
        if (ev === "pause" || ev === "paused")   { setIsPaused(true); setCtrlVisible(true); }
        if (ev === "ended" || ev === "end")      { handleEnded(); }
        if (ev === "timeupdate") {
          const ct = d.currentTime ?? d.time ?? 0;
          const du = d.duration   ?? 0;
          if (ct > 0) setCurrentTime(Math.floor(ct));
          if (du > 0) setDuration(Math.floor(du));
        }
      }

      // ── Plain string events
      if (d === "play" || d === "playing") { setIsPaused(false); startHideCtrl(); }
      if (d === "pause" || d === "paused")  { setIsPaused(true); setCtrlVisible(true); }
      if (d === "ended")                    { handleEnded(); }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoNext, type, episodes, episode]);

  function handleEnded() {
    if (type === "tv") {
      const idx = episodes.findIndex((ep) => ep.episode_number === episode);
      if (idx >= 0 && idx + 1 < episodes.length && autoNext) setCountdown(10);
    }
  }

  // ── Controls auto-hide when playing ───────────────────────────────────────
  function startHideCtrl() {
    if (ctrlTimer.current) clearTimeout(ctrlTimer.current);
    ctrlTimer.current = setTimeout(() => setCtrlVisible(false), 3500);
  }

  const onMouseMove = useCallback(() => {
    setCtrlVisible(true);
    if (!isPaused) startHideCtrl();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPaused]);

  // ── Countdown ──────────────────────────────────────────────────────────────
  const cancelCountdown = useCallback(() => {
    setCountdown(-1);
    if (countdownRef.current) clearInterval(countdownRef.current);
  }, []);

  useEffect(() => {
    if (countdown < 0) return;
    if (countdown === 0) { goNextEpisode(); setCountdown(-1); return; }
    countdownRef.current = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => { if (countdownRef.current) clearInterval(countdownRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countdown]);

  // ── Navigation ─────────────────────────────────────────────────────────────
  const goEpisode = useCallback((s: number, ep: number) => {
    setSeason(s); setEpisode(ep); setServerIdx(0); setSeekStart(undefined);
    cancelCountdown(); setCurrentTime(0);
  }, [cancelCountdown]);

  const goNextEpisode = useCallback(() => {
    const idx = episodes.findIndex((e) => e.episode_number === episode);
    if (idx >= 0 && idx + 1 < episodes.length) goEpisode(season, episodes[idx + 1].episode_number);
  }, [episodes, episode, season, goEpisode]);

  // ── Seek ───────────────────────────────────────────────────────────────────
  const seek = useCallback((targetSec: number) => {
    const t = Math.max(0, Math.min(Math.floor(targetSec), duration));
    setCurrentTime(t);
    const win = iframeRef.current?.contentWindow;
    win?.postMessage({ event: "seek", time: t, seconds: t, offset: t }, "*");
    win?.postMessage({ type: "seek", time: t, seconds: t }, "*");
    // VidLink: reload with start time
    if (serverIdx === 2) setSeekStart(t);
  }, [duration, serverIdx]);

  const onProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const frac = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    seek(frac * (duration || 1));
  }, [seek, duration]);

  // ── Speed ──────────────────────────────────────────────────────────────────
  const applySpeed = (s: number) => {
    setSpeed(s);
    const win = iframeRef.current?.contentWindow;
    win?.postMessage({ event: "speed", value: s, playbackRate: s }, "*");
    win?.postMessage({ type: "playbackRate", rate: s }, "*");
    setSettingsOpen(false);
  };

  // ── Panel scroll ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (panelOpen) setTimeout(() => currentEpRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 100);
  }, [panelOpen]);

  // ── Keyboard ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;
      if (e.code === "Space") { e.preventDefault(); iframeRef.current?.focus(); }
      if (e.code === "Escape") { setPanelOpen(false); setSettingsOpen(false); setCcOpen(false); }
      if (e.code === "ArrowRight") seek(currentTime + 10);
      if (e.code === "ArrowLeft")  seek(currentTime - 10);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [seek, currentTime]);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen();
  };

  // ── Derived ────────────────────────────────────────────────────────────────
  const filteredEps = episodes.filter((ep) =>
    !epSearch || ep.name.toLowerCase().includes(epSearch.toLowerCase()) || String(ep.episode_number).includes(epSearch)
  );
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const showUI   = ctrlVisible || isPaused;

  const src = SOURCES[serverIdx].url(tmdbId, String(season), String(episode), type, seekStart);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div
      onMouseMove={onMouseMove}
      onClick={() => {
        // Close panels on player-area click
        if (settingsOpen) setSettingsOpen(false);
        if (ccOpen)       setCcOpen(false);
      }}
      style={{ position: "fixed", inset: 0, background: "#000", overflow: "hidden", cursor: showUI ? "default" : "none" }}
    >
      {/* ── IFRAME — extra height clips VidKing's own control bar ─────── */}
      <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
        <iframe
          ref={iframeRef}
          key={`${tmdbId}-${season}-${episode}-${serverIdx}-${seekStart ?? 0}`}
          src={src}
          tabIndex={0}
          allow="autoplay; fullscreen; encrypted-media; picture-in-picture; clipboard-write; web-share"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
          style={{ width: "100%", height: "calc(100% + 60px)", border: "none", display: "block", background: "#000" }}
          title={showTitle}
        />
      </div>

      {/* ── SOLID BLACK FOOTER — completely kills VidKing bleed-through ── */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 74, background: "#000", zIndex: 18 }} />

      {/* ── GRADIENT scrim (readability above control bar) ───────────── */}
      <div style={{
        position: "absolute", bottom: 74, left: 0, right: 0, height: 220, zIndex: 4,
        background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)",
        pointerEvents: "none",
        opacity: showUI ? 1 : 0, transition: "opacity 0.5s",
      }} />

      {/* ── DIM overlay when episodes panel open ─────────────────────── */}
      {panelOpen && (
        <div style={{ position: "absolute", inset: 0, zIndex: 5, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(2px)", pointerEvents: "none" }} />
      )}

      {/* ── BACK ARROW ───────────────────────────────────────────────── */}
      <button onClick={() => router.back()} aria-label="Go back"
        style={{
          position: "absolute", top: 16, left: 18, zIndex: 30,
          width: 40, height: 40, borderRadius: "50%",
          background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)",
          border: "1px solid rgba(255,255,255,0.18)", color: "#fff", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          opacity: showUI ? 1 : 0, transition: "opacity 0.4s",
        }}>
        <svg width={20} height={20} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
        </svg>
      </button>

      {/* ── SOURCE PILLS top-right ───────────────────────────────────── */}
      <div style={{ position: "absolute", top: 14, right: 14, zIndex: 30, display: "flex", gap: "0.35rem", opacity: showUI ? 1 : 0, transition: "opacity 0.4s" }}>
        {SOURCES.map((s, i) => (
          <button key={i} onClick={(e) => { e.stopPropagation(); setServerIdx(i); cancelCountdown(); setSeekStart(undefined); setCurrentTime(0); }}
            style={{
              padding: "5px 12px", borderRadius: 9999, fontSize: "0.7rem", fontWeight: 800,
              border: serverIdx === i ? "none" : "1px solid rgba(255,255,255,0.2)",
              background: serverIdx === i ? "#e50914" : "rgba(0,0,0,0.7)",
              backdropFilter: "blur(8px)", color: "#fff", cursor: "pointer",
            }}>
            {s.name}
          </button>
        ))}
      </div>

      {/* ── TITLE CARD — shows when isPaused, fades otherwise ────────── */}
      <div style={{
        position: "absolute", bottom: 90, left: 28, zIndex: 22,
        maxWidth: 600, pointerEvents: "none",
        opacity: isPaused ? 1 : 0,
        transform: isPaused ? "translateY(0)" : "translateY(10px)",
        transition: "opacity 0.7s ease, transform 0.7s ease",
      }}>
        {logoPath ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoPath} alt={showTitle} style={{ maxWidth: 260, maxHeight: 100, objectFit: "contain", marginBottom: "0.75rem", filter: "drop-shadow(0 2px 20px rgba(0,0,0,1))" }} />
        ) : showTitle ? (
          <p style={{ fontSize: "clamp(2.2rem,4.5vw,3.5rem)", fontWeight: 900, color: "#fff", lineHeight: 1.05, marginBottom: "0.65rem", textShadow: "0 2px 28px rgba(0,0,0,1)", letterSpacing: "-0.02em" }}>
            {showTitle}
          </p>
        ) : null}

        {type === "tv" && (
          <p style={{ fontSize: "1rem", color: "rgba(255,255,255,0.65)", marginBottom: "0.4rem", textShadow: "0 1px 10px rgba(0,0,0,1)" }}>
            Season {season} · Episode {episode}
            {epMeta?.runtime ? ` · ${fmtRuntime(epMeta.runtime)}` : ""}
          </p>
        )}
        {epMeta?.name && (
          <p style={{ fontSize: "1.2rem", fontWeight: 700, color: "#fff", marginBottom: "0.45rem", textShadow: "0 1px 10px rgba(0,0,0,1)" }}>
            {epMeta.name}
          </p>
        )}
        {epMeta?.overview && (
          <p className="line-clamp-3" style={{ fontSize: "0.88rem", color: "rgba(255,255,255,0.55)", lineHeight: 1.65, textShadow: "0 1px 8px rgba(0,0,0,1)", maxWidth: 520 }}>
            {epMeta.overview}
          </p>
        )}
      </div>

      {/* ── CONTROL BAR (sits ON TOP of the solid black footer) ──────── */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 25,
        opacity: showUI ? 1 : 0, transition: "opacity 0.4s",
        pointerEvents: showUI ? "auto" : "none",
      }}>
        {/* Progress bar */}
        <div ref={progressRef}
          onClick={(e) => { e.stopPropagation(); onProgressClick(e); }}
          style={{
            height: 18, display: "flex", alignItems: "center", cursor: "pointer",
            padding: "0 0", position: "relative",
          }}>
          {/* Track */}
          <div style={{ position: "absolute", left: 0, right: 0, height: 3, background: "rgba(255,255,255,0.2)" }}>
            {/* Filled */}
            <div style={{ height: "100%", width: `${progress}%`, background: "#e50914", position: "relative" }}>
              {/* Handle dot */}
              <div style={{
                position: "absolute", right: -6, top: "50%", transform: "translateY(-50%)",
                width: 13, height: 13, borderRadius: "50%", background: "#fff",
                boxShadow: "0 0 6px rgba(0,0,0,0.6)",
              }} />
            </div>
          </div>
        </div>

        {/* Buttons row */}
        <div style={{
          display: "flex", alignItems: "center", gap: "0.1rem",
          padding: "0.3rem 1.1rem 0.65rem",
          background: "transparent",   // black footer div below provides bg
        }}>
          {/* ── Left controls ──────────────────────────────────────── */}
          {/* Play / Pause */}
          <IBtn onClick={() => iframeRef.current?.focus()} label={isPaused ? "Play (Space)" : "Pause (Space)"}>
            {isPaused ? (
              <svg width={22} height={22} viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
            ) : (
              <svg width={22} height={22} viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
            )}
          </IBtn>

          {/* Skip back 10 */}
          <IBtn onClick={() => seek(currentTime - 10)} label="Back 10s">
            <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" d="M11 17a7 7 0 1 1 0-10" />
              <path strokeLinecap="round" strokeLinejoin="round" d="m6.5 6.5-3-3 3-3" />
              <text x="12" y="14" textAnchor="middle" fontSize="6" fontWeight="700" fill="currentColor" stroke="none">10</text>
            </svg>
          </IBtn>

          {/* Skip forward 10 */}
          <IBtn onClick={() => seek(currentTime + 10)} label="Forward 10s">
            <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" d="M13 17a7 7 0 1 0 0-10" />
              <path strokeLinecap="round" strokeLinejoin="round" d="m17.5 6.5 3-3-3-3" />
              <text x="12" y="14" textAnchor="middle" fontSize="6" fontWeight="700" fill="currentColor" stroke="none">10</text>
            </svg>
          </IBtn>

          {/* Volume */}
          <IBtn onClick={() => {}} label="Volume">
            <svg width={21} height={21} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9}>
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <path strokeLinecap="round" d="M15.54 8.46a5 5 0 010 7.07" />
            </svg>
          </IBtn>

          {/* ── Spacer ─────────────────────────────────────────────── */}
          <div style={{ flex: 1, minWidth: 0 }} />

          {/* Time display */}
          <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "rgba(255,255,255,0.75)", letterSpacing: "0.02em", whiteSpace: "nowrap", marginRight: "0.5rem" }}>
            {fmtTime(currentTime)} / {duration > 0 ? fmtTime(duration) : "--:--"}
          </span>

          {/* ── Right controls ──────────────────────────────────────── */}
          {type === "tv" && (
            <IBtn onClick={goNextEpisode} label="Next episode">
              <svg width={20} height={20} viewBox="0 0 24 24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zm7 0l8.5-6L13 6v12z" /></svg>
            </IBtn>
          )}

          {type === "tv" && (
            <IBtn onClick={(e) => { e.stopPropagation(); setPanelOpen((p) => !p); setEpSearch(""); }} label="Episodes" active={panelOpen}>
              <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <rect x={2} y={7} width={14} height={10} rx={1} />
                <path strokeLinecap="round" d="M16 9l4-2v10l-4-2" />
              </svg>
              <span style={{ fontSize: "0.78rem", fontWeight: 700 }}>Episodes</span>
            </IBtn>
          )}

          {/* Captions */}
          <div style={{ position: "relative" }}>
            <IBtn onClick={(e) => { e.stopPropagation(); setCcOpen((p) => !p); setSettingsOpen(false); }} label="Subtitles / CC" active={ccOpen}>
              <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <rect x={2} y={6} width={20} height={14} rx={2} />
                <path strokeLinecap="round" d="M7 12h5m-5 4h3M14 12h3m-3 4h3" />
              </svg>
            </IBtn>
            {ccOpen && (
              <div onClick={(e) => e.stopPropagation()} style={{
                position: "absolute", bottom: 44, right: 0, width: 220, zIndex: 50,
                background: "#111", border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 10, padding: "0.75rem",
              }}>
                <p style={{ fontSize: "0.7rem", fontWeight: 700, color: "#e50914", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Subtitles</p>
                <p style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.5)", lineHeight: 1.5 }}>
                  Subtitles are provided by the embedded player. Use the player&apos;s own CC button (⛶) if available.
                </p>
                <p style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.3)", marginTop: 8 }}>
                  VidLink often includes subtitles in its player UI.
                </p>
              </div>
            )}
          </div>

          {/* Settings */}
          <div style={{ position: "relative" }}>
            <IBtn onClick={(e) => { e.stopPropagation(); setSettingsOpen((p) => !p); setCcOpen(false); }} label="Settings" active={settingsOpen}>
              <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <circle cx={12} cy={12} r={3} />
                <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06A1.65 1.65 0 0015 19.4a1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.6 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.07a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
              </svg>
            </IBtn>
            {settingsOpen && (
              <div onClick={(e) => e.stopPropagation()} style={{
                position: "absolute", bottom: 44, right: 0, width: 210, zIndex: 50,
                background: "#111", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, padding: "0.75rem",
              }}>
                <p style={{ fontSize: "0.7rem", fontWeight: 700, color: "#e50914", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>Settings</p>

                {/* Speed */}
                <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "#fff", marginBottom: 6 }}>Playback Speed</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 12 }}>
                  {[0.5, 0.75, 1, 1.25, 1.5, 2].map((s) => (
                    <button key={s} onClick={() => applySpeed(s)}
                      style={{
                        padding: "3px 9px", borderRadius: 6, fontSize: "0.72rem", fontWeight: 700, cursor: "pointer",
                        background: speed === s ? "#e50914" : "rgba(255,255,255,0.08)",
                        border: speed === s ? "none" : "1px solid rgba(255,255,255,0.1)",
                        color: "#fff",
                      }}>
                      {s}×
                    </button>
                  ))}
                </div>

                {/* Source switcher */}
                <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "#fff", marginBottom: 6 }}>Source</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {SOURCES.map((s, i) => (
                    <button key={i} onClick={() => { setServerIdx(i); setSettingsOpen(false); cancelCountdown(); setCurrentTime(0); setSeekStart(undefined); }}
                      style={{
                        padding: "5px 10px", borderRadius: 6, fontSize: "0.75rem", fontWeight: 600, cursor: "pointer", textAlign: "left",
                        background: serverIdx === i ? "rgba(229,9,20,0.15)" : "rgba(255,255,255,0.04)",
                        border: serverIdx === i ? "1px solid rgba(229,9,20,0.4)" : "1px solid rgba(255,255,255,0.08)",
                        color: serverIdx === i ? "#fff" : "rgba(255,255,255,0.6)",
                      }}>
                      {s.name} {serverIdx === i ? "✓" : ""}
                    </button>
                  ))}
                </div>

                <p style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.25)", marginTop: 10 }}>
                  Quality is managed by the source player.
                </p>
              </div>
            )}
          </div>

          {/* Fullscreen */}
          <IBtn onClick={toggleFullscreen} label="Fullscreen">
            <svg width={19} height={19} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3" />
            </svg>
          </IBtn>
        </div>
      </div>

      {/* ── EPISODES FLOATING PANEL ──────────────────────────────────── */}
      {type === "tv" && panelOpen && (
        <div onClick={(e) => e.stopPropagation()} style={{
          position: "absolute", top: 14, right: 14, zIndex: 35,
          width: 365, maxHeight: "calc(100vh - 100px)",
          background: "rgba(8,8,8,0.96)", backdropFilter: "blur(24px)",
          border: "1px solid rgba(255,255,255,0.1)", borderRadius: 14,
          display: "flex", flexDirection: "column", overflow: "hidden",
        }}>
          {/* Header */}
          <div style={{ padding: "0.75rem", borderBottom: "1px solid rgba(255,255,255,0.08)", flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <div style={{ position: "relative", flex: 1 }}>
                <span style={{ position: "absolute", left: 7, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)", pointerEvents: "none" }}>
                  <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><circle cx={11} cy={11} r={8} /><path strokeLinecap="round" d="m21 21-4.35-4.35" /></svg>
                </span>
                <input type="text" placeholder="Search…" value={epSearch} onChange={(e) => setEpSearch(e.target.value)}
                  style={{ width: "100%", paddingLeft: 25, paddingRight: 8, paddingTop: 6, paddingBottom: 6, background: "#1c1c1c", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 7, color: "#fff", fontSize: "0.78rem", outline: "none", boxSizing: "border-box" }} />
              </div>
              <div style={{ position: "relative", flexShrink: 0 }}>
                <select value={panelSeason} onChange={(e) => { setPanelSeason(Number(e.target.value)); loadEpisodes(Number(e.target.value)); }}
                  style={{ appearance: "none", WebkitAppearance: "none", padding: "6px 20px 6px 8px", background: "#1c1c1c", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 7, color: "#fff", fontSize: "0.78rem", cursor: "pointer", outline: "none" }}>
                  {Array.from({ length: totalSeasons }, (_, i) => i + 1).map((s) => <option key={s} value={s}>S{s}</option>)}
                </select>
                <span style={{ position: "absolute", right: 5, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "rgba(255,255,255,0.35)" }}>
                  <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" /></svg>
                </span>
              </div>
              <span style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.4)", flexShrink: 0 }}>Auto</span>
              <div onClick={() => setAutoNext((p) => !p)} style={{ width: 32, height: 18, borderRadius: 9999, cursor: "pointer", flexShrink: 0, background: autoNext ? "#e50914" : "rgba(255,255,255,0.12)", position: "relative", transition: "background 0.2s" }}>
                <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#fff", position: "absolute", top: 2, left: autoNext ? 16 : 2, transition: "left 0.2s" }} />
              </div>
              <button onClick={() => setPanelOpen(false)} style={{ width: 26, height: 26, borderRadius: "50%", cursor: "pointer", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" d="M6 18 18 6M6 6l12 12" /></svg>
              </button>
            </div>
          </div>

          {/* Episodes */}
          <div style={{ overflowY: "auto", flex: 1, scrollbarWidth: "thin", scrollbarColor: "#e50914 transparent" }}>
            {filteredEps.map((ep) => {
              const isCurrent = ep.episode_number === episode && panelSeason === season;
              return (
                <div key={ep.episode_number} ref={isCurrent ? currentEpRef : undefined}
                  onClick={() => { goEpisode(panelSeason, ep.episode_number); setPanelOpen(false); }}
                  onMouseEnter={(e) => { if (!isCurrent) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = isCurrent ? "rgba(229,9,20,0.09)" : "transparent"; }}
                  style={{ display: "flex", gap: "0.65rem", alignItems: "flex-start", padding: "0.65rem 0.75rem", borderBottom: "1px solid rgba(255,255,255,0.04)", background: isCurrent ? "rgba(229,9,20,0.09)" : "transparent", borderLeft: `3px solid ${isCurrent ? "#e50914" : "transparent"}`, cursor: "pointer" }}>
                  <div style={{ flexShrink: 0, width: 106, height: 60, borderRadius: isCurrent ? 6 : 4, overflow: "hidden", background: "#1c1c1c", position: "relative", border: isCurrent ? "2px solid #e50914" : "none" }}>
                    {ep.still_path ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={ep.still_path} alt={ep.name} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.15)" }}>🎬</div>
                    )}
                    <span style={{ position: "absolute", bottom: 3, left: 4, background: "rgba(0,0,0,0.85)", borderRadius: 3, padding: "1px 4px", fontSize: "0.58rem", fontWeight: 800, color: "#fff" }}>E{ep.episode_number}</span>
                    {isCurrent && <span style={{ position: "absolute", top: 3, left: 4, background: "#e50914", borderRadius: 3, padding: "1px 5px", fontSize: "0.5rem", fontWeight: 800, color: "#fff", textTransform: "uppercase" }}>▶ WATCHING</span>}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 3 }}>
                      <span className="line-clamp-1" style={{ fontSize: "0.8rem", fontWeight: isCurrent ? 700 : 600, color: isCurrent ? "#fff" : "rgba(255,255,255,0.8)" }}>{ep.episode_number}. {ep.name}</span>
                      {ep.runtime && <span style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.35)", flexShrink: 0, marginLeft: 6 }}>{ep.runtime}m</span>}
                    </div>
                    <p className="line-clamp-2" style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.4)", lineHeight: 1.5 }}>{ep.overview || "No description."}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── AUTO-NEXT COUNTDOWN ──────────────────────────────────────── */}
      {countdown >= 0 && (() => {
        const ni  = episodes.findIndex((e) => e.episode_number === episode) + 1;
        const nep = episodes[ni];
        const pct = ((10 - countdown) / 10) * 100;
        return (
          <div style={{ position: "absolute", bottom: 90, right: 24, zIndex: 40, background: "rgba(10,10,10,0.94)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 14, padding: "1rem 1.2rem", width: 300 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.9rem", marginBottom: "0.75rem" }}>
              <svg width={48} height={48} style={{ flexShrink: 0, transform: "rotate(-90deg)" }}>
                <circle cx={24} cy={24} r={20} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={4} />
                <circle cx={24} cy={24} r={20} fill="none" stroke="#e50914" strokeWidth={4}
                  strokeDasharray={`${2 * Math.PI * 20}`} strokeDashoffset={`${2 * Math.PI * 20 * (1 - pct / 100)}`}
                  strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.9s linear" }} />
                <text x={24} y={24} textAnchor="middle" dominantBaseline="central" fill="#fff" fontSize={14} fontWeight={800}
                  style={{ transform: "rotate(90deg)", transformOrigin: "24px 24px" }}>{countdown}</text>
              </svg>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.4)", marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.07em" }}>Up next</p>
                <p className="line-clamp-1" style={{ fontSize: "0.88rem", fontWeight: 700, color: "#fff" }}>
                  {nep ? `E${nep.episode_number} — ${nep.name}` : "Next Episode"}
                </p>
              </div>
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button onClick={goNextEpisode} style={{ flex: 1, padding: "0.5rem", background: "#e50914", color: "#fff", fontWeight: 700, fontSize: "0.8rem", border: "none", borderRadius: 7, cursor: "pointer" }}>Skip Now ▶</button>
              <button onClick={cancelCountdown} style={{ padding: "0.5rem 0.9rem", background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.7)", fontWeight: 600, fontSize: "0.8rem", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 7, cursor: "pointer" }}>Cancel</button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// ── Icon button ───────────────────────────────────────────────────────────────
function IBtn({
  onClick, label, children, active,
}: { onClick: (e: React.MouseEvent) => void; label: string; children: React.ReactNode; active?: boolean }) {
  return (
    <button onClick={onClick} aria-label={label} title={label}
      style={{
        display: "flex", alignItems: "center", justifyContent: "center", gap: "0.3rem",
        background: active ? "rgba(229,9,20,0.2)" : "transparent",
        border: "none", borderRadius: 7, color: "#fff", cursor: "pointer",
        padding: "0.45rem 0.6rem", lineHeight: 1,
        opacity: 0.88, transition: "opacity 0.15s, background 0.15s",
        userSelect: "none", fontSize: "0.8rem", fontWeight: 600, whiteSpace: "nowrap" as const,
      }}
      onMouseEnter={(e) => { e.currentTarget.style.opacity = "1"; }}
      onMouseLeave={(e) => { e.currentTarget.style.opacity = "0.88"; }}
    >
      {children}
    </button>
  );
}

// ── Page wrapper ──────────────────────────────────────────────────────────────
export default function WatchPage() {
  return (
    <Suspense fallback={
      <div style={{ position: "fixed", inset: 0, background: "#000", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.875rem" }}>Loading player…</p>
      </div>
    }>
      <WatchInner />
    </Suspense>
  );
}
