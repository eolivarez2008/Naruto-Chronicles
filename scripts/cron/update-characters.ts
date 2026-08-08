import { PrismaClient } from "@prisma/client";
import {
  sleep,
  fetchWithRetry,
  normalizeString,
  TENRAI_DELAY_MS,
} from "@/lib/network";
import { sendDiscordEmbed, sendDiscordFatal } from "../discord-logger";

const prisma = new PrismaClient();

const TENRAI_BASE = "https://api.tenrai.org/v1";

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

interface TenraiCharactersResponse {
  data: Array<{ character: { name: string }; favorites?: number }>;
}

function isValidCharactersResponse(
  json: unknown,
): json is TenraiCharactersResponse {
  return (
    !!json &&
    typeof json === "object" &&
    Array.isArray((json as TenraiCharactersResponse).data)
  );
}

async function fetchPopularityScores(): Promise<{
  scores: Map<string, number>;
  errors: string[];
}> {
  const scores = new Map<string, number>();
  const errors: string[] = [];

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
    await sleep(TENRAI_DELAY_MS);

    const res = await fetchWithRetry(
      `${TENRAI_BASE}/anime/${anime.id}/characters`,
    );

    if (!res.ok) {
      const msg = `${anime.label} : HTTP ${res.status}`;
      errors.push(msg);
      console.log(`❌ ${msg}`);
      continue;
    }

    const json = (await res.json()) as unknown;
    if (!isValidCharactersResponse(json)) {
      const msg = `${anime.label} : réponse invalide`;
      errors.push(msg);
      console.log(`❌ ${msg}`);
      continue;
    }

    let count = 0;
    for (const entry of json.data) {
      if (entry.character?.name) {
        addScore(entry.character.name, entry.favorites);
        count++;
      }
    }
    console.log(`✓ ${count} personnages`);
  }

  return { scores, errors };
}

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

async function notify(
  changes: ChangeLog[],
  errors: string[],
  aborted: boolean,
  durationSeconds: number,
): Promise<void> {
  const hasError = errors.length > 0;

  const topChanges = [...changes]
    .sort((a, b) => Math.abs(b.after - b.before) - Math.abs(a.after - a.before))
    .slice(0, 10);

  const changesField = aborted
    ? "Mise à jour annulée — au moins une source a échoué"
    : changes.length === 0
      ? "Aucun changement détecté"
      : topChanges
          .map((c) => `**${c.name}** ${c.before} → **${c.after}**`)
          .join("\n") +
        (changes.length > 10 ? `\n*…et ${changes.length - 10} autre(s)*` : "");

  const fields = [
    {
      name: aborted
        ? "🚫 Mise à jour annulée"
        : `👥 Popularité — ${changes.length} personnage(s) mis à jour`,
      value: changesField.slice(0, 1024),
      inline: false,
    },
  ];

  if (errors.length > 0) {
    fields.push({
      name: "❌ Erreurs Tenrai",
      value: errors
        .map((e) => `• ${e}`)
        .join("\n")
        .slice(0, 1024),
      inline: false,
    });
  }

  await sendDiscordEmbed(
    {
      title: aborted
        ? "🚫 update-characters — mise à jour annulée"
        : hasError
          ? "⚠️ update-characters — erreurs Tenrai"
          : `✅ update-characters — ${changes.length} changement(s)`,
      color: aborted ? 0xff4747 : hasError ? 0xf59e0b : 0xff6600,
      fields,
      footer: {
        text: `Naruto Chronicles · update-characters · ${durationSeconds}s`,
      },
    },
    aborted || hasError,
  );
}

export async function run(): Promise<void> {
  const startedAt = Date.now();
  console.log("👥 update-characters — démarrage\n");

  const { scores, errors } = await fetchPopularityScores();
  const aborted = errors.length > 0;

  if (aborted) {
    console.log(`\n🚫 ${errors.length} source(s) en échec — mise à jour annulée`);
    const duration = Math.round((Date.now() - startedAt) / 1000);
    await notify([], errors, true, duration);
    return;
  }

  console.log(`\n  ${scores.size} entrées de popularité récupérées`);

  const changes = await applyPopularityUpdates(scores);
  console.log(`  ✓ ${changes.length} personnage(s) mis à jour`);

  const duration = Math.round((Date.now() - startedAt) / 1000);
  console.log(`\n✅ Terminé en ${duration}s`);

  await notify(changes, [], false, duration);
}

// Exécution directe du script
if (import.meta.url === `file://${process.argv[1]}`) {
  run()
    .catch(async (err) => {
      console.error("❌ Erreur fatale :", err);
      await sendDiscordFatal("update-characters.ts", err);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}