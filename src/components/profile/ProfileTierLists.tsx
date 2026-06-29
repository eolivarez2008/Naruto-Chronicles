"use client";

import { useState } from "react";
import { LayoutGrid, Heart, Video, Sparkles } from "lucide-react";
import TierListCardItem from "@/components/tier-list/TierListCard";
import type { TierListCard } from "@/types/tierlist";
import { VideoCategory, CATEGORY_ICONS, CATEGORY_COLORS } from "@/types/videos";
import Link from "next/link";
import { trackEvent, EVENTS } from "@/lib/analytics";

type Tab = "created" | "liked" | "videos";

interface VideoLikeItem {
  video: {
    id: string;
    title: string;
    thumbnail: string;
    category: string;
  };
}

export default function ProfileTierLists({
  myCreatedLists,
  myLikedLists,
  likedVideos,
}: {
  myCreatedLists: Array<TierListCard & { tiersData: string }>;
  myLikedLists: Array<TierListCard & { tiersData: string }>;
  likedVideos: VideoLikeItem[];
}) {
  const [tab, setTab] = useState<Tab>("created");

  const tabs = [
    {
      id: "created",
      label: "Tier Lists créées",
      icon: LayoutGrid,
      count: myCreatedLists.length,
    },
    {
      id: "liked",
      label: "Tier Lists favorites",
      icon: Heart,
      count: myLikedLists.length,
    },
    {
      id: "videos",
      label: "Vidéos aimées",
      icon: Video,
      count: likedVideos.length,
    },
  ] as const;

  const handleTabChange = (id: Tab) => {
    setTab(id);
    trackEvent(EVENTS.PROFILE_TAB_SWITCH, { tab: id });
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-center p-1 bg-white/5 rounded-2xl w-fit mx-auto border border-white/5">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => handleTabChange(t.id)}
            className={`relative cursor-pointer flex items-center gap-2 px-4 sm:px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${tab === t.id ? "text-white bg-white/10 shadow-lg" : "text-white/40 hover:text-white/60"}`}
          >
            <t.icon
              className={`w-6 h-6 ${tab === t.id ? "text-naruto-orange" : ""}`}
            />
            <span className="hidden sm:inline-flex items-center gap-1.5 leading-none">
              {t.label}
            </span>
            <span>
              {t.count > 0 && (
                <span className="text-[13px] opacity-50 font-normal tabular-nums">
                  ({t.count})
                </span>
              )}
            </span>
          </button>
        ))}
      </div>

      <div className="min-h-75 transition-all duration-500">
        {tab === "created" && (
          <Grid
            items={myCreatedLists}
            emptyText="Tu n'as pas encore créé de Tier List."
          />
        )}
        {tab === "liked" && (
          <Grid
            items={myLikedLists}
            emptyText="Tes Tier Lists favorites apparaîtront ici."
          />
        )}
        {tab === "videos" && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {likedVideos.map(({ video }) => (
              <VideoCard key={video.id} video={video} />
            ))}
            {likedVideos.length === 0 && (
              <div className="col-span-full">
                <EmptyState text="Aucune vidéo aimée." />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Grid({
  items,
  emptyText,
}: {
  items: Array<TierListCard & { tiersData: string }>;
  emptyText: string;
}) {
  if (items.length === 0) return <EmptyState text={emptyText} />;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map((l, i) => (
        <TierListCardItem key={l.id} list={l} index={i} />
      ))}
    </div>
  );
}

function VideoCard({
  video,
}: {
  video: { id: string; title: string; thumbnail: string; category: string };
}) {
  const color = CATEGORY_COLORS[video.category as VideoCategory] ?? "#ff6600";
  const CategoryIcon = CATEGORY_ICONS[video.category as VideoCategory];
  return (
    <Link
      href={`/videos/${video.id}`}
      className="group space-y-3"
      onClick={() =>
        trackEvent(EVENTS.PROFILE_VIDEO_CLICK, {
          videoId: video.id,
          category: video.category,
        })
      }
    >
      <div className="aspect-video relative rounded-2xl overflow-hidden ring-1 ring-white/10 transition-transform group-hover:scale-[1.02] duration-300">
        <img
          src={video.thumbnail}
          className="w-full h-full object-cover"
          alt=""
        />
        <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
        <span
          className="absolute top-2 left-2 flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded-lg backdrop-blur-md shadow-xl text-white"
          style={{ background: `${color}cc`, border: `1px solid ${color}` }}
        >
          {CategoryIcon && <CategoryIcon size={12} />}
          <span className="uppercase tracking-wider">{video.category}</span>
        </span>
      </div>
      <p className="text-sm font-medium text-white/80 line-clamp-2 px-1 group-hover:text-naruto-orange transition-colors">
        {video.title}
      </p>
    </Link>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center space-y-4 rounded-4xl border border-dashed border-white/10 bg-white/2">
      <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-white/20">
        <Sparkles />
      </div>
      <p className="text-white/30 text-sm max-w-50 font-medium leading-relaxed">
        {text}
      </p>
    </div>
  );
}
