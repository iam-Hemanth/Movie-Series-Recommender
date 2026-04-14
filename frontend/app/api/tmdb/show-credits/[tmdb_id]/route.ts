import { NextResponse } from "next/server";
import { tmdbFetch, PROFILE_BASE } from "@/lib/tmdb-server";

export const revalidate = 604800;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ tmdb_id: string }> },
) {
  try {
    const { tmdb_id } = await params;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") ?? "movie";

    const data = await tmdbFetch(`/${type}/${tmdb_id}/credits`);

    const cast = (data.cast ?? []).slice(0, 12).map((person: Record<string, unknown>) => ({
      person_id:    person.id,
      name:         person.name,
      character:    person.character,
      profile_path: person.profile_path ? `${PROFILE_BASE}${person.profile_path}` : null,
    }));

    return NextResponse.json({ cast });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
