import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";

function hashIp(req: NextRequest): string {
  const ip =
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    "unknown";
  return createHash("sha256").update(ip + "naruto-salt").digest("hex");
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

  try {
    const session = await auth();
    const userId = session?.user?.id;

    const video = await prisma.video.findUnique({
      where: { id },
      include: {
        likes: userId
          ? { where: { userId }, select: { id: true } }
          : false,
      },
    });

    if (!video) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({
      id: video.id,
      title: video.title,
      thumbnail: video.thumbnail,
      channelTitle: video.channelTitle,
      publishedAt: video.publishedAt.toISOString(),
      category: video.category,
      likesCount: video.likesCount,
      viewCount: video.viewCount.toString(),
      hasLiked: Array.isArray(video.likes) && video.likes.length > 0,
    });
  } catch (err) {
    console.error("API video [id] error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
