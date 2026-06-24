import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import type { TierListCharacter } from "@/types/tierlist";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const idsParam = searchParams.get("ids") ?? "";

  const ids = idsParam
    .split(",")
    .map((s) => parseInt(s.trim()))
    .filter((id) => Number.isInteger(id) && id > 0);

  if (ids.length === 0) {
    return NextResponse.json({ data: [] });
  }

  const safeIds = ids.slice(0, 300);

  try {
    const characters = await prisma.character.findMany({
      where: { id: { in: safeIds } },
      select: {
        id: true,
        name: true,
        image: true,
        rank: true,
        natureType: true,
        popularity: true,
      },
    });

    const data: TierListCharacter[] = characters.map((c) => {
      let natureType: string[] = [];
      try {
        natureType = JSON.parse(c.natureType ?? "[]") as string[];
      } catch {}
      return { ...c, rank: c.rank ?? null, image: c.image ?? null, natureType };
    });

    return NextResponse.json({ data });
  } catch (err) {
    console.error("GET /api/tier-lists/characters/by-ids error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
