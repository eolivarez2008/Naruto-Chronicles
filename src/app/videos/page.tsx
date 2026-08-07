import type { Metadata } from "next";
import PageHero from "@/components/ui/PageHero";
import VideoListClient from "@/components/videos/VideoListClient";

export const metadata: Metadata = {
  title: "Vidéos",
  description:
    "Théories, edits, réactions, fanarts et OST — le meilleur contenu Naruto de la communauté.",
};

export default function VideosPage() {
  return (
    <main className="min-h-screen text-white -mt-16 pt-16">
      <PageHero
        eyebrow="Fan-Hub"
        title="Vidéos"
        description="Théories, edits, réactions, fanarts et OST — le meilleur du contenu communautaire Naruto, réuni en un seul endroit."
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <VideoListClient />
      </div>
    </main>
  );
}
