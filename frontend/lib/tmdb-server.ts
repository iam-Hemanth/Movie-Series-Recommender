// Shared server-side TMDB fetch helper
// Used by all /api/tmdb/* route handlers

const TMDB_BASE   = "https://api.themoviedb.org/3";

export const POSTER_BASE   = "https://image.tmdb.org/t/p/w342";
export const BACKDROP_BASE = "https://image.tmdb.org/t/p/w1280";
export const STILL_BASE    = "https://image.tmdb.org/t/p/w300";
export const PROFILE_BASE  = "https://image.tmdb.org/t/p/w185";
export const LOGO_BASE     = "https://image.tmdb.org/t/p/w500";

function tmdbKey(): string {
  const key = process.env.TMDB_KEY;
  if (!key) throw new Error("TMDB_KEY env var is not set");
  return key;
}

/**
 * Fetch from TMDB. Plain fetch — no Next.js-specific options.
 * Route-level caching is controlled by `export const revalidate = N` in each route file.
 * @param endpoint  e.g. "/trending/all/day"
 * @param params    extra query params (without api_key)
 */
export async function tmdbFetch(
  endpoint: string,
  params: Record<string, string> = {},
) {
  const url = new URL(`${TMDB_BASE}${endpoint}`);
  url.searchParams.set("api_key", tmdbKey());
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`TMDB ${res.status} on ${endpoint}`);
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return res.json() as Promise<any>;
}

/** Normalise a TMDB raw item into the shared MediaItem shape */
export function formatMedia(
  item: Record<string, unknown>,
  mediaType: string,
): Record<string, unknown> {
  const poster   = item.poster_path   ? `${POSTER_BASE}${item.poster_path}`   : null;
  const backdrop = item.backdrop_path ? `${BACKDROP_BASE}${item.backdrop_path}` : null;
  return {
    id:           item.id,
    title:        (item.title ?? item.name) as string,
    overview:     item.overview,
    poster_path:  poster,
    backdrop_path: backdrop,
    vote_average: item.vote_average,
    release_date: (item.release_date ?? item.first_air_date) as string | null,
    type:         mediaType,
  };
}
