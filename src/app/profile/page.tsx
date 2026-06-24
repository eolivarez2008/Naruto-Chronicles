import { auth, signIn, signOut } from "@/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import type { Metadata } from "next";
import { LogOut, Calendar, ShieldCheck, Mail } from "lucide-react";
import DeleteAccountButton from "@/components/profile/DeleteAccountButton";
import ConsentButtons from "@/components/profile/ConsentButtons";
import ProfileTierLists from "@/components/profile/ProfileTierLists";
import type { TierListCard, TierRank } from "@/types/tierlist";

export const metadata: Metadata = {
  title: "Mon Profil | Naruto Chronicles",
  description: "Gère tes tier lists et tes favoris sur Naruto Chronicles.",
};

function getAvatarSrc(
  avatarSnapshot: string | null,
  image: string | null,
): string | null {
  return avatarSnapshot ?? image ?? null;
}

async function enrichTiersData(tiersData: string): Promise<string> {
  let tiers: TierRank[] = [];
  try {
    const raw = JSON.parse(tiersData) as unknown;
    if (!Array.isArray(raw)) return tiersData;
    tiers = (raw as unknown[]).filter(
      (t): t is TierRank =>
        t !== null &&
        typeof t === "object" &&
        Array.isArray((t as TierRank).characterIds),
    );
  } catch {
    return tiersData;
  }
  const allIds = [
    ...new Set(
      tiers.flatMap((t) => t.characterIds.map(Number).filter((id) => id > 0)),
    ),
  ];
  if (allIds.length === 0) return JSON.stringify(tiers);
  try {
    const chars = await prisma.character.findMany({
      where: { id: { in: allIds } },
      select: { id: true, image: true, name: true },
    });
    const charMap = new Map(chars.map((c) => [c.id, c]));
    const enriched = tiers.map((tier) => ({
      ...tier,
      characterImages: tier.characterIds.slice(0, 7).map((rawId) => {
        const id = Number(rawId);
        const c = charMap.get(id);
        return { id, image: c?.image ?? null, name: c?.name ?? "?" };
      }),
    }));
    return JSON.stringify(enriched);
  } catch {
    return JSON.stringify(tiers);
  }
}

async function mapTierList(
  l: any,
  currentUserId: string,
): Promise<TierListCard & { tiersData: string }> {
  const enrichedTiersData = await enrichTiersData(l.tiersData).catch(
    () => l.tiersData,
  );
  return {
    id: l.id,
    title: l.title,
    isPublic: l.isPublic,
    previewImage: l.previewImage,
    packUsed: l.packUsed,
    likesCount: l._count.likes,
    hasLiked: Array.isArray(l.likes) && l.likes.length > 0,
    author: l.user,
    createdAt: l.createdAt.toISOString(),
    updatedAt: l.updatedAt.toISOString(),
    tiersData: enrichedTiersData,
  };
}

// --- Page Composant Principal ---

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await auth();
  const params = await searchParams;

  if (!session?.user) return <LoginPage error={params.error} />;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      avatarSnapshot: true,
      consentGiven: true,
      createdAt: true,
    },
  });

  if (!user) redirect("/profile");
  if (!user.consentGiven) return <ConsentPage userId={user.id} />;

  const currentUserId = user.id;

  const [likedVideos, createdRaw, likedRelations] = await Promise.all([
    prisma.videoLike.findMany({
      where: { userId: currentUserId },
      include: {
        video: {
          select: { id: true, title: true, thumbnail: true, category: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
    prisma.tierList.findMany({
      where: { userId: currentUserId },
      orderBy: { updatedAt: "desc" },
      take: 40,
      include: {
        user: {
          select: { id: true, name: true, image: true, avatarSnapshot: true },
        },
        likes: { where: { userId: currentUserId }, select: { id: true } },
        _count: { select: { likes: true } },
      },
    }),
    prisma.tierListLike.findMany({
      where: { userId: currentUserId },
      orderBy: { createdAt: "desc" },
      take: 40,
      include: {
        tierList: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
                avatarSnapshot: true,
              },
            },
            likes: { where: { userId: currentUserId }, select: { id: true } },
            _count: { select: { likes: true } },
          },
        },
      },
    }),
  ]);

  const likedRaw = likedRelations
    .filter((r) => r.tierList.isPublic || r.tierList.userId === currentUserId)
    .map((r) => r.tierList);

  const [myCreatedLists, myLikedLists] = await Promise.all([
    Promise.all(createdRaw.map((l) => mapTierList(l, currentUserId))),
    Promise.all(likedRaw.map((l) => mapTierList(l, currentUserId))),
  ]);

  const avatarSrc = getAvatarSrc(user.avatarSnapshot, user.image);
  const memberSince = new Date(user.createdAt).toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-12 space-y-12">
      {/* HEADER */}
      <div className="relative overflow-hidden rounded-[2.5rem] border border-white/5 bg-linear-to-br from-white/[0.07] to-transparent p-8 md:p-10">
        {/* Background decor */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-naruto-orange/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
          {/* Avatar */}
          <div className="relative group">
            <div className="relative w-28 h-28 rounded-full overflow-hidden border border-white/10 bg-zinc-900">
              {avatarSrc ? (
                <img
                  src={avatarSrc}
                  className="w-full h-full object-cover"
                  alt={user.name ?? "Profil"}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl font-black text-white/20">
                  {user.name?.charAt(0).toUpperCase() ?? "?"}
                </div>
              )}
            </div>
          </div>

          {/* User Info */}
          <div className="flex-1 text-center md:text-left space-y-3">
            <div className="space-y-1">
              <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                {user.name}
              </h1>
              <div className="flex flex-wrap justify-center md:justify-start gap-4">
                <span className="flex items-center gap-1.5 text-white/40 text-sm font-medium">
                  <Mail className="w-3.5 h-3.5" /> {user.email}
                </span>
                <span className="flex items-center gap-1.5 text-white/40 text-sm font-medium">
                  <Calendar className="w-3.5 h-3.5" /> Depuis {memberSince}
                </span>
              </div>
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-naruto-orange/10 border border-naruto-orange/20 text-[10px] uppercase tracking-wider font-bold text-naruto-orange">
              <ShieldCheck className="w-3 h-3" /> Compte Vérifié
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <button className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white text-black font-bold text-sm hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-white/5 cursor-pointer">
                <LogOut className="w-4 h-4" /> Se déconnecter
              </button>
            </form>
            <DeleteAccountButton />
          </div>
        </div>
      </div>

      {/* TABS & GRID SECTION */}
      <ProfileTierLists
        myCreatedLists={myCreatedLists}
        myLikedLists={myLikedLists}
        likedVideos={likedVideos}
      />
    </div>
  );
}

// --- Pages Secondaires (Consentement / Login) ---

function ConsentPage({ userId }: { userId: string }) {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-24">
      <div className="w-full max-w-md space-y-8 text-center">
        <div className="w-20 h-20 rounded-4xl bg-linear-to-tr from-naruto-orange to-orange-400 flex items-center justify-center text-4xl shadow-2xl shadow-naruto-orange/20 mx-auto transform -rotate-6">
          🍥
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-black text-white">Presque là !</h1>
          <p className="text-white/40 text-sm">
            Nous avons besoin de valider tes parchemins avant de continuer.
          </p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 text-left space-y-4">
          <p className="text-xs font-bold text-white/60 uppercase tracking-widest">
            Accès requis :
          </p>
          <ul className="space-y-3">
            {[
              { t: "Identité", d: "Nom et adresse e-mail Google", i: "👤" },
              { t: "Apparence", d: "Photo de profil", i: "🖼️" },
            ].map((item, idx) => (
              <li key={idx} className="flex items-center gap-4">
                <span className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-sm">
                  {item.i}
                </span>
                <div>
                  <p className="text-sm font-bold text-white/80">{item.t}</p>
                  <p className="text-xs text-white/40">{item.d}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <ConsentButtons userId={userId} />
      </div>
    </div>
  );
}

function LoginPage({ error }: { error?: string }) {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-24">
      <div className="w-full max-w-sm space-y-8 text-center">
        <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-3xl mx-auto">
          🍥
        </div>
        <div className="space-y-3">
          <h1 className="text-2xl font-black text-naruto-orange">
            Connexion - Inscription
          </h1>
          <p className="text-white/40 text-sm">
            Rejoins le village caché pour créer tes tier lists et bien plus
            encore !
          </p>
        </div>
        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium">
            {error}
          </div>
        )}
        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: "/profile" });
          }}
        >
          <button
            type="submit"
            className="w-full group relative flex items-center justify-center gap-3 px-5 py-4 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 text-white font-bold text-sm transition-all shadow-xl active:scale-95 cursor-pointer"
          >
            <img
              src="https://www.google.com/favicon.ico"
              className="w-4 h-4 transition-all"
            />
            Continuer avec Google
          </button>
        </form>
      </div>
    </div>
  );
}
