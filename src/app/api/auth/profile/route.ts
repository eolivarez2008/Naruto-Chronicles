import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export async function DELETE(_req: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const userLikes = await prisma.videoLike.findMany({
      where: { userId },
      select: { videoId: true },
    });

    await prisma.$transaction([
      ...userLikes.map((like) =>
        prisma.video.update({
          where: { id: like.videoId },
          data: {
            likesCount: { decrement: 1 },
          },
        }),
      ),

      prisma.videoLike.deleteMany({ where: { userId } }),
      prisma.account.deleteMany({ where: { userId } }),
      prisma.user.delete({ where: { id: userId } }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[DELETE] Erreur:", e);
    return NextResponse.json(
      { error: "Erreur lors de la suppression." },
      { status: 500 },
    );
  }
}
