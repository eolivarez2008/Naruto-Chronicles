import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: rawId } = await params;
  const id = parseInt(rawId);

  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  try {
    const character = await prisma.character.findUnique({ where: { id } });

    if (!character) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const parse = <T>(val: string | null, fallback: T): T => {
      if (!val) return fallback;
      try {
        return JSON.parse(val) as T;
      } catch {
        return fallback;
      }
    };

    const rank = parse<Record<string, string> | null>(character.rank, null);
    const natureType = parse<string[]>(character.natureType, []);
    const jutsu = parse<string[]>(character.jutsu, []);
    const family = parse<Record<string, string>>(character.family, {});
    const debut = parse<Record<string, string>>(character.debut, {});
    const age = parse<Record<string, string> | null>(character.age, null);
    const height = parse<Record<string, string> | null>(character.height, null);

    return NextResponse.json({
      id: character.id,
      name: character.name,
      image: character.image ?? null,
      sex: character.sex ?? null,
      birthdate: character.birthdate ?? null,
      age,
      height,
      rank,
      natureType,
      jutsu,
      family,
      debut,
    });
  } catch (error) {
    console.error("API Error ID:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
