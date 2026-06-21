import { PrismaClient } from "@prisma/client";
import * as crypto from "crypto";

const prisma = new PrismaClient();

// ─── Config ────────────────────────────────────────────────────────────────────

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY ?? "";
const DISCORD_WEBHOOK = process.env.DISCORD_ADMIN_WEBHOOK_URL ?? "";
const ADMIN_ROLE_ID = "1483836726429356123";
const MAX_RESULTS = 17;

const CATEGORY_QUERIES: { category: string; label: string; query: string }[] = [
  { category: "edit", label: "Edit", query: "Naruto edit amv 4k" },
  { category: "theorie", label: "Théorie", query: "Naruto theories explained" },
  { category: "react", label: "React", query: "Naruto reaction compilation" },
  { category: "fanart", label: "Fanart", query: "Naruto fanart speed drawing" },
  { category: "ost", label: "OST", query: "Naruto OST soundtrack epic" },
];

// ─── Types ─────────────────────────────────────────────────────────────────────

interface YouTubeSearchItem {
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

interface YouTubeStatsItem {
  id: string;
  statistics: {
    viewCount?: string;
  };
}

interface FetchResult {
  category: string;
  label: string;
  fetched: number;
  inserted: number;
  updated: number;
  skipped: number;
  error?: string;
}

// ─── YouTube API ───────────────────────────────────────────────────────────────

async function searchVideos(
  query: string,
  maxResults: number,
): Promise<YouTubeSearchItem[]> {
  const url = new URL("https://www.googleapis.com/youtube/v3/search");
  url.searchParams.set("part", "snippet");
  url.searchParams.set("q", query);
  url.searchParams.set("type", "video");
  url.searchParams.set("maxResults", String(maxResults));
  url.searchParams.set("relevanceLanguage", "fr");
  url.searchParams.set("order", "relevance");
  url.searchParams.set("key", YOUTUBE_API_KEY);

  const res = await fetch(url.toString());
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      `YouTube Search API ${res.status}: ${(err as any)?.error?.message ?? res.statusText}`,
    );
  }
  const data = await res.json();
  return (data.items ?? []) as YouTubeSearchItem[];
}

async function fetchVideoStats(
  videoIds: string[],
): Promise<Map<string, bigint>> {
  if (videoIds.length === 0) return new Map();

  const url = new URL("https://www.googleapis.com/youtube/v3/videos");
  url.searchParams.set("part", "statistics");
  url.searchParams.set("id", videoIds.join(","));
  url.searchParams.set("key", YOUTUBE_API_KEY);

  const res = await fetch(url.toString());
  if (!res.ok) return new Map();

  const data = await res.json();
  const map = new Map<string, bigint>();
  for (const item of (data.items ?? []) as YouTubeStatsItem[]) {
    const views = BigInt(item.statistics?.viewCount ?? "0");
    map.set(item.id, views);
  }
  return map;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function pickThumbnail(t: YouTubeSearchItem["snippet"]["thumbnails"]): string {
  return t.high?.url ?? t.medium?.url ?? t.default?.url ?? "";
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function decodeHtml(html: string): string {
  return html
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

// ─── Traitement par catégorie ──────────────────────────────────────────────────

async function processCategory(
  category: string,
  label: string,
  query: string,
): Promise<FetchResult> {
  const result: FetchResult = {
    category,
    label,
    fetched: 0,
    inserted: 0,
    updated: 0,
    skipped: 0,
  };

  process.stdout.write(`   [${label}] fetch... `);

  let items: YouTubeSearchItem[];
  try {
    items = await searchVideos(query, MAX_RESULTS);
    result.fetched = items.length;
  } catch (e: any) {
    result.error = e.message;
    console.log(`⚠ skipped (${e.message})`);
    return result;
  }

  if (items.length === 0) {
    console.log("✓ 0 résultat");
    return result;
  }

  const videoIds = items.map((i) => i.id.videoId).filter(Boolean);
  const statsMap = await fetchVideoStats(videoIds);

  for (const item of items) {
    const videoId = item.id.videoId;
    if (!videoId) {
      result.skipped++;
      continue;
    }

    const existing = await prisma.video.findUnique({ where: { id: videoId } });

    const videoData = {
      title: decodeHtml(item.snippet.title),
      thumbnail: pickThumbnail(item.snippet.thumbnails),
      channelTitle: item.snippet.channelTitle,
      publishedAt: new Date(item.snippet.publishedAt),
      category,
      keyword: query,
      viewCount: statsMap.get(videoId) ?? BigInt(0),
      lastUpdated: new Date(),
    };

    if (existing) {
      // mise à jour silencieuse : viewCount + metadata uniquement
      await prisma.video.update({ where: { id: videoId }, data: videoData });
      result.updated++;
    } else {
      await prisma.video.create({ data: { id: videoId, ...videoData } });
      result.inserted++;
    }
  }

  console.log(
    `✓ ${result.fetched} fetch — +${result.inserted} new, ~${result.updated} upd`,
  );
  return result;
}

// ─── Discord notification ──────────────────────────────────────────────────────

async function sendDiscord(
  results: FetchResult[],
  durationSeconds: number,
  totalInDb: number,
): Promise<void> {
  if (!DISCORD_WEBHOOK) return;

  const hasError = results.some((r) => r.error);
  const totalInserted = results.reduce((s, r) => s + r.inserted, 0);

  const fields = results.map((r) => ({
    name: `${r.label} ${r.error ? "❌" : "✅"}`,
    value: r.error
      ? r.error.slice(0, 256)
      : `+${r.inserted} new · ~${r.updated} mis à jour`,
    inline: true,
  }));

  fields.push({
    name: "📊 Total en base",
    value: `${totalInDb} vidéos`,
    inline: false,
  });

  const embed = {
    title: hasError
      ? "⚠️ Fetch vidéos — erreurs détectées"
      : `✅ Fetch vidéos — +${totalInserted} nouvelles`,
    color: hasError ? 0xff4747 : 0xff6600,
    fields,
    footer: { text: `Naruto Chronicles · ${durationSeconds}s` },
    timestamp: new Date().toISOString(),
  };

  try {
    await fetch(DISCORD_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: hasError ? `<@&${ADMIN_ROLE_ID}>` : undefined,
        embeds: [embed],
      }),
    });
  } catch (e) {
    console.error("Discord webhook error :", e);
  }
}

// ─── Main ──────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const startedAt = Date.now();
  console.log(`🎬 Fetch vidéos YouTube — ${new Date().toISOString()}\n`);

  if (!YOUTUBE_API_KEY) {
    console.error("❌ YOUTUBE_API_KEY manquante dans .env");
    process.exit(1);
  }

  const results: FetchResult[] = [];

  for (const { category, label, query } of CATEGORY_QUERIES) {
    const result = await processCategory(category, label, query);
    results.push(result);
    await sleep(500);
  }

  const duration = Math.round((Date.now() - startedAt) / 1000);
  const totalInDb = await prisma.video.count();

  const totalInserted = results.reduce((s, r) => s + r.inserted, 0);
  const totalUpdated = results.reduce((s, r) => s + r.updated, 0);
  const errors = results.filter((r) => r.error);

  console.log(`
╔══════════════════════════════════════════╗
║      Fetch vidéos terminé avec succès    ║
╠══════════════════════════════════════════╣
║  Durée              : ${`${duration}s`.padEnd(18)}║
║  Nouvelles vidéos   : ${String(totalInserted).padEnd(18)}║
║  Mises à jour       : ${String(totalUpdated).padEnd(18)}║
║  Total en base      : ${String(totalInDb).padEnd(18)}║
${errors.length > 0 ? `╠══════════════════════════════════════════╣\n║  ⚠ ${errors.length} erreur(s) — vérifier le log        ║` : ""}
╚══════════════════════════════════════════╝
`);

  await sendDiscord(results, duration, totalInDb);
}

main()
  .catch(async (e) => {
    console.error("❌ Erreur fatale :", e);
    if (DISCORD_WEBHOOK) {
      await fetch(DISCORD_WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: `<@&${ADMIN_ROLE_ID}>`,
          embeds: [
            {
              title: "💀 Erreur fatale — fetch-videos.ts",
              description: String(e),
              color: 0xff0000,
              timestamp: new Date().toISOString(),
              footer: { text: "Naruto Chronicles" },
            },
          ],
        }),
      }).catch(() => {});
    }
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
