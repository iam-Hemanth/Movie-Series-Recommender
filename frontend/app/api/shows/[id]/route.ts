import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// ── PATCH /api/shows/[id] ─────────────────────────────────────────────────────
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updates: Record<string, unknown> = {};
    if (body.status        !== undefined) updates.status        = body.status;
    if (body.poster_path   !== undefined) updates.poster_path   = body.poster_path;
    if (body.backdrop_path !== undefined) updates.backdrop_path = body.backdrop_path;

    const { error } = await supabase.from("shows").update(updates).eq("id", id);
    if (error) throw new Error(error.message);

    const { data } = await supabase
      .from("shows")
      .select("*, episode_ratings(id, engagement, season, episode, logged_at)")
      .eq("id", id)
      .single();

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// ── DELETE /api/shows/[id] ────────────────────────────────────────────────────
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // Cascade delete ratings first (Supabase enforces FK only if configured)
    await supabase.from("episode_ratings").delete().eq("show_id", id);

    const { error } = await supabase.from("shows").delete().eq("id", id);
    if (error) throw new Error(error.message);

    return NextResponse.json({ message: `Show ${id} and all ratings deleted` });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
