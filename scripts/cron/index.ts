import { PrismaClient } from "@prisma/client";
import { sendDiscordFatal } from "../discord-logger";
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
  const startedAt = Date.now();

  try {
    await fn();

    return {
      label,
      icon,
      durationSeconds: Math.round((Date.now() - startedAt) / 1000),
      success: true,
    };
  } catch (err: unknown) {
    return {
      label,
      icon,
      durationSeconds: Math.round((Date.now() - startedAt) / 1000),
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
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
}

main()
  .catch(async (err) => {
    console.error("❌ Erreur fatale orchestrateur :", err);
    await sendDiscordFatal("cron/index.ts", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
