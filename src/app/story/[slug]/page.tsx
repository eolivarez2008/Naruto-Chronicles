import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import type { StoryArc, SagaKey } from "@/types/story";
import { SAGA_CONFIG } from "@/types/story";
import ArcDetailClient from "@/components/story/ArcDetailClient";

export const revalidate = 3600;

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const arcs = await prisma.storyArc.findMany({ select: { slug: true } });

  return arcs.map((arc) => ({
    slug: arc.slug,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const arc = await prisma.storyArc.findUnique({
    where: { slug: decodeURIComponent(slug) },
    select: {
      title: true,
      titleFr: true,
      summary: true,
      summaryFr: true,
    },
  });
  if (!arc) return { title: "Arc introuvable" };
  return {
    title: arc.title,
    description: arc.summary.slice(0, 155),
  };
}

async function getArcWithNeighbors(rawSlug: string): Promise<{
  arc: StoryArc;
  prev: { slug: string; title: string } | null;
  next: { slug: string; title: string } | null;
} | null> {
  const slug = decodeURIComponent(rawSlug);
  const arc = await prisma.storyArc.findUnique({ where: { slug } });
  if (!arc) return null;

  const [prevRow, nextRow] = await Promise.all([
    prisma.storyArc.findFirst({
      where: { sagaKey: arc.sagaKey, order: { lt: arc.order } },
      orderBy: { order: "desc" },
      select: { slug: true, title: true },
    }),
    prisma.storyArc.findFirst({
      where: { sagaKey: arc.sagaKey, order: { gt: arc.order } },
      orderBy: { order: "asc" },
      select: { slug: true, title: true },
    }),
  ]);

  return {
    arc: { ...arc, fetchedAt: arc.fetchedAt } as StoryArc,
    prev: prevRow ?? null,
    next: nextRow ?? null,
  };
}

export default async function ArcDetailPage({ params }: Props) {
  const { slug } = await params;
  const result = await getArcWithNeighbors(slug);
  if (!result) notFound();

  const { arc, prev, next } = result;
  const config = SAGA_CONFIG[arc.sagaKey as SagaKey];

  return (
    <ArcDetailClient
      arc={arc}
      prev={prev}
      next={next}
      sagaColor={config.color}
      sagaLabel={config.label}
    />
  );
}
