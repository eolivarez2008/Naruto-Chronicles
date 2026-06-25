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
import { Eye, Calendar, ExternalLink, ChevronLeft } from "lucide-react";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const video = await prisma.video.findUnique({ where: { id } });
  if (!video) return { title: "Vidéo introuvable" };

  return {
    title: video.title,
    description: `${CATEGORY_LABELS[video.category as VideoCategory]} · ${video.channelTitle} — Naruto Chronicles`,
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
  const Icon = CATEGORY_ICONS[video.category as VideoCategory];

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-10 fade-in-up">
      {/* Fil d'ariane */}
      <nav className="flex items-center gap-2 text-xs text-white/30 mb-6">
        <Link
          href="/videos"
          className="group flex items-center gap-1.5 hover:text-naruto-orange transition-colors"
        >
          <ChevronLeft
            size={14}
            className="group-hover:-translate-x-0.5 transition-transform"
          />
          <span>Fan-Hub Vidéo</span>
        </Link>

        <ChevronLeft size={14} className="shrink-0" />

        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-bold bg-white/5 border border-white/10 text-white/70 w-fit whitespace-nowrap">
          <Icon size={14} className="shrink-0" style={{ color }} />
          <span className="truncate max-w-37.5 lg:max-w-none">
            {video.title}
          </span>
        </span>
      </nav>

      {/* Lecteur YouTube */}
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
            <span className="flex items-center gap-1">
              <Eye size={12} />
              {formatViews(video.viewCount)}
            </span>
            <span className="flex items-center gap-1">
              <Calendar size={12} />
              {formatDate(video.publishedAt)}
            </span>
          </div>
        </div>
        <VideoPageLikeButton
          videoId={video.id}
          initialLikesCount={video.likesCount}
          color={color}
        />
      </div>

      <div className="mt-8 pt-6 border-t border-white/6">
        <a
          href={`https://www.youtube.com/watch?v=${id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-xs text-white/25 hover:text-white/50 transition-colors"
        >
          <ExternalLink size={16} />
          Voir sur YouTube
        </a>
      </div>
    </div>
  );
}
