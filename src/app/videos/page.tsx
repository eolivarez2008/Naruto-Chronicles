import type { Metadata } from "next";
import Image from "next/image";
import VideoListClient from "@/components/videos/VideoListClient";

export const metadata: Metadata = {
  title: "Fan-Hub Vidéo",
  description:
    "Théories, edits, réactions, fanarts et OST — le meilleur contenu Naruto de la communauté.",
};

export default function VideosPage() {
  return (
    <main className="min-h-screen bg-[#050505] text-white -mt-16">
      {/* ── Hero ── */}
      <div className="relative overflow-hidden" style={{ minHeight: "260px" }}>
        <div className="absolute inset-0">
          <Image
            src="https://github.com/sriniously/narutodb-website/blob/master/public/cards/akatsuki.jpg?raw=true"
            alt=""
            fill
            className="object-cover object-center"
            priority
            unoptimized
          />
          <div className="absolute inset-0 backdrop-blur-sm" />
          <div className="absolute inset-0 bg-[#050505]/65" />
          <div className="absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-[#050505] to-transparent" />
          <div
            className="absolute top-0 right-0 w-96 h-96 opacity-10 pointer-events-none"
            style={{
              background:
                "radial-gradient(circle at top right, #ff6600 0%, transparent 70%)",
            }}
          />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
          <p className="text-naruto-orange text-sm font-bold uppercase tracking-[0.3em] mb-3">
            Fan-Hub
          </p>
          <h1 className="text-4xl sm:text-5xl font-black text-white leading-none mb-4">
            Vidéos
          </h1>
          <p className="text-white/65 text-base max-w-xl leading-relaxed">
            Théories, edits, réactions, fanarts et OST — le meilleur du contenu
            communautaire Naruto, réuni en un seul endroit.
          </p>
        </div>
      </div>

      {/* ── Contenu principal ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <VideoListClient />
      </div>
    </main>
  );
}
