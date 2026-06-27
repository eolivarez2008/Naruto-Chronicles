export type SagaKey = "naruto" | "shippuden" | "boruto";

export interface StoryArc {
  id: string;
  slug: string;
  order: number;
  sagaKey: SagaKey;
  title: string;
  summary: string;
  content: string;
  titleFr?: string;
  summaryFr?: string;
  contentFr?: string;
  fetchedAt: Date | string;
}

// ─── Config visuelle par saga ─────────────────────────────────────────────────

export const SAGA_CONFIG: Record<
  SagaKey,
  {
    label: string;
    color: string;
    borderClass: string;
  }
> = {
  naruto: {
    label: "Naruto",
    color: "#ff6600",
    borderClass: "border-[#ff6600]",
  },
  shippuden: {
    label: "Naruto Shippuden",
    color: "#3b82f6",
    borderClass: "border-[#3b82f6]",
  },
  boruto: {
    label: "Boruto",
    color: "#22c55e",
    borderClass: "border-[#22c55e]",
  },
};

// ─── Toolbar ─────────────────────────────────────────────────────────

export const SAGA_ORDER: SagaKey[] = ["naruto", "shippuden", "boruto"];

export type StorySortOption = "chronologique" | "alpha_asc" | "alpha_desc";

export const STORY_SORT_OPTIONS: { value: StorySortOption; label: string }[] = [
  { value: "chronologique", label: "Timeline" },
  { value: "alpha_asc", label: "Nom (A–Z)" },
  { value: "alpha_desc", label: "Nom (Z–A)" },
];

// ─── Helpers ─────────────────────────────────────────────────────────

export interface TocItem {
  id: string;
  text: string;
  level: 2 | 3;
}

export interface ArcNeighbor {
  slug: string;
  title: string;
}

export type ContentBlock =
  | { type: "h2"; id: string; text: string }
  | { type: "h3"; id: string; text: string }
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] };
