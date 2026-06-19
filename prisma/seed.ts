import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ─── Config ────────────────────────────────────────────────────────────────────

const DATTEBAYO_BASE = "https://dattebayo-api.onrender.com";
const JIKAN_BASE = "https://api.jikan.moe/v4";

const SOURCE_SRINIOUSLY =
  "https://raw.githubusercontent.com/sriniously/narutodb-website/master/src/pages/api/data/characters.json";
const SOURCE_GUSTAVO =
  "https://raw.githubusercontent.com/gustavonobreza/naruto-api/main/src/shared/data/en/prod-V3.json";

const DB_BATCH_SIZE = 50;
const MAX_RETRY = 4;
const MAX_RETRY_WAIT = 30_000;
const JIKAN_DELAY_MS = 500;

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

// ─── Types ─────────────────────────────────────────────────────────────────────

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

// ─── Réseau ────────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/** Fetch avec backoff exponentiel sur 429 */
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

/** Fetch JSON avec timeout strict */
async function fetchJsonSafe<T>(
  url: string,
  timeoutMs = 15_000,
): Promise<T | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) {
      console.warn(`   ⚠ HTTP ${res.status} — ${url}`);
      return null;
    }
    return (await res.json()) as T;
  } catch (e: any) {
    if (e.name === "AbortError")
      console.warn(`   ⏱ Timeout (${timeoutMs / 1000}s) — ${url}`);
    else console.warn(`   ⚠ ${e.message} — ${url}`);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** fetch JSON avec retry 429 — pour les endpoints critiques (Jikan). */
async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetchWithRetry(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} — ${url}`);
  return res.json() as Promise<T>;
}

// ─── Utilitaires ───────────────────────────────────────────────────────────────

function normalizeString(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

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

// ─── Image ─────────────────────────────────────────────────────────────────────

function pickImage(
  ...candidates: (string | null | undefined)[]
): string | null {
  for (const url of candidates) {
    if (url?.trim()) return url.trim();
  }
  return null;
}

// ─── Natures ───────────────────────────────────────────────────────────────────

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

// ─── Rangs ─────────────────────────────────────────────────────────────────────

const ARC_KEY_MAP: Record<string, string> = {
  "Prologue — Land of Waves": "Prologue",
  "Part I": "Partie 1",
  "Part II": "Partie 2",
  "Blank Period": "Blank Period",
  "The Last": "The Last",
};

function normalizeRankRecord(raw: any): Record<string, string> {
  if (!raw) return {};
  const source: Record<string, string> =
    raw.ninjaRank && typeof raw.ninjaRank === "object"
      ? raw.ninjaRank
      : (({ ninjaRank: _a, ninjaRegistration: _b, _main: _c, ...rest }) =>
          rest)(raw);
  const result: Record<string, string> = {};
  for (const [k, v] of Object.entries(source)) {
    if (!v || typeof v !== "string") continue;
    const key = ARC_KEY_MAP[k] ?? k;
    if (!result[key] || key === "Partie 2") result[key] = v.trim();
  }
  return result;
}

// ─── Sources ───────────────────────────────────────────────────────────────────

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
  rank?: { ninjaRank?: Record<string, string>; ninjaRegistration?: string };
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

async function fetchSriniously(): Promise<Map<number, SriniouslyChar>> {
  process.stdout.write("📥 [1/3] sriniously... ");
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
  process.stdout.write("📥 [2/3] gustavonobreza... ");
  const raw = await fetchJsonSafe<
    GustavoChar[] | { characters: GustavoChar[] }
  >(SOURCE_GUSTAVO, 20_000);
  if (!raw) {
    console.log("⚠ skipped");
    return new Map();
  }
  const list = Array.isArray(raw) ? raw : ((raw as any).characters ?? []);
  const map = new Map<number, GustavoChar>();
  for (const char of list) {
    if (char.id) map.set(char.id, char);
  }
  console.log(`✓ ${map.size} personnages`);
  return map;
}

async function fetchDattebayo(): Promise<Map<number, DattebayoChar>> {
  process.stdout.write("📥 [3/3] dattebayo... ");
  const map = new Map<number, DattebayoChar>();
  let page = 1,
    total = Infinity;
  while ((page - 1) * 20 < total) {
    const data = await fetchJsonSafe<{
      characters: DattebayoChar[];
      total: number;
    }>(`${DATTEBAYO_BASE}/characters?page=${page}&limit=20`, 10_000);
    if (!data) {
      console.log(`\n   ⚠ Arrêt à la page ${page} — timeout`);
      break;
    }
    total = data.total;
    for (const char of data.characters) {
      if (char.id) map.set(char.id, char);
    }
    process.stdout.write(`\r📥 [3/3] dattebayo... ${map.size}/${total}  `);
    page++;
    await sleep(100);
  }
  console.log(`\r📥 [3/3] dattebayo... ✓ ${map.size} personnages            `);
  return map;
}

// ─── Popularité Jikan — 3 endpoints fixes ──────────────────────────────────────

async function fetchJikanPopularity(): Promise<Map<string, number>> {
  console.log("\n⭐ Popularité Jikan (fix propre)...");

  const scores = new Map<string, number>();

  const addScore = (name: string, favorites: number | null | undefined) => {
    const safe = favorites ?? 1;

    const k = normalizeString(name);
    scores.set(k, (scores.get(k) ?? 0) + safe);

    const reversed = normalizeString(name.split(", ").reverse().join(" "));

    if (reversed !== k) {
      scores.set(reversed, (scores.get(reversed) ?? 0) + safe);
    }
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
        data: Array<{
          character: { name: string };
          favorites?: number;
        }>;
      }>(`${JIKAN_BASE}/anime/${anime.id}/characters`);

      let count = 0;

      for (const entry of data.data ?? []) {
        if (entry.character?.name) {
          addScore(entry.character.name, entry.favorites);
          count++;
        }
      }

      console.log(`✓ ${count} personnages`);
    } catch (e: any) {
      console.log(`⚠ skipped (${e.message})`);
    }
  }

  console.log(`   Total : ${scores.size} entrées`);
  return scores;
}
// ─── Merge ─────────────────────────────────────────────────────────────────────

function buildCharacters(
  s1: Map<number, SriniouslyChar>,
  s2: Map<number, GustavoChar>,
  s3: Map<number, DattebayoChar>,
  popularityScores: Map<string, number>,
): MergedCharacter[] {
  const allIds = new Set([...s1.keys(), ...s2.keys(), ...s3.keys()]);
  console.log(`\n🔀 Merge — ${allIds.size} personnages...`);

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
  const noImage = result.length - withImage;

  console.log(`   ✓ ${result.length} personnages`);
  console.log(
    `   🖼  Avec image    : ${withImage} (${noImage} sans image → favicon fallback)`,
  );
  console.log(`   ⭐ Avec score     : ${withPop}`);

  return result;
}

// ─── Push DB ───────────────────────────────────────────────────────────────────

async function upsertCharacters(characters: MergedCharacter[]): Promise<void> {
  console.log(
    `\n💾 Push DB — ${characters.length} personnages par batch de ${DB_BATCH_SIZE}...`,
  );
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
    const done = Math.min(i + DB_BATCH_SIZE, characters.length);
    process.stdout.write(
      `\r   ${done}/${characters.length} (${Math.round((done / characters.length) * 100)}%)`,
    );
  }
  console.log("\n   ✓ Insertion terminée");
}

// ─── Sagas ─────────────────────────────────────────────────────────────────────

async function syncSagas(): Promise<void> {
  console.log("\n📺 Sync sagas...");
  for (const saga of SAGA_CONFIG) {
    await sleep(JIKAN_DELAY_MS * 4);
    process.stdout.write(`   ${saga.label}... `);
    try {
      const res = await fetchWithRetry(
        `${JIKAN_BASE}/${saga.type}/${saga.id}/full`,
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const { data } = await res.json();

      let creator = "Masashi Kishimoto";
      if (data.authors?.length)
        creator = data.authors[0].name.split(", ").reverse().join(" ");
      else if (data.studios?.length) creator = data.studios[0].name;

      const status =
        data.status === "Finished" || data.status === "Finished Airing"
          ? "Terminé"
          : "En cours";

      await prisma.saga.upsert({
        where: { key: saga.key },
        update: {
          score: data.score,
          status,
          total: data.episodes ?? data.chapters,
          lastUpdated: new Date(),
        },
        create: {
          key: saga.key,
          jikanId: saga.id,
          type: saga.type,
          label: saga.label,
          synopsisFr: STORIES_FR[saga.key] ?? "À venir",
          image: data.images?.jpg?.large_image_url ?? "",
          status,
          score: data.score,
          creator,
          total: data.episodes ?? data.chapters,
          year:
            data.aired?.prop?.from?.year ?? data.published?.prop?.from?.year,
        },
      });
      console.log(
        `✓ (score: ${data.score ?? "—"}, ${data.episodes ?? data.chapters ?? "?"} ép.)`,
      );
    } catch (e: any) {
      console.log(`⚠ skipped (${e.message})`);
    }
  }
}

// ─── Main ──────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const startedAt = Date.now();
  console.log("🌀 Seed naruto-chronicles\n");

  // 1. Fetch sources
  console.log("─── Sources ───────────────────────────────────");
  const [s1, s2, s3] = await Promise.all([
    fetchSriniously(),
    fetchGustavo(),
    fetchDattebayo(),
  ]);

  // 2. Fetch scores Jikan
  console.log("\n─── Popularité ────────────────────────────────");
  const popularityScores = await fetchJikanPopularity();

  // 3. Merge
  console.log("\n─── Merge ─────────────────────────────────────");
  const characters = buildCharacters(s1, s2, s3, popularityScores);

  // 4. Push DB
  console.log("\n─── Base de données ───────────────────────────");
  await upsertCharacters(characters);

  // 5. Sagas
  console.log("\n─── Sagas ─────────────────────────────────────");
  await syncSagas();

  // 6. Stats finales
  const [total, withImage, withPop] = await Promise.all([
    prisma.character.count(),
    prisma.character.count({ where: { NOT: { image: null } } }),
    prisma.character.count({ where: { popularity: { gt: 0 } } }),
  ]);

  const top5 = await prisma.character.findMany({
    orderBy: { popularity: "desc" },
    take: 5,
    select: { name: true, popularity: true },
  });

  const duration = Math.round((Date.now() - startedAt) / 1000);

  console.log(`
╔══════════════════════════════════════════╗
║         Seed terminé avec succès         ║
╠══════════════════════════════════════════╣
║  Durée              : ${`${duration}s`.padEnd(18)}║
║  Personnages        : ${String(total).padEnd(18)}║
║  Avec image         : ${String(withImage).padEnd(18)}║
║  Avec score Jikan   : ${String(withPop).padEnd(18)}║
╠══════════════════════════════════════════╣
║  Top 5 popularité                        ║
${top5.map((c, i) => `║  ${i + 1}. ${c.name.slice(0, 22).padEnd(22)} ${String(c.popularity).padStart(4)} ║`).join("\n")}
╚══════════════════════════════════════════╝
`);
}

main()
  .catch((e) => {
    console.error("❌ Erreur fatale :", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
