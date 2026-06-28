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
import {
  CharacterSortField,
  RankType,
  RANK_OPTIONS,
  RANK_COLORS,
  RANK_ICONS,
  CHARACTER_SORT_OPTIONS,
} from "@/types/characters";
import { trackEvent, EVENTS } from "@/lib/analytics";
import CharacterModal from "@/components/character/CharacterModal";
import { normalizeString } from "@/lib/network";
import { Leaf } from "lucide-react";
import FilterToolbar from "@/components/ui/FilterToolbar";
import type { FilterOption } from "@/components/ui/FilterToolbar";
import Pagination from "@/components/ui/Pagination";

const LIMIT = 40;
const FALLBACK = "/logo/favicon-naruto.png";

function useCharacters(
  search: string,
  rank: RankType,
  sort: CharacterSortField,
  page: number,
) {
  const [characters, setCharacters] = useState<CharacterCard[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const abortRef = useRef<AbortController | null>(null);

  const fetchPage = useCallback(async () => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);

    const params = new URLSearchParams({
      page: String(page),
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
      setCharacters(json.data);
      setTotalPages(json.meta.totalPages);
      setTotal(json.meta.total);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [search, rank, sort, page]);

  useEffect(() => {
    fetchPage();
  }, [fetchPage]);

  return { characters, loading, totalPages, total };
}

export default function CharacterListClient() {
  const [searchRaw, setSearchRaw] = useState("");
  const [rank, setRank] = useState<RankType>("");
  const [sort, setSort] = useState<CharacterSortField>("popularity");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [page, setPage] = useState(1);

  const search = useDeferredValue(normalizeString(searchRaw));

  useEffect(() => {
    setPage(1);
  }, [search, rank, sort]);

  const { characters, loading, totalPages, total } = useCharacters(
    search,
    rank,
    sort,
    page,
  );

  const handlePageChange = (p: number) => {
    setPage(p);
  };

  const rankFilterOptions: FilterOption[] = [
    { id: "", label: "Tous les rangs" },
    ...RANK_OPTIONS.map((r) => ({
      id: r,
      label: r,
      icon: RANK_ICONS[r] ?? undefined,
      color: RANK_COLORS[r],
    })),
  ];

  return (
    <>
      <FilterToolbar
        searchValue={searchRaw}
        onSearchChange={(v) => {
          setSearchRaw(v);
          if (v.length > 2) trackEvent(EVENTS.CHARACTER_SEARCH, { query: v });
        }}
        searchPlaceholder="Rechercher un ninja..."
        sortOptions={CHARACTER_SORT_OPTIONS}
        sortValue={sort}
        onSortChange={(v) => setSort(v as CharacterSortField)}
        filterOptions={rankFilterOptions}
        filterValue={rank}
        onFilterChange={(v) => setRank(v as RankType)}
      />

      {loading ? (
        <SkeletonGrid />
      ) : characters.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <motion.div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            <AnimatePresence>
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

          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </>
      )}

      <CharacterModal
        characterId={selectedId}
        onClose={() => setSelectedId(null)}
      />
    </>
  );
}

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
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      onClick={onClick}
      className="group relative flex flex-col overflow-hidden rounded-xl bg-[#050505] outline-none cursor-pointer"
    >
      <div className="relative w-full aspect-3/4 overflow-hidden">
        <Image
          priority={index < 5}
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
      {Array.from({ length: LIMIT }).map((_, i) => (
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
