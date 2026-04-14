import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// ── GET /api/ratings ──────────────────────────────────────────────────────────
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const show_id = searchParams.get("show_id");

    let query = supabase
      .from("episode_ratings")
      .select("*")
      .order("logged_at", { ascending: false });

    if (show_id) query = query.eq("show_id", show_id);

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    return NextResponse.json({ ratings: data ?? [] });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// ── POST /api/ratings ─────────────────────────────────────────────────────────
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      show_id, season, episode, engagement,
      emotions, kept_watching, note, is_dropout,
    } = body;
    const logged_at = body.logged_at ?? Math.floor(Date.now() / 1000);

    // Verify show exists
    const { data: show } = await supabase
      .from("shows")
      .select("id")
      .eq("id", show_id)
      .maybeSingle();

    if (!show) {
      return NextResponse.json(
        { error: "Show not found. Add it to watchlist first." },
        { status: 404 },
      );
    }

    const { data, error } = await supabase
      .from("episode_ratings")
      .insert({
        show_id,
        season,
        episode,
        engagement,
        emotions:      emotions ?? null,
        kept_watching: kept_watching ?? true,
        note:          note ?? null,
        is_dropout:    is_dropout ?? false,
        logged_at,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
