"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import type { TierListLikeResponse } from "@/types/tierlist";

interface UseTierListLikeOptions {
  tierListId: string;
  initialLiked?: boolean;
  initialCount: number;
  onToggle?: (id: string, liked: boolean, newCount: number) => void;
  onUnauthenticated?: () => void;
}

export function useTierListLike({
  tierListId,
  initialLiked = false,
  initialCount,
  onToggle,
  onUnauthenticated,
}: UseTierListLikeOptions) {
  const { data: session } = useSession();
  const [liked, setLiked] = useState(initialLiked);
  const [likesCount, setCount] = useState(initialCount);
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
      const res = await fetch(`/api/tier-lists/${tierListId}/like`, {
        method: "POST",
      });
      const data = (await res.json()) as TierListLikeResponse;

      if (res.ok) {
        setLiked(data.liked);
        setCount(data.likesCount);
        onToggle?.(tierListId, data.liked, data.likesCount);
      }
    } catch {
    } finally {
      setLiking(false);
    }
  };

  return { liked, likesCount, liking, handleLike };
}
