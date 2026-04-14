import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// ── GET /api/recommendations/taste-profile ────────────────────────────────────
export async function GET() {
  try {
    const { data: rows, error } = await supabase
      .from("episode_ratings")
      .select("engagement, emotions, kept_watching, is_dropout");

    if (error) throw new Error(error.message);

    if (!rows || rows.length === 0) {
      return NextResponse.json({
        taste_profile: null,
        message: "Rate some episodes to build your taste profile.",
      });
    }

    const total       = rows.length;
    const avgEng      = rows.reduce((s, r) => s + (r.engagement ?? 0), 0) / total;
    const dropoutRate = rows.filter((r) => r.is_dropout).length / total;
    const keptRate    = rows.filter((r) => r.kept_watching).length / total;

    const emotionCounts: Record<string, number> = {};
    for (const row of rows) {
      let emotions: string[] = [];
      try {
        emotions = row.emotions ? JSON.parse(row.emotions) : [];
      } catch {
        emotions = [];
      }
      for (const e of emotions) {
        emotionCounts[e] = (emotionCounts[e] ?? 0) + 1;
      }
    }

    const topEmotions = Object.entries(emotionCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([emotion, count]) => ({ emotion, count }));

    return NextResponse.json({
      taste_profile: {
        total_rated:    total,
        avg_engagement: Math.round(avgEng * 100) / 100,
        kept_rate:      Math.round(keptRate * 100) / 100,
        dropout_rate:   Math.round(dropoutRate * 100) / 100,
        top_emotions:   topEmotions,
      },
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
