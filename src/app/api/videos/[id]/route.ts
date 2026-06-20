import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import * as crypto from "crypto";

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

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Missing ID" }, { status: 400 });
  }

  try {
    const ipHash = hashIp(req);
    const video = await prisma.video.findUnique({
      where: { id },
      include: { likes: { where: { ipHash }, select: { id: true } } },
    });

    if (!video) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: video.id,
      title: video.title,
      thumbnail: video.thumbnail,
      channelTitle: video.channelTitle,
      publishedAt: video.publishedAt.toISOString(),
      category: video.category,
      likesCount: video.likesCount,
      viewCount: video.viewCount.toString(),
      hasLiked: video.likes.length > 0,
    });
  } catch (error) {
    console.error("Video detail API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
