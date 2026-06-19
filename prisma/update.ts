import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ─── Config ────────────────────────────────────────────────────────────────────

const JIKAN_BASE = "https://api.jikan.moe/v4";
const JIKAN_DELAY_MS = 500;
const MAX_RETRY = 4;
const MAX_RETRY_WAIT = 30_000;
const DISCORD_WEBHOOK = process.env.DISCORD_ADMIN_WEBHOOK_URL ?? "";
const ADMIN_ROLE_ID = "1483836726429356123";

const SAGA_CONFIG = [
  { key: "naruto", id: 20, type: "anime", label: "Naruto" },
  { key: "shippuden", id: 1735, type: "anime", label: "Naruto Shippuden" },
  { key: "boruto", id: 34566, type: "anime", label: "Boruto" },
  { key: "tbv", id: 160786, type: "manga", label: "Two Blue Vortex" },
];

// ─── Types ─────────────────────────────────────────────────────────────────────

interface ChangeLog {
  entity: string;
  field: string;
  before: string | number;
  after: string | number;
}

// ─── Réseau ────────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchWithRetry(url: string, attempt = 0): Promise<Response> {
  const res = await fetch(url);
  if (res.status === 429 && attempt < MAX_RETRY) {
    const retryAfter = parseInt(res.headers.get("retry-after") ?? "0", 10);
    const wait = Math.min(
      retryAfter > 0 ? retryAfter * 1000 : 1_000 * 2 ** attempt,
      MAX_RETRY_WAIT,
    );
    console.warn(
      `   ⏳ 429 — attente ${wait / 1000}s (tentative ${attempt + 1}/${MAX_RETRY})`,
    );
    await sleep(wait);
    return fetchWithRetry(url, attempt + 1);
  }
  return res;
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetchWithRetry(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} — ${url}`);
  return res.json() as Promise<T>;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function normalizeString(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function fmt(val: number | null | undefined): string {
  return val != null ? String(val) : "—";
}

// ─── Discord ───────────────────────────────────────────────────────────────────

async function sendDiscord(
  changes: ChangeLog[],
  sagaResults: Array<{ label: string; changes: ChangeLog[]; error?: string }>,
  errors: string[],
  hasRateLimit: boolean,
  durationSeconds: number,
): Promise<void> {
  if (!DISCORD_WEBHOOK) return;

  const hasError = errors.length > 0;
  const mention = hasError || hasRateLimit;

  // Champ popularité : top 10 changements triés par écart décroissant
  const popSorted = [...changes].sort((a, b) => {
    const diffA = Math.abs(Number(a.after) - Number(a.before));
    const diffB = Math.abs(Number(b.after) - Number(b.before));
    return diffB - diffA;
  });

  const popValue =
    popSorted.length === 0
      ? "Aucun changement"
      : popSorted
          .slice(0, 10)
          .map((c) => `**${c.entity}** : ${c.before} → **${c.after}**`)
          .join("\n") +
        (popSorted.length > 10
          ? `\n*…et ${popSorted.length - 10} autres*`
          : "");

  // Champ sagas
  const sagaValue =
    sagaResults
      .map((s) => {
        if (s.error) return `**${s.label}** ❌ ${s.error}`;
        if (s.changes.length === 0) return `**${s.label}** — aucun changement`;
        return (
          `**${s.label}**\n` +
          s.changes
            .map((c) => `  ${c.field} : ${c.before} → **${c.after}**`)
            .join("\n")
        );
      })
      .join("\n\n") || "Aucune saga mise à jour";

  const embed = {
    title: hasError
      ? "⚠️ Mise à jour terminée avec erreurs"
      : "✅ Mise à jour terminée",
    color: hasError ? 0xff4747 : 0x22c55e,
    fields: [
      {
        name: `⭐ Popularité — ${changes.length} changement(s)`,
        value: popValue.slice(0, 1024),
        inline: false,
      },
      {
        name: "📺 Sagas",
        value: sagaValue.slice(0, 1024),
        inline: false,
      },
      ...(errors.length > 0
        ? [
            {
              name: "❌ Erreurs",
              value: errors
                .map((e) => `• ${e}`)
                .join("\n")
                .slice(0, 1024),
              inline: false,
            },
          ]
        : []),
    ],
    footer: {
      text: `Naruto Chronicles · ${durationSeconds}s${hasRateLimit ? " · Rate-limit détecté" : ""}`,
    },
    timestamp: new Date().toISOString(),
  };

  try {
    await fetch(DISCORD_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: mention ? `<@&${ADMIN_ROLE_ID}>` : undefined,
        embeds: [embed],
      }),
    });
  } catch (e) {
    console.error("Discord webhook error :", e);
  }
}

// ─── Update popularité ─────────────────────────────────────────────────────────

async function updatePopularity(
  errors: string[],
  rateLimitDetected: { value: boolean },
): Promise<ChangeLog[]> {
  console.log("⭐ Popularité — fetch Jikan (3 endpoints)...");
  const scores = new Map<string, number>();

  const addScore = (name: string, favorites: number | null | undefined) => {
    const safe = favorites ?? 1;
    const k = normalizeString(name);
    scores.set(k, (scores.get(k) ?? 0) + safe);
    const reversed = normalizeString(name.split(", ").reverse().join(" "));
    if (reversed !== k)
      scores.set(reversed, (scores.get(reversed) ?? 0) + safe);
  };

  const animes = [
    { id: 20, label: "Naruto" },
    { id: 1735, label: "Shippuden" },
    { id: 34566, label: "Boruto" },
  ];

  for (const anime of animes) {
    process.stdout.write(`   [${anime.label}] fetch... `);
    try {
      await sleep(JIKAN_DELAY_MS);
      const data = await fetchJson<{
        data: Array<{ character: { name: string; favorites: number } }>;
      }>(`${JIKAN_BASE}/anime/${anime.id}/characters`);
      let count = 0;
      for (const entry of data.data ?? []) {
        if (entry.character?.name) {
          addScore(
            entry.character.name,
            (entry as any).favorites ?? entry.character.favorites,
          );
          count++;
        }
      }
      console.log(`✓ ${count} personnages`);
    } catch (e: any) {
      if (e.message?.includes("429")) rateLimitDetected.value = true;
      errors.push(`Popularité ${anime.label} : ${e.message}`);
      console.log(`⚠ skipped (${e.message})`);
    }
  }

  console.log(`   ${scores.size} entrées uniques récupérées`);

  // Lecture DB + diff avant/après
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
      changes.push({
        entity: char.name,
        field: "popularity",
        before: char.popularity,
        after: newPop,
      });
      toUpdate.push({ id: char.id, popularity: newPop });
    }
  }

  // Update par batch
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

  console.log(`   ✓ ${changes.length} personnage(s) mis à jour`);
  return changes;
}

// ─── Update sagas ──────────────────────────────────────────────────────────────

async function updateSagas(
  errors: string[],
  rateLimitDetected: { value: boolean },
): Promise<Array<{ label: string; changes: ChangeLog[]; error?: string }>> {
  console.log("\n📺 Sagas — fetch Jikan...");
  const results: Array<{
    label: string;
    changes: ChangeLog[];
    error?: string;
  }> = [];

  for (const saga of SAGA_CONFIG) {
    await sleep(JIKAN_DELAY_MS * 4);
    process.stdout.write(`   ${saga.label}... `);
    try {
      const res = await fetchWithRetry(
        `${JIKAN_BASE}/${saga.type}/${saga.id}/full`,
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const { data } = await res.json();

      const existing = await prisma.saga.findUnique({
        where: { key: saga.key },
      });
      const newScore = data.score ?? null;
      const newStatus =
        data.status === "Finished" || data.status === "Finished Airing"
          ? "Terminé"
          : "En cours";
      const newTotal = data.episodes ?? data.chapters ?? null;

      const changes: ChangeLog[] = [];
      if (existing) {
        if (existing.score !== newScore)
          changes.push({
            entity: saga.label,
            field: "Score",
            before: fmt(existing.score),
            after: fmt(newScore),
          });
        if (existing.status !== newStatus)
          changes.push({
            entity: saga.label,
            field: "Statut",
            before: existing.status,
            after: newStatus,
          });
        if (existing.total !== newTotal)
          changes.push({
            entity: saga.label,
            field: "Total",
            before: fmt(existing.total),
            after: fmt(newTotal),
          });
      }

      await prisma.saga.upsert({
        where: { key: saga.key },
        update: {
          score: newScore,
          status: newStatus,
          total: newTotal,
          lastUpdated: new Date(),
        },
        create: {
          key: saga.key,
          jikanId: saga.id,
          type: saga.type,
          label: saga.label,
          synopsisFr: "À venir",
          image: data.images?.jpg?.large_image_url ?? "",
          status: newStatus,
          score: newScore,
          creator: "Masashi Kishimoto",
          total: newTotal,
          year:
            data.aired?.prop?.from?.year ?? data.published?.prop?.from?.year,
        },
      });

      const summary =
        changes.length > 0
          ? changes.map((c) => `${c.field}: ${c.before}→${c.after}`).join(", ")
          : "aucun changement";
      console.log(`✓ (${summary})`);
      results.push({ label: saga.label, changes });
    } catch (e: any) {
      if (e.message?.includes("429")) rateLimitDetected.value = true;
      errors.push(`Saga ${saga.label} : ${e.message}`);
      console.log(`⚠ skipped (${e.message})`);
      results.push({ label: saga.label, changes: [], error: e.message });
    }
  }

  return results;
}

// ─── Main ──────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const startedAt = Date.now();
  console.log(`🔄 Update naruto-chronicles — ${new Date().toISOString()}\n`);

  const errors: string[] = [];
  const rateLimitDetected = { value: false };

  const popularityChanges = await updatePopularity(errors, rateLimitDetected);
  const sagaResults = await updateSagas(errors, rateLimitDetected);

  const duration = Math.round((Date.now() - startedAt) / 1000);
  const hasError = errors.length > 0;

  console.log(
    `\n${hasError ? "⚠" : "✅"} Terminé en ${duration}s — ${popularityChanges.length} perso(s) mis à jour`,
  );
  if (errors.length > 0) errors.forEach((e) => console.warn(`  ⚠ ${e}`));

  await sendDiscord(
    popularityChanges,
    sagaResults,
    errors,
    rateLimitDetected.value,
    duration,
  );
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
              title: "💀 Erreur fatale — update.ts",
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
