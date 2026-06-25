import type { Metadata } from "next";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import TierListHomeClient from "@/components/tier-list/TierListHomeClient";
import type { TierListCard, TierRank } from "@/types/tierlist";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Tier Lists",
  description:
    "Crée et partage tes classements de personnages Naruto. Découvre les tier lists de la communauté.",
};

async function enrichTiersData(tiersData: string): Promise<string> {
  let tiers: TierRank[] = [];
  try {
    const raw = JSON.parse(tiersData) as unknown;
    if (!Array.isArray(raw)) return tiersData;
    tiers = (raw as unknown[]).filter(
      (t): t is TierRank =>
        t !== null &&
        typeof t === "object" &&
        Array.isArray((t as TierRank).characterIds),
    );
  } catch {
    return tiersData;
  }

  const allIds = [
    ...new Set(
      tiers.flatMap((t) => t.characterIds.map(Number).filter((id) => id > 0)),
    ),
  ];
  if (allIds.length === 0) return JSON.stringify(tiers);

  try {
    const chars = await prisma.character.findMany({
      where: { id: { in: allIds } },
      select: { id: true, image: true, name: true },
    });
    const charMap = new Map(chars.map((c) => [c.id, c]));
    const enriched = tiers.map((tier) => ({
      ...tier,
      characterImages: tier.characterIds.slice(0, 7).map((rawId) => {
        const id = Number(rawId);
        const c = charMap.get(id);
        return { id, image: c?.image ?? null, name: c?.name ?? "?" };
      }),
    }));
    return JSON.stringify(enriched);
  } catch {
    return JSON.stringify(tiers);
  }
}

async function mapList(l: {
  id: string;
  title: string;
  isPublic: boolean;
  packUsed: string;
  tiersData: string;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    name: string | null;
    image: string | null;
    avatarSnapshot: string | null;
  };
  _count: { likes: number };
  likes: Array<{ id: string }>;
}): Promise<TierListCard & { tiersData: string }> {
  const enrichedTiersData = await enrichTiersData(l.tiersData).catch(
    () => l.tiersData,
  );
  return {
    id: l.id,
    title: l.title,
    isPublic: l.isPublic,
    packUsed: l.packUsed,
    likesCount: l._count.likes,
    hasLiked: Array.isArray(l.likes) && l.likes.length > 0,
    author: l.user,
    createdAt: l.createdAt.toISOString(),
    updatedAt: l.updatedAt.toISOString(),
    tiersData: enrichedTiersData,
  };
}

export default async function TierListPage() {
  const session = await auth();
  const currentUserId = session?.user?.id;
  const isLoggedIn = !!session?.user;

  let createdRaw: Array<{
    id: string;
    title: string;
    isPublic: boolean;
    packUsed: string;
    tiersData: string;
    createdAt: Date;
    updatedAt: Date;
    user: {
      id: string;
      name: string | null;
      image: string | null;
      avatarSnapshot: string | null;
    };
    _count: { likes: number };
    likes: Array<{ id: string }>;
  }> = [];

  let likedRaw: typeof createdRaw = [];

  if (currentUserId) {
    createdRaw = await prisma.tierList.findMany({
      where: { userId: currentUserId },
      orderBy: { updatedAt: "desc" },
      take: 40,
      include: {
        user: {
          select: { id: true, name: true, image: true, avatarSnapshot: true },
        },
        likes: { where: { userId: currentUserId }, select: { id: true } },
        _count: { select: { likes: true } },
      },
    });

    const likedRelations = await prisma.tierListLike.findMany({
      where: { userId: currentUserId },
      orderBy: { createdAt: "desc" },
      take: 40,
      include: {
        tierList: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
                avatarSnapshot: true,
              },
            },
            likes: { where: { userId: currentUserId }, select: { id: true } },
            _count: { select: { likes: true } },
          },
        },
      },
    });

    likedRaw = likedRelations
      .filter((r) => r.tierList.isPublic || r.tierList.userId === currentUserId)
      .map((r) => r.tierList);
  }

  const [myCreatedLists, myLikedLists] = await Promise.all([
    Promise.all(createdRaw.map(mapList)),
    Promise.all(likedRaw.map(mapList)),
  ]);

  return (
    <TierListHomeClient
      myCreatedLists={myCreatedLists}
      myLikedLists={myLikedLists}
      isLoggedIn={isLoggedIn}
    />
  );
}
