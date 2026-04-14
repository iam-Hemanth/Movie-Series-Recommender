import { NextResponse } from "next/server";
import { tmdbFetch } from "@/lib/tmdb-server";

export const revalidate = 604800;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ tmdb_id: string }> },
) {
  try {
    const { tmdb_id } = await params;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") ?? "movie";

    const data = await tmdbFetch(`/${type}/${tmdb_id}/videos`);

    const trailer = (data.results ?? []).find(
      (v: Record<string, unknown>) => v.site === "YouTube" && v.type === "Trailer",
    );

    return NextResponse.json({ key: trailer?.key ?? null });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
