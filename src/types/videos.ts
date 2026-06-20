// ─── Catégories ───────────────────────────────────────────────────────────────

export const VIDEO_CATEGORIES = [
  "edit",
  "theorie",
  "react",
  "fanart",
  "ost",
] as const;

export type VideoCategory = (typeof VIDEO_CATEGORIES)[number];

export const CATEGORY_LABELS: Record<VideoCategory | "all", string> = {
  all: "Toutes",
  edit: "Edit",
  theorie: "Théorie",
  react: "React",
  fanart: "Fanart",
  ost: "OST",
};

export const CATEGORY_ICONS: Record<VideoCategory | "all", string> = {
  all: "🎬",
  edit: "✂️",
  theorie: "🧠",
  react: "👁",
  fanart: "🎨",
  ost: "🎵",
};

export const CATEGORY_COLORS: Record<VideoCategory | "all", string> = {
  all: "#ff6600",
  edit: "#ef4444",
  theorie: "#8b5cf6",
  react: "#22d3ee",
  fanart: "#f59e0b",
  ost: "#4ade80",
};

// ─── Video Card (grille) ──────────────────────────────────────────────────────

export interface VideoCard {
  id: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
  publishedAt: string;
  category: VideoCategory;
  likesCount: number;
  viewCount: string;
  hasLiked?: boolean;
}

// ─── API Responses ────────────────────────────────────────────────────────────

export interface VideosApiResponse {
  data: VideoCard[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface VideoLikeResponse {
  liked: boolean;
  likesCount: number;
}

// ─── Sort options ─────────────────────────────────────────────────────────────

export type VideoSortField = "recent" | "popular" | "views";

export const SORT_OPTIONS: { value: VideoSortField; label: string }[] = [
  { value: "recent", label: "Plus récents" },
  { value: "popular", label: "Plus aimés" },
  { value: "views", label: "Plus vus" },
];
