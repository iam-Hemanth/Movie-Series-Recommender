import { NextResponse } from "next/server";
import { tmdbFetch, STILL_BASE } from "@/lib/tmdb-server";

export const revalidate = 86400;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ tmdb_id: string; season: string }> },
) {
  try {
    const { tmdb_id, season } = await params;

    const data = await tmdbFetch(`/tv/${tmdb_id}/season/${season}`);

    const episodes = (data.episodes ?? []).map((ep: Record<string, unknown>) => ({
      episode_number: ep.episode_number,
      name:           ep.name,
      overview:       ep.overview,
      runtime:        ep.runtime ?? null,
      still_path:     ep.still_path ? `${STILL_BASE}${ep.still_path}` : null,
    }));

    return NextResponse.json({ episodes });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
