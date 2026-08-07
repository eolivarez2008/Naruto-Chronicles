"use client";

import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import GlassCard from "@/components/ui/GlassCard";
import { Star, Tv, BookOpen } from "lucide-react";

export type SagaType = "anime" | "manga";

export interface SagaData {
  type: SagaType | string;
  label: string;
  synopsisFr: string;
  image: string;
  status: string;
  score: number | null;
  creator: string;
  episodes: number | null;
  chapters: number | null;
  volumes: number | null;
  year: number | null;
}

function formatUnits(saga: SagaData): string {
  const normalizedType = saga.type?.toLowerCase().trim();
  if (normalizedType === "anime") {
    return saga.episodes != null ? `${saga.episodes} épisodes` : "? épisodes";
  }
  const chapters =
    saga.chapters != null ? `${saga.chapters} chap.` : "? chap.";
  const volumes =
    saga.volumes != null ? `${saga.volumes} vol.` : "? vol.";
  return `${chapters} ${volumes}`;
}

function SagaCard({ saga, index }: { saga: SagaData; index: number }) {
  const normalizedType = saga.type?.toLowerCase().trim();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25, delay: index * 0.05 }}
    >
      <GlassCard className="group relative h-full flex flex-row overflow-hidden border border-white/10 bg-white-3 hover:translate-x-1 hover:bg-white/6 hover:border-white/20 transition-all duration-300">
        <div className="relative w-28 sm:w-36 aspect-[2/3] shrink-0 overflow-hidden border-r border-white/8">
          <Image
            src={saga.image}
            alt={saga.label}
            fill
            sizes="(max-width: 640px) 120px, 150px"
            unoptimized
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-black/20" />

          <span
            className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-black backdrop-blur-sm"
            style={{ background: "rgba(0,0,0,0.6)", color: "#facc15" }}
          >
            <Star size={11} fill="currentColor" />
            {saga.score ?? "-"}
          </span>
        </div>

        <div className="flex flex-col p-4 flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 mb-3">
            <h3 className="text-lg sm:text-xl font-bold text-naruto-orange leading-tight font-syne italic drop-shadow-lg line-clamp-2">
              {saga.label}
            </h3>

            <span
              className={`shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black border border-white/10 ${
                saga.status === "En cours"
                  ? "bg-naruto-orange/15 text-naruto-orange border-naruto-orange/30"
                  : "bg-green-500/15 text-green-400 border-green-500/30"
              }`}
            >
              {saga.status}
            </span>
          </div>

          <div className="grid grid-cols-[2fr_2fr_1fr] gap-2 pb-3 mb-3 border-b border-white/8">
            <div className="min-w-0">
              <p className="text-[9px] uppercase text-white/30 font-black tracking-widest mb-0.5 truncate">
                Auteur
              </p>
              <p className="text-xs font-bold text-white/85 truncate">
                {saga.creator ?? "-"}
              </p>
            </div>
            <div className="min-w-0">
              <p className="text-[9px] uppercase text-white/30 font-black tracking-widest mb-0.5 truncate">
                {normalizedType === "anime" ? "Épisodes" : "Chap. / Vol."}
              </p>
              <p className="text-xs font-bold text-white/85 truncate">
                {formatUnits(saga)}
              </p>
            </div>
            <div className="min-w-0">
              <p className="text-[9px] uppercase text-white/30 font-black tracking-widest mb-0.5 truncate">
                Année
              </p>
              <p className="text-xs font-bold text-white/85 truncate">
                {saga.year ?? "-"}
              </p>
            </div>
          </div>

          <div className="relative flex-1">
            <p className="text-white/60 text-xs sm:text-[13px] leading-relaxed italic">
              {saga.synopsisFr}
            </p>
          </div>
        </div>
        <div
          className="absolute left-0 top-0 bottom-0 w-0.5 opacity-0 group-hover:opacity-100 transition-opacity bg-naruto-orange"
        />
      </GlassCard>
    </motion.div>
  );
}

export default function SagaSection({ sagas }: { sagas: SagaData[] }) {
  const hasAnime = useMemo(
    () => sagas.some((s) => s.type?.toLowerCase().trim() === "anime"),
    [sagas]
  );
  const hasManga = useMemo(
    () => sagas.some((s) => s.type?.toLowerCase().trim() === "manga"),
    [sagas]
  );

  const [activeType, setActiveType] = useState<SagaType>("anime");

  useEffect(() => {
    if (!hasAnime && hasManga) {
      setActiveType("manga");
    } else if (hasAnime) {
      setActiveType("anime");
    }
  }, [hasAnime, hasManga]);

  const filtered = useMemo(
    () =>
      sagas.filter((s) => s.type?.toLowerCase().trim() === activeType),
    [sagas, activeType]
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-b border-white/6 mb-8">
        <div className="flex justify-center">
            {(["anime", "manga"] as SagaType[]).map((type) => {
            const disabled = type === "anime" ? !hasAnime : !hasManga;
            const isActive = activeType === type;
            const TypeIcon = type === "anime" ? Tv : BookOpen;
            return (
                <button
                key={type}
                onClick={() => !disabled && setActiveType(type)}
                disabled={disabled}
                className={[
                    "relative flex items-center gap-2 px-4 sm:px-6 py-3 text-sm font-semibold transition-all cursor-pointer disabled:opacity-25 disabled:cursor-not-allowed",
                    isActive ? "text-white" : "text-white/40 hover:text-white/65",
                ].join(" ")}
                >
                <TypeIcon
                    className={`w-4 h-4 ${isActive ? "text-naruto-orange" : ""}`}
                />
                <span>{type === "anime" ? "Anime" : "Manga"}</span>
                {isActive && (
                    <motion.div
                    layoutId="saga-tab-underline"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-naruto-orange rounded-full"
                    />
                )}
                </button>
            );
            })}
        </div>
        </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeType}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6"
        >
          {filtered.map((saga, i) => (
            <SagaCard key={i} saga={saga} index={i} />
          ))}
        </motion.div>
      </AnimatePresence>

      {filtered.length === 0 && (
        <div className="text-center py-20 text-white/20 text-sm">
          Aucune saga disponible pour ce format.
        </div>
      )}
    </div>
  );
}