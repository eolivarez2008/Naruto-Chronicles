"use client";

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  useDeferredValue,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import type {
  VideoCard,
  VideoCategory,
  VideoSortField,
  VideosApiResponse,
} from "@/types/videos";
import {
  CATEGORY_LABELS,
  CATEGORY_ICONS,
  CATEGORY_COLORS,
  SORT_OPTIONS,
  VIDEO_CATEGORIES,
} from "@/types/videos";
import { trackEvent, EVENTS } from "@/lib/analytics";
import VideoCardItem from "@/components/videos/VideoCard";
import VideoModal from "@/components/videos/VideoModal";

const LIMIT = 12;

function useVideos(
  search: string,
  category: VideoCategory | "all",
  sort: VideoSortField,
) {
  const [videos, setVideos] = useState<VideoCard[]>([]);
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
        sort,
        ...(search && { search }),
        ...(category !== "all" && { category }),
      });

      try {
        const res = await fetch(`/api/videos?${params}`, {
          signal: controller.signal,
        });
        if (!res.ok) {
          setVideos([]);
          return;
        }

        const json: VideosApiResponse = await res.json();
        setVideos((prev) =>
          pageNum === 1 ? (json.data ?? []) : [...prev, ...(json.data ?? [])],
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
    [search, category, sort],
  );

  useEffect(() => {
    setVideos([]);
    fetchPage(1);
  }, [fetchPage]);

  const loadMore = useCallback(() => {
    if (!loadingMore && page < totalPages) fetchPage(page + 1);
  }, [loadingMore, page, totalPages, fetchPage]);

  const toggleLike = useCallback(
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

  return {
    videos,
    loading,
    loadingMore,
    loadMore,
    hasMore: page < totalPages,
    total,
    toggleLike,
  };
}

export default function VideoListClient() {
  const router = useRouter();
  const [searchRaw, setSearchRaw] = useState("");
  const [category, setCategory] = useState<VideoCategory | "all">("all");
  const [sort, setSort] = useState<VideoSortField>("popular");
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const search = useDeferredValue(searchRaw);
  const sortMenuRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const { videos, loading, loadingMore, loadMore, hasMore, total, toggleLike } =
    useVideos(search, category, sort);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        sortMenuRef.current &&
        !sortMenuRef.current.contains(e.target as Node)
      )
        setIsSortOpen(false);
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
      { rootMargin: "400px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  const handleCardClick = (id: string) => {
    setSelectedId(id);
    window.history.pushState({}, "", `/videos/${id}`);
  };

  const handleModalClose = () => {
    setSelectedId(null);
    window.history.pushState({}, "", "/videos");
  };

  const currentSortLabel =
    SORT_OPTIONS.find((o) => o.value === sort)?.label ?? "Trier";

  return (
    <>
      {/* Barre de filtres */}
      <div className="relative z-110 mb-8 flex flex-wrap gap-2 sm:gap-3 items-center bg-[#050505]/80 backdrop-blur-md px-3 sm:px-4 py-2.5 sm:py-3 rounded-2xl border border-white/10">
        <div className="relative flex-1 min-w-40">
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
            placeholder="Rechercher une vidéo..."
            value={searchRaw}
            onChange={(e) => {
              setSearchRaw(e.target.value);
              if (e.target.value.length > 2)
                trackEvent(EVENTS.VIDEO_SEARCH, { query: e.target.value });
            }}
            className="w-full bg-white/5 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-orange-500/40 transition-all"
          />
        </div>

        {/* Menu tri */}
        <div className="relative" ref={sortMenuRef}>
          <button
            onClick={() => setIsSortOpen((v) => !v)}
            className="flex items-center gap-2 bg-white/5 rounded-xl px-3 py-2 text-sm text-white/80 hover:bg-white/10 transition-all cursor-pointer whitespace-nowrap"
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
                className="absolute top-full right-0 mt-2 w-44 bg-[#141414] border border-white/10 rounded-xl overflow-hidden shadow-xl z-120"
              >
                {SORT_OPTIONS.map((opt) => (
                  <li key={opt.value}>
                    <button
                      onClick={() => {
                        setSort(opt.value);
                        setIsSortOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-4 py-2.5 text-sm text-left transition-colors cursor-pointer ${sort === opt.value ? "text-naruto-orange bg-[rgba(255,102,0,0.1)]" : "text-white/70 hover:bg-white/5 hover:text-white"}`}
                    >
                      {opt.label}
                      {sort === opt.value && (
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

      {/* Filtres catégories */}
      <div className="flex flex-wrap gap-2 mb-8">
        {(["all", ...VIDEO_CATEGORIES] as const).map((cat) => {
          const active = category === cat;
          const color = CATEGORY_COLORS[cat];
          return (
            <button
              key={cat}
              onClick={() => {
                setCategory(cat);
                trackEvent(EVENTS.VIDEO_FILTER, { category: cat });
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer"
              style={{
                background: active ? `${color}22` : "rgba(255,255,255,0.04)",
                color: active ? color : "rgba(255,255,255,0.5)",
                border: `1px solid ${active ? color + "55" : "rgba(255,255,255,0.08)"}`,
                boxShadow: active ? `0 0 12px ${color}22` : "none",
              }}
            >
              <span>{CATEGORY_ICONS[cat]}</span>
              {CATEGORY_LABELS[cat]}
            </button>
          );
        })}
      </div>

      {/* Grille */}
      {loading ? (
        <VideoSkeletonGrid />
      ) : !videos || videos.length === 0 ? (
        <VideoEmpty />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <AnimatePresence mode="popLayout" initial={false}>
              {videos.map((video, i) => (
                <VideoCardItem
                  key={video.id}
                  video={video}
                  index={i}
                  onClick={() => handleCardClick(video.id)}
                  onLikeToggle={toggleLike}
                />
              ))}
            </AnimatePresence>
          </div>

          <div ref={sentinelRef} className="h-1 mt-4" aria-hidden />

          {loadingMore && (
            <div className="flex justify-center py-6">
              <div className="w-7 h-7 rounded-full border-2 border-naruto-orange border-t-transparent animate-spin" />
            </div>
          )}

          {!hasMore && videos.length > 0 && (
            <p className="text-center text-white/20 text-xs py-8 font-mono">
              — {total.toLocaleString()} vidéos affichées —
            </p>
          )}
        </>
      )}

      <VideoModal
        videoId={selectedId}
        onClose={handleModalClose}
        onLikeToggle={toggleLike}
      />
    </>
  );
}

function VideoSkeletonGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl bg-white/4 overflow-hidden animate-pulse"
        >
          <div className="aspect-video bg-white/5" />
          <div className="p-4 space-y-2">
            <div className="h-3 bg-white/8 rounded w-3/4" />
            <div className="h-3 bg-white/5 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

function VideoEmpty() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <p className="text-5xl mb-4">🎬</p>
      <p className="text-white/40 text-sm">Aucune vidéo trouvée</p>
      <p className="text-white/20 text-xs mt-1">
        Essaie un autre filtre ou un autre mot-clé
      </p>
    </div>
  );
}
