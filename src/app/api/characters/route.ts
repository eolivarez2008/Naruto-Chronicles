import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(60, parseInt(searchParams.get("limit") ?? "40"));
  const search = searchParams.get("search")?.trim() ?? "";
  const rank = searchParams.get("rank") ?? "";

  const sortParam = searchParams.get("sort") ?? "popularity";

  const skip = (page - 1) * limit;
  const where: Prisma.CharacterWhereInput = {};

  if (search) {
    where.normalizedName = { contains: search };
  }

  if (rank) {
    where.rank = {
      contains: `"${rank}"`,
    };
  }

  let orderBy: Prisma.CharacterOrderByWithRelationInput = { name: "asc" };

  if (sortParam === "popularity") {
    orderBy = { popularity: "desc" };
  } else if (sortParam === "name_desc") {
    orderBy = { name: "desc" };
  } else if (sortParam === "name_asc") {
    orderBy = { name: "asc" };
  }

  try {
    const [total, characters] = await Promise.all([
      prisma.character.count({ where }),
      prisma.character.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        select: {
          id: true,
          name: true,
          image: true,
          rank: true,
          natureType: true,
          popularity: true,
        },
      }),
    ]);

    const data = characters.map((c) => {
      let natureType: string[] = [];
      try {
        const parsed = JSON.parse(c.natureType ?? "[]");
        natureType = Array.isArray(parsed) ? parsed : [];
      } catch {
        natureType = [];
      }

      return {
        id: c.id,
        name: c.name,
        image: (c as any).image ?? null,
        rank: c.rank,
        natureType,
        popularity: c.popularity,
      };
    });

    return NextResponse.json({
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", detail: String(error) },
      { status: 500 },
    );
  }
}
