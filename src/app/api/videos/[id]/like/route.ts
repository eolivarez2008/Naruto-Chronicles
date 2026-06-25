import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import type { VideoLikeResponse } from "@/types/videos";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: videoId } = await params;
  if (!videoId) {
    return NextResponse.json({ error: "Missing video ID" }, { status: 400 });
  }

  try {
    const video = await prisma.video.findUnique({ where: { id: videoId } });
    if (!video)
      return NextResponse.json({ error: "Video not found" }, { status: 404 });

    const existing = await prisma.videoLike.findFirst({
      where: { videoId, userId },
    });

    let liked: boolean;
    let finalLikesCount: number;

    if (existing) {
      await prisma.$transaction([
        prisma.videoLike.delete({ where: { id: existing.id } }),
        prisma.video.update({
          where: { id: videoId },
          data: { likesCount: { decrement: 1 } },
        }),
      ]);
      liked = false;
    } else {
      await prisma.$transaction([
        prisma.videoLike.create({
          data: { videoId, userId, ipHash: `auth_${userId}` },
        }),
        prisma.video.update({
          where: { id: videoId },
          data: { likesCount: { increment: 1 } },
        }),
      ]);
      liked = true;
    }

    finalLikesCount = await prisma.videoLike.count({ where: { videoId } });

    const response: VideoLikeResponse = { liked, likesCount: finalLikesCount };
    return NextResponse.json(response);
  } catch (err) {
    console.error("Like API error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
