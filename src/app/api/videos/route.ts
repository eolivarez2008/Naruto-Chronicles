import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import type { VideoCard, VideoSortField } from "@/types/videos";
import { VIDEO_CATEGORIES } from "@/types/videos";
import { auth } from "@/auth";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(24, parseInt(searchParams.get("limit") ?? "12"));
  const search = searchParams.get("search")?.trim() ?? "";
  const category = searchParams.get("category") ?? "";
  const sort = (searchParams.get("sort") ?? "recent") as VideoSortField;
  const skip = (page - 1) * limit;

  const where: Prisma.VideoWhereInput = {};
  if (search) where.title = { contains: search };
  if (category && VIDEO_CATEGORIES.includes(category as (typeof VIDEO_CATEGORIES)[number])) {
    where.category = category;
  }

  let orderBy: Prisma.VideoOrderByWithRelationInput;
  switch (sort) {
    case "popular": orderBy = { likesCount: "desc" }; break;
    case "views": orderBy = { viewCount: "desc" }; break;
    default: orderBy = { publishedAt: "desc" };
  }

  try {
    const session = await auth();
    const userId = session?.user?.id;

    const [total, videos] = await Promise.all([
      prisma.video.count({ where }),
      prisma.video.findMany({
        where, skip, take: limit, orderBy,
        include: {
          likes: userId
            ? { where: { userId }, select: { id: true } }
            : false,
        },
      }),
    ]);

    const data: VideoCard[] = videos.map((v) => ({
      id: v.id,
      title: v.title,
      thumbnail: v.thumbnail,
      channelTitle: v.channelTitle,
      publishedAt: v.publishedAt.toISOString(),
      category: v.category as VideoCard["category"],
      likesCount: v.likesCount,
      viewCount: v.viewCount.toString(),
      hasLiked: Array.isArray(v.likes) && v.likes.length > 0,
    }));

    return NextResponse.json({
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error("API videos error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
