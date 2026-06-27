import { PrismaClient } from "@prisma/client";
import axios from "axios";
import * as cheerio from "cheerio";

const prisma = new PrismaClient();
const API_URL = "https://naruto.fandom.com/api.php";

const headers = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
};

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function detectSaga(
  sectionTitle: string,
): "naruto" | "shippuden" | "boruto" | "tbv" {
  const t = sectionTitle.toLowerCase();
  if (t.includes("two blue vortex")) return "tbv";
  if (t.includes("boruto") || t.includes("new era")) return "boruto";
  if (t.includes("part ii") || t.includes("shippuden")) return "shippuden";
  return "naruto";
}

function buildSlug(sagaKey: string, arcName: string): string {
  return `${sagaKey}_${arcName
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "")}`;
}

async function getArcIndex(): Promise<
  Array<{
    arcName: string;
    pageTitle: string;
    summary: string;
    sagaKey: string;
  }>
> {
  const { data } = await axios.get(API_URL, {
    params: {
      action: "parse",
      page: "Plot of Naruto",
      prop: "text",
      format: "json",
    },
    headers,
  });

  const $ = cheerio.load(data.parse.text["*"]);
  const entries: Array<{
    arcName: string;
    pageTitle: string;
    summary: string;
    sagaKey: string;
  }> = [];

  for (const section of $("h2").toArray()) {
    const sectionTitle = $(section).find(".mw-headline").text().trim();
    if (!sectionTitle || ["Contents", "See also"].includes(sectionTitle))
      continue;

    const sagaKey = detectSaga(sectionTitle);
    const rows = $(section).nextAll("table").first().find("tr").toArray();

    for (const row of rows) {
      const cells = $(row).find("td");
      if (cells.length < 2) continue;

      const arcLink = $(cells[0]).find("a").first();
      const arcName = arcLink.text().trim();
      const pageTitle = arcLink.attr("title");
      if (!arcName || !pageTitle) continue;

      const summaryCell =
        cells.length >= 4 ? cells[3] : cells[cells.length - 1];
      const summary = $(summaryCell).text().trim();
      if (!summary) continue;

      entries.push({ arcName, pageTitle, summary, sagaKey });
    }
  }

  return entries;
}

const SECTIONS_TO_DROP = [
  "chapters",
  "episodes",
  "references",
  "promotional material",
  "see also",
  "trivia",
  "translation",
  "notes",
];

function parseWikitext(raw: string): string {
  const lines = raw.split("\n");
  let inSummary = false;
  let skipSection = false;
  const output: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    const h2Match = trimmed.match(/^==\s*([^=]+?)\s*==$/);
    if (h2Match) {
      const sectionName = h2Match[1].toLowerCase();
      if (sectionName === "summary") {
        inSummary = true;
        skipSection = false;
        continue;
      }
      if (SECTIONS_TO_DROP.includes(sectionName)) {
        inSummary = false;
        skipSection = true;
        continue;
      }
      if (inSummary) {
        inSummary = false;
        skipSection = true;
      }
      continue;
    }

    if (trimmed.match(/\[\[File:/i)) continue;

    if (skipSection && !inSummary) continue;

    const h3Match = trimmed.match(/^===\s*([^=]+?)\s*===$/);
    if (h3Match) {
      if (inSummary) output.push(`\n## ${h3Match[1]}\n`);
      continue;
    }

    const h4Match = trimmed.match(/^====\s*([^=]+?)\s*====$/);
    if (h4Match) {
      if (inSummary) output.push(`\n### ${h4Match[1]}\n`);
      continue;
    }

    if (!inSummary) continue;

    let cleaned = trimmed;
    cleaned = cleaned.replace(/<ref[^>]*>.*?<\/ref>/gi, "");
    cleaned = cleaned.replace(/<ref[^>]*\/>/gi, "");
    cleaned = cleaned.replace(/\{\{[^{}]*\}\}/g, "");
    cleaned = cleaned.replace(/\{\{[^{}]*\}\}/g, "");
    cleaned = cleaned.replace(/\[\[(?:[^\]|]*\|)?([^\]]+)\]\]/g, "$1");
    cleaned = cleaned.replace(/\[https?:\/\/\S+\s+([^\]]+)\]/g, "$1");
    cleaned = cleaned.replace(/'{2,3}/g, "");
    if (
      cleaned.match(/^<section|^\[\[Category:|^\[\[(?:es|fr|id|pl|de|pt|ja):/)
    )
      continue;

    cleaned = cleaned.trim();
    if (!cleaned) continue;

    output.push(cleaned);
  }

  return output
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function getArcDetail(pageTitle: string): Promise<string> {
  try {
    const { data } = await axios.get(API_URL, {
      params: {
        action: "query",
        titles: pageTitle,
        prop: "revisions",
        rvprop: "content",
        rvslots: "main",
        format: "json",
        redirects: 1,
      },
      headers,
    });
    const pages = data.query?.pages;
    if (!pages) return "";
    const page = Object.values(pages)[0] as any;
    const raw = page?.revisions?.[0]?.slots?.main?.["*"] ?? "";
    return raw ? parseWikitext(raw) : "";
  } catch {
    return "";
  }
}

async function main() {
  try {
    console.log("\n🧹 Reset complet...");
    await prisma.storyArc.deleteMany({});
    console.log("✅ Table vidée.\n");

    console.log("📋 Récupération de l'index des arcs...");
    const arcs = await getArcIndex();
    console.log(`✅ ${arcs.length} arcs trouvés.\n`);

    let globalOrder = 1;
    let created = 0;

    for (const { arcName, pageTitle, summary, sagaKey } of arcs) {
      console.log(`🔄 [${globalOrder}] "${arcName}"`);

      const content = await getArcDetail(pageTitle);

      if (!content && !summary) {
        console.log("  ⏭️  Aucun contenu — ignoré.");
        continue;
      }

      await prisma.storyArc.create({
        data: {
          slug: buildSlug(sagaKey, arcName),
          title: arcName,
          summary,
          content: content || summary,
          order: globalOrder++,
          sagaKey,
        },
      });

      created++;
      console.log(`  ✅ OK`);
      await sleep(400);
    }

    console.log(`\n✨ Terminé ! ${created} arcs créés.`);
  } catch (err: any) {
    console.error("❌ Erreur :", err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
