import type { StoryArc } from "@/types/story";

export type ArcLang = "fr" | "en";

export function getArcText(arc: StoryArc, lang: ArcLang = "fr") {
  const hasFr = !!(arc.titleFr && arc.summaryFr && arc.contentFr);

  return {
    title: lang === "fr" && arc.titleFr ? arc.titleFr : arc.title,
    summary: lang === "fr" && arc.summaryFr ? arc.summaryFr : arc.summary,
    content: lang === "fr" && arc.contentFr ? arc.contentFr : arc.content,
    hasFr,
    isTranslated: lang === "fr" && hasFr,
  };
}
