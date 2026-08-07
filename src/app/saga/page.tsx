import { Metadata } from "next";
import PageHero from "@/components/ui/PageHero";
import SagaSection from "@/components/saga/SagaSection";
import type { SagaData, SagaType } from "@/components/saga/SagaSection";
import prisma from "@/lib/prisma";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Sagas",
  description:
    "Découvrez toutes les sagas de l'univers Naruto — scores, statuts et synopsis en temps réel.",
};

export default async function SagaPage() {
  const sagas = await prisma.saga.findMany({ orderBy: { year: "asc" } });

  const data: SagaData[] = sagas.map((s) => ({
    type: s.type as SagaType,
    label: s.label,
    synopsisFr: s.synopsisFr,
    image: s.image,
    status: s.status,
    score: s.score,
    creator: s.creator,
    episodes: s.episodes,
    chapters: s.chapters,
    volumes: s.volumes,
    year: s.year,
  }));

  return (
    <main className="min-h-screen text-white -mt-16 pt-16">
      <PageHero
        eyebrow="Chronologie"
        title="La Saga"
        description="L'épopée complète à travers les différentes époques : de l'enfance de Naruto à l'avènement de Boruto."
      />
      <SagaSection sagas={data} />
    </main>
  );
}