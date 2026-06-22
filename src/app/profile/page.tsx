import { auth, signIn, signOut } from "@/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import type { Metadata } from "next";
import type { VideoCategory } from "@/types/videos";
import { CATEGORY_LABELS, CATEGORY_ICONS, CATEGORY_COLORS } from "@/types/videos";
import DeleteAccountButton from "@/components/profile/DeleteAccountButton";
import ConsentButtons from "@/components/profile/ConsentButtons";

export const metadata: Metadata = {
  title: "Mon Profil",
  description: "Ton espace personnel sur Naruto Chronicles.",
};

function getAvatarSrc(avatarSnapshot: string | null, image: string | null): string | null {
  return avatarSnapshot ?? image ?? null;
}

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await auth();
  const params = await searchParams;

  if (!session?.user) {
    return <LoginPage error={params.error} />;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, image: true, avatarSnapshot: true, consentGiven: true, createdAt: true },
  });

  if (!user) redirect("/profile");
  if (!user.consentGiven) return <ConsentPage userId={user.id} />;

  const [likedCount, likedVideos] = await Promise.all([
    prisma.videoLike.count({ where: { userId: user.id } }),
    prisma.videoLike.findMany({
      where: { userId: user.id },
      include: { video: { select: { id: true, title: true, thumbnail: true, category: true } } },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
  ]);

  const avatarSrc = getAvatarSrc(user.avatarSnapshot, user.image);
  const initials = user.name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() ?? "?";
  const memberSince = user.createdAt.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

  return (
    <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-12 fade-in-up space-y-8">
      {/* Carte profil */}
      <div className="relative rounded-3xl border border-white/8 bg-white/3 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at top left, rgba(255,102,0,0.12) 0%, transparent 55%)" }} />
        <div className="relative z-10 p-6 sm:p-8 flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="shrink-0">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-2 border-naruto-orange/40 shadow-[0_0_20px_rgba(255,102,0,0.15)]">
              {avatarSrc ? (
                <img src={avatarSrc} alt={user.name ?? "avatar"} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-full h-full bg-naruto-orange/15 flex items-center justify-center text-xl font-black text-naruto-orange">{initials}</div>
              )}
            </div>
          </div>
          <div className="flex-1 text-center sm:text-left min-w-0">
            <h1 className="text-2xl font-black text-white truncate">{user.name}</h1>
            <p className="text-white/40 text-sm mt-0.5 truncate">{user.email}</p>
            <div className="flex flex-wrap justify-center sm:justify-start gap-x-4 gap-y-1 mt-3 text-xs text-white/30">
              <span>📅 Membre depuis {memberSince}</span>
              <span>❤️ {likedCount} vidéo{likedCount !== 1 ? "s" : ""} aimée{likedCount !== 1 ? "s" : ""}</span>
            </div>
            <div className="mt-3">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] bg-white/5 border border-white/8 text-white/35">
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Connecté via Google
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Vidéos aimées */}
      {likedVideos.length > 0 && (
        <div>
          <div className="mb-4">
            <span className="text-naruto-orange text-xs font-bold tracking-[0.2em] uppercase">Activité</span>
            <h2 className="text-lg font-bold text-white mt-1">Vidéos aimées</h2>
            <div className="accent-line w-14" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {likedVideos.map(({ video }) => {
              const color = CATEGORY_COLORS[video.category as VideoCategory] ?? "#ff6600";
              return (
                <a key={video.id} href={`/videos/${video.id}`} className="group flex flex-col overflow-hidden rounded-xl border border-white/8 bg-white/3 hover:border-white/15 transition-colors">
                  <div className="relative aspect-video overflow-hidden bg-black">
                    <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold" style={{ background: `${color}dd`, color: "#fff" }}>
                      {CATEGORY_ICONS[video.category as VideoCategory]}
                    </span>
                  </div>
                  <p className="text-[11px] font-medium text-white/75 line-clamp-2 p-2.5 leading-snug">{video.title}</p>
                </a>
              );
            })}
          </div>
        </div>
      )}

      {/* Zone danger */}
      <div className="rounded-2xl border border-red-500/15 bg-red-500/4 p-6 space-y-4">
        <div>
          <h2 className="text-sm font-bold text-red-400/80">Zone de danger</h2>
          <p className="text-white/35 text-xs mt-1 leading-relaxed">La suppression est immédiate et irréversible. Toutes tes données sont effacées.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <form action={async () => { "use server"; await signOut({ redirectTo: "/" }); }}>
            <button type="submit" className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-white/6 text-white/60 border border-white/10 hover:bg-white/10 hover:text-white transition-all cursor-pointer">
              Se déconnecter
            </button>
          </form>
          <DeleteAccountButton />
        </div>
      </div>
    </div>
  );
}

function ConsentPage({ userId }: { userId: string }) {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-20 fade-in-up">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-naruto-orange/10 border border-naruto-orange/20 flex items-center justify-center text-2xl mx-auto mb-4">🍥</div>
          <h1 className="text-2xl font-black text-white mb-2">Bienvenue !</h1>
          <p className="text-white/45 text-sm">Avant de continuer, nous avons besoin de ton accord.</p>
        </div>
        <div className="rounded-2xl border border-white/8 bg-white/3 p-5 space-y-3 text-sm text-white/55 leading-relaxed">
          <p className="text-white/80 font-semibold text-sm">Ce que nous utilisons :</p>
          <ul className="space-y-2">
            <li className="flex items-start gap-2"><span className="text-naruto-orange mt-0.5">•</span>Ton <strong className="text-white/70">nom et e-mail</strong> Google</li>
            <li className="flex items-start gap-2"><span className="text-naruto-orange mt-0.5">•</span>Ta <strong className="text-white/70">photo de profil</strong></li>
          </ul>
        </div>
        <ConsentButtons userId={userId} />
      </div>
    </div>
  );
}

function LoginPage({ error }: { error?: string }) {
  void error;
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-20 fade-in-up">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-naruto-orange/10 border border-naruto-orange/20 flex items-center justify-center text-2xl mx-auto mb-4">🍥</div>
          <h1 className="text-2xl font-black text-white">Connexion</h1>
        </div>
        <form action={async () => { "use server"; await signIn("google", { redirectTo: "/profile" }); }}>
          <button type="submit" className="w-full flex items-center justify-center gap-3 px-5 py-3.5 rounded-xl border border-white/12 bg-white/5 hover:bg-white/9 text-white font-semibold text-sm transition-all cursor-pointer">
            Continuer avec Google
          </button>
        </form>
      </div>
    </div>
  );
}
