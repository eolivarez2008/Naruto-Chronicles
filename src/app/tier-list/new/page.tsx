import type { Metadata } from "next";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import TierListEditor from "@/components/tier-list/TierListEditor";

export const metadata: Metadata = {
  title: "Nouvelle Tier List",
  description: "Crée ta tier list de personnages Naruto.",
};

interface Props {
  searchParams: Promise<{ pack?: string }>;
}

export default async function NewTierListPage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user) redirect("/profile?error=unauthenticated");

  const { pack } = await searchParams;
  const packId = pack ?? "all";

  return <TierListEditor packId={packId} mode="create" />;
}
