"use client";

import { useState } from "react";

interface VideoPageLikeButtonProps {
  videoId: string;
  initialLikesCount: number;
  color: string;
}

export default function VideoPageLikeButton({
  videoId,
  initialLikesCount,
  color,
}: VideoPageLikeButtonProps) {
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [liking, setLiking] = useState(false);

  const handleLike = async () => {
    if (liking) return;
    setLiking(true);
    try {
      const res = await fetch(`/api/videos/${videoId}/like`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        setLiked(data.liked);
        setLikesCount(data.likesCount);
      }
    } catch {
    } finally {
      setLiking(false);
    }
  };

  return (
    <button
      onClick={handleLike}
      disabled={liking}
      className="flex items-center gap-2.5 px-6 py-3 rounded-full font-semibold text-sm transition-all duration-200 shrink-0"
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
        {liked ? "❤️" : "🤍"}
      </span>
      <span>{likesCount > 0 ? `${likesCount} j'aime` : "J'aime"}</span>
    </button>
  );
}
