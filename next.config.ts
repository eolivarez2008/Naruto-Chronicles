import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",

  images: {
    remotePatterns: [
      // ── Sources de données principales ────────────────────────────────────
      { protocol: "https", hostname: "dattebayo-api.onrender.com" },
      { protocol: "https", hostname: "cdn.myanimelist.net" },
      { protocol: "https", hostname: "raw.githubusercontent.com" },
      { protocol: "https", hostname: "naruto-official.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },

      // ── Wikia / Fandom  ──
      { protocol: "https", hostname: "static.wikia.nocookie.net" },
      { protocol: "https", hostname: "vignette.wikia.nocookie.net" },
      { protocol: "https", hostname: "static.wikia.com" },
      { protocol: "https", hostname: "naruto.fandom.com" },

      // ── DuckDuckGo (fallback images) ──────────────────────────────────────
      { protocol: "https", hostname: "duckduckgo.com" },
      { protocol: "https", hostname: "external-content.duckduckgo.com" },

      // ── Wikimedia Commons (fallback secondaire) ───────────────────────────
      { protocol: "https", hostname: "upload.wikimedia.org" },
      { protocol: "https", hostname: "commons.wikimedia.org" },

      // ── Autres CDN fréquents dans les résultats de recherche ─────────────
      { protocol: "https", hostname: "i.imgur.com" },
      { protocol: "https", hostname: "imgur.com" },
      { protocol: "https", hostname: "pbs.twimg.com" },
      { protocol: "https", hostname: "media.tenor.com" },
      { protocol: "https", hostname: "i.pinimg.com" },
      { protocol: "https", hostname: "images.alphacoders.com" },
      { protocol: "https", hostname: "www.anime-planet.com" },
      { protocol: "https", hostname: "s4.anilist.co" },
      { protocol: "https", hostname: "media.kitsu.app" },
      { protocol: "https", hostname: "m.media-amazon.com" },
    ],

    formats: ["image/avif", "image/webp"],

    minimumCacheTTL: 604800,
  },
};

export default nextConfig;
