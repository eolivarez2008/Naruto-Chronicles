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
    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    const existing = await prisma.videoLike.findFirst({
      where: { videoId, userId },
    });

    const ipHash = "auth_user";

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
      finalLikesCount = Math.max(0, video.likesCount - 1);
    } else {
      await prisma.$transaction([
        prisma.videoLike.create({
          data: { videoId, userId, ipHash },
        }),
        prisma.video.update({
          where: { id: videoId },
          data: { likesCount: { increment: 1 } },
        }),
      ]);
      liked = true;
      finalLikesCount = video.likesCount + 1;
    }

    const response: VideoLikeResponse = {
      liked,
      likesCount: finalLikesCount,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Like API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
