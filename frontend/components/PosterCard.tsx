import Link from "next/link";
import PosterImage from "./PosterImage";

type WatchStatus = "watching" | "completed" | "dropped" | "plan_to_watch";

const STATUS_LABEL: Record<WatchStatus, string> = {
  watching:       "Watching",
  completed:      "Done",
  dropped:        "Dropped",
  plan_to_watch:  "Plan",
};

const STATUS_COLOR: Record<WatchStatus, string> = {
  watching:       "#3b82f6",
  completed:      "#22c55e",
  dropped:        "#ef4444",
  plan_to_watch:  "#a855f7",
};

interface PosterCardProps {
  id: number;
  type: "movie" | "tv";
  title: string;
  posterPath?: string | null;
  /** TMDB 0-10 */
  rating?: number;
  status?: WatchStatus;
  /** 0-100 progress percentage */
  progress?: number;
}

export default function PosterCard({
  id,
  type,
  title,
  posterPath,
  rating,
  status,
  progress,
}: PosterCardProps) {
  return (
    <Link
      href={`/show/${id}?type=${type}`}
      className="group"
      style={{ display: "flex", flexDirection: "column", gap: 8 }}
    >
      {/* ── Card ──────────────────────────────────────── */}
      <div
        style={{
          position:     "relative",
          width:        "100%",
          aspectRatio:  "2/3",
          borderRadius: "var(--radius-card)",
          overflow:     "hidden",
          background:   "var(--bg-card)",
          border:       "1px solid var(--border)",
          boxShadow:    "var(--shadow-card)",
          transition:   "transform 0.25s ease, box-shadow 0.25s ease",
        }}
        // hover via CSS class applied to group
      >
        <PosterImage src={posterPath} alt={title} title={title} />

        {/* Status badge — top left */}
        {status && (
          <span
            style={{
              position:    "absolute",
              top:         8,
              left:        8,
              padding:     "2px 7px",
              borderRadius:"var(--radius-pill)",
              fontSize:    "0.6rem",
              fontWeight:  700,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              background:  STATUS_COLOR[status],
              color:       "#fff",
              zIndex:      2,
            }}
          >
            {STATUS_LABEL[status]}
          </span>
        )}

        {/* Rating badge — top right */}
        {rating !== undefined && (
          <span
            style={{
              position:    "absolute",
              top:         8,
              right:       8,
              width:       32,
              height:      32,
              borderRadius:"50%",
              display:     "flex",
              alignItems:  "center",
              justifyContent: "center",
              background:  "rgba(0,0,0,0.65)",
              backdropFilter: "blur(6px)",
              fontSize:    "0.65rem",
              fontWeight:  800,
              color:       "#fff",
              zIndex:      2,
            }}
          >
            {rating.toFixed(1)}
          </span>
        )}

        {/* Progress bar — bottom */}
        {progress !== undefined && (
          <div
            style={{
              position:  "absolute",
              bottom:    0,
              left:      0,
              right:     0,
              height:    3,
              background:"rgba(0,0,0,0.4)",
              zIndex:    2,
            }}
          >
            <div
              style={{
                height:     "100%",
                width:      `${Math.min(100, Math.max(0, progress))}%`,
                background: "var(--accent)",
              }}
            />
          </div>
        )}
      </div>

      {/* ── Title ─────────────────────────────────────── */}
      <span
        className="line-clamp-1"
        style={{
          fontSize:   "0.8125rem",
          fontWeight: 600,
          color:      "var(--text-primary)",
        }}
        title={title}
      >
        {title}
      </span>
    </Link>
  );
}
