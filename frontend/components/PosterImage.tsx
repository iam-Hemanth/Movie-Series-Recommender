"use client";

import { useState } from "react";

interface Props {
  src?: string | null;
  alt: string;
  /** First char shown in placeholder */
  title: string;
}

export default function PosterImage({ src, alt, title }: Props) {
  const [errored, setErrored] = useState(false);

  if (!src || errored) {
    return (
      <div
        style={{
          position:       "absolute",
          inset:          0,
          background:     "var(--bg-card)",
          display:        "flex",
          alignItems:     "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            fontSize:   "3rem",
            fontWeight: 900,
            color:      "var(--text-hint)",
            textTransform: "uppercase",
            userSelect: "none",
          }}
        >
          {title.charAt(0)}
        </span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setErrored(true)}
      style={{
        position:   "absolute",
        inset:      0,
        width:      "100%",
        height:     "100%",
        objectFit:  "cover",
        transition: "transform 0.35s ease",
      }}
    />
  );
}
