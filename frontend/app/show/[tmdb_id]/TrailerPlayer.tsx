"use client";

import { useState } from "react";

interface Props {
  trailerKey: string;
}

export default function TrailerPlayer({ trailerKey }: Props) {
  const [playing, setPlaying] = useState(false);

  const thumb = `https://img.youtube.com/vi/${trailerKey}/maxresdefault.jpg`;
  const src   = `https://www.youtube.com/embed/${trailerKey}?autoplay=1&mute=1&controls=1`;

  if (playing) {
    return (
      <div style={{ position: "relative", width: "100%", paddingTop: "56.25%" }}>
        <iframe
          src={src}
          allow="autoplay; fullscreen"
          allowFullScreen
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none", borderRadius: 10 }}
          title="Trailer"
        />
      </div>
    );
  }

  return (
    <button
      onClick={() => setPlaying(true)}
      style={{
        position:        "relative",
        display:         "block",
        width:           "100%",
        paddingTop:      "56.25%",
        overflow:        "hidden",
        borderRadius:    10,
        cursor:          "pointer",
        border:          "none",
        background:      "none",
        padding:         0,
      }}
      aria-label="Play trailer"
    >
      {/* Thumbnail */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={thumb}
        alt="Trailer thumbnail"
        loading="lazy"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", borderRadius: 10 }}
      />

      {/* Dark scrim */}
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.35)", borderRadius: 10 }} />

      {/* Circular play button */}
      <div
        style={{
          position:        "absolute",
          top:             "50%",
          left:            "50%",
          transform:       "translate(-50%, -50%)",
          width:           60,
          height:          60,
          borderRadius:    "50%",
          background:      "var(--accent)",
          display:         "flex",
          alignItems:      "center",
          justifyContent:  "center",
          boxShadow:       "0 0 24px rgba(229,9,20,0.6)",
          transition:      "transform 0.2s, box-shadow 0.2s",
        }}
      >
        <svg width={22} height={22} viewBox="0 0 24 24" fill="white">
          <path d="M8 5v14l11-7z" />
        </svg>
      </div>
    </button>
  );
}
