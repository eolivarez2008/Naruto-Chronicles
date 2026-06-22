import { PrismaClient } from "@prisma/client";
import { sendDiscordEmbed, sendDiscordFatal } from "../discord-logger";
import { run as runCharacters } from "./update-characters";
import { run as runSagas } from "./update-sagas";
import { run as runVideos } from "./update-videos";

const prisma = new PrismaClient();

interface TaskResult {
  label: string;
  icon: string;
  durationSeconds: number;
  success: boolean;
  error?: string;
}

// ─── Exécution d'une tâche avec mesure du temps ───────────────────────────────

async function runTask(
  label: string,
  icon: string,
  fn: () => Promise<void>,
): Promise<TaskResult> {
  const sep = "━".repeat(50);
  console.log(`\n${sep}`);
  console.log(`${icon} ${label}`);
  console.log(sep);

  const startedAt = Date.now();
  try {
    await fn();
    const durationSeconds = Math.round((Date.now() - startedAt) / 1000);
    return { label, icon, durationSeconds, success: true };
  } catch (err: unknown) {
    const durationSeconds = Math.round((Date.now() - startedAt) / 1000);
    const error = err instanceof Error ? err.message : String(err);
    console.error(`❌ Erreur dans "${label}" :`, error);
    return { label, icon, durationSeconds, success: false, error };
  }
}

// ─── Rapport Discord global ───────────────────────────────────────────────────

async function notify(
  results: TaskResult[],
  totalDuration: number,
): Promise<void> {
  const hasError = results.some((r) => !r.success);

  const taskLines = results.map((r) =>
    r.success
      ? `${r.icon} **${r.label}** ✅ — ${r.durationSeconds}s`
      : `${r.icon} **${r.label}** ❌ — ${r.durationSeconds}s\n  └ ${r.error}`,
  );

  await sendDiscordEmbed(
    {
      title: hasError
        ? "⚠️ Cron quotidien — une ou plusieurs tâches en erreur"
        : "✅ Cron quotidien — toutes les tâches réussies",
      color: hasError ? 0xff4747 : 0x22c55e,
      fields: [
        {
          name: "📋 Résumé des tâches",
          value: taskLines.join("\n\n").slice(0, 1024),
          inline: false,
        },
        {
          name: "⏱ Durée totale",
          value: `${totalDuration}s`,
          inline: true,
        },
      ],
      footer: { text: `Naruto Chronicles · cron/index.ts` },
    },
    hasError,
  );
}

// ─── Point d'entrée ───────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const startedAt = Date.now();
  console.log(`\n🌀 Cron quotidien — ${new Date().toISOString()}`);

  const results: TaskResult[] = [];

  results.push(await runTask("Personnages (popularité)", "👥", runCharacters));
  results.push(await runTask("Sagas (scores & statuts)", "📺", runSagas));
  results.push(await runTask("Vidéos (nouvelles + vues)", "🎬", runVideos));

  const totalDuration = Math.round((Date.now() - startedAt) / 1000);
  const hasError = results.some((r) => !r.success);

  console.log(`\n${"━".repeat(50)}`);
  console.log(`${hasError ? "⚠" : "✅"} Cron terminé en ${totalDuration}s`);
  results.forEach((r) =>
    console.log(
      `  ${r.success ? "✓" : "✗"} ${r.label} — ${r.durationSeconds}s`,
    ),
  );

  await notify(results, totalDuration);
}

main()
  .catch(async (err) => {
    console.error("❌ Erreur fatale orchestrateur :", err);
    await sendDiscordFatal("cron/index.ts", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
