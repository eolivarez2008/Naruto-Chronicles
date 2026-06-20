"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { VideoCard } from "@/types/videos";
import {
  CATEGORY_LABELS,
  CATEGORY_ICONS,
  CATEGORY_COLORS,
} from "@/types/videos";

interface VideoModalProps {
  videoId: string | null;
  onClose: () => void;
  onOpenPage: (id: string) => void;
  onLikeToggle: (videoId: string, liked: boolean, newCount: number) => void;
}

// ajout du composant player YouTube en mode nocookie
function YouTubePlayer({ videoId }: { videoId: string }) {
  return (
    <div className="relative w-full aspect-video bg-black rounded-t-2xl overflow-hidden">
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`}
        title="YouTube video player"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="absolute inset-0 w-full h-full"
      />
    </div>
  );
}

export default function VideoModal({
  videoId,
  onClose,
  onOpenPage,
  onLikeToggle,
}: VideoModalProps) {
  const [video, setVideo] = useState<VideoCard | null>(null);
  const [loading, setLoading] = useState(false);
  const [liking, setLiking] = useState(false);

  const isOpen = videoId !== null;

  // récupération des détails de la vidéo
  useEffect(() => {
    if (!videoId) {
      setVideo(null);
      return;
    }
    setLoading(true);
    fetch(`/api/videos/${videoId}`)
      .then((r) => r.json())
      .then(setVideo)
      .catch(() => setVideo(null))
      .finally(() => setLoading(false));
  }, [videoId]);

  // fermeture au clavier
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // lock du scroll body
  useEffect(() => {
    if (isOpen) {
      const original = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [isOpen]);

  const handleLike = async () => {
    if (!video || liking) return;
    setLiking(true);
    try {
      const res = await fetch(`/api/videos/${video.id}/like`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        setVideo((v) =>
          v ? { ...v, hasLiked: data.liked, likesCount: data.likesCount } : v,
        );
        onLikeToggle(video.id, data.liked, data.likesCount);
      }
    } catch {
    } finally {
      setLiking(false);
    }
  };

  const color = video
    ? (CATEGORY_COLORS[video.category] ?? "#ff6600")
    : "#ff6600";

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="video-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-9999 bg-black/85 backdrop-blur-sm"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="video-modal"
            initial={{ opacity: 0, y: 50, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed z-10000 inset-x-2 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 bottom-2 sm:bottom-auto sm:top-[8vh] sm:w-full sm:max-w-3xl max-h-[90dvh] bg-naruto-surface rounded-2xl border border-white/10 shadow-2xl flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* bouton fermer */}
            <button
              onClick={onClose}
              className="absolute right-3 top-3 z-10 p-2 rounded-full bg-black/60 hover:bg-black/90 border border-white/10 text-white transition-colors cursor-pointer"
              aria-label="Fermer"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            <div className="flex-1 overflow-y-auto overscroll-contain">
              {loading && (
                <div className="aspect-video bg-black flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full border-2 border-naruto-orange border-t-transparent animate-spin" />
                </div>
              )}

              {!loading && videoId && (
                <>
                  {/* ajout du player YouTube nocookie */}
                  <YouTubePlayer videoId={videoId} />

                  {/* infos vidéo */}
                  {video && (
                    <div className="p-5 space-y-3">
                      {/* titre + catégorie */}
                      <div className="flex items-start gap-3">
                        <span
                          className="shrink-0 flex items-center gap-1 mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold"
                          style={{ background: `${color}22`, color }}
                        >
                          {CATEGORY_ICONS[video.category]}{" "}
                          {CATEGORY_LABELS[video.category]}
                        </span>
                        <h2 className="text-base font-bold text-white leading-snug flex-1">
                          {video.title}
                        </h2>
                      </div>

                      <p className="text-sm text-white/40">
                        {video.channelTitle}
                      </p>

                      {/* Actions */}
                      <div className="flex items-center gap-3 pt-2 border-t border-white/8">
                        {/* Like */}
                        <button
                          onClick={handleLike}
                          disabled={liking}
                          className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all"
                          style={{
                            background: video.hasLiked
                              ? `${color}22`
                              : "rgba(255,255,255,0.06)",
                            color: video.hasLiked
                              ? color
                              : "rgba(255,255,255,0.6)",
                            border: `1px solid ${video.hasLiked ? color + "44" : "rgba(255,255,255,0.1)"}`,
                          }}
                        >
                          <span
                            className={`text-base transition-transform ${liking ? "scale-75" : video.hasLiked ? "scale-125" : ""}`}
                          >
                            {video.hasLiked ? "❤️" : "🤍"}
                          </span>
                          {video.likesCount > 0 ? video.likesCount : "J'aime"}
                        </button>

                        {/* Bouton "ouvrir la page dédiée" */}
                        <button
                          onClick={() => onOpenPage(video.id)}
                          className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold bg-white/6 text-white/60 border border-white/10 hover:bg-white/10 hover:text-white transition-all"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                            />
                          </svg>
                          Ouvrir la page
                        </button>

                        {/* Lien YouTube direct */}
                        <a
                          href={`https://www.youtube.com/watch?v=${video.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-auto flex items-center gap-1.5 text-xs text-white/25 hover:text-white/50 transition-colors"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05A6.34 6.34 0 003.15 15.3a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.79 1.53V6.77a4.85 4.85 0 01-1.02-.08z" />
                          </svg>
                          YouTube
                        </a>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
