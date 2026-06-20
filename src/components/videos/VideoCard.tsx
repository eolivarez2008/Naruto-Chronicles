"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { VideoCard } from "@/types/videos";
import {
  CATEGORY_LABELS,
  CATEGORY_ICONS,
  CATEGORY_COLORS,
} from "@/types/videos";

interface VideoCardProps {
  video: VideoCard;
  index: number;
  onClick: () => void;
  onLikeToggle: (videoId: string, liked: boolean, newCount: number) => void;
}

function formatCount(n: string | number): string {
  const num = typeof n === "string" ? parseInt(n) : n;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(0)}k`;
  return String(num);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    month: "short",
    year: "numeric",
  });
}

export default function VideoCardItem({
  video,
  index,
  onClick,
  onLikeToggle,
}: VideoCardProps) {
  const [liking, setLiking] = useState(false);
  const color = CATEGORY_COLORS[video.category] ?? "#ff6600";

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (liking) return;
    setLiking(true);
    try {
      const res = await fetch(`/api/videos/${video.id}/like`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) onLikeToggle(video.id, data.liked, data.likesCount);
    } catch (err) {
      console.error("Like error:", err);
    } finally {
      setLiking(false);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2, delay: Math.min(index % LIMIT, 12) * 0.04 }}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/8 bg-white/4 cursor-pointer hover:border-white/15 transition-all duration-300"
      style={{ "--card-accent": color } as React.CSSProperties}
      onClick={onClick}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden bg-black">
        <img
          src={video.thumbnail}
          alt={video.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        {/* overlay hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 w-14 h-14 rounded-full bg-white/15 backdrop-blur-sm border border-white/25 flex items-center justify-center">
            <svg
              className="w-6 h-6 text-white ml-1"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
        {/* badge catégorie */}
        <div
          className="absolute top-2.5 left-2.5 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
          style={{ background: `${color}dd`, color: "#fff" }}
        >
          {CATEGORY_ICONS[video.category]} {CATEGORY_LABELS[video.category]}
        </div>
      </div>

      {/* Infos */}
      <div className="flex flex-col gap-2 p-4 flex-1">
        <h3 className="text-sm font-semibold text-white/90 leading-snug line-clamp-2 group-hover:text-white transition-colors">
          {video.title}
        </h3>
        <p className="text-xs text-white/40">{video.channelTitle}</p>

        {/* Footer : vues + date + like */}
        <div className="mt-auto flex items-center justify-between pt-2 border-t border-white/6">
          <div className="flex items-center gap-3 text-[11px] text-white/35">
            <span>👁 {formatCount(video.viewCount)}</span>
            <span>{formatDate(video.publishedAt)}</span>
          </div>

          {/* bouton like communautaire */}
          <button
            onClick={handleLike}
            disabled={liking}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all duration-200"
            style={{
              background: video.hasLiked
                ? `${color}22`
                : "rgba(255,255,255,0.06)",
              color: video.hasLiked ? color : "rgba(255,255,255,0.4)",
              border: `1px solid ${video.hasLiked ? color + "44" : "rgba(255,255,255,0.08)"}`,
            }}
            title={video.hasLiked ? "Retirer le like" : "J'aime cette vidéo"}
          >
            <span
              className={`transition-transform ${liking ? "scale-75" : video.hasLiked ? "scale-110" : ""}`}
            >
              {video.hasLiked ? "❤️" : "🤍"}
            </span>
            {video.likesCount > 0 && video.likesCount}
          </button>
        </div>
      </div>

      {/* accent line en bas */}
      <div
        className="absolute bottom-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: `linear-gradient(90deg, ${color}, transparent)` }}
      />
    </motion.div>
  );
}

const LIMIT = 12;
