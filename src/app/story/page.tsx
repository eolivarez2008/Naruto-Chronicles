import type { Metadata } from "next";
import GlassCard from "@/components/ui/GlassCard";
import { STORY_PARAGRAPHS } from "@/lib/homeData";

export const metadata: Metadata = {
  title: "Histoire",
  description: "Découvrez l'histoire de Naruto Uzumaki depuis ses origines.",
};

export default function StoryPage() {
  return (
    <div className="w-full max-w-4xl mx-auto px-6 py-12 fade-in-up">

      {/* Page header */}
      <div className="mb-10">
        <h1
          className="text-4xl md:text-5xl font-bold tracking-tight text-white mt-2"
          style={{ fontFamily: "'Syne', sans-serif" }}
        >
          Histoire
        </h1>
        <span className="accent-line w-20" />
      </div>

      {/* Content card */}
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
  );
}
