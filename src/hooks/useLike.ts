"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import type { VideoLikeResponse } from "@/types/videos";

interface UseLikeOptions {
  videoId: string;
  initialLiked?: boolean;
  initialCount: number;
  onToggle?: (videoId: string, liked: boolean, newCount: number) => void;
  onUnauthenticated?: () => void;
}

interface UseLikeReturn {
  liked: boolean;
  likesCount: number;
  liking: boolean;
  handleLike: (e?: React.MouseEvent) => Promise<void>;
}

// Logique like partagée entre VideoCard, VideoModal et VideoPageLikeButton
export function useLike({
  videoId,
  initialLiked = false,
  initialCount,
  onToggle,
  onUnauthenticated,
}: UseLikeOptions): UseLikeReturn {
  const { data: session } = useSession();
  const [liked, setLiked] = useState(initialLiked);
  const [likesCount, setLikesCount] = useState(initialCount);
  const [liking, setLiking] = useState(false);

  const handleLike = async (e?: React.MouseEvent) => {
    e?.stopPropagation();

    if (!session) {
      onUnauthenticated?.();
      return;
    }

    if (liking) return;
    setLiking(true);

    try {
      const res = await fetch(`/api/videos/${videoId}/like`, {
        method: "POST",
      });
      const data: VideoLikeResponse = await res.json();

      if (res.ok) {
        setLiked(data.liked);
        setLikesCount(data.likesCount);
        onToggle?.(videoId, data.liked, data.likesCount);
      }
    } catch {
    } finally {
      setLiking(false);
    }
  };

  return { liked, likesCount, liking, handleLike };
}
