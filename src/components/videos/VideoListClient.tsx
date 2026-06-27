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
import { Clapperboard } from "lucide-react";
import VideoCardItem from "@/components/videos/VideoCard";
import VideoModal from "@/components/videos/VideoModal";
import { trackEvent, EVENTS } from "@/lib/analytics";
import FilterToolbar from "@/components/ui/FilterToolbar";
import type { FilterOption } from "@/components/ui/FilterToolbar";

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
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const search = useDeferredValue(searchRaw);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const { videos, loading, loadingMore, loadMore, hasMore, total, toggleLike } =
    useVideos(search, category, sort);

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

  const categoryFilterOptions: FilterOption[] = [
    { id: "all", label: CATEGORY_LABELS["all"] },
    ...VIDEO_CATEGORIES.map((cat) => ({
      id: cat,
      label: CATEGORY_LABELS[cat],
      icon: CATEGORY_ICONS[cat],
      color: CATEGORY_COLORS[cat],
    })),
  ];

  return (
    <>
      <FilterToolbar
        searchValue={searchRaw}
        onSearchChange={(v) => {
          setSearchRaw(v);
          if (v.length > 2) trackEvent(EVENTS.VIDEO_SEARCH, { query: v });
        }}
        searchPlaceholder="Rechercher une vidéo..."
        sortOptions={SORT_OPTIONS}
        sortValue={sort}
        onSortChange={(v) => setSort(v as VideoSortField)}
        filterOptions={categoryFilterOptions}
        filterValue={category}
        onFilterChange={(v) => {
          setCategory(v as VideoCategory | "all");
          trackEvent(EVENTS.VIDEO_FILTER, { category: v });
        }}
      />

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
      <Clapperboard size={48} className="mb-4 text-white/20" />
      <p className="text-white/40 text-sm">Aucune vidéo trouvée</p>
      <p className="text-white/20 text-xs mt-1">
        Essaie un autre filtre ou un autre mot-clé
      </p>
    </div>
  );
}
