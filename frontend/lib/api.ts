const API = "/api";

// ── Shared types ────────────────────────────────────────────────────
export interface MediaItem {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  release_date: string | null;
  type: "movie" | "tv";
}

export interface ShowDetail extends MediaItem {
  genres: { id: number; name: string }[];
  dates: { start: string | null; end: string | null };
  seasons: number | null;
  runtime: number | null;
  paths: { poster: string | null; backdrop: string | null };
  status: string | null;
}

export interface Episode {
  episode_number: number;
  name: string;
  overview: string;
  runtime: number | null;
  still_path: string | null;
}

export interface CastMember {
  person_id: number;
  name: string;
  character: string;
  profile_path: string | null;
}

export interface Show {
  id: number;
  tmdb_id: number;
  title: string;
  type: "movie" | "tv";
  poster_path: string | null;
  backdrop_path: string | null;
  status: "watching" | "completed" | "dropped" | "plan_to_watch";
  added_at: number;
}

export interface AddShowPayload {
  tmdb_id: number;
  title: string;
  type: "movie" | "tv";
  poster_path?: string | null;
  backdrop_path?: string | null;
  status: Show["status"];
}

// ── Fetch helper ────────────────────────────────────────────────────
async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API}${path}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`API ${res.status}: ${path}`);
  return res.json() as Promise<T>;
}

async function post<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`API ${res.status}: POST ${path}`);
  return res.json() as Promise<T>;
}

async function del<T>(path: string): Promise<T> {
  const res = await fetch(`${API}${path}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`API ${res.status}: DELETE ${path}`);
  return res.json() as Promise<T>;
}

// ── TMDB endpoints ──────────────────────────────────────────────────
export const tmdb = {
  trending:    (category: "movie" | "tv" | "all" = "all", window: "day" | "week" = "day") =>
    get<{ results: MediaItem[] }>(`/tmdb/trending?category=${category}&window=${window}`),

  search:      (q: string, type = "multi") =>
    get<{ results: MediaItem[] }>(`/tmdb/search?q=${encodeURIComponent(q)}&type=${type}`),

  detail:      (id: number, type: "movie" | "tv") =>
    get<ShowDetail>(`/tmdb/show-detail/${id}?type=${type}`),

  trailer:     (id: number, type: "movie" | "tv") =>
    get<{ key: string | null }>(`/tmdb/show-trailer/${id}?type=${type}`),

  logo:        (id: number, type: "movie" | "tv") =>
    get<{ logo_path: string | null }>(`/tmdb/show-logo/${id}?type=${type}`),

  credits:     (id: number, type: "movie" | "tv") =>
    get<{ cast: CastMember[] }>(`/tmdb/show-credits/${id}?type=${type}`),

  similar:     (id: number, type: "movie" | "tv") =>
    get<{ results: MediaItem[] }>(`/tmdb/show-similar/${id}?type=${type}`),

  episodes:    (id: number, season: number) =>
    get<{ episodes: Episode[] }>(`/tmdb/episodes/${id}/${season}`),

  browse:      (type: "movie" | "tv", params: Record<string, string> = {}) => {
    const qs = new URLSearchParams({ type, ...params }).toString();
    return get<{ results: MediaItem[]; total_pages: number }>(`/tmdb/browse?${qs}`);
  },

  genres:      (type: "movie" | "tv") =>
    get<{ genres: { id: number; name: string }[] }>(`/tmdb/genres?type=${type}`),
};

// ── Watchlist endpoints ─────────────────────────────────────────────
export const watchlist = {
  list:   ()              => get<{ shows: Show[] }>("/shows"),
  add:    (p: AddShowPayload) => post<Show>("/shows", p),
  remove: (id: number)    => del<{ message: string }>(`/shows/${id}`),
};

// ── Recommendations endpoints ───────────────────────────────────────
export const recommendations = {
  get:     ()  => get<{ recommendations: MediaItem[] }>("/recommendations"),
  refresh: ()  => post<{ message: string }>("/recommendations/refresh"),
  taste:   ()  => get<unknown>("/recommendations/taste-profile"),
};
