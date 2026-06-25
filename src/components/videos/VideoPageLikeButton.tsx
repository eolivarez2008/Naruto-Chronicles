"use client";

import { useState } from "react";
import { useLike } from "@/hooks/useLike";
import LoginPromptModal from "@/components/ui/LoginPromptModal";
import { Heart } from "lucide-react";

interface VideoPageLikeButtonProps {
  videoId: string;
  initialLikesCount: number;
  initialLiked?: boolean;
  color: string;
}

export default function VideoPageLikeButton({
  videoId,
  initialLikesCount,
  initialLiked = false,
  color,
}: VideoPageLikeButtonProps) {
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  const { liked, likesCount, liking, handleLike } = useLike({
    videoId,
    initialLiked,
    initialCount: initialLikesCount,
    onUnauthenticated: () => setShowLoginPrompt(true),
  });

  return (
    <>
      <button
        onClick={handleLike}
        disabled={liking}
        className="flex items-center gap-2.5 px-6 py-3 rounded-full font-semibold text-sm transition-all duration-200 shrink-0 cursor-pointer"
        style={{
          background: liked ? `${color}22` : "rgba(255,255,255,0.06)",
          color: liked ? color : "rgba(255,255,255,0.6)",
          border: `1px solid ${liked ? color + "44" : "rgba(255,255,255,0.1)"}`,
          boxShadow: liked ? `0 0 20px ${color}22` : "none",
        }}
      >
        <span
          className={`text-lg transition-transform duration-200 ${liking ? "scale-75" : liked ? "scale-125" : ""}`}
        >
          <Heart size={16} fill={liked ? "currentColor" : "none"} />
        </span>
        <span>{likesCount > 0 ? `${likesCount} j'aime` : "J'aime"}</span>
      </button>

      <LoginPromptModal
        isOpen={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
      />
    </>
  );
}
