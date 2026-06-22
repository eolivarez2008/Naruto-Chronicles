"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BaseModal from "@/components/ui/BaseModal";
import LoginPromptModal from "@/components/ui/LoginPromptModal";
import { useLike } from "@/hooks/useLike";
import { trackEvent, EVENTS } from "@/lib/analytics";
import type { VideoCard } from "@/types/videos";
import { CATEGORY_LABELS, CATEGORY_ICONS, CATEGORY_COLORS } from "@/types/videos";

interface VideoModalProps {
  videoId: string | null;
  onClose: () => void;
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

function ModalContent({
  video,
  videoId,
  onLikeToggle,
}: {
  video: VideoCard;
  videoId: string;
  onLikeToggle: (id: string, liked: boolean, count: number) => void;
}) {
  const router = useRouter();
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const color = CATEGORY_COLORS[video.category] ?? "#ff6600";

  const { liked, likesCount, liking, handleLike } = useLike({
    videoId: video.id,
    initialLiked: video.hasLiked,
    initialCount: video.likesCount,
    onToggle: onLikeToggle,
    onUnauthenticated: () => setShowLoginPrompt(true),
  });

  return (
    <>
      <YouTubePlayer videoId={videoId} />

      <div className="p-4 space-y-3">
        <div className="flex items-start gap-3">
          <span
            className="shrink-0 flex items-center gap-1 mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold"
            style={{ background: `${color}22`, color }}
          >
            {CATEGORY_ICONS[video.category]} {CATEGORY_LABELS[video.category]}
          </span>
          <h2 className="text-base font-bold text-white leading-snug flex-1">{video.title}</h2>
        </div>

        <p className="text-sm text-white/40">{video.channelTitle}</p>

        <div className="flex items-center gap-3 pt-4 border-t border-white/8">
          <button
            onClick={handleLike}
            disabled={liking}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all cursor-pointer"
            style={{
              background: liked ? `${color}22` : "rgba(255,255,255,0.06)",
              color: liked ? color : "rgba(255,255,255,0.6)",
              border: `1px solid ${liked ? color + "44" : "rgba(255,255,255,0.1)"}`,
            }}
          >
            <span className={`text-base transition-transform ${liking ? "scale-75" : liked ? "scale-125" : ""}`}>
              {liked ? "❤️" : "🤍"}
            </span>
            {likesCount > 0 ? likesCount : "J'aime"}
          </button>

          <button
            onClick={() => router.push(`/videos/${video.id}`)}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold bg-white/6 text-white/60 border border-white/10 hover:bg-white/10 hover:text-white transition-all cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Ouvrir
          </button>

          <a
            href={`https://www.youtube.com/watch?v=${video.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto text-xs text-white/25 hover:text-white/50 transition-colors"
          >
            YouTube ↗
          </a>
        </div>
      </div>

      <LoginPromptModal isOpen={showLoginPrompt} onClose={() => setShowLoginPrompt(false)} />
    </>
  );
}

export default function VideoModal({ videoId, onClose, onLikeToggle }: VideoModalProps) {
  const [video, setVideo] = useState<VideoCard | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!videoId) { setVideo(null); return; }
    setLoading(true);
    setVideo(null);
    fetch(`/api/videos/${videoId}`)
      .then((r) => r.json())
      .then((data: VideoCard) => setVideo(data))
      .catch(() => setVideo(null))
      .finally(() => setLoading(false));
  }, [videoId]);

  useEffect(() => {
    if (videoId) trackEvent(EVENTS.VIDEO_OPEN, { videoId });
  }, [videoId]);

  return (
    <BaseModal isOpen={videoId !== null} onClose={onClose} maxWidth="sm:max-w-3xl">
      {loading && (
        <div className="flex items-center justify-center min-h-75">
          <div className="w-10 h-10 rounded-full border-2 border-naruto-orange border-t-transparent animate-spin" />
        </div>
      )}
      {!loading && videoId && video && (
        <ModalContent video={video} videoId={videoId} onLikeToggle={onLikeToggle} />
      )}
    </BaseModal>
  );
}
