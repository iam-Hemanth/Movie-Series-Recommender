import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// ── Helper: fetch shows with aggregated episode stats ─────────────────────────
async function fetchShows(filter?: { column: string; value: unknown }) {
  let query = supabase
    .from("shows")
    .select("*, episode_ratings(id, engagement, season, episode, logged_at)")
    .order("added_at", { ascending: false });

  if (filter) {
    query = query.eq(filter.column, filter.value);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  // Compute aggregated fields in JS (Supabase JS client doesn't support inline aggregates)
  return (data ?? []).map((show) => {
    const ratings: Array<{ id: number; engagement: number; season: number; episode: number; logged_at: number }> =
      show.episode_ratings ?? [];
    const sorted = [...ratings].sort((a, b) => b.logged_at - a.logged_at);

    return {
      ...show,
      episode_ratings:  undefined, // strip raw relation
      episodes_watched: ratings.length || null,
      avg_rating:       ratings.length
        ? Math.round((ratings.reduce((s, r) => s + r.engagement, 0) / ratings.length) * 10) / 10
        : null,
      last_season:  sorted[0]?.season  ?? null,
      last_episode: sorted[0]?.episode ?? null,
    };
  });
}

// ── GET /api/shows ────────────────────────────────────────────────────────────
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const filter = status ? { column: "status", value: status } : undefined;
    const shows  = await fetchShows(filter);
    return NextResponse.json({ shows });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// ── POST /api/shows ───────────────────────────────────────────────────────────
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tmdb_id, title, type, poster_path, backdrop_path, status } = body;
    const added_at = Math.floor(Date.now() / 1000);

    // Upsert: if same tmdb_id + type already exists, update status/paths
    const { data: existing } = await supabase
      .from("shows")
      .select("id")
      .eq("tmdb_id", tmdb_id)
      .eq("type", type)
      .maybeSingle();

    let showId: number;

    if (existing) {
      const { error } = await supabase
        .from("shows")
        .update({ status, poster_path: poster_path ?? null, backdrop_path: backdrop_path ?? null })
        .eq("id", existing.id);
      if (error) throw new Error(error.message);
      showId = existing.id;
    } else {
      const { data: inserted, error } = await supabase
        .from("shows")
        .insert({ tmdb_id, title, type, poster_path: poster_path ?? null, backdrop_path: backdrop_path ?? null, status, added_at })
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      showId = inserted.id;
    }

    const shows = await fetchShows({ column: "id", value: showId });
    return NextResponse.json(shows[0], { status: existing ? 200 : 201 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
