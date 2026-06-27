import type { StoryArc } from "@/types/story";

export function getArcText(arc: StoryArc, lang: "fr" | "en" = "fr") {
  return {
    title: lang === "fr" && arc.titleFr ? arc.titleFr : arc.title,
    summary: lang === "fr" && arc.summaryFr ? arc.summaryFr : arc.summary,
    content: lang === "fr" && arc.contentFr ? arc.contentFr : arc.content,
  };
}
