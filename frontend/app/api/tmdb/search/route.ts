import { NextResponse } from "next/server";
import { tmdbFetch, formatMedia } from "@/lib/tmdb-server";

export const revalidate = 3600;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q    = searchParams.get("q")    ?? "";
    const type = searchParams.get("type") ?? "multi";

    const data = await tmdbFetch(`/search/${type}`, { query: q });

    const results = (data.results ?? [])
      .map((item: Record<string, unknown>) => {
        const itemType = (item.media_type as string) ?? (type !== "multi" ? type : "movie");
        if (!["movie", "tv"].includes(itemType)) return null;
        return formatMedia(item, itemType);
      })
      .filter(Boolean);

    return NextResponse.json({ results });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
