import type { Metadata } from "next";
import Link from "next/link";
import { tmdb, type MediaItem } from "@/lib/api";

export const metadata: Metadata = {
  title: "Hemanth's Entertainment Zone",
  description:
    "Discover trending movies & TV shows with AI-powered recommendations.",
};

// ── Hero ─────────────────────────────────────────────────────────────────

function Hero({ item }: { item: MediaItem }) {
  const bg = item.backdrop_path
    ? item.backdrop_path
    : null;

  return (
    <section
      style={{
        position:   "relative",
        width:      "100%",
        height:     "clamp(320px, 55vw, 620px)",
        display:    "flex",
        alignItems: "flex-end",
        overflow:   "hidden",
      }}
    >
      {bg && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={bg}
          alt={item.title}
          style={{
            position:       "absolute",
            inset:          0,
            width:          "100%",
            height:         "100%",
            objectFit:      "cover",
            objectPosition: "center top",
          }}
        />
      )}

      {/* gradient scrim */}
      <div
        style={{
          position:   "absolute",
          inset:      0,
          background:
            "linear-gradient(to right, rgba(15,15,15,0.97) 30%, rgba(15,15,15,0.4) 100%), " +
            "linear-gradient(to top, #0f0f0f 0%, transparent 55%)",
        }}
      />

      <div
        style={{
          position:    "relative",
          maxWidth:    620,
          padding:     "0 1.5rem 2.5rem",
          animation:   "fadeUp 0.5s ease forwards",
        }}
      >
        <p
          style={{
            fontSize:      "0.7rem",
            fontWeight:    700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color:         "var(--accent)",
            marginBottom:  "0.75rem",
          }}
        >
          🔥 Trending Now
        </p>

        <h1
          style={{
            fontSize:      "clamp(1.75rem, 4vw, 3rem)",
            fontWeight:    900,
            lineHeight:    1.15,
            letterSpacing: "-0.03em",
            marginBottom:  "0.75rem",
            color:         "#fff",
          }}
        >
          {item.title}
        </h1>

        <p
          className="line-clamp-2"
          style={{
            color:        "var(--text-muted)",
            fontSize:     "0.9rem",
            lineHeight:   1.65,
            marginBottom: "1.5rem",
          }}
        >
          {item.overview}
        </p>

        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <Link
            href={`/show/${item.id}?type=${item.type}`}
            style={{
              display:      "inline-flex",
              alignItems:   "center",
              gap:          "0.4rem",
              padding:      "0.6rem 1.4rem",
              background:   "var(--accent)",
              color:        "#fff",
              fontWeight:   700,
              fontSize:     "0.875rem",
              borderRadius: "var(--radius-sm, 6px)",
              transition:   "opacity 0.2s",
            }}
          >
            ▶ Watch Now
          </Link>
          <Link
            href={`/show/${item.id}?type=${item.type}`}
            style={{
              display:      "inline-flex",
              alignItems:   "center",
              gap:          "0.4rem",
              padding:      "0.6rem 1.4rem",
              background:   "rgba(255,255,255,0.1)",
              color:        "#fff",
              fontWeight:   700,
              fontSize:     "0.875rem",
              borderRadius: "var(--radius-sm, 6px)",
              border:       "1px solid var(--border)",
              transition:   "background 0.2s",
            }}
          >
            + My List
          </Link>
        </div>
      </div>
    </section>
  );
}

// ── Poster card (minimal inline version) ─────────────────────────────────

function Card({ item }: { item: MediaItem }) {
  return (
    <Link
      href={`/show/${item.id}?type=${item.type}`}
      className="group"
      style={{ flexShrink: 0, width: 140 }}
    >
      <div
        style={{
          position:     "relative",
          aspectRatio:  "2/3",
          borderRadius: 8,
          overflow:     "hidden",
          background:   "var(--bg-card)",
          border:       "1px solid var(--border)",
          transition:   "transform 0.25s ease",
        }}
      >
        {item.poster_path ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.poster_path}
            alt={item.title}
            loading="lazy"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <div
            style={{
              width:          "100%",
              height:         "100%",
              display:        "flex",
              alignItems:     "center",
              justifyContent: "center",
              fontSize:       "2.5rem",
              color:          "var(--text-hint)",
              fontWeight:     900,
              textTransform:  "uppercase",
            }}
          >
            {item.title.charAt(0)}
          </div>
        )}

        {/* Rating */}
        <span
          style={{
            position:       "absolute",
            top:            6,
            right:          6,
            background:     "rgba(0,0,0,0.7)",
            backdropFilter: "blur(4px)",
            borderRadius:   "50%",
            width:          30,
            height:         30,
            display:        "flex",
            alignItems:     "center",
            justifyContent: "center",
            fontSize:       "0.6rem",
            fontWeight:     800,
            color:          "#fff",
          }}
        >
          {(item.vote_average ?? 0).toFixed(1)}
        </span>
      </div>

      <p
        className="line-clamp-1"
        style={{
          marginTop:  6,
          fontSize:   "0.75rem",
          fontWeight: 600,
          color:      "var(--text-primary)",
        }}
        title={item.title}
      >
        {item.title}
      </p>
    </Link>
  );
}

// ── Scroll row ────────────────────────────────────────────────────────────

function Row({ title, items }: { title: string; items: MediaItem[] }) {
  if (!items.length) return null;
  return (
    <section style={{ marginBottom: "2.5rem" }}>
      <h2
        style={{
          fontSize:     "1rem",
          fontWeight:   800,
          color:        "#fff",
          marginBottom: "1rem",
          paddingLeft:  "1.5rem",
          display:      "flex",
          alignItems:   "center",
          gap:          "0.5rem",
        }}
      >
        <span
          style={{
            display:      "inline-block",
            width:        3,
            height:       "1em",
            background:   "var(--accent)",
            borderRadius: 2,
          }}
        />
        {title}
      </h2>

      <div
        style={{
          display:    "flex",
          gap:        "0.75rem",
          overflowX:  "auto",
          padding:    "0 1.5rem 0.5rem",
        }}
        className="scrollbar-none"
      >
        {items.map((item) => (
          <Card key={`${item.type}-${item.id}`} item={item} />
        ))}
      </div>
    </section>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────

export default async function HomePage() {
  let all: MediaItem[] = [];
  try {
    const data = await tmdb.trending("all", "day");
    all = data.results;
  } catch {
    // backend offline – show empty state
  }

  const hero    = all[0];
  const movies  = all.filter((t) => t.type === "movie");
  const tv      = all.filter((t) => t.type === "tv");

  return (
    <>
      {hero ? (
        <Hero item={hero} />
      ) : (
        <div
          style={{
            height:         "40vh",
            display:        "flex",
            flexDirection:  "column",
            alignItems:     "center",
            justifyContent: "center",
            gap:            "0.75rem",
            color:          "var(--text-muted)",
          }}
        >
          <span style={{ fontSize: "3rem" }}>🎬</span>
          <p style={{ fontSize: "1rem" }}>Backend offline — start FastAPI on port 8000</p>
          <code
            style={{
              fontSize:     "0.8rem",
              background:   "var(--bg-card)",
              padding:      "0.35rem 0.75rem",
              borderRadius: 6,
              color:        "var(--text-muted)",
            }}
          >
            uvicorn main:app --reload --port 8000
          </code>
        </div>
      )}

      <div style={{ paddingTop: "1.5rem" }}>
        <Row title="Trending Movies" items={movies} />
        <Row title="Trending Series" items={tv} />
        {all.length > 0 && <Row title="All Trending" items={all} />}
      </div>
    </>
  );
}
