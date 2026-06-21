"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import type { VideoCard } from "@/types/videos";
import {
  CATEGORY_LABELS,
  CATEGORY_ICONS,
  CATEGORY_COLORS,
} from "@/types/videos";
import LoginPromptModal from "./LoginPromptModal";

interface VideoModalProps {
  videoId: string | null;
  onClose: () => void;
  onOpenPage: (id: string) => void;
  onLikeToggle: (videoId: string, liked: boolean, newCount: number) => void;
}

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
  const { data: session } = useSession();
  const [video, setVideo] = useState<VideoCard | null>(null);
  const [loading, setLoading] = useState(false);
  const [liking, setLiking] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  const isOpen = videoId !== null;

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

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

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
    if (!session) {
      setShowLoginPrompt(true);
      return;
    }
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
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="video-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-9999 bg-black/75 backdrop-blur-sm"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="video-modal"
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 60 }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className={[
              "fixed z-10000",
              "inset-x-2 sm:inset-x-auto",
              "bottom-1 sm:bottom-auto",
              "sm:left-1/2 sm:-translate-x-1/2",
              "top-[15vh] sm:top-[13vh]",
              "max-h-[85dvh] sm:max-h-[84dvh]",
              "sm:w-full sm:max-w-3xl",
              "bg-naruto-surface rounded-2xl border border-white/10 shadow-2xl",
              "flex flex-col overflow-hidden",
            ].join(" ")}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative shrink-0">
              <button
                onClick={onClose}
                className="absolute right-4 top-4 p-2 rounded-full bg-white/10 hover:bg-white/20 active:bg-white/30 text-white transition-colors cursor-pointer z-10001"
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
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain">
              {loading && (
                <div className="flex items-center justify-center min-h-75">
                  <div className="w-10 h-10 rounded-full border-2 border-naruto-orange border-t-transparent animate-spin" />
                </div>
              )}

              {!loading && videoId && (
                <>
                  <YouTubePlayer videoId={videoId} />

                  {video && (
                    <div className="p-4 space-y-3">
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

                      <div className="flex items-center gap-3 pt-4 border-t border-white/8">
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
                          Ouvrir
                        </button>

                        <a
                          href={`https://www.youtube.com/watch?v=${video.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-auto flex items-center gap-1.5 text-xs text-white/25 hover:text-white/50 transition-colors"
                        >
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

      <LoginPromptModal
        isOpen={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
      />
    </>
  );
}
