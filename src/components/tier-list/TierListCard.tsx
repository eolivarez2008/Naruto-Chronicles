"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useTierListLike } from "@/hooks/useTierListLike";
import LoginPromptModal from "@/components/ui/LoginPromptModal";
import SafeImage from "@/components/ui/SafeImage";
import type { TierListCard, TierRank } from "@/types/tierlist";

interface TierListCardProps {
  list: TierListCard & { tiersData?: string };
  index?: number;
  onLikeToggle?: (id: string, liked: boolean, newCount: number) => void;
}

interface EnrichedTier extends TierRank {
  characterImages?: Array<{ id: number; image: string | null; name: string }>;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);
  if (mins < 60) return `${mins}min`;
  if (hours < 24) return `${hours}h`;
  if (days < 30) return `${days}j`;
  return new Date(iso).toLocaleDateString("fr-FR", {
    month: "short",
    year: "numeric",
  });
}

function TierMiniPreview({ tiersData }: { tiersData?: string }) {
  if (!tiersData) return <EmptyPreview />;

  let tiers: EnrichedTier[] = [];
  try {
    const parsed = JSON.parse(tiersData) as unknown;
    if (!Array.isArray(parsed)) return <EmptyPreview />;
    tiers = parsed.filter(
      (t): t is EnrichedTier =>
        t !== null &&
        typeof t === "object" &&
        Array.isArray((t as EnrichedTier).characterIds),
    );
  } catch {
    return <EmptyPreview />;
  }

  const nonEmpty = tiers.filter((t) => t.characterIds.length > 0).slice(0, 5);
  if (nonEmpty.length === 0) return <EmptyPreview />;

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      {nonEmpty.map((tier) => {
        const images = Array.isArray(tier.characterImages)
          ? tier.characterImages
          : [];
        const slots = images.length > 0 ? images.slice(0, 7) : [];

        return (
          <div
            key={tier.id ?? Math.random()}
            className="flex items-stretch flex-1 min-h-0"
          >
            <div
              className="flex items-center justify-center shrink-0 w-7"
              style={{
                backgroundColor: `${tier.color ?? "#666"}25`,
                borderRight: `2px solid ${tier.color ?? "#666"}80`,
              }}
            >
              <span
                className="font-black text-[9px] leading-none"
                style={{ color: tier.color ?? "#666" }}
              >
                {tier.label ?? "?"}
              </span>
            </div>
            <div className="flex items-center gap-px px-0.5 flex-1 min-w-0 bg-[#0d0d0d] overflow-hidden">
              {slots.map((chr) => (
                <div
                  key={chr.id}
                  className="h-full aspect-square shrink-0 overflow-hidden"
                >
                  <SafeImage
                    src={chr.image}
                    alt={chr.name}
                    className="w-full h-full object-cover object-top"
                    loading="lazy"
                  />
                </div>
              ))}
              {slots.length === 0 &&
                tier.characterIds
                  .slice(0, 7)
                  .map((id) => (
                    <div
                      key={id}
                      className="h-full aspect-square bg-white/5 shrink-0"
                    />
                  ))}
              {tier.characterIds.length > 7 && (
                <div className="h-full aspect-square bg-white/3 shrink-0 flex items-center justify-center">
                  <span className="text-[8px] text-white/25">
                    +{tier.characterIds.length - 7}
                  </span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function EmptyPreview() {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <p className="text-white/15 text-[11px]">Tier list vide</p>
    </div>
  );
}

export default function TierListCardItem({
  list,
  index = 0,
  onLikeToggle,
}: TierListCardProps) {
  const [showLogin, setShowLogin] = useState(false);

  const { liked, likesCount, liking, handleLike } = useTierListLike({
    tierListId: list.id,
    initialLiked: list.hasLiked,
    initialCount: list.likesCount,
    onToggle: onLikeToggle,
    onUnauthenticated: () => setShowLogin(true),
  });

  const avatarSrc = list.author.avatarSnapshot ?? list.author.image ?? null;
  const initials =
    list.author.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ?? "?";

  return (
    <>
      <motion.div
        layout="position"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18, delay: Math.min(index % 12, 8) * 0.04 }}
        className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/8 bg-[#0d0d0d] hover:border-white/15 transition-colors duration-300"
      >
        <Link href={`/tier-list/${list.id}`} className="block">
          <div className="relative h-36 overflow-hidden bg-[#0d0d0d] border-b border-white/5">
            <TierMiniPreview tiersData={list.tiersData} />
            <div className="absolute inset-x-0 bottom-0 h-6 bg-linear-to-t from-[#0d0d0d] to-transparent pointer-events-none" />
          </div>
        </Link>

        <div className="flex items-center gap-2 px-3 py-2.5">
          <div className="w-5 h-5 rounded-full overflow-hidden border border-white/10 shrink-0">
            {avatarSrc ? (
              <SafeImage
                src={avatarSrc}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-naruto-orange/20 flex items-center justify-center text-[7px] font-bold text-naruto-orange">
                {initials}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <Link href={`/tier-list/${list.id}`}>
              <p className="text-xs font-bold text-white/80 truncate group-hover:text-white transition-colors leading-tight">
                {list.title}
              </p>
            </Link>
            <p className="text-[10px] text-white/25 leading-tight">
              {list.author.name?.split(" ")[0] ?? "Anonyme"} ·{" "}
              {timeAgo(list.createdAt)}
            </p>
          </div>

          <button
            onClick={handleLike}
            disabled={liking}
            className="flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold transition-all duration-200 cursor-pointer shrink-0"
            style={{
              background: liked
                ? "rgba(255,102,0,0.12)"
                : "rgba(255,255,255,0.04)",
              color: liked ? "#ff6600" : "rgba(255,255,255,0.30)",
              border: `1px solid ${liked ? "rgba(255,102,0,0.25)" : "rgba(255,255,255,0.06)"}`,
            }}
          >
            <span
              className={`transition-transform text-xs ${liking ? "scale-75" : liked ? "scale-110" : ""}`}
            >
              {liked ? "❤️" : "🤍"}
            </span>
            {likesCount > 0 && <span>{likesCount}</span>}
          </button>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity bg-linear-to-r from-naruto-orange to-transparent" />
      </motion.div>

      <LoginPromptModal
        isOpen={showLogin}
        onClose={() => setShowLogin(false)}
      />
    </>
  );
}
