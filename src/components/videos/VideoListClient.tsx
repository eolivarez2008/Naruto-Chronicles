"use client";

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  useDeferredValue,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
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
import Pagination from "@/components/ui/Pagination";

const LIMIT = 12;

function useVideos(
  search: string,
  category: VideoCategory | "all",
  sort: VideoSortField,
  page: number,
) {
  const [videos, setVideos] = useState<VideoCard[]>([]);
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
      setVideos(json.data ?? []);
      setTotalPages(json.meta.totalPages);
      setTotal(json.meta.total);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [search, category, sort, page]);

  useEffect(() => {
    fetchPage();
  }, [fetchPage]);

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

  return { videos, loading, totalPages, total, toggleLike };
}

export default function VideoListClient() {
  const [searchRaw, setSearchRaw] = useState("");
  const [category, setCategory] = useState<VideoCategory | "all">("all");
  const [sort, setSort] = useState<VideoSortField>("popular");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const search = useDeferredValue(searchRaw);

  useEffect(() => {
    setPage(1);
  }, [search, category, sort]);

  const { videos, loading, totalPages, total, toggleLike } = useVideos(
    search,
    category,
    sort,
    page,
  );

  const handlePageChange = (p: number) => {
    setPage(p);
  };

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
          <p className="text-white/20 text-xs mb-4 font-mono">
            {total.toLocaleString()} vidéos · page {page}/{totalPages}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <AnimatePresence initial={false}>
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

          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
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
