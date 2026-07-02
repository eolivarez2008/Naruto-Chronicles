"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { trackEvent, EVENTS } from "@/lib/analytics";
import VideoCardItem from "@/components/videos/VideoCard";
import VideoModal from "@/components/videos/VideoModal";
import TierListCardItem from "@/components/tier-list/TierListCard";
import CharacterModal from "@/components/character/CharacterModal";
import { CharacterCardItem } from "@/components/character/CharacterListClient";
import type { VideoCard } from "@/types/videos";
import type { TierListCard } from "@/types/tierlist";
import type { CharacterCard } from "@/types/characters";

// ─── Section Header ───────────────────────────────────────────────────────────

function SectionHeader({
  eyebrow,
  title,
  href,
  hrefLabel,
}: {
  eyebrow: string;
  title: string;
  href: string;
  hrefLabel: string;
}) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <p className="text-naruto-orange text-[10px] font-black uppercase tracking-[0.3em] mb-1">
          {eyebrow}
        </p>
        <h2
          className="text-2xl sm:text-3xl font-black text-white leading-none"
          style={{ fontFamily: "'Syne', sans-serif" }}
        >
          {title}
        </h2>
        <div className="accent-line w-14 mt-2 mb-0" />
      </div>
      <Link
        href={href}
        className="flex items-center gap-1.5 text-xs font-semibold text-white/40 hover:text-naruto-orange transition-colors group"
      >
        {hrefLabel}
        <ArrowRight
          size={14}
          className="group-hover:translate-x-0.5 transition-transform"
        />
      </Link>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonRow({ cols, aspect }: { cols: number; aspect: string }) {
  return (
    <div
      className="grid gap-4"
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
    >
      {Array.from({ length: cols }).map((_, i) => (
        <div
          key={i}
          className={`rounded-2xl bg-white/4 overflow-hidden animate-pulse ${aspect}`}
        />
      ))}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function HomeDynamic() {
  const [videos, setVideos] = useState<VideoCard[]>([]);
  const [tierLists, setTierLists] = useState<
    Array<TierListCard & { tiersData: string }>
  >([]);
  const [characters, setCharacters] = useState<CharacterCard[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [selectedCharId, setSelectedCharId] = useState<number | null>(null);

  const toggleVideoLike = useCallback(
    (videoId: string, liked: boolean, newCount: number) => {
      setVideos((prev) =>
        prev.map((v) =>
          v.id === videoId
            ? { ...v, hasLiked: liked, likesCount: newCount }
            : v,
        ),
      );
    },
    [],
  );

  const toggleTierLike = useCallback(
    (id: string, liked: boolean, newCount: number) => {
      setTierLists((prev) =>
        prev.map((l) =>
          l.id === id ? { ...l, hasLiked: liked, likesCount: newCount } : l,
        ),
      );
    },
    [],
  );

  useEffect(() => {
    Promise.all([
      fetch("/api/videos?limit=3&sort=popular").then((r) => r.json()),
      fetch("/api/tier-lists?limit=4&sort=popular").then((r) => r.json()),
      fetch("/api/characters?limit=6&sort=popularity").then((r) => r.json()),
    ])
      .then(([vData, tData, cData]) => {
        setVideos(vData.data ?? []);
        setTierLists(tData.data ?? []);
        setCharacters(cData.data ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-6 space-y-16 pb-20">
        <div className="space-y-4">
          <div className="h-6 w-40 bg-white/5 rounded animate-pulse" />
          <SkeletonRow cols={3} aspect="aspect-video" />
        </div>
        <div className="space-y-4">
          <div className="h-6 w-44 bg-white/5 rounded animate-pulse" />
          <SkeletonRow cols={4} aspect="h-36" />
        </div>
        <div className="space-y-4">
          <div className="h-6 w-48 bg-white/5 rounded animate-pulse" />
          <SkeletonRow cols={6} aspect="aspect-3/4" />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-6xl mx-auto px-6 space-y-16 pb-20">
        {/* Vidéos Populaires */}
        {videos.length > 0 && (
          <section>
            <SectionHeader
              eyebrow="Fan-Hub"
              title="Les vidéos les plus appéciées"
              href="/videos"
              hrefLabel="Plus"
            />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <AnimatePresence mode="popLayout" initial={false}>
                {videos.map((video, i) => (
                  <VideoCardItem
                    key={video.id}
                    video={video}
                    index={i}
                    onClick={() => setSelectedVideoId(video.id)}
                    onLikeToggle={toggleVideoLike}
                  />
                ))}
              </AnimatePresence>
            </div>
          </section>
        )}

        {/* Tier Lists populaires */}
        {tierLists.length > 0 && (
          <section>
            <SectionHeader
              eyebrow="Communauté"
              title=" Les Tier Lists populaires"
              href="/tier-list"
              hrefLabel="Découvrir"
            />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <AnimatePresence mode="popLayout" initial={false}>
                {tierLists.map((list, i) => (
                  <TierListCardItem
                    key={list.id}
                    list={list}
                    index={i}
                    onLikeToggle={toggleTierLike}
                  />
                ))}
              </AnimatePresence>
            </div>
          </section>
        )}

        {/* Personnages populaires */}
        {characters.length > 0 && (
          <section>
            <SectionHeader
              eyebrow="Encyclopédie"
              title=" Les Personnages favoris"
              href="/characters"
              hrefLabel="Explorer"
            />
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {characters.map((char, i) => (
                <CharacterCardItem
                  key={char.id}
                  character={char}
                  index={i}
                  onClick={() => {
                    trackEvent(EVENTS.CHARACTER_OPEN, {
                      characterId: char.id,
                      name: char.name,
                    });
                    setSelectedCharId(char.id);
                  }}
                />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Modals */}
      <VideoModal
        videoId={selectedVideoId}
        onClose={() => setSelectedVideoId(null)}
        onLikeToggle={toggleVideoLike}
      />

      <CharacterModal
        characterId={selectedCharId}
        onClose={() => setSelectedCharId(null)}
      />
    </>
  );
}
