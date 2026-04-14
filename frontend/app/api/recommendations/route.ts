import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { tmdbFetch, POSTER_BASE } from "@/lib/tmdb-server";

// ── GET /api/recommendations ──────────────────────────────────────────────────
export async function GET() {
  try {
    const { data: shows, error } = await supabase
      .from("shows")
      .select("tmdb_id, type, title");

    if (error) throw new Error(error.message);

    if (!shows || shows.length === 0) {
      return NextResponse.json({
        recommendations: [],
        message: "Add shows to your watchlist to get recommendations.",
      });
    }

    const seenIds = new Set(shows.map((s) => s.tmdb_id));
    const candidates: Array<Record<string, unknown>> = [];

    // Seed from up to 5 shows to avoid hammering TMDB
    const seeds = shows.slice(0, 5);
    await Promise.all(
      seeds.map(async (show) => {
        try {
          const data = await tmdbFetch(
            `/${show.type}/${show.tmdb_id}/recommendations`,
          );
          for (const item of (data.results ?? []).slice(0, 8)) {
            const poster = item.poster_path ? `${POSTER_BASE}${item.poster_path}` : null;
            candidates.push({
              id:           item.id,
              title:        item.title ?? item.name,
              overview:     item.overview,
              poster_path:  poster,
              backdrop_path: null,
              vote_average: item.vote_average,
              release_date: item.release_date ?? item.first_air_date ?? null,
              type:         show.type,
            });
          }
        } catch {
          // skip failed individual seed
        }
      }),
    );

    // De-duplicate and exclude already-watchlisted titles
    const seen = new Set(seenIds);
    const unique: Array<Record<string, unknown>> = [];
    for (const item of candidates) {
      if (item.id && !seen.has(item.id as number)) {
        seen.add(item.id as number);
        unique.push(item);
      }
    }

    // Sort by vote_average desc, cap at 20
    unique.sort((a, b) => ((b.vote_average as number) ?? 0) - ((a.vote_average as number) ?? 0));

    return NextResponse.json({ recommendations: unique.slice(0, 20) });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
