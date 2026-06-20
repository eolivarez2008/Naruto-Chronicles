import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import * as crypto from "crypto";
import type { VideoLikeResponse } from "@/types/videos";

// ajout du hash IP — le sel "naruto-salt" garantit qu'on ne peut pas rétro-dériver l'IP réelle
function hashIp(req: NextRequest): string {
  const ip =
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    "unknown";
  return crypto
    .createHash("sha256")
    .update(ip + "naruto-salt")
    .digest("hex");
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: videoId } = await params;

  if (!videoId) {
    return NextResponse.json({ error: "Missing video ID" }, { status: 400 });
  }

  const video = await prisma.video.findUnique({ where: { id: videoId } });
  if (!video) {
    return NextResponse.json({ error: "Video not found" }, { status: 404 });
  }

  const ipHash = hashIp(req);

  // placeholder userId — à remplacer par req.session.userId ou le token JWT plus tard
  const userId: string | null = null;

  try {
    const existing = await prisma.videoLike.findUnique({
      where: { videoId_ipHash: { videoId, ipHash } },
    });

    let liked: boolean;
    let likesCount: number;

    if (existing) {
      // ajout du toggle : retrait du like si déjà liké
      await prisma.$transaction([
        prisma.videoLike.delete({ where: { id: existing.id } }),
        prisma.video.update({
          where: { id: videoId },
          data: { likesCount: { decrement: 1 } },
        }),
      ]);
      liked = false;
      likesCount = Math.max(0, video.likesCount - 1);
    } else {
      // ajout du like
      await prisma.$transaction([
        prisma.videoLike.create({ data: { videoId, ipHash, userId } }),
        prisma.video.update({
          where: { id: videoId },
          data: { likesCount: { increment: 1 } },
        }),
      ]);
      liked = true;
      likesCount = video.likesCount + 1;
    }

    const response: VideoLikeResponse = { liked, likesCount };
    return NextResponse.json(response);
  } catch (error) {
    console.error("Like API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
