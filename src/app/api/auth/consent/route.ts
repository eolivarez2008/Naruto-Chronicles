import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { consentGiven: true, consentAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
