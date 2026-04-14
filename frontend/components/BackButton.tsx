"use client";

import { useRouter } from "next/navigation";

export default function BackButton({ fallback = "/" }: { fallback?: string }) {
  const router = useRouter();

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push(fallback);
    }
  };

  return (
    <button
      onClick={handleBack}
      aria-label="Go back"
      style={{
        width:           38,
        height:          38,
        borderRadius:    "50%",
        background:      "rgba(0,0,0,0.65)",
        backdropFilter:  "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        border:          "1px solid rgba(255,255,255,0.12)",
        display:         "flex",
        alignItems:      "center",
        justifyContent:  "center",
        color:           "#fff",
        cursor:          "pointer",
        transition:      "background 0.2s",
        flexShrink:      0,
      }}
    >
      <svg width={18} height={18} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
      </svg>
    </button>
  );
}
