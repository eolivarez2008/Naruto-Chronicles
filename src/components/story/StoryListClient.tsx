"use client";

import React, { useState, useRef, useEffect, useDeferredValue } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import type { StoryArc, SagaKey } from "@/types/story";
import { SAGA_CONFIG, SAGA_ORDER } from "@/types/story";
import { getArcText } from "@/lib/arcLang";
import {
  Search,
  SlidersHorizontal,
  ChevronDown,
  Check,
  X,
  ArrowRight,
  Filter,
  Leaf,
  Flame,
  Zap,
  type LucideIcon,
} from "lucide-react";

type SortOption = "chronologique" | "alpha_asc" | "alpha_desc";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "chronologique", label: "Ordre chronologique" },
  { value: "alpha_asc", label: "Nom (A–Z)" },
  { value: "alpha_desc", label: "Nom (Z–A)" },
];

const SAGA_ICONS: Record<SagaKey, LucideIcon> = {
  naruto: Leaf,
  shippuden: Flame,
  boruto: Zap,
};

function ArcCard({ arc, color }: { arc: StoryArc; color: string }) {
  const { title, summary } = getArcText(arc, "fr");
  return (
    <Link
      href={`/story/${encodeURIComponent(arc.slug)}`}
      className="group h-full"
    >
      <article className="relative h-full flex flex-col bg-white/3 hover:bg-white/6 border border-white/10 rounded-2xl overflow-hidden transition-all duration-300 hover:border-white/20 hover:translate-x-1 shadow-lg p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {(() => {
              const SagaIcon = SAGA_ICONS[arc.sagaKey];
              return SagaIcon ? <SagaIcon size={14} style={{ color }} /> : null;
            })()}
            <span
              className="text-[10px] font-black uppercase tracking-widest"
              style={{ color }}
            >
              {SAGA_CONFIG[arc.sagaKey].label}
            </span>
          </div>
          <div
            className="absolute top-4 right-4 flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] sm:px-2 sm:py-0.5 sm:text-[11px] font-black shadow-lg z-20"
            style={{ backgroundColor: color, color: "#fff" }}
          >
            {(() => {
              const SagaIcon = SAGA_ICONS[arc.sagaKey];
              return SagaIcon ? (
                <SagaIcon size={10} className="sm:w-3 sm:h-3 shrink-0" />
              ) : null;
            })()}
            <span>{String(arc.order + 1).padStart(2, "0")}</span>
          </div>
          <div
            className="absolute left-0 top-0 bottom-0 w-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ backgroundColor: color }}
          />
        </div>

        <h3 className="text-lg sm:text-xl font-bold text-white leading-tight mb-2 line-clamp-2 group-hover:text-white">
          {title}
        </h3>

        <p className="text-white/40 text-xs sm:text-sm leading-relaxed line-clamp-3 mb-4">
          {summary}
        </p>

        <div className="mt-auto flex items-center justify-between">
          <span
            className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest transition-all"
            style={{ color }}
          >
            Découvrir
            <ArrowRight
              size={14}
              className="transition-transform group-hover:translate-x-1"
            />
          </span>
        </div>
      </article>
    </Link>
  );
}

function SagaDivider({ sagaKey, count }: { sagaKey: SagaKey; count: number }) {
  const config = SAGA_CONFIG[sagaKey];
  return (
    <div className="col-span-full flex items-center gap-4 py-8">
      <div className="flex items-center gap-3 shrink-0">
        <div
          className="w-1.5 h-6 rounded-full"
          style={{ backgroundColor: config.color }}
        />
        <h2
          className="text-lg font-black uppercase tracking-[0.2em]"
          style={{ color: config.color }}
        >
          {config.label}
        </h2>
      </div>
      <div className="h-px flex-1 bg-white/20" />
      <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">
        {count} Arcs
      </span>
    </div>
  );
}

export default function StoryListClient({ arcs }: { arcs: StoryArc[] }) {
  const [searchRaw, setSearchRaw] = useState("");
  const [sort, setSort] = useState<SortOption>("chronologique");
  const [activeSaga, setActiveSaga] = useState<SagaKey | "all">("all");
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isSagaOpen, setIsSagaOpen] = useState(false);

  const sortMenuRef = useRef<HTMLDivElement>(null);
  const sagaMenuRef = useRef<HTMLDivElement>(null);
  const search = useDeferredValue(searchRaw.toLowerCase().trim());
  const currentSortLabel =
    SORT_OPTIONS.find((opt) => opt.value === sort)?.label ??
    "Ordre chronologique";

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        sortMenuRef.current &&
        !sortMenuRef.current.contains(e.target as Node)
      )
        setIsSortOpen(false);
      if (
        sagaMenuRef.current &&
        !sagaMenuRef.current.contains(e.target as Node)
      )
        setIsSagaOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      sessionStorage.setItem("storyScrollY", String(window.scrollY));
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const filtered = arcs
    .filter((arc) => {
      if (activeSaga !== "all" && arc.sagaKey !== activeSaga) return false;

      if (search) {
        const t = getArcText(arc, "fr");

        const matches =
          t.title.toLowerCase().includes(search) ||
          t.summary.toLowerCase().includes(search);

        if (!matches) return false;
      }

      return true;
    })
    .sort((a, b) => {
      if (sort === "alpha_asc") {
        const aTitle = getArcText(a, "fr").title;
        const bTitle = getArcText(b, "fr").title;
        return aTitle.localeCompare(bTitle);
      }
      if (sort === "alpha_desc") {
        const aTitle = getArcText(a, "fr").title;
        const bTitle = getArcText(b, "fr").title;
        return bTitle.localeCompare(aTitle);
      }
      const sagaDiff =
        SAGA_ORDER.indexOf(a.sagaKey) - SAGA_ORDER.indexOf(b.sagaKey);
      return sagaDiff !== 0 ? sagaDiff : a.order - b.order;
    });

  const showGroups = sort === "chronologique" && !search;
  const sagasWithResults = SAGA_ORDER.filter((key) =>
    filtered.some((a) => a.sagaKey === key),
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 pt-3">
      <div className="relative z-110 mb-8 flex flex-wrap gap-2 sm:gap-3 items-center bg-[#050505]/80 backdrop-blur-md px-3 sm:px-4 py-2.5 sm:py-3 rounded-2xl border border-white/10">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25"
          />
          <input
            type="text"
            value={searchRaw}
            onChange={(e) => setSearchRaw(e.target.value)}
            placeholder="Rechercher un arc…"
            className="w-full bg-white/5 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-orange-500/40 transition-all"
          />
          {searchRaw && (
            <button
              onClick={() => setSearchRaw("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50 cursor-pointer"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="relative" ref={sortMenuRef}>
          <button
            onClick={() => setIsSortOpen((v) => !v)}
            className="flex items-center justify-between gap-2 bg-white/5 rounded-xl px-3 py-2 text-sm text-white/80 hover:bg-white/10 transition-all cursor-pointer whitespace-nowrap min-w-12.5 sm:min-w-55"
          >
            <span className="flex items-center gap-2 overflow-hidden text-left">
              <SlidersHorizontal size={16} className="text-white/50 shrink-0" />
              <span className="hidden sm:inline truncate">
                {currentSortLabel}
              </span>
            </span>
            <ChevronDown
              size={12}
              className={`text-white/30 transition-transform shrink-0 ${isSortOpen ? "rotate-180" : ""}`}
            />
          </button>
          <AnimatePresence>
            {isSortOpen && (
              <motion.ul
                initial={{ opacity: 0, y: -6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.97 }}
                className="absolute top-full right-0 mt-2 w-55 bg-[#141414] border border-white/10 rounded-xl overflow-hidden shadow-xl z-20"
              >
                {SORT_OPTIONS.map((opt) => (
                  <li key={opt.value}>
                    <button
                      onClick={() => {
                        setSort(opt.value);
                        setIsSortOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-4 py-2.5 text-sm text-left transition-colors cursor-pointer ${sort === opt.value ? "text-naruto-orange bg-naruto-orange/10" : "text-white/70 hover:bg-white/5 hover:text-white"}`}
                    >
                      {opt.label}
                      {sort === opt.value && <Check size={14} />}
                    </button>
                  </li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>

        <div className="relative" ref={sagaMenuRef}>
          <button
            onClick={() => setIsSagaOpen((v) => !v)}
            className="flex items-center justify-between gap-2 bg-white/5 rounded-xl px-3 py-2 text-sm text-white/80 hover:bg-white/10 transition-all cursor-pointer whitespace-nowrap min-w-12.5 sm:min-w-60"
          >
            <span className="flex items-center gap-2 overflow-hidden text-left">
              {activeSaga === "all" ? (
                <Filter size={16} className="text-white/50 shrink-0" />
              ) : (
                (() => {
                  const SagaIcon = SAGA_ICONS[activeSaga];
                  const sagaColor = SAGA_CONFIG[activeSaga]?.color ?? "#fff";
                  return SagaIcon ? (
                    <SagaIcon
                      size={16}
                      className="shrink-0"
                      style={{ color: sagaColor }}
                    />
                  ) : null;
                })()
              )}
              <span className="hidden sm:inline truncate">
                {activeSaga === "all"
                  ? "Toutes les sagas"
                  : (SAGA_CONFIG[activeSaga]?.label ?? "Toutes les sagas")}
              </span>
            </span>
            <ChevronDown
              size={12}
              className={`text-white/30 transition-transform shrink-0 ${isSagaOpen ? "rotate-180" : ""}`}
            />
          </button>
          <AnimatePresence>
            {isSagaOpen && (
              <motion.ul
                initial={{ opacity: 0, y: -6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.97 }}
                className="absolute top-full right-0 mt-2 w-60 bg-[#141414] border border-white/10 rounded-xl overflow-hidden shadow-xl z-20"
              >
                <li>
                  <button
                    onClick={() => {
                      setActiveSaga("all");
                      setIsSagaOpen(false);
                    }}
                    className={`w-full flex items-center justify-between gap-2 px-4 py-3 text-sm text-left transition-colors cursor-pointer ${activeSaga === "all" ? "text-naruto-orange bg-naruto-orange/10" : "text-white/70 hover:bg-white/5 hover:text-white"}`}
                  >
                    <span className="flex items-center gap-2">
                      <Filter
                        size={14}
                        className={
                          activeSaga === "all"
                            ? "text-naruto-orange"
                            : "text-white/70"
                        }
                      />
                      Toutes les sagas
                    </span>
                    {activeSaga === "all" && <Check size={14} />}
                  </button>
                </li>
                {SAGA_ORDER.map((key) => {
                  const config = SAGA_CONFIG[key];
                  const SagaIcon = SAGA_ICONS[key];
                  return (
                    <li key={key}>
                      <button
                        onClick={() => {
                          setActiveSaga(key);
                          setIsSagaOpen(false);
                        }}
                        className={`w-full flex items-center justify-between gap-2 px-4 py-3 text-sm text-left transition-colors cursor-pointer ${activeSaga === key ? "text-naruto-orange bg-naruto-orange/10" : "text-white/70 hover:bg-white/5 hover:text-white"}`}
                      >
                        <span className="flex items-center gap-2">
                          {SagaIcon && (
                            <SagaIcon
                              size={14}
                              className="shrink-0"
                              style={{ color: config.color }}
                            />
                          )}
                          {config.label}
                        </span>
                        {activeSaga === key && <Check size={14} />}
                      </button>
                    </li>
                  );
                })}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10">
          <p className="text-white/20 italic">
            Aucun arc ne correspond à votre recherche.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {showGroups
            ? sagasWithResults.map((key) => {
                const sagaArcs = filtered.filter((a) => a.sagaKey === key);
                return (
                  <React.Fragment key={key}>
                    <SagaDivider sagaKey={key} count={sagaArcs.length} />
                    {sagaArcs.map((arc) => (
                      <ArcCard
                        key={arc.id}
                        arc={arc}
                        color={SAGA_CONFIG[arc.sagaKey].color}
                      />
                    ))}
                  </React.Fragment>
                );
              })
            : filtered.map((arc) => (
                <ArcCard
                  key={arc.id}
                  arc={arc}
                  color={SAGA_CONFIG[arc.sagaKey].color}
                />
              ))}
        </div>
      )}
    </div>
  );
}
