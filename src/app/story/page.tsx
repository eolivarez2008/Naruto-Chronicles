import type { Metadata } from "next";
import PageHero from "@/components/ui/PageHero";
import GlassCard from "@/components/ui/GlassCard";
import { STORY_PARAGRAPHS } from "@/lib/homeData";

export const metadata: Metadata = {
  title: "Histoire",
  description:
    "Découvrez l'histoire complète de Naruto Uzumaki depuis ses origines jusqu'à son ascension en tant que Hokage.",
};

export default function StoryPage() {
  return (
    <main className="min-h-screen bg-[#050505] text-white -mt-16 pt-16">
      <PageHero
        eyebrow="Chroniques"
        title="Histoire"
        description="Découvrez l'épopée complète de Naruto Uzumaki, depuis ses origines d'orphelin rejeté jusqu'à son ascension légendaire en tant que Septième Hokage."
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <GlassCard className="p-6 md:p-10">
          <div className="space-y-5">
            {STORY_PARAGRAPHS.map((p, i) => (
              <p
                key={i}
                className="text-white/70 leading-[1.85] text-[15px] fade-in-up"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                {p}
              </p>
            ))}
          </div>
        </GlassCard>
      </div>
    </main>
  );
}
