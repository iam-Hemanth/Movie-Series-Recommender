import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/Nav";
import MainWrapper from "@/components/MainWrapper";

export const metadata: Metadata = {
  title: {
    default: "Hemanth's Entertainment Zone",
    template: "%s | HEZ",
  },
  description:
    "Discover, track, and watch movies & TV series with AI-powered recommendations.",
  keywords: ["movies", "tv shows", "streaming", "recommendations", "watchlist"],
  openGraph: {
    type: "website",
    siteName: "Hemanth's Entertainment Zone",
    title: "Hemanth's Entertainment Zone",
    description: "Discover, track, and watch movies & TV series.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <meta name="theme-color" content="#0f0f0f" />
      </head>
      <body
        style={{
          backgroundColor: "var(--bg-page)",
          color: "var(--text-primary)",
          fontFamily: '"Inter", system-ui, sans-serif',
          minHeight: "100dvh",
        }}
      >
        <Nav />
        <MainWrapper>{children}</MainWrapper>
      </body>
    </html>
  );
}
