import { NextResponse } from "next/server";
import { tmdbFetch, POSTER_BASE, BACKDROP_BASE } from "@/lib/tmdb-server";

export const revalidate = 86400;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ tmdb_id: string }> },
) {
  try {
    const { tmdb_id } = await params;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") ?? "movie";

    const data = await tmdbFetch(`/${type}/${tmdb_id}`);

    const poster   = data.poster_path   ? `${POSTER_BASE}${data.poster_path}`     : null;
    const backdrop = data.backdrop_path ? `${BACKDROP_BASE}${data.backdrop_path}` : null;

    return NextResponse.json({
      id:           data.id,
      title:        data.title ?? data.name,
      overview:     data.overview,
      genres:       data.genres ?? [],
      vote_average: data.vote_average,
      dates: {
        start: data.release_date ?? data.first_air_date ?? null,
        end:   data.last_air_date ?? null,
      },
      seasons: data.number_of_seasons ?? null,
      runtime: data.runtime ?? (data.episode_run_time?.[0] ?? null),
      paths:   { poster, backdrop },
      status:  data.status ?? null,
      type,
      poster_path:   poster,
      backdrop_path: backdrop,
      release_date:  data.release_date ?? data.first_air_date ?? null,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
