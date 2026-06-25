"use client";
import { useState } from "react";
import { useTierListLike } from "@/hooks/useTierListLike";
import LoginPromptModal from "@/components/ui/LoginPromptModal";
import { Heart } from "lucide-react";

export default function TierListPublicClient({
  tierListId,
  initialLiked,
  initialLikesCount,
  isLoggedIn,
}: {
  tierListId: string;
  initialLiked: boolean;
  initialLikesCount: number;
  isLoggedIn: boolean;
}) {
  const [showLogin, setShowLogin] = useState(false);
  const { liked, likesCount, liking, handleLike } = useTierListLike({
    tierListId,
    initialLiked,
    initialCount: initialLikesCount,
    onUnauthenticated: () => setShowLogin(true),
  });
  return (
    <>
      <button
        onClick={handleLike}
        disabled={liking}
        className="flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold transition-all cursor-pointer"
        style={{
          background: liked ? "rgba(255,102,0,0.15)" : "rgba(255,255,255,0.06)",
          color: liked ? "#ff6600" : "rgba(255,255,255,0.5)",
          border: `1px solid ${liked ? "rgba(255,102,0,0.3)" : "rgba(255,255,255,0.1)"}`,
        }}
      >
        <span
          className={`transition-transform ${liking ? "scale-75" : liked ? "scale-125" : ""}`}
        >
          <Heart size={16} fill={liked ? "currentColor" : "none"} />
        </span>
        {likesCount > 0 ? `${likesCount} j'aime` : "J'aime"}
      </button>
      <LoginPromptModal
        isOpen={showLogin}
        onClose={() => setShowLogin(false)}
      />
    </>
  );
}
