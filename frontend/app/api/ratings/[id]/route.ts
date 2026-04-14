import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// ── DELETE /api/ratings/[id] ──────────────────────────────────────────────────
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { error } = await supabase.from("episode_ratings").delete().eq("id", id);
    if (error) throw new Error(error.message);
    return NextResponse.json({ message: `Rating ${id} deleted` });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
