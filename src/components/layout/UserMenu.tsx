"use client";

import { useState, useRef, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { trackEvent, EVENTS } from "@/lib/analytics";
import { User, LogOut } from "lucide-react";

interface UserMenuProps {
  isMobile?: boolean;
}

export default function UserMenu({ isMobile = false }: UserMenuProps) {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const hasConsented =
    (session?.user as { consentGiven?: boolean } | undefined)?.consentGiven ===
    true;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (status === "loading") {
    return <div className="w-8 h-8 rounded-full bg-white/10 animate-pulse" />;
  }

  if (!session || !hasConsented) {
    return (
      <Link
        href="/profile"
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold text-white/55 hover:text-white hover:bg-white/5 transition-all duration-200"
      >
        <User size={16} />
        <span>Connexion</span>
      </Link>
    );
  }

  const avatarSrc =
    session?.user?.avatarSnapshot ?? session?.user?.image ?? null;
  const initials =
    session?.user?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ?? "?";

  // VERSION MOBILE
  if (isMobile) {
    return (
      <div className="flex items-center justify-between w-full p-2 bg-white/3 border border-white/5 rounded-3xl">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-full overflow-hidden border border-naruto-orange/30 shrink-0 shadow-lg shadow-naruto-orange/5">
            {avatarSrc ? (
              <img
                src={avatarSrc}
                alt="avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-naruto-orange/20 flex items-center justify-center text-[10px] font-bold text-naruto-orange">
                {initials}
              </div>
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[13px] font-bold text-white truncate">
              {session.user?.name?.split(" ")[0]}
            </span>
            <span className="text-[10px] text-white/30 truncate font-medium">
              {session.user?.email}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <Link
            href="/profile"
            className="p-2.5 rounded-xl bg-white/5 text-white/50 hover:text-white hover:bg-white/10 transition-all active:scale-90"
          >
            <User size={18} />
          </Link>
          <button
            onClick={() => {
              trackEvent(EVENTS.AUTH_LOGOUT);
              signOut({ callbackUrl: "/" });
            }}
            className="p-2.5 rounded-xl bg-red-500/5 text-red-400/50 hover:text-red-400 hover:bg-red-500/10 transition-all active:scale-90"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    );
  }

  // VERSION DESKTOP
  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="p-1 hover:bg-white/5 rounded-xl transition-all cursor-pointer"
        aria-label="Menu utilisateur"
      >
        <div className="w-8 h-8 rounded-full overflow-hidden border border-naruto-orange/35 shrink-0 shadow-lg shadow-naruto-orange/10">
          {avatarSrc ? (
            <img
              src={avatarSrc}
              alt="avatar"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-full h-full bg-naruto-orange/20 flex items-center justify-center text-[10px] font-bold text-naruto-orange">
              {initials}
            </div>
          )}
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full right-0 mt-2 w-52 bg-[#0A0A0A] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50"
          >
            <div className="px-4 py-3 border-b border-white/5 bg-white/2">
              <p className="text-sm font-bold text-white truncate">
                {session.user?.name}
              </p>
              <p className="text-[11px] text-white/30 truncate font-medium">
                {session.user?.email}
              </p>
            </div>
            <div className="p-1.5 space-y-0.5">
              <Link
                href="/profile"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/60 hover:text-white hover:bg-white/5 transition-all group"
              >
                <User
                  size={16}
                  className="group-hover:text-naruto-orange transition-colors"
                />
                Mon profil
              </Link>
              <button
                onClick={() => {
                  setOpen(false);
                  trackEvent(EVENTS.AUTH_LOGOUT);
                  signOut({ callbackUrl: "/" });
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-400/60 hover:text-red-400 hover:bg-red-500/5 transition-all cursor-pointer group"
              >
                <LogOut
                  size={16}
                  className="group-hover:rotate-12 transition-transform"
                />
                Déconnexion
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
