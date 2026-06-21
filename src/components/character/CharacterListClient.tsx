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
import type {
  CharacterCard,
  CharacterDetail,
  CharactersApiResponse,
} from "@/types/characters";
import {
  NATURE_COLORS,
  NATURE_ICONS,
  formatNatureName,
} from "@/types/characters";

// ─── Constants ────────────────────────────────────────────────────────────────

const LIMIT = 40;
const FALLBACK = "/logo/favicon-naruto.png";

// ─── Types ────────────────────────────────────────────────────────────────────

type SortField = "popularity" | "name_asc" | "name_desc";
type RankType = (typeof RANK_OPTIONS)[number] | "";

const RANK_OPTIONS = [
  "Academy Student",
  "Genin",
  "Chūnin",
  "Jōnin",
  "Kage",
] as const;

function normalizeString(str: string): string {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

function useCharacters(search: string, rank: string, sort: SortField) {
  const [characters, setCharacters] = useState<CharacterCard[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchPage = useCallback(
    async (pageNum: number) => {
      if (abortControllerRef.current) abortControllerRef.current.abort();

      const controller = new AbortController();
      abortControllerRef.current = controller;

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

        if (!json.data || !json.meta) {
          console.error("Réponse API inattendue:", json);
          return;
        }

        setCharacters((prev) =>
          pageNum === 1 ? json.data : [...prev, ...json.data],
        );
        setTotalPages(json.meta.totalPages);
        setTotal(json.meta.total);
        setPage(pageNum);
      } catch (error: any) {
        if (error.name === "AbortError") return;
        console.error("Erreur de chargement:", error);
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

function useCharacterDetail(id: number | null) {
  const [data, setData] = useState<CharacterDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id) {
      setData(null);
      return;
    }
    setLoading(true);
    setData(null);
    fetch(`/api/characters/${id}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [id]);

  return { data, loading };
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

  const { characters, loading, loadingMore, loadMore, hasMore, total } =
    useCharacters(search, rank, sort);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!isSortOpen && !isRankOpen) return;
      const target = e.target as Node;
      if (sortMenuRef.current && !sortMenuRef.current.contains(target))
        setIsSortOpen(false);
      if (rankMenuRef.current && !rankMenuRef.current.contains(target))
        setIsRankOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isSortOpen, isRankOpen]);

  const sentinelRef = useRef<HTMLDivElement>(null);
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

  const SORT_OPTIONS: { value: SortField; label: string }[] = [
    { value: "popularity", label: "Popularité" },
    { value: "name_asc", label: "Nom (A-Z)" },
    { value: "name_desc", label: "Nom (Z-A)" },
  ];

  const currentSortLabel =
    SORT_OPTIONS.find((o) => o.value === sort)?.label ?? "Trier";
  const currentRankLabel = rank || "Tous les rangs";

  return (
    <>
      {/* ── Toolbar ── */}
      <div className="relative z-110 mb-8 flex flex-wrap gap-2 sm:gap-3 items-center bg-[#050505]/80 backdrop-blur-md px-3 sm:px-4 py-2.5 sm:py-3 rounded-2xl border border-white/10">
        {/* Search */}
        <div className="relative flex-1 min-w-35">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Rechercher un ninja..."
            value={searchRaw}
            onChange={(e) => setSearchRaw(e.target.value)}
            className="w-full bg-white/5 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-orange-500/40 transition-all"
          />
        </div>

        {/* Menu Tri */}
        <div className="relative" ref={sortMenuRef}>
          <button
            onClick={() => setIsSortOpen((v) => !v)}
            className="flex items-center gap-2 bg-white/5 rounded-xl px-3 py-2 text-sm text-white/80 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-orange-500/40 transition-all cursor-pointer whitespace-nowrap"
          >
            <svg
              className="w-4 h-4 text-white/50"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 7h18M6 12h12M9 17h6"
              />
            </svg>
            <span className="hidden sm:inline">{currentSortLabel}</span>
            <svg
              className={`w-3 h-3 text-white/30 transition-transform ${isSortOpen ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          <AnimatePresence>
            {isSortOpen && (
              <motion.ul
                initial={{ opacity: 0, y: -6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.97 }}
                className="absolute top-full left-0 mt-2 w-40 bg-[#141414] border border-white/10 rounded-xl overflow-hidden shadow-xl z-120"
              >
                {SORT_OPTIONS.map((option) => (
                  <li key={option.value}>
                    <button
                      onClick={() => {
                        setSort(option.value);
                        setIsSortOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-4 py-2.5 text-sm text-left transition-colors cursor-pointer ${
                        sort === option.value
                          ? "text-orange-400 bg-orange-500/10"
                          : "text-white/70 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <span>{option.label}</span>
                      {sort === option.value && (
                        <svg
                          className="w-3.5 h-3.5"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </button>
                  </li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>

        {/* Menu Rang */}
        <div className="relative" ref={rankMenuRef}>
          <button
            onClick={() => setIsRankOpen((v) => !v)}
            className="flex items-center gap-2 bg-white/5 rounded-xl px-3 py-2 text-sm text-white/80 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-orange-500/40 transition-all cursor-pointer whitespace-nowrap"
          >
            <svg
              className="w-4 h-4 text-white/50"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
              />
            </svg>
            <span className="hidden sm:inline">{currentRankLabel}</span>
            <svg
              className={`w-3 h-3 text-white/30 transition-transform ${isRankOpen ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          <AnimatePresence>
            {isRankOpen && (
              <motion.ul
                initial={{ opacity: 0, y: -6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.97 }}
                className="absolute top-full right-0 mt-2 w-44 bg-[#141414] border border-white/10 rounded-xl overflow-hidden shadow-xl z-120"
              >
                <li>
                  <button
                    onClick={() => {
                      setRank("");
                      setIsRankOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors cursor-pointer ${rank === "" ? "text-orange-400 bg-orange-500/10" : "text-white/70 hover:bg-white/5"}`}
                  >
                    Tous les rangs
                  </button>
                </li>
                {RANK_OPTIONS.map((option) => (
                  <li key={option}>
                    <button
                      onClick={() => {
                        setRank(option);
                        setIsRankOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-4 py-2.5 text-sm text-left transition-colors cursor-pointer ${
                        rank === option
                          ? "text-orange-400 bg-orange-500/10"
                          : "text-white/70 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <span>{option}</span>
                      {rank === option && (
                        <svg
                          className="w-3.5 h-3.5"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </button>
                  </li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Grille ── */}
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
                  onClick={() => setSelectedId(char.id)}
                />
              ))}
            </AnimatePresence>
          </motion.div>

          <div ref={sentinelRef} className="h-8 mt-4" />

          {loadingMore && (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          )}

          {!hasMore && characters.length > 0 && (
            <p className="text-center text-white/20 text-xs py-8 font-mono">
              — {total.toLocaleString()} personnages affichés —
            </p>
          )}
        </>
      )}

      {/* ── Modal ── */}
      <CharacterModal
        characterId={selectedId}
        onClose={() => setSelectedId(null)}
      />
    </>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────

function CharacterCardItem({
  character,
  index,
  onClick,
}: {
  character: CharacterCard;
  index: number;
  onClick: () => void;
}) {
  const imageSrc =
    character.image && character.image.trim() !== ""
      ? character.image
      : FALLBACK;
  return (
    <motion.button
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2, delay: Math.min(index % LIMIT, 20) * 0.02 }}
      onClick={onClick}
      className="group relative flex flex-col overflow-hidden rounded-xl bg-[#050505] outline-none"
    >
      <div className="relative w-full aspect-3/4 overflow-hidden cursor-pointer">
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
      <div
        className="absolute bottom-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ backgroundColor: "#ff6600" }}
      />
    </motion.button>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────

function CharacterModal({
  characterId,
  onClose,
}: {
  characterId: number | null;
  onClose: () => void;
}) {
  const { data, loading } = useCharacterDetail(characterId);
  const isOpen = characterId !== null;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      const original = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [isOpen]);

  const accent = data?.natureType?.[0]
    ? (NATURE_COLORS[formatNatureName(data.natureType[0])] ?? "#e5c97e")
    : "#e5c97e";

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-9999 bg-black/75 backdrop-blur-sm"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="modal"
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 60 }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className={[
              "fixed z-10000",
              "inset-x-2 sm:inset-x-auto",
              "bottom-1 sm:bottom-auto",
              "sm:left-1/2 sm:-translate-x-1/2",
              "top-[15vh] sm:top-[13vh]",
              "max-h-[85dvh] sm:max-h-[84dvh]",
              "sm:w-full sm:max-w-2xl",
              "bg-naruto-surface rounded-2xl border border-white/10 shadow-2xl",
              "flex flex-col overflow-hidden",
            ].join(" ")}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative shrink-0">
              <button
                onClick={onClose}
                className="absolute right-4 top-4 p-2 rounded-full bg-white/10 hover:bg-white/20 active:bg-white/30 text-white transition-colors cursor-pointer z-10001"
                aria-label="Fermer"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain">
              {loading && (
                <div className="flex items-center justify-center min-h-50">
                  <LoadingSpinner color={accent} />
                </div>
              )}
              {!loading && data && (
                <DrawerContent data={data} accent={accent} />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Drawer content ───────────────────────────────────────────────────────────

function DrawerContent({
  data,
  accent,
}: {
  data: CharacterDetail;
  accent: string;
}) {
  return (
    <div className="flex flex-col pb-8">
      {/* Hero */}
      <div className="relative w-full aspect-video overflow-hidden">
        <Image
          src={data.image ?? FALLBACK}
          alt={data.name}
          fill
          className="object-cover object-top"
          unoptimized
          onError={(e) => {
            (e.target as HTMLImageElement).src = FALLBACK;
          }}
        />
        <div className="absolute inset-0 bg-linear-to-t from-naruto-surface via-naruto-surface/30 to-transparent" />
        <div className="absolute bottom-0 left-0 p-5">
          <motion.h2
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl sm:text-3xl font-black text-white leading-none"
            style={{ textShadow: `0 0 40px ${accent}66` }}
          >
            {data.name}
          </motion.h2>
        </div>
      </div>

      <div className="p-5 flex flex-col gap-5">
        {/* Nature types */}
        {data.natureType?.length > 0 && (
          <DrawerSection title="Affinités chakra" accent={accent}>
            <div className="flex flex-wrap gap-2">
              {data.natureType.map((rawName) => {
                const cleanName = formatNatureName(rawName);

                const color = NATURE_COLORS[cleanName] ?? "#888";
                const icon = NATURE_ICONS[cleanName] ?? "✨";

                return (
                  <span
                    key={rawName}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium"
                    style={{
                      background: `${color}1a`,
                      color: color,
                      border: `1px solid ${color}44`,
                    }}
                  >
                    {icon} {rawName}
                  </span>
                );
              })}
            </div>
          </DrawerSection>
        )}

        {/* Infos */}
        {(data.sex || data.birthdate) && (
          <DrawerSection title="Informations" accent={accent}>
            <div className="grid grid-cols-2 gap-3">
              {data.sex && <InfoPair label="Sexe" value={data.sex} />}
              {data.birthdate && (
                <InfoPair label="Anniversaire" value={data.birthdate} />
              )}
            </div>

            {data.height && Object.keys(data.height).length > 0 && (
              <div className="mt-3">
                <p className="text-[10px] uppercase tracking-widest text-white/30 mb-2">
                  Taille
                </p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(data.height).map(([arc, h]) => (
                    <span
                      key={arc}
                      className="text-xs bg-white/5 rounded px-2 py-1"
                    >
                      <span className="text-white/35">{arc}: </span>
                      <span className="text-white/80">{h}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {data.age && Object.keys(data.age).length > 0 && (
              <div className="mt-3">
                <p className="text-[10px] uppercase tracking-widest text-white/30 mb-2">
                  Âge
                </p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(data.age).map(([arc, a]) => (
                    <span
                      key={arc}
                      className="text-xs bg-white/5 rounded px-2 py-1"
                    >
                      <span className="text-white/35">{arc}: </span>
                      <span className="text-white/80">{a}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </DrawerSection>
        )}

        {/* Rang */}
        {data.rank && Object.keys(data.rank).length > 0 && (
          <DrawerSection title="Rang ninja" accent={accent}>
            {"ninjaRank" in data.rank ? (
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(
                  (data.rank as any).ninjaRank as Record<string, string>,
                ).map(([arc, r]) => (
                  <InfoPair key={arc} label={arc} value={r} />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(data.rank as Record<string, string>).map(
                  ([arc, r]) => (
                    <InfoPair key={arc} label={arc} value={r} />
                  ),
                )}
              </div>
            )}
          </DrawerSection>
        )}

        {/* Famille */}
        {data.family && Object.keys(data.family).length > 0 && (
          <DrawerSection title="Famille" accent={accent}>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(data.family).map(([relation, member]) => (
                <InfoPair key={relation} label={relation} value={member} />
              ))}
            </div>
          </DrawerSection>
        )}

        {/* Jutsus */}
        {data.jutsu?.length > 0 && (
          <DrawerSection
            title={`Jutsus · ${data.jutsu.length}`}
            accent={accent}
          >
            <ul className="max-h-48 overflow-y-auto flex flex-col divide-y divide-white/5 pr-1">
              {data.jutsu.map((j) => (
                <li
                  key={j}
                  className="py-1.5 text-sm text-white/65 hover:text-white/90 transition-colors"
                >
                  {j}
                </li>
              ))}
            </ul>
          </DrawerSection>
        )}

        {/* Premières apparitions */}
        {(data.debut?.anime ||
          data.debut?.manga ||
          data.debut?.movie ||
          data.debut?.game) && (
          <DrawerSection title="Premières apparitions" accent={accent}>
            <div className="flex flex-col gap-2">
              {data.debut.anime && (
                <InfoPair label="Anime" value={data.debut.anime} full />
              )}
              {data.debut.manga && (
                <InfoPair label="Manga" value={data.debut.manga} full />
              )}
              {data.debut.movie && (
                <InfoPair label="Film" value={data.debut.movie} full />
              )}
              {data.debut.game && (
                <InfoPair label="Jeu" value={data.debut.game} full />
              )}
            </div>
          </DrawerSection>
        )}
      </div>
    </div>
  );
}

// ─── Utilitaires UI ───────────────────────────────────────────────────────────

function DrawerSection({
  title,
  accent,
  children,
}: {
  title: string;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3
        className="text-[10px] font-bold uppercase tracking-widest mb-3 pb-2 border-b"
        style={{ color: accent, borderColor: `${accent}30` }}
      >
        {title}
      </h3>
      {children}
    </div>
  );
}

function InfoPair({
  label,
  value,
  full = false,
}: {
  label: string;
  value: string;
  full?: boolean;
}) {
  return (
    <div className={full ? "col-span-2" : ""}>
      <dt className="text-[10px] text-white/35 uppercase tracking-wider">
        {label}
      </dt>
      <dd className="text-sm text-white/80 font-medium mt-0.5">{value}</dd>
    </div>
  );
}

function LoadingSpinner({ color = "#e5c97e" }: { color?: string }) {
  return (
    <div
      className="w-10 h-10 rounded-full border-2 animate-spin"
      style={{ borderColor: `${color} transparent transparent transparent` }}
    />
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
      <p className="text-5xl mb-4">🍃</p>
      <p className="text-white/40 text-sm">Aucun personnage trouvé</p>
    </div>
  );
}
