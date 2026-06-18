import { syncSagas } from "../lib/sync";

async function run() {
  console.log("⏳ Lancement de la tâche de fond...");
  try {
    await syncSagas();
    console.log("✨ Synchronisation terminée avec succès.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Échec de la synchronisation critique :", error);
    process.exit(1);
  }
}

run();
