import { NextResponse } from "next/server";
import { tmdbFetch, LOGO_BASE } from "@/lib/tmdb-server";

export const revalidate = 604800;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ tmdb_id: string }> },
) {
  try {
    const { tmdb_id } = await params;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") ?? "movie";

    const data = await tmdbFetch(
      `/${type}/${tmdb_id}/images`,
      { include_image_language: "en,null" },
    );

    const logos = data.logos ?? [];
    const logo_path = logos.length > 0 ? `${LOGO_BASE}${logos[0].file_path}` : null;

    return NextResponse.json({ logo_path });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
