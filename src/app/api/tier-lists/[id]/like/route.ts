import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import type { TierListLikeResponse } from "@/types/tierlist";

// ─── POST — toggle like sur une tier list ────────────────────────────────────

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const { id: tierListId } = await params;
  const userId = session.user.id;

  try {
    const list = await prisma.tierList.findUnique({
      where: { id: tierListId },
      select: { id: true },
    });
    if (!list)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    const existing = await prisma.tierListLike.findUnique({
      where: { tierListId_userId: { tierListId, userId } },
    });

    let liked: boolean;
    if (existing) {
      await prisma.tierListLike.delete({ where: { id: existing.id } });
      liked = false;
    } else {
      await prisma.tierListLike.create({ data: { tierListId, userId } });
      liked = true;
    }

    const likesCount = await prisma.tierListLike.count({
      where: { tierListId },
    });

    const response: TierListLikeResponse = { liked, likesCount };
    return NextResponse.json(response);
  } catch (err) {
    console.error("POST /api/tier-lists/[id]/like error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
