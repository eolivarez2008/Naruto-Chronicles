"use client";

import React, { useState, useEffect, useDeferredValue } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import type { StoryArc, SagaKey } from "@/types/story";
import {
  SAGA_CONFIG,
  SAGA_ORDER,
  StorySortOption,
  STORY_SORT_OPTIONS,
} from "@/types/story";
import { getArcText, type ArcLang } from "@/lib/arcLang";
import { ArrowRight, Leaf, Flame, Zap, type LucideIcon } from "lucide-react";
import FilterToolbar from "@/components/ui/FilterToolbar";
import type { FilterOption } from "@/components/ui/FilterToolbar";
import TranslationBanner from "@/components/story/TranslationBanner";
import { trackEvent, EVENTS } from "@/lib/analytics";

const SAGA_ICONS: Record<SagaKey, LucideIcon> = {
  naruto: Leaf,
  shippuden: Flame,
  boruto: Zap,
};

function ArcCard({
  arc,
  color,
  lang,
}: {
  arc: StoryArc;
  color: string;
  lang: ArcLang;
}) {
  const { title, summary } = getArcText(arc, lang);

  return (
    <Link
      href={`/story/${encodeURIComponent(arc.slug)}`}
      className="group h-full"
      onClick={() =>
        trackEvent(EVENTS.STORY_ARC_OPEN, {
          slug: arc.slug,
          saga: arc.sagaKey,
          title: arc.title,
        })
      }
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
  const [sort, setSort] = useState<StorySortOption>("chronologique");
  const [activeSaga, setActiveSaga] = useState<SagaKey | "all">("all");
  const [lang, setLang] = useState<ArcLang>("fr");

  const search = useDeferredValue(searchRaw.toLowerCase().trim());

  const hasFr = arcs.some((a) => a.titleFr && a.summaryFr);

  const sagaFilterOptions: FilterOption[] = [
    { id: "all", label: "Toutes les sagas" },
    ...SAGA_ORDER.map((key) => ({
      id: key,
      label: SAGA_CONFIG[key].label,
      icon: SAGA_ICONS[key],
      color: SAGA_CONFIG[key].color,
    })),
  ];

  const handleLangToggle = (l: ArcLang) => {
    setLang(l);
    trackEvent(EVENTS.STORY_LANG_TOGGLE, { lang: l });
  };

  const handleSortChange = (v: string) => {
    setSort(v as StorySortOption);
    trackEvent(EVENTS.STORY_SORT, { sort: v });
  };

  const handleFilterChange = (v: string) => {
    setActiveSaga(v as SagaKey | "all");
    trackEvent(EVENTS.STORY_FILTER, { saga: v });
  };

  const handleSearchChange = (v: string) => {
    setSearchRaw(v);
    if (v.length > 2) trackEvent(EVENTS.STORY_SEARCH, { query: v });
  };

  const filtered = arcs
    .filter((arc) => {
      if (activeSaga !== "all" && arc.sagaKey !== activeSaga) return false;
      if (search) {
        const t = getArcText(arc, lang);
        return (
          t.title.toLowerCase().includes(search) ||
          t.summary.toLowerCase().includes(search)
        );
      }
      return true;
    })
    .sort((a, b) => {
      if (sort === "alpha_asc") {
        return getArcText(a, lang).title.localeCompare(
          getArcText(b, lang).title,
        );
      }
      if (sort === "alpha_desc") {
        return getArcText(b, lang).title.localeCompare(
          getArcText(a, lang).title,
        );
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
      <FilterToolbar
        searchValue={searchRaw}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Rechercher un arc…"
        sortOptions={STORY_SORT_OPTIONS}
        sortValue={sort}
        onSortChange={handleSortChange}
        filterOptions={sagaFilterOptions}
        filterValue={activeSaga}
        onFilterChange={handleFilterChange}
      />

      <div className="mb-6">
        <TranslationBanner
          lang={lang}
          hasFr={hasFr}
          onToggle={handleLangToggle}
        />
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
                        lang={lang}
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
                  lang={lang}
                />
              ))}
        </div>
      )}
    </div>
  );
}
