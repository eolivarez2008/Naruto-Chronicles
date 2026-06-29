import type { Metadata } from "next";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import TierListHomeClient from "@/components/tier-list/TierListHomeClient";
import type { TierListCard } from "@/types/tierlist";
import { enrichTiersDataBatch } from "@/lib/tierlist";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Tier Lists",
  description:
    "Crée et partage tes classements de personnages Naruto. Découvre les tier lists de la communauté.",
};

// ─── Mapping liste tier ───────────────────────────────────────────────────────

async function mapLists(
  lists: Array<{
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
  }>,
): Promise<Array<TierListCard & { tiersData: string }>> {
  if (lists.length === 0) return [];
  const enrichedBatch = await enrichTiersDataBatch(
    lists.map((l) => l.tiersData),
  );
  return lists.map((l, idx) => ({
    id: l.id,
    title: l.title,
    isPublic: l.isPublic,
    packUsed: l.packUsed,
    likesCount: l._count.likes,
    hasLiked: Array.isArray(l.likes) && l.likes.length > 0,
    author: l.user,
    createdAt: l.createdAt.toISOString(),
    updatedAt: l.updatedAt.toISOString(),
    tiersData: enrichedBatch[idx],
  }));
}

// ─── Page principale ──────────────────────────────────────────────────────────

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
    mapLists(createdRaw),
    mapLists(likedRaw),
  ]);

  return (
    <main className="min-h-screen bg-[#050505] text-white -mt-16 pt-16">
      <TierListHomeClient
        myCreatedLists={myCreatedLists}
        myLikedLists={myLikedLists}
        isLoggedIn={isLoggedIn}
      />
    </main>
  );
}
