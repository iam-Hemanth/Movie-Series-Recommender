import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import HeroSection from "./HeroSection";
import EpisodesSection from "./EpisodesSection";
import {
  tmdbFetch,
  POSTER_BASE,
  BACKDROP_BASE,
  LOGO_BASE,
  PROFILE_BASE,
  STILL_BASE,
  formatMedia,
} from "@/lib/tmdb-server";

export const revalidate = 3600;

// ── Helpers: mirrors what each route handler returns ─────────────────────────
async function fetchDetail(id: number, type: string) {
  try {
    const d = await tmdbFetch(`/${type}/${id}`);
    return {
      id: d.id,
      title: d.title ?? d.name,
      overview: d.overview ?? "",
      vote_average: d.vote_average ?? 0,
      genres: d.genres ?? [],
      dates: {
        start: d.release_date ?? d.first_air_date ?? null,
        end: d.last_air_date ?? null,
      },
      seasons: d.number_of_seasons ?? null,
      runtime: d.runtime ?? (d.episode_run_time?.[0] ?? null),
      paths: {
        poster:   d.poster_path   ? `${POSTER_BASE}${d.poster_path}`     : null,
        backdrop: d.backdrop_path ? `${BACKDROP_BASE}${d.backdrop_path}` : null,
      },
      status: d.status ?? null,
    };
  } catch { return null; }
}

async function fetchLogo(id: number, type: string) {
  try {
    const d = await tmdbFetch(`/${type}/${id}/images`, { include_image_language: "en,null" });
    const logo = (d.logos ?? []).find(
      (l: Record<string, unknown>) => typeof l.file_path === "string",
    );
    return { logo_path: logo ? `${LOGO_BASE}${logo.file_path}` : null };
  } catch { return { logo_path: null }; }
}

async function fetchTrailer(id: number, type: string) {
  try {
    const d = await tmdbFetch(`/${type}/${id}/videos`);
    const t = (d.results ?? []).find(
      (v: Record<string, unknown>) => v.site === "YouTube" && v.type === "Trailer",
    );
    return { key: (t?.key as string) ?? null };
  } catch { return { key: null }; }
}

async function fetchCredits(id: number, type: string) {
  try {
    const d = await tmdbFetch(`/${type}/${id}/credits`);
    const cast = (d.cast ?? []).slice(0, 12).map((p: Record<string, unknown>) => ({
      person_id:   p.id,
      name:        p.name,
      character:   p.character,
      profile_path: p.profile_path ? `${PROFILE_BASE}${p.profile_path}` : null,
    }));
    return { cast };
  } catch { return { cast: [] }; }
}

async function fetchSimilar(id: number, type: string) {
  try {
    const d = await tmdbFetch(`/${type}/${id}/recommendations`);
    const results = (d.results ?? []).slice(0, 18).map(
      (item: Record<string, unknown>) => formatMedia(item, type),
    );
    return { results };
  } catch { return { results: [] }; }
}

async function fetchEpisodes(id: number, season: number) {
  try {
    const d = await tmdbFetch(`/tv/${id}/season/${season}`);
    const episodes = (d.episodes ?? []).map((ep: Record<string, unknown>) => ({
      episode_number: ep.episode_number,
      name:           ep.name,
      overview:       ep.overview ?? "",
      runtime:        ep.runtime ?? null,
      still_path:     ep.still_path ? `${STILL_BASE}${ep.still_path}` : null,
    }));
    return { episodes };
  } catch { return { episodes: [] }; }
}


// ── Types ─────────────────────────────────────────────────────────────────────
interface Genre      { id: number; name: string }
interface ShowDetail {
  id: number; title: string; overview: string; vote_average: number;
  genres: Genre[];
  dates: { start: string | null; end: string | null };
  seasons: number | null;
  runtime: number | null;
  paths: { poster: string | null; backdrop: string | null };
  status: string | null;
}
interface Episode    { episode_number: number; name: string; overview: string; runtime: number | null; still_path: string | null }
interface CastMember { person_id: number; name: string; character: string; profile_path: string | null }
interface MediaItem  { id: number; title: string; poster_path: string | null; vote_average: number; type: string }

function fmtRuntime(mins: number): string {
  const h = Math.floor(mins / 60), m = mins % 60;
  return h > 0 ? `${h}h ${m > 0 ? `${m}m` : ""}`.trim() : `${m}m`;
}

// ── Section heading ───────────────────────────────────────────────────────────
function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{
      fontSize: "1.1rem", fontWeight: 800, color: "#fff",
      marginBottom: "1rem", paddingLeft: "0.75rem",
      borderLeft: "3px solid #e50914",
    }}>
      {children}
    </h2>
  );
}

// ── Cast — horizontal scroll row ─────────────────────────────────────────────
function CastRow({ cast }: { cast: CastMember[] }) {
  if (!cast.length) return null;
  return (
    <section style={{ marginBottom: "2.5rem" }}>
      <SectionHeading>Actors</SectionHeading>
      <div style={{
        display:         "flex",
        gap:             "1rem",
        overflowX:       "auto",
        scrollbarWidth:  "none",
        paddingBottom:   "0.5rem",
      }}>
        {cast.slice(0, 20).map((p) => (
          <div key={p.person_id}
            style={{ display: "flex", alignItems: "center", gap: "0.75rem",
              flexShrink: 0, background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 10, padding: "0.6rem 1rem 0.6rem 0.6rem",
              minWidth: 200, maxWidth: 240 }}>
            {/* Avatar */}
            <div style={{ width: 48, height: 48, borderRadius: "50%", overflow: "hidden",
              background: "#242424", border: "1px solid rgba(255,255,255,0.1)", flexShrink: 0 }}>
              {p.profile_path ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.profile_path} alt={p.name} loading="lazy"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <div style={{ width: "100%", height: "100%", display: "flex",
                  alignItems: "center", justifyContent: "center",
                  fontSize: "1.25rem", fontWeight: 900, color: "rgba(255,255,255,0.2)" }}>
                  {p.name.charAt(0)}
                </div>
              )}
            </div>
            {/* Name + role */}
            <div style={{ minWidth: 0 }}>
              <p className="line-clamp-1" style={{ fontSize: "0.82rem", fontWeight: 700, color: "#fff" }}>
                {p.name}
              </p>
              <p className="line-clamp-1" style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.4)", marginTop: 2 }}>
                {p.character}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Similar — responsive grid (no fixed max) ──────────────────────────────────
function SimilarGrid({ items, type }: { items: MediaItem[]; type: string }) {
  if (!items.length) return null;
  return (
    <section id="similar" style={{ marginBottom: "3rem" }}>
      <SectionHeading>You May Like</SectionHeading>
      <div style={{
        display:               "grid",
        gridTemplateColumns:   "repeat(auto-fill, minmax(130px, 1fr))",
        gap:                   "0.9rem",
      }}>
        {items.map((item) => (
          <Link key={item.id} href={`/show/${item.id}?type=${item.type || type}`}
            style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ position: "relative", aspectRatio: "2/3", borderRadius: 8,
              overflow: "hidden", background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.07)" }}>
              {item.poster_path ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.poster_path} alt={item.title} loading="lazy"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <div style={{ width: "100%", height: "100%", display: "flex",
                  alignItems: "center", justifyContent: "center",
                  fontSize: "2rem", fontWeight: 900, color: "rgba(255,255,255,0.1)" }}>
                  {item.title.charAt(0)}
                </div>
              )}
              {item.vote_average != null && (
                <span style={{
                  position: "absolute", top: 5, right: 5,
                  background: "rgba(0,0,0,0.75)", borderRadius: 4,
                  padding: "2px 5px", fontSize: "0.6rem", fontWeight: 800, color: "#f5c518",
                }}>
                  ★ {item.vote_average.toFixed(1)}
                </span>
              )}
            </div>
            <p className="line-clamp-1"
              style={{ fontSize: "0.72rem", fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>
              {item.title}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default async function ShowDetailPage({
  params, searchParams,
}: {
  params:       Promise<{ tmdb_id: string }>;
  searchParams: Promise<{ type?: string }>;
}) {
  const { tmdb_id }     = await params;
  const { type: rawType } = await searchParams;
  const type = rawType === "tv" ? "tv" : "movie";
  const id   = parseInt(tmdb_id, 10);
  if (isNaN(id)) notFound();

  const [detail, logoRes, trailerRes, creditsRes, similarRes, episodesRes] =
    await Promise.all([
      fetchDetail(id, type),
      fetchLogo(id, type),
      fetchTrailer(id, type),
      fetchCredits(id, type),
      fetchSimilar(id, type),
      type === "tv" ? fetchEpisodes(id, 1) : Promise.resolve(null),
    ]);

  if (!detail) notFound();

  const logoPath   = logoRes?.logo_path  ?? null;
  const trailerKey = trailerRes?.key     ?? null;
  const cast       = creditsRes?.cast    ?? [];
  const similar    = similarRes?.results ?? [];
  const episodes   = (episodesRes as { episodes: Episode[] } | null)?.episodes ?? [];
  const totalSeas  = detail.seasons ?? 1;
  const year       = detail.dates.start?.slice(0, 4) ?? "";
  const runtimeStr = type === "movie" && detail.runtime ? fmtRuntime(detail.runtime) : null;

  return (
    /* Full-bleed page — no max-width wrapper */
    <div style={{ minHeight: "100vh" }}>

      {/* ── HERO (client, full-width) ───────────────────────────────────── */}
      <HeroSection
        tmdbId={id}
        type={type}
        title={detail.title}
        logoPath={logoPath}
        backdrop={detail.paths.backdrop}
        trailerKey={trailerKey}
        year={year}
        runtimeStr={runtimeStr}
        seasons={detail.seasons}
        voteAverage={detail.vote_average}
        genres={detail.genres}
        overview={detail.overview}
        posterPath={detail.paths.poster}
      />

      {/* ── BODY — natural full-width, generous padding ─────────────────── */}
      <div style={{ padding: "2.5rem 3rem 4rem" }}>

        {/* Episodes (TV only) */}
        {type === "tv" && (
          <div id="episodes" style={{ marginBottom: "2.5rem" }}>
            <EpisodesSection
              tmdbId={id}
              totalSeasons={totalSeas}
              initialEpisodes={episodes}
            />
          </div>
        )}

        {/* Cast */}
        <CastRow cast={cast} />

        {/* Similar */}
        <SimilarGrid items={similar} type={type} />
      </div>
    </div>
  );
}
