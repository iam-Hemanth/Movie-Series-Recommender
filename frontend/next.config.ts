import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "image.tmdb.org",    pathname: "/t/p/**" },
      { protocol: "https", hostname: "img.youtube.com",   pathname: "/vi/**" },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Prevent HEZ from being embedded in other sites
          { key: "X-Frame-Options",        value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Use strict-origin-when-cross-origin so streaming iframes
          // (embed.su, vidsrc.xyz, multiembed.mov, vidlink.pro) receive
          // a proper Referer header and don't reject the request.
          { key: "Referrer-Policy",        value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
