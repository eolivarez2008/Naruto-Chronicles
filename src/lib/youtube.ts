import { sleep } from "./network";

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY ?? "";

export const VIDEO_CATEGORIES = [
  { category: "edit", label: "Edit", query: "Naruto edit amv 4k" },
  { category: "theorie", label: "Théorie", query: "Naruto theories explained" },
  { category: "react", label: "React", query: "Naruto reaction compilation" },
  { category: "fanart", label: "Fanart", query: "Naruto fanart speed drawing" },
  { category: "ost", label: "OST", query: "Naruto OST soundtrack epic" },
] as const;

export type VideoCategory = (typeof VIDEO_CATEGORIES)[number]["category"];

// ─── Types ────────────────────────────────────────────────────────────────────

export interface YouTubeSearchItem {
  id: { videoId: string };
  snippet: {
    title: string;
    channelTitle: string;
    publishedAt: string;
    thumbnails: {
      high?: { url: string };
      medium?: { url: string };
      default?: { url: string };
    };
  };
}

export interface YouTubeVideoStats {
  id: string;
  viewCount: bigint;
}

interface YouTubeApiError {
  code: number;
  errors?: Array<{ reason: string }>;
}

interface YouTubeSearchResponse {
  items?: YouTubeSearchItem[];
  error?: YouTubeApiError;
}

interface YouTubeStatsResponse {
  items?: Array<{ id: string; statistics: { viewCount?: string } }>;
  error?: YouTubeApiError;
}

export type YouTubeResult<T> =
  | { ok: true; data: T }
  | { ok: false; quotaExceeded: true }
  | { ok: false; quotaExceeded: false; error: string };

// ─── Détection quota ──────────────────────────────────────────────────────────

function isQuotaExceeded(error: YouTubeApiError | undefined): boolean {
  if (!error) return false;
  const reason = error.errors?.[0]?.reason ?? "";
  return (
    error.code === 403 &&
    (reason === "quotaExceeded" || reason === "dailyLimitExceeded")
  );
}

// ─── Utilitaires ──────────────────────────────────────────────────────────────

export function decodeHtml(html: string): string {
  return html
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

export function pickThumbnail(
  thumbnails: YouTubeSearchItem["snippet"]["thumbnails"],
): string {
  return (
    thumbnails.high?.url ??
    thumbnails.medium?.url ??
    thumbnails.default?.url ??
    ""
  );
}

export function hasApiKey(): boolean {
  return YOUTUBE_API_KEY.length > 0;
}

// ─── Search ───────────────────────────────────────────────────────────────────

export async function searchVideos(
  query: string,
  maxResults: number,
): Promise<YouTubeResult<YouTubeSearchItem[]>> {
  const url = new URL("https://www.googleapis.com/youtube/v3/search");
  url.searchParams.set("part", "snippet");
  url.searchParams.set("q", query);
  url.searchParams.set("type", "video");
  url.searchParams.set("maxResults", String(maxResults));
  url.searchParams.set("relevanceLanguage", "fr");
  url.searchParams.set("order", "relevance");
  url.searchParams.set("key", YOUTUBE_API_KEY);

  try {
    const res = await fetch(url.toString());
    const data = (await res.json()) as YouTubeSearchResponse;

    if (!res.ok) {
      if (isQuotaExceeded(data.error))
        return { ok: false, quotaExceeded: true };
      return { ok: false, quotaExceeded: false, error: `HTTP ${res.status}` };
    }

    return { ok: true, data: data.items ?? [] };
  } catch (err: unknown) {
    return {
      ok: false,
      quotaExceeded: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// ─── Stats (vues) ─────────────────────────────────────────────────────────────

export async function fetchVideoStats(
  videoIds: string[],
): Promise<YouTubeResult<Map<string, bigint>>> {
  if (videoIds.length === 0) return { ok: true, data: new Map() };

  const url = new URL("https://www.googleapis.com/youtube/v3/videos");
  url.searchParams.set("part", "statistics");
  url.searchParams.set("id", videoIds.join(","));
  url.searchParams.set("key", YOUTUBE_API_KEY);

  try {
    const res = await fetch(url.toString());
    const data = (await res.json()) as YouTubeStatsResponse;

    if (!res.ok) {
      if (isQuotaExceeded(data.error))
        return { ok: false, quotaExceeded: true };
      return { ok: false, quotaExceeded: false, error: `HTTP ${res.status}` };
    }

    const map = new Map<string, bigint>();
    for (const item of data.items ?? []) {
      map.set(item.id, BigInt(item.statistics?.viewCount ?? "0"));
    }
    return { ok: true, data: map };
  } catch (err: unknown) {
    return {
      ok: false,
      quotaExceeded: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// ─── Search + stats combinés ──────────────────────────────────────────────────

export interface VideoWithStats {
  id: string;
  title: string;
  channelTitle: string;
  publishedAt: Date;
  thumbnail: string;
  viewCount: bigint;
}

export async function searchVideosWithStats(
  query: string,
  maxResults: number,
  delayMs = 300,
): Promise<YouTubeResult<VideoWithStats[]>> {
  const searchResult = await searchVideos(query, maxResults);
  if (!searchResult.ok) return searchResult;

  await sleep(delayMs);

  const ids = searchResult.data.map((i) => i.id.videoId).filter(Boolean);
  const statsResult = await fetchVideoStats(ids);
  if (!statsResult.ok) return statsResult;

  const videos: VideoWithStats[] = searchResult.data.map((item) => ({
    id: item.id.videoId,
    title: decodeHtml(item.snippet.title),
    channelTitle: item.snippet.channelTitle,
    publishedAt: new Date(item.snippet.publishedAt),
    thumbnail: pickThumbnail(item.snippet.thumbnails),
    viewCount: statsResult.data.get(item.id.videoId) ?? BigInt(0),
  }));

  return { ok: true, data: videos };
}
