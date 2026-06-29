// Utilitaires partagés pour l'enrichissement des tier lists

import prisma from "@/lib/prisma";
import type { TierRank } from "@/types/tierlist";

interface CharacterImage {
  id: number;
  image: string | null;
  name: string;
}

interface EnrichedTier extends TierRank {
  characterImages: CharacterImage[];
}

export async function enrichTiersDataBatch(
  tierListsData: string[],
): Promise<string[]> {
  const parsedTiers: TierRank[][] = tierListsData.map((data) => {
    try {
      const raw = JSON.parse(data) as unknown;
      if (!Array.isArray(raw)) return [];
      return (raw as unknown[]).filter(
        (t): t is TierRank =>
          t !== null &&
          typeof t === "object" &&
          Array.isArray((t as TierRank).characterIds),
      );
    } catch {
      return [];
    }
  });

  const allIds = [
    ...new Set(
      parsedTiers.flatMap((tiers) =>
        tiers.flatMap((t) => t.characterIds.map(Number).filter((id) => id > 0)),
      ),
    ),
  ];

  if (allIds.length === 0) {
    return parsedTiers.map((tiers) => JSON.stringify(tiers));
  }

  try {
    const chars = await prisma.character.findMany({
      where: { id: { in: allIds } },
      select: { id: true, image: true, name: true },
    });
    const charMap = new Map(chars.map((c) => [c.id, c]));

    return parsedTiers.map((tiers) => {
      const enriched: EnrichedTier[] = tiers.map((tier) => ({
        ...tier,
        characterImages: tier.characterIds.slice(0, 7).map((rawId) => {
          const id = Number(rawId);
          const c = charMap.get(id);
          return { id, image: c?.image ?? null, name: c?.name ?? "?" };
        }),
      }));
      return JSON.stringify(enriched);
    });
  } catch (err) {
    console.error("[enrichTiersDataBatch] DB error:", err);
    return parsedTiers.map((tiers) => JSON.stringify(tiers));
  }
}

export async function enrichTiersData(tiersData: string): Promise<string> {
  const results = await enrichTiersDataBatch([tiersData]);
  return results[0];
}
