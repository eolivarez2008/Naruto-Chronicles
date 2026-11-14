import { auth, signIn, signOut } from "@/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import type { Metadata } from "next";
import {
  LogOut,
  Calendar,
  ShieldCheck,
  Mail,
  Flame,
  ListOrdered,
  Heart,
  Scroll,
  User,
  ImageIcon,
  CheckCircle2,
} from "lucide-react";
import DeleteAccountButton from "@/components/profile/DeleteAccountButton";
import ConsentButtons from "@/components/profile/ConsentButtons";
import ProfileTierLists from "@/components/profile/ProfileTierLists";
import type { TierListCard } from "@/types/tierlist";
import { enrichTiersDataBatch } from "@/lib/tierlist";

export const metadata: Metadata = {
  title: "Mon Profil",
  description: "Gère tes tier lists et tes favoris sur Naruto Chronicles.",
};

function getAvatarSrc(
  avatarSnapshot: string | null,
  image: string | null,
): string | null {
  return avatarSnapshot ?? image ?? null;
}

async function mapLists(
  lists: Array<{
    id: string;
    title: string;
    isPublic: boolean;
    packUsed: string;
    tiersData: string;
    createdAt: Date;
    updatedAt: Date;
    user: {
      id: string;
      name: string | null;
      image: string | null;
      avatarSnapshot: string | null;
    };
    _count: { likes: number };
    likes: Array<{ id: string }>;
  }>,
  currentUserId: string,
): Promise<Array<TierListCard & { tiersData: string }>> {
  if (lists.length === 0) return [];
  const enrichedBatch = await enrichTiersDataBatch(
    lists.map((l) => l.tiersData),
  );
  return lists.map((l, idx) => ({
    id: l.id,
    title: l.title,
    isPublic: l.isPublic,
    packUsed: l.packUsed,
    likesCount: l._count.likes,
    hasLiked: Array.isArray(l.likes) && l.likes.length > 0,
    author: l.user,
    createdAt: l.createdAt.toISOString(),
    updatedAt: l.updatedAt.toISOString(),
    tiersData: enrichedBatch[idx],
  }));
}

// --- Page Composant Principal ---

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await auth();
  const params = await searchParams;

  if (!session?.user) {
    const loginCharacters = await prisma.character.findMany({
      where: { image: { not: null } },
      select: { name: true, image: true },
      orderBy: { popularity: "desc" },
      take: 48,
    });
    return <LoginPage error={params.error} characters={loginCharacters} />;
  }

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
    .filter(
      (r: any) => r.tierList.isPublic || r.tierList.userId === currentUserId,
    )
    .map((r: any) => r.tierList);

  const [myCreatedLists, myLikedLists] = await Promise.all([
    mapLists(createdRaw, currentUserId),
    mapLists(likedRaw, currentUserId),
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
  const permissions = [
    {
      t: "Identité",
      d: "Nom et adresse e-mail Google",
      i: User,
    },
    {
      t: "Apparence",
      d: "Photo de profil",
      i: ImageIcon,
    },
  ];

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12 lg:py-24">
      <div className="w-full max-w-sm space-y-8 text-center">
        <div className="w-20 h-20 rounded-3xl bg-linear-to-tr from-naruto-orange to-orange-400 flex items-center justify-center shadow-2xl shadow-naruto-orange/20 mx-auto">
          <ShieldCheck size={40} className="text-white" strokeWidth={2.5} />
        </div>

        <div className="space-y-3">
          <h1 className="text-3xl font-black text-white tracking-tight">
            Presque là !
          </h1>
          <p className="text-white/40 text-sm leading-relaxed">
            Nous avons besoin de valider tes parchemins{" "}
            <br className="hidden sm:block" /> avant de continuer ton aventure.
          </p>
        </div>

        <div className="bg-white/3 border border-white/10 rounded-4xl p-6 text-left space-y-5 backdrop-blur-sm">
          <p className="text-[10px] font-black text-naruto-orange uppercase tracking-[0.2em] pl-1">
            Accès requis
          </p>

          <ul className="space-y-4">
            {permissions.map((item, idx) => (
              <li key={idx} className="flex items-center gap-4 group">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center transition-colors group-hover:bg-white/10">
                  <item.i size={18} className="text-white/60" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-white/90">{item.t}</p>
                  <p className="text-xs text-white/30">{item.d}</p>
                </div>
                <CheckCircle2 size={14} className="text-naruto-orange/40" />
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-4">
          <p className="text-[11px] leading-relaxed text-white/40 px-2">
            En acceptant, tu confirmes avoir pris connaissance de nos{" "}
            <a
              href="/legal"
              className="text-naruto-orange/80 hover:text-naruto-orange underline transition-colors"
            >
              Mentions Légales & Politique de Confidentialité
            </a>
            .
          </p>
          <div>
            <ConsentButtons userId={userId} />
          </div>
        </div>
      </div>
    </div>
  );
}

function LoginPage({
  error,
  characters = [],
}: {
  error?: string;
  characters: { name: string; image: string | null }[];
}) {
  // Deux rangées décalées, chacune dupliquée pour le loop sans couture
  const row1 = characters.slice(0, 24);
  const row2 = characters.slice(24, 48);

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-16 lg:py-24 fade-in-up">
      <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
        {/* ── Colonne gauche ── */}
        <div className="flex-1 space-y-6 sm:space-y-8 w-full">
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight tracking-tight">
              Rejoins la
              <br />
              <span className="text-naruto-orange">communauté</span>
            </h1>
            <p className="text-white/50 text-base sm:text-lg leading-relaxed max-w-md">
              Crée tes tier lists, sauvegarde tes vidéos favorites et rejoins
              des milliers de fans de l&rsquo;univers Naruto.
            </p>
          </div>

          {/* Features */}
          <ul className="space-y-4">
            {[
              {
                icon: ListOrdered,
                label: "Tier Lists personnalisées",
                desc: "Crée et partage tes classements de personnages avec la communauté",
              },
              {
                icon: Heart,
                label: "Vidéos & listes favorites",
                desc: "Retrouve tout ce que tu as aimé dans ton profil",
              },
              {
                icon: ShieldCheck,
                label: "Compte sécurisé & gratuit",
                desc: "Connexion via Google, aucun mot de passe, 100% RGPD",
              },
            ].map(({ icon: Icon, label, desc }) => (
              <li key={label} className="flex items-center gap-3 sm:gap-4">
                <div className="shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-naruto-orange/10 border border-naruto-orange/15 flex items-center justify-center">
                  <Icon size={18} className="text-naruto-orange sm:hidden" />
                  <Icon
                    size={22}
                    className="text-naruto-orange hidden sm:block"
                  />
                </div>
                <div>
                  <p className="text-white/85 text-sm font-bold">{label}</p>
                  <p className="text-white/35 text-xs leading-relaxed mt-0.5 hidden sm:block">
                    {desc}
                  </p>
                </div>
              </li>
            ))}
          </ul>

          {/* Stats */}
          <div className="flex gap-6 sm:gap-8 pt-1">
            {[
              ["1 000+", "Personnages"],
              ["100%", "Gratuit"],
              ["RGPD", "Conforme"],
            ].map(([val, lbl]) => (
              <div key={lbl}>
                <div className="text-white font-semibold text-sm sm:text-base">
                  {val}
                </div>
                <div className="text-white/40 text-xs mt-0.5">{lbl}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Colonne droite ── */}
        <div className="w-full lg:w-[460px] shrink-0">
          <div className="rounded-4xl max-w-md border border-white/10 bg-white/4 backdrop-blur-md p-5 sm:p-7 space-y-5 overflow-hidden relative">
            <div className="space-y-1">
              <h2 className="text-xl font-black text-white">
                Connexion &amp; Inscription
              </h2>
              <p className="text-white/40 text-sm">
                Rejoignez les ninjas en un seul clic !
              </p>
            </div>

            {/* Panorama infini */}
            <div className="relative rounded-2xl overflow-hidden py-2.5 space-y-2 -mx-5 sm:-mx-7">
              {/* Rangée 1 → gauche */}
              <div className="flex overflow-hidden">
                <div className="flex gap-1.5 animate-marquee-left shrink-0">
                  {[...row1, ...row1].map(({ name, image }, i) => (
                    <div
                      key={i}
                      className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg overflow-hidden shrink-0 border border-white/8"
                    >
                      <img
                        src={image ?? ""}
                        alt={name}
                        className="w-full h-full object-cover object-top"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Rangée 2 → droite */}
              <div className="flex overflow-hidden">
                <div className="flex gap-1.5 animate-marquee-right shrink-0">
                  {[...row2, ...row2].map(({ name, image }, i) => (
                    <div
                      key={i}
                      className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg overflow-hidden shrink-0 border border-white/8"
                    >
                      <img
                        src={image ?? ""}
                        alt={name}
                        className="w-full h-full object-cover object-top"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Overlay */}
              <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-black/60 pointer-events-none" />
              {/* Fades latéraux */}
              <div className="absolute inset-y-0 left-0 w-6 bg-linear-to-r from-black/60 to-transparent pointer-events-none" />
              <div className="absolute inset-y-0 right-0 w-6 bg-linear-to-l from-black/60 to-transparent pointer-events-none" />
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
                className="w-full flex items-center justify-center gap-3 px-5 py-4 rounded-2xl bg-white hover:bg-white/92 text-black font-bold text-sm transition-all shadow-2xl shadow-black/30 active:scale-98 cursor-pointer"
              >
                <img
                  src="https://www.google.com/favicon.ico"
                  className="w-4 h-4"
                  alt="Google"
                />
                Continuer avec Google
              </button>
            </form>

            <p className="text-center text-[11px] text-white/25 leading-relaxed">
              En continuant, tu acceptes nos{" "}
              <a
                href="/legal"
                className="underline underline-offset-2 hover:text-white/50 transition-colors"
              >
                Mentions Légales &amp; CGU
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
