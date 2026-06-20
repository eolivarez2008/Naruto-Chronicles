import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import {
  CATEGORY_LABELS,
  CATEGORY_ICONS,
  CATEGORY_COLORS,
} from "@/types/videos";
import type { VideoCategory } from "@/types/videos";
import VideoPageLikeButton from "@/components/videos/VideoPageLikeButton";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const video = await prisma.video.findUnique({ where: { id } });
  if (!video) return { title: "Vidéo introuvable" };

  return {
    title: video.title,
    description: `${CATEGORY_LABELS[video.category as VideoCategory]} · ${video.channelTitle} — Naruto Chronicles Fan-Hub`,
    openGraph: {
      title: video.title,
      images: [{ url: video.thumbnail }],
      description: `${CATEGORY_LABELS[video.category as VideoCategory]} Naruto`,
    },
  };
}

export default async function VideoPage({ params }: Props) {
  const { id } = await params;
  const video = await prisma.video.findUnique({ where: { id } });
  if (!video) notFound();

  const color = CATEGORY_COLORS[video.category as VideoCategory] ?? "#ff6600";

  const formatDate = (d: Date) =>
    d.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  const formatViews = (n: bigint) => {
    const num = Number(n);
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M vues`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(0)}k vues`;
    return `${num} vues`;
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-10 fade-in-up">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-white/30 mb-6">
        <Link
          href="/videos"
          className="hover:text-naruto-orange transition-colors"
        >
          ← Fan-Hub Vidéo
        </Link>
        <span>/</span>
        <span
          className="px-2 py-0.5 rounded-full text-[10px] font-bold"
          style={{ background: `${color}22`, color }}
        >
          {CATEGORY_ICONS[video.category as VideoCategory]}{" "}
          {CATEGORY_LABELS[video.category as VideoCategory]}
        </span>
      </nav>

      {/* Player YouTube nocookie */}
      <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden border border-white/8 shadow-2xl mb-8">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1`}
          title={video.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 w-full h-full"
        />
      </div>

      {/* Infos */}
      <div className="flex flex-col sm:flex-row items-start gap-4">
        <div className="flex-1">
          <h1 className="text-xl sm:text-2xl font-bold text-white leading-snug mb-2">
            {video.title}
          </h1>
          <p className="text-white/40 text-sm">{video.channelTitle}</p>

          <div className="flex flex-wrap gap-4 mt-4 text-xs text-white/30">
            <span>👁 {formatViews(video.viewCount)}</span>
            <span>📅 {formatDate(video.publishedAt)}</span>
          </div>
        </div>

        {/* ajout du bouton like côté serveur → client */}
        <VideoPageLikeButton
          videoId={video.id}
          initialLikesCount={video.likesCount}
          color={color}
        />
      </div>

      {/* Lien YouTube */}
      <div className="mt-8 pt-6 border-t border-white/6">
        <a
          href={`https://www.youtube.com/watch?v=${id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-xs text-white/25 hover:text-white/50 transition-colors"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05A6.34 6.34 0 003.15 15.3a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.79 1.53V6.77a4.85 4.85 0 01-1.02-.08z" />
          </svg>
          Voir sur YouTube
        </a>
      </div>
    </div>
  );
}
