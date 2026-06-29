import { PrismaClient, StoryArc } from "@prisma/client";
import OpenAI from "openai";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

dotenv.config();

const prisma = new PrismaClient();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ─── Config ───────────────────────────────────────────────────────────────────

const DELAY_BETWEEN_ARCS_MS = 1500;
const CHUNK_SIZE = 55000;
const GPT_MODEL = "gpt-4o-mini";

const INPUT_COST_PER_TOKEN = 0.00000015;
const OUTPUT_COST_PER_TOKEN = 0.0000006;

// ─── Logger ───────────────────────────────────────────────────────────────────

const LOG_DIR = path.join(process.cwd(), "logs");
const LOG_FILE = path.join(
  LOG_DIR,
  `translate-arcs_${new Date().toISOString().replace(/[:.]/g, "-")}.log`,
);

function ensureLogDir() {
  if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
}

function log(
  message: string,
  level: "INFO" | "WARN" | "ERROR" | "COST" = "INFO",
) {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] [${level}] ${message}`;
  console.log(line);
  fs.appendFileSync(LOG_FILE, line + "\n", "utf8");
}

function logSeparator() {
  const line = "─".repeat(80);
  console.log(line);
  fs.appendFileSync(LOG_FILE, line + "\n", "utf8");
}

// ─── Glossaire ────────────────────────────────────────────────────────────────

const GLOSSAIRE = `
## Termes à conserver tels quels (ne pas traduire)

### Rangs ninja
- Genin, Chūnin, Jōnin, ANBU, Kage, Hokage, Kazekage, Mizukage, Tsuchikage, Raikage
- Daimyō, Sannin

### Personnages (noms propres)
- Naruto, Sasuke, Sakura, Kakashi, Obito, Madara, Hashirama, Tobirama
- Minato, Kushina, Itachi, Shisui, Orochimaru, Jiraiya, Tsunade, Nagato, Konan
- Pain, Tobi, Zetsu, Kisame, Deidara, Sasori, Hidan, Kakuzu, Kabuto
- Hiruzen, Danzo, Shikamaru, Ino, Choji, Neji, Tenten, Lee, Hinata, Kiba, Shino
- Gaara, Temari, Kankuro, Killer B, Ay, Mei, Onoki, Mifune
- Boruto, Sarada, Mitsuki, Kawaki, Daemon, Eida, Isshiki, Jigen, Delta, Code, Ada
- Momoshiki, Kinshiki

### Lieux
- Konoha, Konohagakure, Sunagakure, Kirigakure, Iwagakure, Kumogakure, Otogakure, Amegakure, Uzushiogakure
- Land of Fire → Pays du Feu
- Land of Wind → Pays du Vent
- Land of Water → Pays de l'Eau
- Land of Earth → Pays de la Terre
- Land of Lightning → Pays de l'Éclair

### Clans & organisations
- Uchiha, Senju, Hyūga, Uzumaki, Nara, Yamanaka, Akimichi, Aburame, Inuzuka
- Ōtsutsuki, Kaguya, Akatsuki, Kara, Karma

### Techniques & jutsus
- Chidori, Rasengan, Rasenshuriken → conserver
- Sharingan, Mangekyō Sharingan, Rinnegan, Byakugan, Tenseigan, Jougan → conserver
- Susanoo, Amaterasu, Tsukuyomi, Izanagi, Izanami → conserver
- Edo Tensei → conserver
- Ninjutsu, Genjutsu, Taijutsu, Fūinjutsu → conserver
- Shadow Clone Jutsu → Technique du Double Umbral
- Multi Shadow Clone Jutsu → Technique de multiplication par clonage
- Summoning Jutsu → Technique d'Invocation
- Wood Style / Wood Release → Style Bois
- Fire Style / Fire Release → Style Feu
- Water Style / Water Release → Style Eau
- Wind Style / Wind Release → Style Vent
- Earth Style / Earth Release → Style Terre
- Lightning Style / Lightning Release → Style Foudre
- Sage Mode → Mode Ermite
- Nine-Tails Chakra Mode → Mode Chakra du Kyūbi
- Truth-Seeking Balls → Orbes de Vérité
- Infinite Tsukuyomi → Tsukuyomi Infini
- Reanimation Jutsu → Edo Tensei
- Eight Gates → Huit Portes Célestes
- Gentle Fist → Poing Doux
- Eight Trigrams → Soixante-quatre poings
- Planetary Devastation → Dévstation Planétaire

### Créatures & entités
- Bijū / Tailed Beasts → Bêtes à queues
- Kyūbi / Nine-Tails → Kyūbi
- Shukaku, Kurama → conserver
- Jinchūriki → conserver
- White Zetsu → Zetsu Blanc
- Black Zetsu → Zetsu Noir

### Concepts
- Shinobi → Shinobi ou Ninja (selon contexte)
- Chakra, Kekkei Genkai → conserver
- Sage of the Six Paths → Sage des Six Chemins
- Ten-Tails → Dix-Queues
- Great Ninja War → Grande Guerre Ninja
- Fourth Great Ninja War → Quatrième Grande Guerre Ninja
- Hidden Leaf Village → Village Caché de la Feuille
- Five Kage Summit → Sommet des Cinq Kages
- Chunin Exams → Examens Chūnin
- Bell Test → Test de la Clochette

### Boruto / Two Blue Vortex
- Karma, Omnipotence, Code → conserver
- Vessel → Réceptacle
- Pure Land → Terre Pure
- Claw Marks → Marques de Griffe
`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function charsToTokens(chars: number): number {
  return Math.ceil(chars / 4);
}

function calcCost(inputTokens: number, outputTokens: number): number {
  return (
    inputTokens * INPUT_COST_PER_TOKEN + outputTokens * OUTPUT_COST_PER_TOKEN
  );
}

function estimateCostFromChars(inputChars: number): number {
  const tokens = charsToTokens(inputChars);
  return calcCost(tokens, tokens);
}

function formatCost(usd: number): string {
  return `$${usd.toFixed(6)} USD (€${(usd * 0.92).toFixed(6)})`;
}

function isAlreadyTranslated(arc: StoryArc): boolean {
  return !!(arc.titleFr && arc.summaryFr && arc.contentFr);
}

// ─── Traduction chunk texte brut ──────────────────────────────────────────────

async function translateChunk(
  text: string,
  isFirst: boolean,
  arcTitle: string,
  chunkIndex: number,
  totalChunks: number,
): Promise<{ text: string; inputTokens: number; outputTokens: number }> {
  const context = isFirst
    ? "Tu traduis le début d'un arc narratif Naruto."
    : "Tu traduis la suite d'un arc narratif Naruto. Continue la traduction directement, sans introduction ni conclusion.";

  const response = await openai.chat.completions.create({
    model: GPT_MODEL,
    messages: [
      {
        role: "system",
        content: `Tu es un traducteur expert de l'univers Naruto pour la version française officielle.

${context}

Règles :
1. Traduis en français fluide, épique et narratif
2. Respecte absolument le glossaire — ces termes NE doivent PAS être traduits sauf indication contraire
3. Conserve le formatage Markdown (##, ###, -, paragraphes)
4. Réponds UNIQUEMENT avec le texte traduit, aucun JSON, aucun commentaire, aucune introduction

${GLOSSAIRE}`,
      },
      {
        role: "user",
        content: text,
      },
    ],
    temperature: 0.3,
  });

  const inputTokens =
    response.usage?.prompt_tokens ?? charsToTokens(text.length);
  const outputTokens = response.usage?.completion_tokens ?? 0;
  const cost = calcCost(inputTokens, outputTokens);

  log(
    `  Chunk ${chunkIndex}/${totalChunks} — "${arcTitle}" | ${text.length} chars | ${inputTokens} in / ${outputTokens} out tokens | ${formatCost(cost)}`,
    "COST",
  );

  return {
    text: response.choices[0].message.content?.trim() ?? "",
    inputTokens,
    outputTokens,
  };
}

// ─── Traduction meta (titre + résumé) ─────────────────────────────────────────

async function translateMeta(arc: StoryArc): Promise<{
  titleFr: string;
  summaryFr: string;
  inputTokens: number;
  outputTokens: number;
}> {
  const payload = JSON.stringify({
    titleFr: arc.title,
    summaryFr: arc.summary,
  });

  const response = await openai.chat.completions.create({
    model: GPT_MODEL,
    messages: [
      {
        role: "system",
        content: `Tu es un traducteur expert de l'univers Naruto pour la version française officielle.
Traduis le JSON en français fluide et épique.
Réponds UNIQUEMENT avec le JSON traduit, aucun texte autour.
Les clés restent en anglais : titleFr, summaryFr.

${GLOSSAIRE}`,
      },
      {
        role: "user",
        content: payload,
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0.3,
  });

  const inputTokens =
    response.usage?.prompt_tokens ?? charsToTokens(payload.length);
  const outputTokens = response.usage?.completion_tokens ?? 0;
  const cost = calcCost(inputTokens, outputTokens);

  log(
    `  Meta — "${arc.title}" | ${inputTokens} in / ${outputTokens} out tokens | ${formatCost(cost)}`,
    "COST",
  );

  const raw = response.choices[0].message.content ?? "{}";
  const parsed = JSON.parse(raw);

  return {
    titleFr: parsed.titleFr ?? arc.title,
    summaryFr: parsed.summaryFr ?? arc.summary,
    inputTokens,
    outputTokens,
  };
}

// ─── Traduction complète d'un arc ─────────────────────────────────────────────

async function translateArc(arc: StoryArc): Promise<{
  titleFr: string;
  summaryFr: string;
  contentFr: string;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCost: number;
}> {
  let totalInputTokens = 0;
  let totalOutputTokens = 0;

  log(
    `  Début traduction — "${arc.title}" (order: ${arc.order}, ${arc.content.length} chars contenu)`,
  );

  // Traduction meta
  const meta = await translateMeta(arc);
  totalInputTokens += meta.inputTokens;
  totalOutputTokens += meta.outputTokens;

  // Chunking du contenu
  let contentFr = "";

  if (arc.content.length === 0) {
    log(`  Contenu vide — skip content translation`, "WARN");
    contentFr = "";
  } else if (arc.content.length <= CHUNK_SIZE) {
    const result = await translateChunk(arc.content, true, arc.title, 1, 1);
    contentFr = result.text;
    totalInputTokens += result.inputTokens;
    totalOutputTokens += result.outputTokens;
  } else {
    const chunks: string[] = [];
    let offset = 0;

    while (offset < arc.content.length) {
      let end = Math.min(offset + CHUNK_SIZE, arc.content.length);
      if (end < arc.content.length) {
        const lastNewline = arc.content.lastIndexOf("\n\n", end);
        if (lastNewline > offset + CHUNK_SIZE / 2) end = lastNewline;
      }
      chunks.push(arc.content.slice(offset, end));
      offset = end;
    }

    log(
      `  Chunking — ${chunks.length} chunks pour ${arc.content.length} chars`,
      "WARN",
    );

    for (let i = 0; i < chunks.length; i++) {
      const result = await translateChunk(
        chunks[i],
        i === 0,
        arc.title,
        i + 1,
        chunks.length,
      );
      contentFr += (i > 0 ? "\n\n" : "") + result.text;
      totalInputTokens += result.inputTokens;
      totalOutputTokens += result.outputTokens;
      if (i < chunks.length - 1) await sleep(1000);
    }
  }

  const totalCost = calcCost(totalInputTokens, totalOutputTokens);

  log(
    `  Total arc — "${arc.title}" | ${totalInputTokens} in / ${totalOutputTokens} out tokens | ${formatCost(totalCost)}`,
    "COST",
  );

  return {
    titleFr: meta.titleFr,
    summaryFr: meta.summaryFr,
    contentFr,
    totalInputTokens,
    totalOutputTokens,
    totalCost,
  };
}

// ─── Point d'entrée ───────────────────────────────────────────────────────────

async function main() {
  ensureLogDir();

  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const forceRetranslate = args.includes("--force");
  const limitArg = args.find((a) => a.startsWith("--limit="));
  const limit = limitArg ? parseInt(limitArg.split("=")[1]) : undefined;
  const fromArg = args.find((a) => a.startsWith("--from="));
  const fromOrder = fromArg ? parseInt(fromArg.split("=")[1]) : 0;

  log("═".repeat(80));
  log(`Script de traduction des arcs Story — démarrage`);
  log(`Fichier log : ${LOG_FILE}`);
  log(`Arguments : ${args.join(" ") || "aucun"}`);
  log(`Modèle : ${GPT_MODEL}`);
  log(`Chunk size : ${CHUNK_SIZE} chars`);
  log("═".repeat(80));

  const allArcs = await prisma.storyArc.findMany({
    orderBy: { order: "asc" },
    where: fromOrder > 0 ? { order: { gte: fromOrder } } : undefined,
    take: limit,
  });

  const toTranslate = forceRetranslate
    ? allArcs
    : allArcs.filter((arc) => !isAlreadyTranslated(arc));

  const alreadyDone = allArcs.length - toTranslate.length;

  const estimatedChars = toTranslate.reduce(
    (acc, arc) =>
      acc + arc.title.length + arc.summary.length + arc.content.length,
    0,
  );
  const estimatedCost = estimateCostFromChars(estimatedChars);

  log(`Arcs total     : ${allArcs.length}`);
  log(`Déjà traduits  : ${alreadyDone}`);
  log(`À traduire     : ${toTranslate.length}`);
  log(`Chars estimés  : ${estimatedChars.toLocaleString()}`);
  log(`Coût estimé    : ${formatCost(estimatedCost)}`);
  logSeparator();

  if (dryRun) {
    log("Mode dry-run — aucune modification en base");
    toTranslate.forEach((a) =>
      log(
        `  [order:${a.order}] "${a.title}" (${a.sagaKey}) — ${a.content.length} chars`,
      ),
    );
    await prisma.$disconnect();
    return;
  }

  if (toTranslate.length === 0) {
    log("Tout est déjà traduit — rien à faire");
    await prisma.$disconnect();
    return;
  }

  let sessionInputTokens = 0;
  let sessionOutputTokens = 0;
  let sessionCost = 0;
  let successCount = 0;
  let errorCount = 0;
  const sessionStart = Date.now();

  for (let i = 0; i < toTranslate.length; i++) {
    const arc = toTranslate[i];
    const progress = `[${i + 1}/${toTranslate.length}]`;

    logSeparator();
    log(
      `${progress} Arc : "${arc.title}" | order: ${arc.order} | saga: ${arc.sagaKey}`,
    );

    try {
      const result = await translateArc(arc);

      await prisma.storyArc.update({
        where: { id: arc.id },
        data: {
          titleFr: result.titleFr,
          summaryFr: result.summaryFr,
          contentFr: result.contentFr,
          lastUpdated: new Date(),
        },
      });

      sessionInputTokens += result.totalInputTokens;
      sessionOutputTokens += result.totalOutputTokens;
      sessionCost += result.totalCost;
      successCount++;

      log(
        `${progress} ✅ Succès — "${arc.title}" | ${formatCost(result.totalCost)}`,
      );
      log(
        `  Session running total : ${sessionInputTokens} in / ${sessionOutputTokens} out tokens | ${formatCost(sessionCost)}`,
        "COST",
      );
    } catch (err) {
      errorCount++;
      log(`${progress} ❌ ERREUR — "${arc.title}" : ${err}`, "ERROR");
      log(`  Arc ignoré, passage au suivant`, "ERROR");
    }

    if (i < toTranslate.length - 1) {
      await sleep(DELAY_BETWEEN_ARCS_MS);
    }
  }

  const durationSeconds = Math.round((Date.now() - sessionStart) / 1000);

  logSeparator();
  log("═".repeat(80));
  log(`RÉSUMÉ FINAL`);
  log(`Durée totale   : ${durationSeconds}s`);
  log(`Succès         : ${successCount}`);
  log(`Erreurs        : ${errorCount}`);
  log(`Tokens input   : ${sessionInputTokens.toLocaleString()}`);
  log(`Tokens output  : ${sessionOutputTokens.toLocaleString()}`);
  log(`Coût estimé    : ${formatCost(estimatedCost)}`);
  log(`Coût réel      : ${formatCost(sessionCost)}`);
  log(`Fichier log    : ${LOG_FILE}`);
  log("═".repeat(80));

  await prisma.$disconnect();
}

main().catch(async (err) => {
  log(`Erreur fatale : ${err}`, "ERROR");
  await prisma.$disconnect();
  process.exit(1);
});
