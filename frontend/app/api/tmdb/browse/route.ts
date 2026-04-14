import { NextResponse } from "next/server";
import { tmdbFetch, formatMedia } from "@/lib/tmdb-server";

export const revalidate = 3600;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") ?? "movie";

    // Forward all remaining query params to TMDB discover
    const params: Record<string, string> = {};
    searchParams.forEach((v, k) => {
      if (k !== "type") params[k] = v;
    });

    const data = await tmdbFetch(`/discover/${type}`, params);

    const results = (data.results ?? []).map((item: Record<string, unknown>) =>
      formatMedia(item, type),
    );

    return NextResponse.json({ results, total_pages: data.total_pages ?? 1 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
