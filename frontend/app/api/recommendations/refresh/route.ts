import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

// ── POST /api/recommendations/refresh ─────────────────────────────────────────
export async function POST() {
  try {
    // Bust Next.js route cache for recommendations
    revalidatePath("/api/recommendations");
    return NextResponse.json({
      message: "Recommendation cache cleared. Fetch /api/recommendations to rebuild.",
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
