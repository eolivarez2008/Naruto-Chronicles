import type { Metadata } from "next";
import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import TierListEditor from "@/components/tier-list/TierListEditor";
import type { TierRank } from "@/types/tierlist";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const list = await prisma.tierList.findUnique({
    where: { id },
    select: { title: true },
  });
  return { title: list ? `Modifier — ${list.title}` : "Modifier la Tier List" };
}

export default async function EditTierListPage({ params }: Props) {
  const session = await auth();
  if (!session?.user) redirect("/profile?error=unauthenticated");

  const { id } = await params;

  const list = await prisma.tierList.findUnique({
    where: { id },
    select: {
      userId: true,
      title: true,
      isPublic: true,
      tiersData: true,
      packUsed: true,
    },
  });

  if (!list) notFound();
  if (list.userId !== session.user.id) redirect("/tier-list");

  let tiers: TierRank[] = [];
  try {
    tiers = JSON.parse(list.tiersData) as TierRank[];
  } catch {}

  return (
    <TierListEditor
      tierListId={id}
      mode="edit"
      packId={list.packUsed}
      initialData={{
        title: list.title,
        isPublic: list.isPublic,
        tiers,
      }}
    />
  );
}
