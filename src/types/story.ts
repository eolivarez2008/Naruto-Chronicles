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

export const SAGA_ORDER: SagaKey[] = ["naruto", "shippuden", "boruto"];
