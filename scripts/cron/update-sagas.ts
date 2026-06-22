import { PrismaClient } from "@prisma/client";
import { sleep, fetchWithRetry, JIKAN_DELAY_MS } from "@/lib/network";
import { sendDiscordEmbed, sendDiscordFatal } from "../discord-logger";

const prisma = new PrismaClient();

const JIKAN_BASE = "https://api.jikan.moe/v4";

const SAGA_CONFIG = [
  { key: "naruto", id: 20, type: "anime", label: "Naruto" },
  { key: "shippuden", id: 1735, type: "anime", label: "Naruto Shippuden" },
  { key: "boruto", id: 34566, type: "anime", label: "Boruto" },
  { key: "tbv", id: 160786, type: "manga", label: "Two Blue Vortex" },
];

interface FieldChange {
  field: string;
  before: string | number;
  after: string | number;
}

interface SagaResult {
  label: string;
  changes: FieldChange[];
  error?: string;
}

function fmt(val: number | null | undefined): string {
  return val != null ? String(val) : "—";
}

// ─── MAJ des sagas depuis Jikan ────────────────────────────────────────────

async function updateSaga(
  key: string,
  jikanId: number,
  type: string,
  label: string,
): Promise<SagaResult> {
  process.stdout.write(`  ${label}... `);
  try {
    const res = await fetchWithRetry(`${JIKAN_BASE}/${type}/${jikanId}/full`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const { data } = (await res.json()) as { data: Record<string, unknown> };

    const newScore = (data.score as number | null) ?? null;
    const newStatus =
      data.status === "Finished" || data.status === "Finished Airing"
        ? "Terminé"
        : "En cours";
    const newTotal =
      (data.episodes as number | null) ??
      (data.chapters as number | null) ??
      null;

    const existing = await prisma.saga.findUnique({ where: { key } });
    const changes: FieldChange[] = [];

    if (existing) {
      if (existing.score !== newScore)
        changes.push({
          field: "Score",
          before: fmt(existing.score),
          after: fmt(newScore),
        });
      if (existing.status !== newStatus)
        changes.push({
          field: "Statut",
          before: existing.status,
          after: newStatus,
        });
      if (existing.total !== newTotal)
        changes.push({
          field: "Total",
          before: fmt(existing.total),
          after: fmt(newTotal),
        });
    }

    await prisma.saga.update({
      where: { key },
      data: {
        score: newScore,
        status: newStatus,
        total: newTotal,
        lastUpdated: new Date(),
      },
    });

    const summary =
      changes.length > 0
        ? changes.map((c) => `${c.field} ${c.before}→${c.after}`).join(", ")
        : "aucun changement";
    console.log(`✓ (${summary})`);

    return { label, changes };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.log(`⚠ skipped (${msg})`);
    return { label, changes: [], error: msg };
  }
}

// ─── Rapport Discord ──────────────────────────────────────────────────────────

async function notify(
  results: SagaResult[],
  durationSeconds: number,
): Promise<void> {
  const hasError = results.some((r) => r.error);
  const totalChanges = results.reduce((s, r) => s + r.changes.length, 0);

  const sagaLines = results.map((r) => {
    if (r.error) return `**${r.label}** ❌ ${r.error}`;
    if (r.changes.length === 0) return `**${r.label}** — aucun changement`;
    return (
      `**${r.label}**\n` +
      r.changes
        .map((c) => `  • ${c.field} : ${c.before} → **${c.after}**`)
        .join("\n")
    );
  });

  await sendDiscordEmbed(
    {
      title: hasError
        ? "⚠️ update-sagas — erreurs Jikan"
        : totalChanges > 0
          ? `✅ update-sagas — ${totalChanges} champ(s) mis à jour`
          : "✅ update-sagas — aucun changement",
      color: hasError ? 0xff4747 : 0xff6600,
      fields: [
        {
          name: "📺 Sagas",
          value: sagaLines.join("\n\n").slice(0, 1024),
          inline: false,
        },
      ],
      footer: {
        text: `Naruto Chronicles · update-sagas · ${durationSeconds}s`,
      },
    },
    hasError,
  );
}

// ─── Point d'entrée ───────────────────────────────────────────────────────────

export async function run(): Promise<void> {
  const startedAt = Date.now();
  console.log("📺 update-sagas — démarrage\n");

  const results: SagaResult[] = [];
  for (const saga of SAGA_CONFIG) {
    await sleep(JIKAN_DELAY_MS * 4);
    results.push(await updateSaga(saga.key, saga.id, saga.type, saga.label));
  }

  const duration = Math.round((Date.now() - startedAt) / 1000);
  const hasError = results.some((r) => r.error);
  console.log(`\n${hasError ? "⚠" : "✅"} Terminé en ${duration}s`);

  await notify(results, duration);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  run()
    .catch(async (err) => {
      console.error("❌ Erreur fatale :", err);
      await sendDiscordFatal("update-sagas.ts", err);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
