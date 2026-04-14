import { NextResponse } from "next/server";
import { tmdbFetch, formatMedia } from "@/lib/tmdb-server";

export const revalidate = 21600;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ tmdb_id: string }> },
) {
  try {
    const { tmdb_id } = await params;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") ?? "movie";

    const data = await tmdbFetch(`/${type}/${tmdb_id}/recommendations`);

    const results = (data.results ?? [])
      .slice(0, 18)
      .map((item: Record<string, unknown>) => formatMedia(item, type));

    return NextResponse.json({ results });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
