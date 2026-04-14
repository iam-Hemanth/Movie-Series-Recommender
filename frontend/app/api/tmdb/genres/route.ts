import { NextResponse } from "next/server";
import { tmdbFetch } from "@/lib/tmdb-server";

export const revalidate = 2592000;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") ?? "movie";

    const data = await tmdbFetch(`/genre/${type}/list`);

    return NextResponse.json({ genres: data.genres ?? [] });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
