import { PrismaClient } from "@prisma/client";
import {
  sleep,
  fetchJson,
  normalizeString,
  JIKAN_DELAY_MS,
} from "@/lib/network";
import { sendDiscordEmbed, sendDiscordFatal } from "../discord-logger";

const prisma = new PrismaClient();

const JIKAN_BASE = "https://api.jikan.moe/v4";

const ANIMES = [
  { id: 20, label: "Naruto" },
  { id: 1735, label: "Shippuden" },
  { id: 34566, label: "Boruto" },
];

interface ChangeLog {
  name: string;
  before: number;
  after: number;
}

// ─── MAJ des scores de popularité depuis Jikan ──────────────────────────────────

async function fetchPopularityScores(): Promise<{
  scores: Map<string, number>;
  rateLimitHit: boolean;
  errors: string[];
}> {
  const scores = new Map<string, number>();
  const errors: string[] = [];
  let rateLimitHit = false;

  const addScore = (name: string, favorites: number | undefined) => {
    const safe = favorites ?? 1;
    const key = normalizeString(name);
    scores.set(key, (scores.get(key) ?? 0) + safe);
    const reversed = normalizeString(name.split(", ").reverse().join(" "));
    if (reversed !== key)
      scores.set(reversed, (scores.get(reversed) ?? 0) + safe);
  };

  for (const anime of ANIMES) {
    process.stdout.write(`  [${anime.label}] fetch... `);
    try {
      await sleep(JIKAN_DELAY_MS);
      const data = await fetchJson<{
        data: Array<{ character: { name: string }; favorites?: number }>;
      }>(`${JIKAN_BASE}/anime/${anime.id}/characters`);

      let count = 0;
      for (const entry of data.data ?? []) {
        if (entry.character?.name) {
          addScore(entry.character.name, entry.favorites);
          count++;
        }
      }
      console.log(`✓ ${count} personnages`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("429")) rateLimitHit = true;
      errors.push(`${anime.label} : ${msg}`);
      console.log(`⚠ skipped (${msg})`);
    }
  }

  return { scores, rateLimitHit, errors };
}

// ─── Comparaison et mise à jour en base ───────────────────────────────────────

async function applyPopularityUpdates(
  scores: Map<string, number>,
): Promise<ChangeLog[]> {
  const allChars = await prisma.character.findMany({
    select: { id: true, name: true, normalizedName: true, popularity: true },
  });

  const changes: ChangeLog[] = [];
  const toUpdate: Array<{ id: number; popularity: number }> = [];

  for (const char of allChars) {
    const newPop =
      scores.get(char.normalizedName) ??
      scores.get(normalizeString(char.name.split(", ").reverse().join(" "))) ??
      null;

    if (newPop !== null && newPop !== char.popularity) {
      changes.push({ name: char.name, before: char.popularity, after: newPop });
      toUpdate.push({ id: char.id, popularity: newPop });
    }
  }

  const BATCH = 50;
  for (let i = 0; i < toUpdate.length; i += BATCH) {
    await prisma.$transaction(
      toUpdate.slice(i, i + BATCH).map((u) =>
        prisma.character.update({
          where: { id: u.id },
          data: { popularity: u.popularity, lastUpdated: new Date() },
        }),
      ),
    );
  }

  return changes;
}

// ─── Rapport Discord ──────────────────────────────────────────────────────────

async function notify(
  changes: ChangeLog[],
  errors: string[],
  rateLimitHit: boolean,
  durationSeconds: number,
): Promise<void> {
  const hasError = errors.length > 0;

  const topChanges = [...changes]
    .sort((a, b) => Math.abs(b.after - b.before) - Math.abs(a.after - a.before))
    .slice(0, 10);

  const changesField =
    changes.length === 0
      ? "Aucun changement détecté"
      : topChanges
          .map((c) => `**${c.name}** ${c.before} → **${c.after}**`)
          .join("\n") +
        (changes.length > 10 ? `\n*…et ${changes.length - 10} autre(s)*` : "");

  const fields = [
    {
      name: `👥 Popularité — ${changes.length} personnage(s) mis à jour`,
      value: changesField.slice(0, 1024),
      inline: false,
    },
  ];

  if (errors.length > 0) {
    fields.push({
      name: "❌ Erreurs Jikan",
      value: errors
        .map((e) => `• ${e}`)
        .join("\n")
        .slice(0, 1024),
      inline: false,
    });
  }

  if (rateLimitHit) {
    fields.push({
      name: "⚠️ Rate-limit Jikan",
      value:
        "Un rate-limit a été détecté pendant la récupération. Certaines données peuvent être incomplètes.",
      inline: false,
    });
  }

  await sendDiscordEmbed(
    {
      title: hasError
        ? "⚠️ update-characters — erreurs Jikan"
        : `✅ update-characters — ${changes.length} changement(s)`,
      color: hasError ? 0xff4747 : rateLimitHit ? 0xf59e0b : 0xff6600,
      fields,
      footer: {
        text: `Naruto Chronicles · update-characters · ${durationSeconds}s`,
      },
    },
    hasError || rateLimitHit,
  );
}

// ─── Point d'entrée ───────────────────────────────────────────────────────────

export async function run(): Promise<void> {
  const startedAt = Date.now();
  console.log("👥 update-characters — démarrage\n");

  const { scores, rateLimitHit, errors } = await fetchPopularityScores();
  console.log(`\n  ${scores.size} entrées de popularité récupérées`);

  const changes = await applyPopularityUpdates(scores);
  console.log(`  ✓ ${changes.length} personnage(s) mis à jour`);

  const duration = Math.round((Date.now() - startedAt) / 1000);
  console.log(`\n${errors.length > 0 ? "⚠" : "✅"} Terminé en ${duration}s`);

  await notify(changes, errors, rateLimitHit, duration);
}

// Exécution directe (npx tsx scripts/cron/update-characters.ts)
if (import.meta.url === `file://${process.argv[1]}`) {
  run()
    .catch(async (err) => {
      console.error("❌ Erreur fatale :", err);
      await sendDiscordFatal("update-characters.ts", err);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
