import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import type { TierRank, TierListCharacter } from "@/types/tierlist";
import TierListPublicClient from "@/components/tier-list/TierListPublicClient";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const list = await prisma.tierList.findUnique({
    where: { id },
    select: { title: true, previewImage: true },
  });
  if (!list) return { title: "Tier List introuvable" };

  return {
    title: list.title,
    description: `Tier list Naruto — ${list.title}`,
    openGraph: {
      title: list.title,
      images: list.previewImage ? [{ url: list.previewImage }] : [],
    },
  };
}

async function enrichCharacters(
  tiers: TierRank[],
): Promise<TierListCharacter[]> {
  const allIds = [...new Set(tiers.flatMap((t) => t.characterIds))];
  if (allIds.length === 0) return [];

  const characters = await prisma.character.findMany({
    where: { id: { in: allIds } },
    select: {
      id: true,
      name: true,
      image: true,
      rank: true,
      natureType: true,
      popularity: true,
    },
  });

  return characters.map((c) => {
    let natureType: string[] = [];
    try {
      natureType = JSON.parse(c.natureType ?? "[]") as string[];
    } catch {}
    return { ...c, rank: c.rank ?? null, image: c.image ?? null, natureType };
  });
}

export default async function TierListPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();
  const currentUserId = session?.user?.id;

  const list = await prisma.tierList.findUnique({
    where: { id },
    include: {
      user: {
        select: { id: true, name: true, image: true, avatarSnapshot: true },
      },
      likes: currentUserId
        ? { where: { userId: currentUserId }, select: { id: true } }
        : { take: 0, select: { id: true } },
      _count: { select: { likes: true } },
    },
  });

  if (!list) notFound();
  if (!list.isPublic && list.userId !== currentUserId) notFound();

  let tiers: TierRank[] = [];
  try {
    tiers = JSON.parse(list.tiersData) as TierRank[];
  } catch {}

  const characters = await enrichCharacters(tiers);
  const charMap = new Map(characters.map((c) => [c.id, c]));

  const isOwner = currentUserId === list.userId;
  const hasLiked = Array.isArray(list.likes) && list.likes.length > 0;

  const avatarSrc = list.user.avatarSnapshot ?? list.user.image ?? null;
  const initials =
    list.user.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ?? "?";

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-10 fade-in-up">
      {/* Fil d'ariane */}
      <nav className="flex items-center gap-2 text-xs text-white/30 mb-6">
        <Link
          href="/tier-list"
          className="hover:text-naruto-orange transition-colors"
        >
          ← Tier Lists
        </Link>
        <span>/</span>
        <span className="text-white/50 truncate max-w-48">{list.title}</span>
      </nav>

      {/* En-tête */}
      <div className="flex flex-col sm:flex-row items-start gap-4 mb-8">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-black text-white mb-2">{list.title}</h1>

          {/* Auteur */}
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full overflow-hidden border border-white/10 shrink-0">
              {avatarSrc ? (
                <img
                  src={avatarSrc}
                  alt={list.user.name ?? "avatar"}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full bg-naruto-orange/20 flex items-center justify-center text-[9px] font-bold text-naruto-orange">
                  {initials}
                </div>
              )}
            </div>
            <span className="text-xs text-white/40">
              par{" "}
              <span className="text-white/60">
                {list.user.name?.split(" ")[0] ?? "Anonyme"}
              </span>
            </span>
            <span className="text-white/20 text-xs">·</span>
            <span className="text-xs text-white/25">
              {new Date(list.updatedAt).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {isOwner && (
            <Link
              href={`/tier-list/${id}/edit`}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-white/6 text-white/60 border border-white/10 hover:bg-white/10 hover:text-white transition-all"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                />
              </svg>
              Modifier
            </Link>
          )}

          <TierListPublicClient
            tierListId={id}
            initialLiked={hasLiked}
            initialLikesCount={list._count.likes}
            isLoggedIn={!!currentUserId}
          />
        </div>
      </div>

      {/* Grille des tiers */}
      <div className="rounded-xl overflow-hidden border border-white/8 bg-naruto-surface divide-y divide-white/6 mb-6">
        {tiers.map((tier) => {
          const chars = tier.characterIds
            .map((chrId) => charMap.get(chrId))
            .filter(Boolean) as TierListCharacter[];

          return (
            <div key={tier.id} className="flex items-stretch min-h-20">
              <div
                className="flex items-center justify-center shrink-0 w-16"
                style={{
                  backgroundColor: `${tier.color}22`,
                  borderRight: `3px solid ${tier.color}`,
                }}
              >
                <span
                  className="font-black text-xl"
                  style={{ color: tier.color }}
                >
                  {tier.label}
                </span>
              </div>

              <div className="flex-1 flex flex-wrap gap-2 p-2 items-center">
                {chars.map((char) => (
                  <div
                    key={char.id}
                    className="relative w-14 h-14 shrink-0 rounded-lg overflow-hidden border border-white/10"
                    title={char.name}
                  >
                    {char.image ? (
                      <img
                        src={char.image}
                        alt={char.name}
                        className="w-full h-full object-cover object-top"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full bg-white/5 flex items-center justify-center text-xs text-white/30">
                        {char.name.charAt(0)}
                      </div>
                    )}
                  </div>
                ))}

                {chars.length === 0 && (
                  <p className="text-white/15 text-xs italic px-2">—</p>
                )}
              </div>
            </div>
          );
        })}

        {tiers.length === 0 && (
          <div className="p-10 text-center text-white/20 text-sm">
            Cette tier list est vide.
          </div>
        )}
      </div>
    </div>
  );
}
