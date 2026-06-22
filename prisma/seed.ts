import { PrismaClient } from "@prisma/client";
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

const SEED_MAX_RESULTS = 10;

const JIKAN_BASE = "https://api.jikan.moe/v4";
const DB_BATCH_SIZE = 50;

const SOURCE_SRINIOUSLY =
  "https://raw.githubusercontent.com/sriniously/narutodb-website/master/src/pages/api/data/characters.json";
const SOURCE_GUSTAVO =
  "https://raw.githubusercontent.com/gustavonobreza/naruto-api/main/src/shared/data/en/prod-V3.json";
const DATTEBAYO_BASE = "https://dattebayo-api.onrender.com";

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

// ─── Types sources personnages ────────────────────────────────────────────────

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

// ─── Utilitaires personnages ──────────────────────────────────────────────────

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

// ─── Fetch sources personnages ────────────────────────────────────────────────

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

// ─── Sagas ────────────────────────────────────────────────────────────────────

async function syncSagas(): Promise<void> {
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

// ─── Vidéos initiales avec stats ─────────────────────────────────────────────

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

// ─── Point d'entrée ───────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const startedAt = Date.now();
  console.log("🌀 Seed naruto-chronicles\n");

  console.log("━━━ 1/3  PERSONNAGES ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  const [s1, s2, s3] = await Promise.all([
    fetchSriniously(),
    fetchGustavo(),
    fetchDattebayo(),
  ]);
  const popularityScores = await fetchJikanPopularity();
  const characters = buildCharacters(s1, s2, s3, popularityScores);
  await upsertCharacters(characters);

  console.log("\n━━━ 2/3  SAGAS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  await syncSagas();

  console.log("\n━━━ 3/3  VIDÉOS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  await seedVideos();

  const duration = Math.round((Date.now() - startedAt) / 1000);
  console.log(`\n✅ Seed terminé en ${duration}s`);
}

main()
  .catch((err) => {
    console.error("❌ Erreur fatale :", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
