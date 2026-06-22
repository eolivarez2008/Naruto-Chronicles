import { PrismaClient } from "@prisma/client";
import { sleep } from "../../src/lib/network";
import {
  searchVideosWithStats,
  hasApiKey,
  VIDEO_CATEGORIES,
} from "@/lib/youtube";
import { sendDiscordEmbed, sendDiscordFatal } from "../discord-logger";

const prisma = new PrismaClient();

const MAX_RESULTS = 17;

interface CategoryResult {
  label: string;
  inserted: number;
  updated: number;
  skippedQuota: boolean;
  quotaHitDuring: boolean;
  error?: string;
}

// ─── Traitement par catégorie ─────────────────────────────────────────────────

async function processCategory(
  category: string,
  label: string,
  query: string,
): Promise<{ result: CategoryResult; quotaHit: boolean }> {
  const result: CategoryResult = {
    label,
    inserted: 0,
    updated: 0,
    skippedQuota: false,
    quotaHitDuring: false,
  };

  process.stdout.write(`  [${label}] search + stats... `);

  const fetchResult = await searchVideosWithStats(query, MAX_RESULTS);

  if (!fetchResult.ok) {
    if (fetchResult.quotaExceeded) {
      result.quotaHitDuring = true;
      console.log("⚠ quota YouTube atteint");
      return { result, quotaHit: true };
    }
    result.error = fetchResult.error;
    console.log(`⚠ skipped (${fetchResult.error})`);
    return { result, quotaHit: false };
  }

  for (const video of fetchResult.data) {
    if (!video.id) continue;

    const existing = await prisma.video.findUnique({ where: { id: video.id } });

    const videoData = {
      title: video.title,
      thumbnail: video.thumbnail,
      channelTitle: video.channelTitle,
      publishedAt: video.publishedAt,
      category,
      keyword: query,
      viewCount: video.viewCount,
      lastUpdated: new Date(),
    };

    if (existing) {
      await prisma.video.update({ where: { id: video.id }, data: videoData });
      result.updated++;
    } else {
      await prisma.video.create({ data: { id: video.id, ...videoData } });
      result.inserted++;
    }
  }

  console.log(
    `✓ +${result.inserted} nouvelles · ~${result.updated} vues mises à jour`,
  );
  return { result, quotaHit: false };
}

// ─── Rapport Discord ──────────────────────────────────────────────────────────

async function notify(
  results: CategoryResult[],
  quotaHitGlobal: boolean,
  durationSeconds: number,
  totalInDb: number,
): Promise<void> {
  const hasError = results.some((r) => r.error);
  const totalInserted = results.reduce((s, r) => s + r.inserted, 0);
  const totalUpdated = results.reduce((s, r) => s + r.updated, 0);

  const categoryLines = results.map((r) => {
    if (r.skippedQuota) return `**${r.label}** ⏭ ignorée (quota déjà atteint)`;
    if (r.quotaHitDuring)
      return `**${r.label}** ⚠️ quota atteint pendant le fetch`;
    if (r.error) return `**${r.label}** ❌ ${r.error}`;
    return `**${r.label}** +${r.inserted} nouvelles · ${r.updated} vues màj`;
  });

  const fields = [
    {
      name: `🎬 Catégories — +${totalInserted} nouvelles · ${totalUpdated} vues màj`,
      value: categoryLines.join("\n").slice(0, 1024),
      inline: false,
    },
    {
      name: "📊 Base de données",
      value: `${totalInDb} vidéos au total`,
      inline: true,
    },
  ];

  if (quotaHitGlobal) {
    fields.push({
      name: "⚠️ Quota YouTube atteint",
      value:
        "La limite quotidienne de l'API YouTube a été atteinte. " +
        "Les catégories restantes ont été ignorées proprement. " +
        "Le script reprendra normalement demain.",
      inline: false,
    });
  }

  if (hasError) {
    const errLines = results
      .filter((r) => r.error)
      .map((r) => `• **${r.label}** : ${r.error}`)
      .join("\n");
    fields.push({
      name: "❌ Erreurs techniques",
      value: errLines.slice(0, 1024),
      inline: false,
    });
  }

  await sendDiscordEmbed(
    {
      title: quotaHitGlobal
        ? "⚠️ update-videos — quota YouTube atteint"
        : hasError
          ? "⚠️ update-videos — erreurs techniques"
          : `✅ update-videos — +${totalInserted} nouvelles`,
      color: quotaHitGlobal ? 0xf59e0b : hasError ? 0xff4747 : 0xff6600,
      fields,
      footer: {
        text: `Naruto Chronicles · update-videos · ${durationSeconds}s`,
      },
    },
    quotaHitGlobal || hasError,
  );
}

// ─── Point d'entrée ───────────────────────────────────────────────────────────

export async function run(): Promise<void> {
  const startedAt = Date.now();
  console.log("🎬 update-videos — démarrage\n");

  if (!hasApiKey()) {
    console.error("❌ YOUTUBE_API_KEY manquante");
    process.exit(1);
  }

  const results: CategoryResult[] = [];
  let quotaHitGlobal = false;

  for (const { category, label, query } of VIDEO_CATEGORIES) {
    if (quotaHitGlobal) {
      console.log(`  [${label}] ⏭ skipped (quota déjà atteint)`);
      results.push({
        label,
        inserted: 0,
        updated: 0,
        skippedQuota: true,
        quotaHitDuring: false,
      });
      continue;
    }

    const { result, quotaHit } = await processCategory(category, label, query);
    results.push(result);

    if (quotaHit) quotaHitGlobal = true;

    await sleep(500);
  }

  const duration = Math.round((Date.now() - startedAt) / 1000);
  const totalInDb = await prisma.video.count();
  const totalInserted = results.reduce((s, r) => s + r.inserted, 0);

  console.log(
    `\n${quotaHitGlobal ? "⚠" : "✅"} Terminé en ${duration}s — +${totalInserted} nouvelles — ${totalInDb} en base`,
  );

  await notify(results, quotaHitGlobal, duration, totalInDb);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  run()
    .catch(async (err) => {
      console.error("❌ Erreur fatale :", err);
      await sendDiscordFatal("update-videos.ts", err);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
