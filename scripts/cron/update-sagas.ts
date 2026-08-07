import { PrismaClient } from "@prisma/client";
import { sleep, fetchWithRetry, TENRAI_DELAY_MS } from "@/lib/network";
import { sendDiscordEmbed, sendDiscordFatal } from "../discord-logger";

const prisma = new PrismaClient();

const TENRAI_BASE = "https://api.tenrai.org/v1";

type SagaType = "anime" | "manga";

interface SagaTarget {
  tenraiId: number;
  type: SagaType;
  label: string;
}

const SAGA_TARGETS: SagaTarget[] = [
  { tenraiId: 20, type: "anime", label: "Naruto" },
  { tenraiId: 11, type: "manga", label: "Naruto" },
  {
    tenraiId: 1735,
    type: "anime",
    label: "Naruto Shippuden",
  },
  { tenraiId: 34566, type: "anime", label: "Boruto" },
  { tenraiId: 95210, type: "manga", label: "Boruto" },
  {
    tenraiId: 160786,
    type: "manga",
    label: "Two Blue Vortex",
  },
];

interface FieldChange {
  field: string;
  before: string | number;
  after: string | number;
}

interface SagaResult {
  label: string;
  type: SagaType;
  changes: FieldChange[];
  error?: string;
}

interface TenraiFullData {
  status?: string;
  score?: number | null;
  episodes?: number | null;
  chapters?: number | null;
  volumes?: number | null;
  authors?: Array<{ name: string }>;
  studios?: Array<{ name: string }>;
  images?: Record<string, Record<string, string>>;
  aired?: { prop?: { from?: { year?: number } } };
  published?: { prop?: { from?: { year?: number } } };
}

function fmt(val: number | null | undefined): string {
  return val != null ? String(val) : "—";
}

function isValidTenraiData(data: unknown): data is TenraiFullData {
  return (
    !!data &&
    typeof data === "object" &&
    typeof (data as { status?: unknown }).status === "string"
  );
}

async function updateSaga(target: SagaTarget): Promise<SagaResult> {
  const { tenraiId, type, label } = target;
  const endpoint = type === "anime" ? "anime" : "manga";

  process.stdout.write(`  ${label} (${type})... `);

  try {
    const res = await fetchWithRetry(
      `${TENRAI_BASE}/${endpoint}/${tenraiId}/full`,
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const json = (await res.json()) as { data: unknown };
    if (!isValidTenraiData(json.data))
      throw new Error("Données Tenrai invalides");

    const data = json.data;

    const newScore = data.score ?? null;
    const newStatus =
      data.status === "Finished" ||
      data.status === "Finished Airing" ||
      data.status === "Complete"
        ? "Terminé"
        : "En cours";
    const newEpisodes = type === "anime" ? (data.episodes ?? null) : null;
    const newChapters = type === "manga" ? (data.chapters ?? null) : null;
    const newVolumes = type === "manga" ? (data.volumes ?? null) : null;

    let creator = "Masashi Kishimoto";
    if (data.authors?.length)
      creator = data.authors[0].name.split(", ").reverse().join(" ");
    else if (data.studios?.length) creator = data.studios[0].name;

    const image = data.images?.jpg?.large_image_url ?? "";
    const year =
      data.aired?.prop?.from?.year ?? data.published?.prop?.from?.year ?? null;

    const whereCondition = {
      tenraiId_type: {
        tenraiId,
        type,
      },
    };

    const existing = await prisma.saga.findUnique({ where: whereCondition });
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
      if (type === "anime" && existing.episodes !== newEpisodes)
        changes.push({
          field: "Épisodes",
          before: fmt(existing.episodes),
          after: fmt(newEpisodes),
        });
      if (type === "manga" && existing.chapters !== newChapters)
        changes.push({
          field: "Chapitres",
          before: fmt(existing.chapters),
          after: fmt(newChapters),
        });
      if (type === "manga" && existing.volumes !== newVolumes)
        changes.push({
          field: "Volumes",
          before: fmt(existing.volumes),
          after: fmt(newVolumes),
        });
    }

    await prisma.saga.upsert({
      where: whereCondition,
      update: {
        score: newScore,
        status: newStatus,
        episodes: newEpisodes,
        chapters: newChapters,
        volumes: newVolumes,
        lastUpdated: new Date(),
      },
      create: {
        tenraiId,
        type,
        label,
        synopsisFr : "",
        image,
        status: newStatus,
        score: newScore,
        creator,
        episodes: newEpisodes,
        chapters: newChapters,
        volumes: newVolumes,
        year,
      },
    });

    const summary =
      changes.length > 0
        ? changes.map((c) => `${c.field} ${c.before}→${c.after}`).join(", ")
        : "aucun changement";
    console.log(`✓ (${summary})`);

    return { label, type, changes };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.log(`⚠ skipped (${msg})`);
    return { label, type, changes: [], error: msg };
  }
}

async function notify(
  results: SagaResult[],
  durationSeconds: number,
): Promise<void> {
  const hasError = results.some((r) => r.error);
  const totalChanges = results.reduce((s, r) => s + r.changes.length, 0);

  const sagaLines = results.map((r) => {
    const suffix = r.type === "anime" ? "anime" : "manga";
    if (r.error) return `**${r.label} (${suffix})** ❌ ${r.error}`;
    if (r.changes.length === 0)
      return `**${r.label} (${suffix})** — aucun changement`;
    return (
      `**${r.label} (${suffix})**\n` +
      r.changes
        .map((c) => `  • ${c.field} : ${c.before} → **${c.after}**`)
        .join("\n")
    );
  });

  await sendDiscordEmbed(
    {
      title: hasError
        ? "⚠️ update-sagas — erreurs Tenrai"
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

export async function run(): Promise<void> {
  const startedAt = Date.now();
  console.log("📺 update-sagas — démarrage\n");

  const results: SagaResult[] = [];
  for (const target of SAGA_TARGETS) {
    await sleep(TENRAI_DELAY_MS * 4);
    results.push(await updateSaga(target));
  }

  const duration = Math.round((Date.now() - startedAt) / 1000);
  const hasError = results.some((r) => r.error);
  console.log(`\n${hasError ? "⚠" : "✅"} Terminé en ${duration}s`);

  await notify(results, duration);
}

run()
  .catch(async (err) => {
    console.error("❌ Erreur fatale :", err);
    await sendDiscordFatal("update-sagas.ts", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

if (import.meta.url === `file://${process.argv[1]}`) {
  run()
    .catch(async (err) => {
      console.error("❌ Erreur fatale :", err);
      await sendDiscordFatal("update-sagas.ts", err);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}