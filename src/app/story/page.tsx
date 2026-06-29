import type { Metadata } from "next";
import prisma from "@/lib/prisma";
import type { StoryArc } from "@/types/story";
import { SAGA_ORDER } from "@/types/story";
import PageHero from "@/components/ui/PageHero";
import StoryListClient from "@/components/story/StoryListClient";
import { BookOpen } from "lucide-react";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Histoire",
  description:
    "Explorez l'histoire complète de la série, de l'Académie Ninja à la Quatrième Grande Guerre Ninja.",
};

async function getArcs(): Promise<StoryArc[]> {
  const rows = await prisma.storyArc.findMany({
    orderBy: [{ sagaKey: "asc" }, { order: "asc" }],
    select: {
      id: true,
      slug: true,
      order: true,
      sagaKey: true,
      title: true,
      summary: true,
      content: true,
      titleFr: true,
      summaryFr: true,
      contentFr: true,
      fetchedAt: true,
    },
  });

  return rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    order: r.order,
    sagaKey: r.sagaKey as StoryArc["sagaKey"],
    title: r.title,
    summary: r.summary,
    content: r.content,
    titleFr: r.titleFr ?? undefined,
    summaryFr: r.summaryFr ?? undefined,
    contentFr: r.contentFr ?? undefined,
    fetchedAt: r.fetchedAt,
  }));
}

export default async function StoryPage() {
  const arcs = await getArcs();

  return (
    <main className="min-h-screen bg-[#050505] text-white -mt-16 pt-16">
      <PageHero
        eyebrow="Chroniques"
        title="Histoire"
        description="Découvrez les arcs majeurs, les événements clés et les personnages emblématiques de la série Naruto, Shippuden et Boruto. Les données proviennents de MediaWiki."
      />

      {arcs.length === 0 ? <EmptyState /> : <StoryListClient arcs={arcs} />}
    </main>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-32 text-center gap-6">
      <div className="w-14 h-14 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
        <BookOpen size={24} className="text-orange-500" />
      </div>
      <div>
        <h2 className="text-xl font-black text-white mb-2">Aucun arc chargé</h2>
        <p className="text-white/40 text-sm">
          Vérifie la base de données ou Prisma.
        </p>
      </div>
    </div>
  );
}
