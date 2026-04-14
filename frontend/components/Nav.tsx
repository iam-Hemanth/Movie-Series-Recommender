"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { label: "Discover",  href: "/discover" },
  { label: "My List",   href: "/my-list" },
  { label: "Rate",      href: "/rate" },
  { label: "For You",   href: "/for-you" },
] as const;

export default function Nav() {
  const pathname = usePathname();

  // Watch page is full-screen — completely hide nav
  if (pathname.startsWith("/watch")) return null;

  return (
    <header
      style={{
        position:   "fixed",
        top:        0,
        left:       0,
        right:      0,
        zIndex:     50,
        background: "#0a0a0a",
        borderBottom: "1px solid var(--border)",
      }}
    >
      {/* ── Top bar 56px ──────────────────────────────────── */}
      <div
        style={{
          height:         "var(--nav-height)",
          display:        "flex",
          alignItems:     "center",
          justifyContent: "space-between",
          padding:        "0 1.5rem",
          maxWidth:       "1440px",
          margin:         "0 auto",
        }}
      >
        {/* Logo */}
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 4, textDecoration: "none" }}>
          <span
            style={{
              background:    "var(--accent)",
              color:         "#fff",
              fontWeight:    900,
              fontSize:      "1.1rem",
              padding:       "2px 8px",
              borderRadius:  4,
              letterSpacing: "-0.03em",
            }}
          >
            HEZ
          </span>
          <span style={{ fontWeight: 600, fontSize: "0.8rem", letterSpacing: "0.02em", color: "rgba(255,255,255,0.55)", maxWidth: 160 }}>
            Hemanth&apos;s Entertainment Zone
          </span>
        </Link>

        {/* Desktop links */}
        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
          <Link href="/browse?type=movie" style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-muted)", transition: "color 0.2s", textDecoration: "none" }}>
            Movies
          </Link>
          <Link href="/browse?type=tv" style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-muted)", transition: "color 0.2s", textDecoration: "none" }}>
            Series
          </Link>
          <Link href="/my-list" style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-muted)", transition: "color 0.2s", textDecoration: "none" }}>
            My List
          </Link>
        </div>

        {/* Icon actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <Link href="/search" aria-label="Search" style={{ display: "flex", alignItems: "center", padding: 6, color: "var(--text-muted)", borderRadius: 6, transition: "color 0.2s" }}>
            <svg width={18} height={18} fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
              <circle cx={11} cy={11} r={8} /><path strokeLinecap="round" d="m21 21-4.35-4.35" />
            </svg>
          </Link>
          <Link href="/profile" aria-label="Profile" style={{ display: "flex", alignItems: "center", padding: 6, color: "var(--text-muted)", borderRadius: 6, transition: "color 0.2s" }}>
            <svg width={18} height={18} fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
              <circle cx={12} cy={8} r={4} />
              <path strokeLinecap="round" d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
            </svg>
          </Link>
        </div>
      </div>

      {/* ── Pill-tab row 44px ─────────────────────────────── */}
      <div
        style={{
          height:     "var(--nav-tabs-h)",
          display:    "flex",
          alignItems: "center",
          gap:        "0.5rem",
          padding:    "0 1.5rem",
          maxWidth:   "1440px",
          margin:     "0 auto",
          overflowX:  "auto",
        }}
        className="scrollbar-none"
      >
        {TABS.map(({ label, href }) => {
          const hrefStr = href as string;
          const active =
            pathname === hrefStr ||
            (hrefStr !== "/" && pathname.startsWith(hrefStr.split("?")[0]));

          return (
            <Link
              key={href}
              href={href}
              style={{
                flexShrink:    0,
                padding:       "5px 16px",
                borderRadius:  9999,
                fontSize:      "0.8125rem",
                fontWeight:    600,
                transition:    "all 0.2s",
                background:    active ? "var(--accent)" : "var(--bg-card)",
                color:         active ? "#fff"          : "var(--text-muted)",
                border:        active ? "1px solid transparent" : "1px solid var(--border)",
                textDecoration: "none",
              }}
            >
              {label}
            </Link>
          );
        })}
      </div>
    </header>
  );
}
