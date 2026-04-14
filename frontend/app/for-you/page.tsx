import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "For You – HEZ" };

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

interface MediaItem {
  id: number;
  title: string;
  poster_path: string | null;
  vote_average: number;
  overview: string;
  type: "movie" | "tv";
}

async function getRecs(): Promise<MediaItem[]> {
  try {
    const res = await fetch(`${API}/recommendations`, { cache: "no-store" });
    if (!res.ok) return [];
    const data = await res.json();
    return data.recommendations ?? [];
  } catch {
    return [];
  }
}

export default async function ForYouPage() {
  const recs = await getRecs();

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "1.5rem 1.5rem 4rem" }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 900, color: "#fff", marginBottom: "0.35rem" }}>For You</h1>
        <p style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
          AI-powered picks based on what you&apos;ve watched and rated.
        </p>
      </div>

      {recs.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem 2rem" }}>
          <p style={{ fontSize: "3rem", marginBottom: "1rem" }}>🤖</p>
          <p style={{ fontSize: "1rem", fontWeight: 700, color: "#fff", marginBottom: "0.5rem" }}>
            No recommendations yet
          </p>
          <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginBottom: "1.5rem" }}>
            Start rating episodes and tracking shows so the model can learn your taste.
          </p>
          <Link href="/rate" style={{ display: "inline-flex", padding: "0.6rem 1.4rem", background: "var(--accent)", color: "#fff", fontWeight: 700, fontSize: "0.875rem", borderRadius: 7 }}>
            Rate Your Watches →
          </Link>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(145px, 1fr))", gap: "1.25rem" }}>
          {recs.map((item) => (
            <Link key={`${item.type}-${item.id}`} href={`/show/${item.id}?type=${item.type}`} style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              <div style={{ position: "relative", aspectRatio: "2/3", borderRadius: 8, overflow: "hidden", background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                {item.poster_path ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.poster_path} alt={item.title} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem", fontWeight: 900, color: "var(--text-hint)" }}>
                    {item.title.charAt(0)}
                  </div>
                )}
                {item.vote_average != null && (
                  <span style={{ position: "absolute", top: 6, right: 6, background: "rgba(0,0,0,.75)", borderRadius: "50%", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.6rem", fontWeight: 800, color: "#fff" }}>
                    {item.vote_average.toFixed(1)}
                  </span>
                )}
                <span style={{ position: "absolute", top: 6, left: 6, background: "var(--accent)", borderRadius: 4, padding: "1px 5px", fontSize: "0.55rem", fontWeight: 800, color: "#fff", textTransform: "uppercase" }}>
                  {item.type}
                </span>
              </div>
              <p className="line-clamp-1" style={{ fontSize: "0.775rem", fontWeight: 600, color: "var(--text-primary)" }}>{item.title}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
