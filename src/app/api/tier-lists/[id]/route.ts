import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import type {
  TierListFull,
  TierRank,
  TierListCharacter,
  SaveTierListPayload,
} from "@/types/tierlist";

function normalizeTier(t: TierRank): TierRank {
  return {
    ...t,
    characterIds: Array.isArray(t.characterIds)
      ? t.characterIds
          .map((id) => Number(id))
          .filter((id) => Number.isInteger(id) && id > 0)
      : [],
  };
}

function safeParseTiers(tiersData: string): TierRank[] {
  try {
    const raw = JSON.parse(tiersData) as unknown;
    if (!Array.isArray(raw)) return [];
    return (raw as unknown[])
      .filter(
        (t): t is TierRank =>
          t !== null &&
          typeof t === "object" &&
          Array.isArray((t as TierRank).characterIds),
      )
      .map(normalizeTier);
  } catch {
    return [];
  }
}

async function enrichCharacters(
  tiers: TierRank[],
): Promise<TierListCharacter[]> {
  const allIds = [
    ...new Set(
      tiers.flatMap((t) =>
        (Array.isArray(t.characterIds) ? t.characterIds : [])
          .map((id) => Number(id))
          .filter((id) => Number.isInteger(id) && id > 0),
      ),
    ),
  ];

  if (allIds.length === 0) return [];

  try {
    const characters = await prisma.character.findMany({
      where: { id: { in: allIds } },
      select: {
        id: true,
        name: true,
        image: true,
        rank: true,
        natureType: true,
        popularity: true,
      },
    });

    return characters.map((c) => {
      let natureType: string[] = [];
      try {
        natureType = JSON.parse(c.natureType ?? "[]") as string[];
      } catch {
        /* noop */
      }
      return { ...c, rank: c.rank ?? null, image: c.image ?? null, natureType };
    });
  } catch (err) {
    console.error("[enrichCharacters] DB error:", err);
    return [];
  }
}

// ─── GET ──────────────────────────────────────────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await auth();
  const currentUserId = session?.user?.id;

  try {
    const list = await prisma.tierList.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, image: true, avatarSnapshot: true },
        },
        likes: currentUserId
          ? { where: { userId: currentUserId }, select: { id: true } }
          : { take: 0, select: { id: true } },
        _count: { select: { likes: true } },
      },
    });

    if (!list)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (!list.isPublic && list.userId !== currentUserId) {
      return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
    }

    const tiers = safeParseTiers(list.tiersData);
    const characters = await enrichCharacters(tiers);

    const full: TierListFull = {
      id: list.id,
      title: list.title,
      isPublic: list.isPublic,
      previewImage: list.previewImage,
      packUsed: list.packUsed,
      likesCount: list._count.likes,
      hasLiked: Array.isArray(list.likes) && list.likes.length > 0,
      author: list.user,
      createdAt: list.createdAt.toISOString(),
      updatedAt: list.updatedAt.toISOString(),
      tiers,
      characters,
    };

    return NextResponse.json(full);
  } catch (err) {
    console.error(`GET /api/tier-lists/${id} error:`, err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

// ─── PATCH ────────────────────────────────────────────────────────────────────

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const { id } = await params;

  const existing = await prisma.tierList.findUnique({
    where: { id },
    select: { userId: true },
  });
  if (!existing)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (existing.userId !== session.user.id)
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });

  let body: Partial<SaveTierListPayload>;
  try {
    body = (await req.json()) as Partial<SaveTierListPayload>;
  } catch {
    return NextResponse.json({ error: "Corps invalide." }, { status: 400 });
  }

  const { title, isPublic, tiers, previewImage } = body;

  if (title !== undefined && (!title?.trim() || title.length > 100)) {
    return NextResponse.json({ error: "Titre invalide." }, { status: 400 });
  }

  const normalizedTiersData =
    tiers !== undefined
      ? JSON.stringify(
          (Array.isArray(tiers) ? tiers : [])
            .filter(
              (t): t is TierRank =>
                t !== null &&
                typeof t === "object" &&
                Array.isArray((t as TierRank).characterIds),
            )
            .map(normalizeTier),
        )
      : undefined;

  try {
    await prisma.tierList.update({
      where: { id },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(isPublic !== undefined && { isPublic }),
        ...(normalizedTiersData !== undefined && {
          tiersData: normalizedTiersData,
        }),
        ...(previewImage !== undefined && { previewImage }),
      },
    });

    revalidatePath(`/tier-list/${id}`);
    revalidatePath("/tier-list");

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(`PATCH /api/tier-lists/${id} error:`, err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

// ─── DELETE ───────────────────────────────────────────────────────────────────

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const { id } = await params;

  const existing = await prisma.tierList.findUnique({
    where: { id },
    select: { userId: true },
  });
  if (!existing)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (existing.userId !== session.user.id)
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });

  try {
    await prisma.tierList.delete({ where: { id } });
    revalidatePath("/tier-list");
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(`DELETE /api/tier-lists/${id} error:`, err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
