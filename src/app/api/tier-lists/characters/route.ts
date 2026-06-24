import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import type { TierListCharacter } from "@/types/tierlist";

function mapCharacters(
  chars: Array<{
    id: number;
    name: string;
    image: string | null;
    rank: string | null;
    natureType: string | null;
    popularity: number;
  }>,
): TierListCharacter[] {
  return chars.map((c) => {
    let natureType: string[] = [];
    try {
      natureType = JSON.parse(c.natureType ?? "[]") as string[];
    } catch {}
    return {
      id: c.id,
      name: c.name,
      image: c.image ?? null,
      rank: c.rank ?? null,
      natureType,
      popularity: c.popularity,
    };
  });
}

const SELECT_FIELDS = {
  id: true,
  name: true,
  image: true,
  rank: true,
  natureType: true,
  popularity: true,
} as const;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const pack = searchParams.get("pack") ?? "all";
  const search = searchParams.get("search") ?? "";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(100, parseInt(searchParams.get("limit") ?? "60"));
  const skip = (page - 1) * limit;

  try {
    // ── Pack random ───────────────────────
    if (pack.startsWith("random")) {
      const count = parseInt(pack.replace("random", "")) || 10;

      const where: Prisma.CharacterWhereInput = search.trim()
        ? { normalizedName: { contains: search.trim().toLowerCase() } }
        : {};

      const all = await prisma.character.findMany({
        where,
        select: SELECT_FIELDS,
      });

      for (let i = all.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [all[i], all[j]] = [all[j], all[i]];
      }

      const sliced = all.slice(0, count);
      return NextResponse.json({
        data: mapCharacters(sliced),
        meta: { total: sliced.length, page: 1, limit: count, totalPages: 1 },
      });
    }

    // ── Pack popular ─────────────────────
    if (pack.startsWith("popular")) {
      const count = parseInt(pack.replace("popular", "")) || 10;

      const where: Prisma.CharacterWhereInput = {
        popularity: { gt: 0 },
        ...(search.trim() && {
          normalizedName: { contains: search.trim().toLowerCase() },
        }),
      };

      const chars = await prisma.character.findMany({
        where,
        select: SELECT_FIELDS,
        orderBy: { popularity: "desc" },
        take: count,
      });

      return NextResponse.json({
        data: mapCharacters(chars),
        meta: { total: chars.length, page: 1, limit: count, totalPages: 1 },
      });
    }

    // ── Pack kage ───────────
    if (pack === "kage") {
      const where: Prisma.CharacterWhereInput = {
        rank: { contains: "Kage" },
        ...(search.trim() && {
          normalizedName: { contains: search.trim().toLowerCase() },
        }),
      };

      const [total, chars] = await Promise.all([
        prisma.character.count({ where }),
        prisma.character.findMany({
          where,
          select: SELECT_FIELDS,
          orderBy: { popularity: "desc" },
          skip,
          take: limit,
        }),
      ]);

      return NextResponse.json({
        data: mapCharacters(chars),
        meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
      });
    }

    // ── Fallback "all" ──────────
    const where: Prisma.CharacterWhereInput = search.trim()
      ? { normalizedName: { contains: search.trim().toLowerCase() } }
      : {};

    const [total, chars] = await Promise.all([
      prisma.character.count({ where }),
      prisma.character.findMany({
        where,
        select: SELECT_FIELDS,
        orderBy: { name: "asc" },
        skip,
        take: limit,
      }),
    ]);

    return NextResponse.json({
      data: mapCharacters(chars),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error("GET /api/tier-lists/characters error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
