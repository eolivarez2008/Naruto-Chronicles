import { PrismaClient } from "@prisma/client";
import axios from "axios";
import * as cheerio from "cheerio";
import {
  sleep,
  fetchWithRetry,
  fetchJson,
  fetchJsonSafe,
  normalizeString,
  JIKAN_DELAY_MS,
} from "@/lib/network";
import {
  searchVideosWithStats,
  hasApiKey,
  VIDEO_CATEGORIES,
} from "@/lib/youtube";

const prisma = new PrismaClient();

const JIKAN_BASE = "https://api.jikan.moe/v4";
const DB_BATCH_SIZE = 50;

const SOURCE_SRINIOUSLY =
  "https://raw.githubusercontent.com/sriniously/narutodb-website/master/src/pages/api/data/characters.json";
const SOURCE_GUSTAVO =
  "https://raw.githubusercontent.com/gustavonobreza/naruto-api/main/src/shared/data/en/prod-V3.json";
const DATTEBAYO_BASE = "https://dattebayo-api.onrender.com";

const SEED_MAX_RESULTS = 10;

const SAGA_CONFIG = [
  { key: "naruto", id: 20, type: "anime", label: "Naruto" },
  { key: "shippuden", id: 1735, type: "anime", label: "Naruto Shippuden" },
  { key: "boruto", id: 34566, type: "anime", label: "Boruto" },
  { key: "tbv", id: 160786, type: "manga", label: "Two Blue Vortex" },
];

const STORIES_FR: Record<string, string> = {
  naruto:
    "Douze ans après l'attaque du Démon Renard à Neuf Queues sur Konoha, le jeune orphelin Naruto Uzumaki grandit dans la solitude, ignorant qu'il porte en lui le monstre qui a ravagé son village. Rejeté par tous, il multiplie les bêtises pour attirer l'attention. Son rêve est immense : devenir Hokage pour obtenir enfin le respect de ses pairs.",
  shippuden:
    "Après deux ans d'entraînement intensif avec Jiraya, Naruto revient à un Konoha plus mature mais menacé. L'organisation criminelle Akatsuki passe à l'offensive pour capturer les démons à queues. Naruto doit faire face à des pertes tragiques, menant à une confrontation inévitable lors de la Grande Guerre Ninja.",
  boruto:
    "Plus de quinze ans après la Grande Guerre, le monde ninja est entré dans une ère de paix technologique. Mais cette tranquillité pèse sur Boruto, fils de Naruto. Une menace mystérieuse nommée Kara émerge pour briser cet équilibre fragile.",
  tbv: "Trois ans après le cataclysme de l'Omnipotence, Boruto est devenu un fugitif traqué par le monde entier. Devenu plus puissant après son exil avec Sasuke, il revient pour protéger le village de nouvelles menaces divines et restaurer la vérité.",
};

const WIKI_API_URL = "https://naruto.fandom.com/api.php";
const WIKI_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
};

// ─── CLI flags ────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const SKIP = {
  characters: args.includes("--skip-characters"),
  sagas: args.includes("--skip-sagas"),
  videos: args.includes("--skip-videos"),
  story: args.includes("--skip-story"),
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface SriniouslyChar {
  id: number;
  name: string;
  images?: { jpg?: { image_url?: string } };
  personal?: {
    sex?: string;
    birthdate?: string;
    age?: string | Record<string, string>;
    height?: string | Record<string, string>;
  };
  rank?: { ninjaRank?: Record<string, string> };
  natureType?: string[];
  jutsu?: string[];
  family?: Record<string, string>;
  debut?: {
    manga?: string;
    anime?: string;
    novel?: string;
    movie?: string;
    game?: string;
  };
}

interface GustavoChar {
  id: number;
  name: string;
  imageURL?: string;
  personal?: {
    sex?: string;
    birthdate?: string;
    age?: string | Record<string, string>;
    height?: string | Record<string, string>;
  };
  jutsu?: string[];
  natureType?: string[];
  rank?: { ninjaRank?: Record<string, string> };
  debut?: { manga?: string; anime?: string; movie?: string; game?: string };
  family?: Record<string, string>;
}

interface DattebayoChar {
  id: number;
  name: string;
  images?: string[];
  personal?: {
    sex?: string;
    birthdate?: string;
    age?: string | Record<string, string>;
    height?: string | Record<string, string>;
  };
  rank?: { ninjaRank?: Record<string, string> };
  natureType?: string[];
  jutsu?: string[];
  family?: Record<string, string>;
  debut?: {
    manga?: string;
    anime?: string;
    novel?: string;
    movie?: string;
    game?: string;
  };
}

interface MergedCharacter {
  id: number;
  name: string;
  normalizedName: string;
  image: string | null;
  sex: string;
  birthdate: string;
  age: string;
  height: string;
  rank: string;
  natureType: string;
  jutsu: string;
  family: string;
  debut: string;
  popularity: number;
  lastUpdated: Date;
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1 — PERSONNAGES
// ─────────────────────────────────────────────────────────────────────────────

function mergeArraysUniq<T>(...arrays: (T[] | undefined | null)[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const arr of arrays) {
    for (const item of arr ?? []) {
      const k = String(item);
      if (!seen.has(k)) {
        seen.add(k);
        out.push(item);
      }
    }
  }
  return out;
}

function normalizeRecord(
  val: string | Record<string, string> | undefined | null,
): Record<string, string> {
  if (!val) return {};
  if (typeof val === "string") return { default: val };
  return val;
}

function pickImage(
  ...candidates: (string | null | undefined)[]
): string | null {
  for (const url of candidates) {
    if (url?.trim()) return url.trim();
  }
  return null;
}

function cleanNature(raw: string): string {
  return raw
    .replace(/\s*Release\s*/gi, "")
    .replace(/\s*\(.*?\)\s*/g, "")
    .trim();
}

function cleanNatureArray(arr: string[] | undefined | null): string[] {
  if (!arr?.length) return [];
  return [...new Set(arr.map(cleanNature).filter(Boolean))];
}

const ARC_KEY_MAP: Record<string, string> = {
  "Prologue — Land of Waves": "Prologue",
  "Part I": "Partie 1",
  "Part II": "Partie 2",
  "Blank Period": "Blank Period",
  "The Last": "The Last",
};

function normalizeRankRecord(
  raw: { ninjaRank?: Record<string, string> } | undefined | null,
): Record<string, string> {
  if (!raw?.ninjaRank) return {};
  const result: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw.ninjaRank)) {
    if (!v) continue;
    result[ARC_KEY_MAP[k] ?? k] = v.trim();
  }
  return result;
}

async function fetchSriniously(): Promise<Map<number, SriniouslyChar>> {
  process.stdout.write("  📥 [1/3] sriniously... ");
  const raw = await fetchJsonSafe<Record<string, SriniouslyChar>>(
    SOURCE_SRINIOUSLY,
    20_000,
  );
  if (!raw) {
    console.log("⚠ skipped");
    return new Map();
  }
  const map = new Map<number, SriniouslyChar>();
  for (const char of Object.values(raw)) {
    if (char.id) map.set(char.id, char);
  }
  console.log(`✓ ${map.size} personnages`);
  return map;
}

async function fetchGustavo(): Promise<Map<number, GustavoChar>> {
  process.stdout.write("  📥 [2/3] gustavonobreza... ");
  const raw = await fetchJsonSafe<
    GustavoChar[] | { characters: GustavoChar[] }
  >(SOURCE_GUSTAVO, 20_000);
  if (!raw) {
    console.log("⚠ skipped");
    return new Map();
  }
  const list = Array.isArray(raw)
    ? raw
    : ((raw as { characters: GustavoChar[] }).characters ?? []);
  const map = new Map<number, GustavoChar>();
  for (const char of list) {
    if (char.id) map.set(char.id, char);
  }
  console.log(`✓ ${map.size} personnages`);
  return map;
}

async function fetchDattebayo(): Promise<Map<number, DattebayoChar>> {
  process.stdout.write("  📥 [3/3] dattebayo... ");
  const map = new Map<number, DattebayoChar>();
  let page = 1;
  let total = Infinity;
  while ((page - 1) * 20 < total) {
    const data = await fetchJsonSafe<{
      characters: DattebayoChar[];
      total: number;
    }>(`${DATTEBAYO_BASE}/characters?page=${page}&limit=20`, 10_000);
    if (!data) {
      console.log(`\n  ⚠ Arrêt page ${page}`);
      break;
    }
    total = data.total;
    for (const char of data.characters) {
      if (char.id) map.set(char.id, char);
    }
    process.stdout.write(`\r  📥 [3/3] dattebayo... ${map.size}/${total}  `);
    page++;
    await sleep(100);
  }
  console.log(
    `\r  📥 [3/3] dattebayo... ✓ ${map.size} personnages            `,
  );
  return map;
}

async function fetchJikanPopularity(): Promise<Map<string, number>> {
  console.log("\n  ⭐ Popularité Jikan...");
  const scores = new Map<string, number>();

  const addScore = (name: string, favorites: number | undefined) => {
    const safe = favorites ?? 1;
    const key = normalizeString(name);
    scores.set(key, (scores.get(key) ?? 0) + safe);
    const reversed = normalizeString(name.split(", ").reverse().join(" "));
    if (reversed !== key)
      scores.set(reversed, (scores.get(reversed) ?? 0) + safe);
  };

  for (const anime of [
    { id: 20, label: "Naruto" },
    { id: 1735, label: "Shippuden" },
    { id: 34566, label: "Boruto" },
  ]) {
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
    } catch (err) {
      console.log(`⚠ skipped (${err})`);
    }
  }
  return scores;
}

function buildCharacters(
  s1: Map<number, SriniouslyChar>,
  s2: Map<number, GustavoChar>,
  s3: Map<number, DattebayoChar>,
  popularityScores: Map<string, number>,
): MergedCharacter[] {
  const allIds = new Set([...s1.keys(), ...s2.keys(), ...s3.keys()]);
  process.stdout.write(`\n  🔀 Merge — ${allIds.size} personnages... `);
  const result: MergedCharacter[] = [];

  for (const id of allIds) {
    const c1 = s1.get(id);
    const c2 = s2.get(id);
    const c3 = s3.get(id);
    const name = c1?.name ?? c2?.name ?? c3?.name ?? `Character #${id}`;
    const normName = normalizeString(name);
    const personal = { ...c3?.personal, ...c2?.personal, ...c1?.personal };
    const rankRecord = {
      ...normalizeRankRecord(c3?.rank),
      ...normalizeRankRecord(c2?.rank),
      ...normalizeRankRecord(c1?.rank),
    };
    const natureType = cleanNatureArray(
      mergeArraysUniq(c1?.natureType, c2?.natureType, c3?.natureType),
    );
    const jutsu = mergeArraysUniq(c1?.jutsu, c2?.jutsu, c3?.jutsu);
    const family = { ...c3?.family, ...c2?.family, ...c1?.family };
    const debut = { ...c3?.debut, ...c2?.debut, ...c1?.debut };
    const image = pickImage(
      c1?.images?.jpg?.image_url,
      c2?.imageURL,
      c3?.images?.[0],
    );
    const popularity =
      popularityScores.get(normName) ??
      popularityScores.get(
        normalizeString(name.split(", ").reverse().join(" ")),
      ) ??
      0;

    result.push({
      id,
      name,
      normalizedName: normName,
      image,
      sex: personal.sex ?? "",
      birthdate: personal.birthdate ?? "",
      age: JSON.stringify(normalizeRecord(personal.age)),
      height: JSON.stringify(normalizeRecord(personal.height)),
      rank: JSON.stringify(rankRecord),
      natureType: JSON.stringify(natureType),
      jutsu: JSON.stringify(jutsu),
      family: JSON.stringify(family),
      debut: JSON.stringify(debut),
      popularity,
      lastUpdated: new Date(),
    });
  }

  const withImage = result.filter((c) => c.image !== null).length;
  const withPop = result.filter((c) => c.popularity > 0).length;
  console.log(`✓ (${withImage} images · ${withPop} scores)`);
  return result;
}

async function upsertCharacters(characters: MergedCharacter[]): Promise<void> {
  process.stdout.write(`  💾 Push DB — ${characters.length} personnages... `);
  for (let i = 0; i < characters.length; i += DB_BATCH_SIZE) {
    const batch = characters.slice(i, i + DB_BATCH_SIZE);
    await prisma.$transaction(
      batch.map((char) =>
        prisma.character.upsert({
          where: { id: char.id },
          update: char,
          create: char,
        }),
      ),
    );
    const pct = Math.round(
      (Math.min(i + DB_BATCH_SIZE, characters.length) / characters.length) *
        100,
    );
    process.stdout.write(
      `\r  💾 Push DB — ${characters.length} personnages... ${pct}%`,
    );
  }
  console.log(
    "\r  💾 Push DB — ✓ terminé                                      ",
  );
}

async function seedCharacters(): Promise<void> {
  const [s1, s2, s3] = await Promise.all([
    fetchSriniously(),
    fetchGustavo(),
    fetchDattebayo(),
  ]);
  const popularityScores = await fetchJikanPopularity();
  const characters = buildCharacters(s1, s2, s3, popularityScores);
  await upsertCharacters(characters);
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2 — SAGAS
// ─────────────────────────────────────────────────────────────────────────────

async function seedSagas(): Promise<void> {
  for (const saga of SAGA_CONFIG) {
    await sleep(JIKAN_DELAY_MS * 4);
    process.stdout.write(`  ${saga.label}... `);
    try {
      const res = await fetchWithRetry(
        `${JIKAN_BASE}/${saga.type}/${saga.id}/full`,
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const { data } = (await res.json()) as { data: Record<string, unknown> };

      let creator = "Masashi Kishimoto";
      const authors = data.authors as Array<{ name: string }> | undefined;
      const studios = data.studios as Array<{ name: string }> | undefined;
      if (authors?.length)
        creator = authors[0].name.split(", ").reverse().join(" ");
      else if (studios?.length) creator = studios[0].name;

      const status =
        data.status === "Finished" || data.status === "Finished Airing"
          ? "Terminé"
          : "En cours";
      const images = data.images as
        | Record<string, Record<string, string>>
        | undefined;
      const aired = data.aired as
        | Record<string, Record<string, Record<string, number>>>
        | undefined;
      const published = data.published as
        | Record<string, Record<string, Record<string, number>>>
        | undefined;

      await prisma.saga.upsert({
        where: { key: saga.key },
        update: {
          score: data.score as number | null,
          status,
          total:
            (data.episodes as number | null) ??
            (data.chapters as number | null),
          lastUpdated: new Date(),
        },
        create: {
          key: saga.key,
          jikanId: saga.id,
          type: saga.type,
          label: saga.label,
          synopsisFr: STORIES_FR[saga.key] ?? "À venir",
          image: images?.jpg?.large_image_url ?? "",
          status,
          score: data.score as number | null,
          creator,
          total:
            (data.episodes as number | null) ??
            (data.chapters as number | null),
          year: aired?.prop?.from?.year ?? published?.prop?.from?.year,
        },
      });
      console.log("✓");
    } catch (err) {
      console.log(`⚠ skipped (${err})`);
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 3 — VIDÉOS
// ─────────────────────────────────────────────────────────────────────────────

async function seedVideos(): Promise<void> {
  if (!hasApiKey()) {
    console.log("  ⚠ YOUTUBE_API_KEY manquante — vidéos ignorées");
    return;
  }

  let quotaHit = false;
  let totalInserted = 0;

  for (const { category, query } of VIDEO_CATEGORIES) {
    if (quotaHit) {
      console.log(`  [${category}] ⏭ skipped (quota atteint)`);
      continue;
    }

    process.stdout.write(`  [${category}] fetch + stats... `);

    const result = await searchVideosWithStats(query, SEED_MAX_RESULTS);

    if (!result.ok) {
      if (result.quotaExceeded) {
        quotaHit = true;
        console.log("⚠ quota YouTube atteint — catégories restantes ignorées");
        continue;
      }
      console.log(`⚠ skipped (${result.error})`);
      continue;
    }

    let inserted = 0;
    for (const video of result.data) {
      if (!video.id) continue;
      const exists = await prisma.video.findUnique({ where: { id: video.id } });
      if (exists) continue;
      await prisma.video.create({
        data: {
          id: video.id,
          title: video.title,
          thumbnail: video.thumbnail,
          channelTitle: video.channelTitle,
          publishedAt: video.publishedAt,
          category,
          keyword: query,
          viewCount: video.viewCount,
          lastUpdated: new Date(),
        },
      });
      inserted++;
    }

    totalInserted += inserted;
    console.log(`✓ +${inserted} (avec vues)`);
    await sleep(300);
  }

  const total = await prisma.video.count();
  console.log(`\n  ✓ ${totalInserted} insérées · ${total} au total en base`);
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 4 — STORY ARCS
// ─────────────────────────────────────────────────────────────────────────────

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
  const { data } = await axios.get(WIKI_API_URL, {
    params: {
      action: "parse",
      page: "Plot of Naruto",
      prop: "text",
      format: "json",
    },
    headers: WIKI_HEADERS,
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
    const { data } = await axios.get(WIKI_API_URL, {
      params: {
        action: "query",
        titles: pageTitle,
        prop: "revisions",
        rvprop: "content",
        rvslots: "main",
        format: "json",
        redirects: 1,
      },
      headers: WIKI_HEADERS,
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

async function seedStoryArcs(): Promise<void> {
  console.log("  🧹 Reset de la table StoryArc...");
  await prisma.storyArc.deleteMany({});

  console.log("  📋 Récupération de l'index des arcs...");
  const arcs = await getArcIndex();
  console.log(`  ✓ ${arcs.length} arcs trouvés\n`);

  let globalOrder = 1;
  let created = 0;

  for (const { arcName, pageTitle, summary, sagaKey } of arcs) {
    process.stdout.write(`  [${globalOrder}] "${arcName}"... `);

    const content = await getArcDetail(pageTitle);

    if (!content && !summary) {
      console.log("⏭ aucun contenu");
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
    console.log("✓");
    await sleep(400);
  }

  console.log(`\n  ✓ ${created} arcs créés`);
}

// ─────────────────────────────────────────────────────────────────────────────
// POINT D'ENTRÉE
// ─────────────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const startedAt = Date.now();

  const skippedLabels = Object.entries(SKIP)
    .filter(([, v]) => v)
    .map(([k]) => `--skip-${k}`)
    .join(" ");

  console.log(`\n🌀 Seed naruto-chronicles — ${new Date().toISOString()}`);
  if (skippedLabels) console.log(`⏭  Skips actifs : ${skippedLabels}\n`);

  if (!SKIP.characters) {
    console.log("━━━ 1/4  PERSONNAGES ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    await seedCharacters();
  } else {
    console.log("━━━ 1/4  PERSONNAGES ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("  ⏭ skipped");
  }

  if (!SKIP.sagas) {
    console.log(
      "\n━━━ 2/4  SAGAS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
    );
    await seedSagas();
  } else {
    console.log(
      "\n━━━ 2/4  SAGAS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
    );
    console.log("  ⏭ skipped");
  }

  if (!SKIP.videos) {
    console.log(
      "\n━━━ 3/4  VIDÉOS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
    );
    await seedVideos();
  } else {
    console.log(
      "\n━━━ 3/4  VIDÉOS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
    );
    console.log("  ⏭ skipped");
  }

  if (!SKIP.story) {
    console.log(
      "\n━━━ 4/4  STORY ARCS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
    );
    await seedStoryArcs();
  } else {
    console.log(
      "\n━━━ 4/4  STORY ARCS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
    );
    console.log("  ⏭ skipped");
  }

  const duration = Math.round((Date.now() - startedAt) / 1000);
  console.log(`\n✅ Seed terminé en ${duration}s`);
}

main()
  .catch((err) => {
    console.error("❌ Erreur fatale :", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
