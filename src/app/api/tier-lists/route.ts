import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import type {
  TierListCard,
  TierListsApiResponse,
  SaveTierListPayload,
  TierRank,
} from "@/types/tierlist";
import { Prisma } from "@prisma/client";

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
      tiers.flatMap((t) =>
        (Array.isArray(t.characterIds) ? t.characterIds : [])
          .map(Number)
          .filter((id) => id > 0),
      ),
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
      characterImages: (Array.isArray(tier.characterIds)
        ? tier.characterIds
        : []
      )
        .slice(0, 7)
        .map((rawId) => {
          const id = Number(rawId);
          const c = charMap.get(id);
          return { id, image: c?.image ?? null, name: c?.name ?? "?" };
        }),
    }));
    return JSON.stringify(enriched);
  } catch (err) {
    console.error("[enrichTiersData] error:", err);
    return JSON.stringify(tiers);
  }
}

function isValidTier(t: unknown): t is TierRank {
  if (!t || typeof t !== "object") return false;
  const o = t as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.label === "string" &&
    typeof o.color === "string" &&
    Array.isArray(o.characterIds) &&
    (o.characterIds as unknown[]).every(
      (id) => typeof id === "number" && !isNaN(id),
    )
  );
}

function normalizeTier(t: TierRank): TierRank {
  return {
    ...t,
    characterIds: Array.isArray(t.characterIds)
      ? t.characterIds
          .map(Number)
          .filter((id) => Number.isInteger(id) && id > 0)
      : [],
  };
}

// ─── GET ──────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(24, parseInt(searchParams.get("limit") ?? "12"));
  const sort = searchParams.get("sort") ?? "recent";
  const userId = searchParams.get("userId") ?? "";
  const search = searchParams.get("search") ?? "";
  const skip = (page - 1) * limit;

  const session = await auth();
  const currentUserId = session?.user?.id;

  const where: Prisma.TierListWhereInput = {};
  if (userId) {
    where.userId = userId;
    if (userId !== currentUserId) where.isPublic = true;
  } else {
    where.isPublic = true;
  }

  if (search.trim()) {
    where.title = { contains: search.trim() };
  }

  let orderBy: Prisma.TierListOrderByWithRelationInput;
  switch (sort) {
    case "popular":
      orderBy = { likes: { _count: "desc" } };
      break;
    case "oldest":
      orderBy = { createdAt: "asc" };
      break;
    case "az":
      orderBy = { title: "asc" };
      break;
    case "za":
      orderBy = { title: "desc" };
      break;
    default:
      orderBy = { createdAt: "desc" };
  }

  try {
    const [total, lists] = await Promise.all([
      prisma.tierList.count({ where }),
      prisma.tierList.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          user: {
            select: { id: true, name: true, image: true, avatarSnapshot: true },
          },
          likes: currentUserId
            ? { where: { userId: currentUserId }, select: { id: true } }
            : { take: 0, select: { id: true } },
          _count: { select: { likes: true } },
        },
      }),
    ]);

    const enrichedTiersData = await Promise.all(
      lists.map((l) => enrichTiersData(l.tiersData).catch(() => l.tiersData)),
    );

    const data = lists.map((l, idx) => ({
      id: l.id,
      title: l.title,
      isPublic: l.isPublic,
      packUsed: l.packUsed,
      likesCount: l._count.likes,
      hasLiked: Array.isArray(l.likes) && l.likes.length > 0,
      author: l.user,
      createdAt: l.createdAt.toISOString(),
      updatedAt: l.updatedAt.toISOString(),
      tiersData: enrichedTiersData[idx],
    }));

    const response: TierListsApiResponse = {
      data: data as TierListCard[],
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
    return NextResponse.json(response);
  } catch (err) {
    console.error("GET /api/tier-lists error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

// ─── POST ─────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  let body: SaveTierListPayload;
  try {
    body = (await req.json()) as SaveTierListPayload;
  } catch {
    return NextResponse.json(
      { error: "Corps de requête invalide." },
      { status: 400 },
    );
  }

  const { title, isPublic, packUsed, tiers } = body;

  if (!title?.trim())
    return NextResponse.json(
      { error: "Le titre est requis." },
      { status: 400 },
    );
  if (title.length > 100)
    return NextResponse.json(
      { error: "Titre trop long (max 100)." },
      { status: 400 },
    );
  if (!Array.isArray(tiers))
    return NextResponse.json({ error: "Tiers invalides." }, { status: 400 });

  const invalidTier = tiers.find((t) => !isValidTier(t));
  if (invalidTier) {
    return NextResponse.json(
      { error: "Structure des tiers invalide." },
      { status: 400 },
    );
  }

  try {
    const tierList = await prisma.tierList.create({
      data: {
        title: title.trim(),
        isPublic: isPublic ?? true,
        packUsed: packUsed ?? "random10",
        tiersData: JSON.stringify(tiers.map(normalizeTier)),
        userId: session.user.id,
      },
    });
    return NextResponse.json({ id: tierList.id }, { status: 201 });
  } catch (err) {
    console.error("POST /api/tier-lists error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
