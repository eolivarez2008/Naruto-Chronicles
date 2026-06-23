// src/app/manifest.ts
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Naruto Chronicles",
    short_name: "Naruto",
    description:
      "L'encyclopédie fan de l'univers Naruto — histoire, personnages, sagas et vidéos.",
    start_url: "/",
    display: "standalone",
    background_color: "#000000",
    theme_color: "#ff6600",
    orientation: "portrait-primary",
    lang: "fr",
    categories: ["entertainment", "anime", "manga"],
    icons: [
      {
        src: "/logo/favicon-naruto.png",
        sizes: "any",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/logo/favicon-naruto.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/logo/favicon-naruto.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
    screenshots: [],
    shortcuts: [
      {
        name: "Personnages",
        short_name: "Persos",
        description: "Encyclopédie des personnages Naruto",
        url: "/characters",
        icons: [{ src: "/logo/favicon-naruto.png", sizes: "96x96" }],
      },
      {
        name: "Vidéos",
        short_name: "Vidéos",
        description: "Fan-hub vidéo Naruto",
        url: "/videos",
        icons: [{ src: "/logo/favicon-naruto.png", sizes: "96x96" }],
      },
    ],
  };
}
