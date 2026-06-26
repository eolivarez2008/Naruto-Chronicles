"use client";

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  useDeferredValue,
} from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import type { CharacterCard, CharactersApiResponse } from "@/types/characters";
import { trackEvent, EVENTS } from "@/lib/analytics";
import CharacterModal from "@/components/character/CharacterModal";
import { normalizeString } from "@/lib/network";
import {
  ChevronDown,
  SlidersHorizontal,
  Leaf,
  Search,
  Check,
  Filter,
  BookOpen,
  Zap,
  Shield,
  Flame,
  Crown,
  type LucideIcon,
} from "lucide-react";

const LIMIT = 40;
const FALLBACK = "/logo/favicon-naruto.png";

type SortField = "popularity" | "name_asc" | "name_desc";
type RankType = "" | "Academy Student" | "Genin" | "Chūnin" | "Jōnin" | "Kage";

const RANK_OPTIONS: RankType[] = [
  "Academy Student",
  "Genin",
  "Chūnin",
  "Jōnin",
  "Kage",
];

const RANK_COLORS: Record<RankType, string> = {
  "": "#ffffff",
  "Academy Student": "#10b981",
  Genin: "#3b82f6",
  Chūnin: "#eab308",
  Jōnin: "#f97316",
  Kage: "#ef4444",
};

const RANK_ICONS: Record<RankType, LucideIcon | null> = {
  "": Filter,
  "Academy Student": BookOpen,
  Genin: Zap,
  Chūnin: Shield,
  Jōnin: Flame,
  Kage: Crown,
};

const SORT_OPTIONS: { value: SortField; label: string }[] = [
  { value: "popularity", label: "Popularité" },
  { value: "name_asc", label: "Nom (A-Z)" },
  { value: "name_desc", label: "Nom (Z-A)" },
];

const getRankColor = (rankVal: RankType | ""): string => {
  if (!rankVal) return "#ffffff";
  return RANK_COLORS[rankVal] ?? "#ffffff";
};

// ─── Hook chargement liste ────────────────────────────────────────────────────

function useCharacters(search: string, rank: RankType, sort: SortField) {
  const [characters, setCharacters] = useState<CharacterCard[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const fetchPage = useCallback(
    async (pageNum: number) => {
      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);

      const params = new URLSearchParams({
        page: String(pageNum),
        limit: String(LIMIT),
        ...(search && { search }),
        ...(rank && { rank }),
        sort,
      });

      try {
        const res = await fetch(`/api/characters?${params}`, {
          signal: controller.signal,
        });
        const json: CharactersApiResponse = await res.json();

        setCharacters((prev) =>
          pageNum === 1 ? json.data : [...prev, ...json.data],
        );
        setTotalPages(json.meta.totalPages);
        setTotal(json.meta.total);
        setPage(pageNum);
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") return;
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [search, rank, sort],
  );

  useEffect(() => {
    setCharacters([]);
    fetchPage(1);
  }, [fetchPage]);

  const loadMore = useCallback(() => {
    if (!loadingMore && page < totalPages) fetchPage(page + 1);
  }, [loadingMore, page, totalPages, fetchPage]);

  return {
    characters,
    loading,
    loadingMore,
    loadMore,
    hasMore: page < totalPages,
    total,
  };
}

// ─── Composant principal ──────────────────────────────────────────────────────

export default function CharacterListClient() {
  const [searchRaw, setSearchRaw] = useState("");
  const [rank, setRank] = useState<RankType>("");
  const [sort, setSort] = useState<SortField>("popularity");
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isRankOpen, setIsRankOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const search = useDeferredValue(normalizeString(searchRaw));
  const sortMenuRef = useRef<HTMLDivElement>(null);
  const rankMenuRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const { characters, loading, loadingMore, loadMore, hasMore, total } =
    useCharacters(search, rank, sort);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (sortMenuRef.current && !sortMenuRef.current.contains(target))
        setIsSortOpen(false);
      if (rankMenuRef.current && !rankMenuRef.current.contains(target))
        setIsRankOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) loadMore();
      },
      { rootMargin: "200px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  const currentSortLabel =
    SORT_OPTIONS.find((o) => o.value === sort)?.label ?? "Trier";
  const currentRankLabel = rank || "Tous les rangs";

  return (
    <>
      {/* Barre de filtres */}
      <div className="relative z-110 mb-8 flex flex-wrap gap-2 sm:gap-3 items-center bg-[#050505]/80 backdrop-blur-md px-3 sm:px-4 py-2.5 sm:py-3 rounded-2xl border border-white/10">
        <div className="relative flex-1 min-w-35">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"
          />
          <input
            type="text"
            placeholder="Rechercher un ninja..."
            value={searchRaw}
            onChange={(e) => {
              setSearchRaw(e.target.value);
              if (e.target.value.length > 2)
                trackEvent(EVENTS.CHARACTER_SEARCH, { query: e.target.value });
            }}
            className="w-full bg-white/5 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-orange-500/40 transition-all"
          />
        </div>

        {/* Menu tri */}
        <div className="relative" ref={sortMenuRef}>
          <button
            onClick={() => setIsSortOpen((v) => !v)}
            className="flex items-center justify-between gap-2 bg-white/5 rounded-xl px-3 py-2 text-sm text-white/80 hover:bg-white/10 transition-all cursor-pointer whitespace-nowrap min-w-12.5 sm:min-w-40"
          >
            <div className="flex items-center gap-2">
              <SlidersHorizontal size={16} className="text-white/50 shrink-0" />
              <span className="hidden sm:inline">{currentSortLabel}</span>
            </div>
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
                className="absolute top-full right-0 mt-2 w-40 bg-[#141414] border border-white/10 rounded-xl overflow-hidden shadow-xl z-120"
              >
                {SORT_OPTIONS.map((opt) => (
                  <li key={opt.value}>
                    <button
                      onClick={() => {
                        setSort(opt.value);
                        setIsSortOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-4 py-2.5 text-sm text-left transition-colors cursor-pointer ${sort === opt.value ? "text-orange-400 bg-orange-500/10" : "text-white/70 hover:bg-white/5 hover:text-white"}`}
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

        {/* Menu rang */}
        <div className="relative" ref={rankMenuRef}>
          <button
            onClick={() => setIsRankOpen((v) => !v)}
            className="flex items-center justify-between gap-2 bg-white/5 rounded-xl px-3 py-2 text-sm text-white/80 hover:bg-white/10 transition-all cursor-pointer whitespace-nowrap min-w-12.5 sm:min-w-50"
          >
            <span className="flex items-center gap-2 overflow-hidden">
              {(() => {
                const Icon = RANK_ICONS[rank] || Filter;
                const iconColor = getRankColor(rank);

                return (
                  <Icon
                    size={14}
                    className="shrink-0"
                    style={{
                      color:
                        rank === "" ? "rgba(255, 255, 255, 0.5)" : iconColor,
                    }}
                  />
                );
              })()}
              <span className="hidden sm:inline truncate">
                {currentRankLabel}
              </span>
            </span>
            <ChevronDown
              size={12}
              className={`text-white/30 transition-transform shrink-0 ${isRankOpen ? "rotate-180" : ""}`}
            />
          </button>
          <AnimatePresence>
            {isRankOpen && (
              <motion.ul
                initial={{ opacity: 0, y: -6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.97 }}
                className="absolute top-full right-0 mt-2 w-48 bg-[#141414] border border-white/10 rounded-xl overflow-hidden shadow-xl z-120"
              >
                <li>
                  <button
                    onClick={() => {
                      setRank("");
                      setIsRankOpen(false);
                    }}
                    className={`w-full flex items-center justify-between gap-2 px-4 py-3 text-sm text-left transition-colors cursor-pointer ${rank === "" ? "text-naruto-orange bg-naruto-orange/10" : "text-white/70 hover:bg-white/5 hover:text-white"}`}
                  >
                    <span className="flex items-center gap-2">
                      <Filter size={14} className="text-white/70" />
                      Tous les rangs
                    </span>
                    {rank === "" && <Check size={14} />}
                  </button>
                </li>
                {RANK_OPTIONS.map((opt) => (
                  <li key={opt}>
                    <button
                      onClick={() => {
                        setRank(opt);
                        setIsRankOpen(false);
                      }}
                      className={`w-full flex items-center justify-between gap-2 px-4 py-3 text-sm text-left transition-colors cursor-pointer ${rank === opt ? "text-naruto-orange bg-naruto-orange/10" : "text-white/70 hover:bg-white/5 hover:text-white"}`}
                    >
                      <span className="flex items-center gap-2">
                        {(() => {
                          const Icon = RANK_ICONS[opt];
                          return Icon ? (
                            <Icon
                              size={14}
                              style={{ color: getRankColor(opt) }}
                            />
                          ) : null;
                        })()}
                        {opt}
                      </span>
                      {rank === opt && <Check size={14} />}
                    </button>
                  </li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Grille */}
      {loading ? (
        <SkeletonGrid />
      ) : characters.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <motion.div
            layout
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
          >
            <AnimatePresence mode="popLayout">
              {characters.map((char, i) => (
                <CharacterCardItem
                  key={char.id}
                  character={char}
                  index={i}
                  onClick={() => {
                    setSelectedId(char.id);
                    trackEvent(EVENTS.CHARACTER_OPEN, {
                      characterId: char.id,
                      name: char.name,
                    });
                  }}
                />
              ))}
            </AnimatePresence>
          </motion.div>

          <div ref={sentinelRef} className="h-8 mt-4" />

          {loadingMore && (
            <div className="flex justify-center py-8">
              <div className="w-10 h-10 rounded-full border-2 border-naruto-orange border-t-transparent animate-spin" />
            </div>
          )}

          {!hasMore && characters.length > 0 && (
            <p className="text-center text-white/20 text-xs py-8 font-mono">
              — {total.toLocaleString()} personnages affichés —
            </p>
          )}
        </>
      )}

      {/* Modal personnage */}
      <CharacterModal
        characterId={selectedId}
        onClose={() => setSelectedId(null)}
      />
    </>
  );
}

// ─── Carte personnage ─────────────────────────────────────────────────────────

export function CharacterCardItem({
  character,
  index,
  onClick,
}: {
  character: CharacterCard;
  index: number;
  onClick: () => void;
}) {
  const imageSrc = character.image?.trim() ? character.image : FALLBACK;

  return (
    <motion.button
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2, delay: Math.min(index % LIMIT, 20) * 0.02 }}
      onClick={onClick}
      className="group relative flex flex-col overflow-hidden rounded-xl bg-[#050505] outline-none cursor-pointer"
    >
      <div className="relative w-full aspect-3/4 overflow-hidden">
        <Image
          src={imageSrc}
          alt={character.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          className="object-cover object-top transition-transform duration-500 group-hover:scale-110 scale-[1.01]"
          unoptimized
          onError={(e) => {
            (e.target as HTMLImageElement).src = FALLBACK;
          }}
        />
        <div className="absolute inset-0 rounded-xl border-[1.5px] border-[#050505] pointer-events-none" />
        <div className="absolute inset-0 bg-linear-to-t from-[#050505] via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <h3 className="font-bold text-xs sm:text-sm text-white leading-tight line-clamp-2 drop-shadow-sm">
            {character.name}
          </h3>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity bg-naruto-orange" />
    </motion.button>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl bg-neutral-900 overflow-hidden animate-pulse"
        >
          <div className="aspect-3/4 bg-white/5" />
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <Leaf size={48} className="mb-4 text-white/20" />
      <p className="text-white/40 text-sm">Aucun personnage trouvé</p>
    </div>
  );
}
