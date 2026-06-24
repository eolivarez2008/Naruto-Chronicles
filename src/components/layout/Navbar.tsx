"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import UserMenu from "@/components/layout/UserMenu";
import { useSession } from "next-auth/react";
import { trackEvent, EVENTS } from "@/lib/analytics";
import type { NavLink } from "@/types";

const LINKS: NavLink[] = [
  { label: "Accueil", href: "/", exact: true },
  { label: "Histoire", href: "/story" },
  { label: "Personnages", href: "/characters" },
  { label: "Vidéos", href: "/videos" },
  { label: "Tier List", href: "/tier-list" },
  { label: "Saga", href: "/saga" },
  { label: "Contact", href: "/contact" },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();

  const isActive = (href: string, exact?: boolean) =>
    exact
      ? pathname === href
      : pathname === href || pathname.startsWith(href + "/");

  const hasConsented =
    session?.user &&
    (session.user as { consentGiven?: boolean }).consentGiven === true;

  return (
    <nav
      className="fixed top-4 left-1/2 -translate-x-1/2 z-50"
      style={{ width: "min(95vw, 780px)" }}
    >
      <div
        className="relative flex items-center justify-between px-4 h-14 rounded-2xl border border-white/10 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.08)]"
        style={{ background: "rgba(10,10,10,0.80)" }}
      >
        {/* Liens desktop */}
        <ul className="hidden md:flex items-center gap-1 flex-1 justify-center">
          {LINKS.map((l) => {
            const active = isActive(l.href, l.exact);
            return (
              <li key={l.href}>
                <Link
                  href={l.href}
                  onClick={() => trackEvent(EVENTS.NAV_CLICK, { page: l.href })}
                  className={[
                    "relative px-3.5 py-2 rounded-xl text-[13px] font-semibold transition-all duration-200",
                    active
                      ? "text-naruto-orange bg-[rgba(255,102,0,0.12)]"
                      : "text-white/55 hover:text-white hover:bg-white/5",
                  ].join(" ")}
                >
                  {active && (
                    <span className="absolute inset-x-3 bottom-1 h-px bg-linear-to-r from-naruto-orange to-transparent rounded-full" />
                  )}
                  {l.label}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Espace utilisateur desktop */}
        <div className="hidden md:flex items-center pl-2 border-l border-white/8 ml-2">
          {hasConsented ? (
            <UserMenu />
          ) : (
            <Link
              href="/profile"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[13px] font-semibold text-white/55 hover:text-white hover:bg-white/5 transition-all duration-200"
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
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              <span className="hidden sm:inline">Connexion</span>
            </Link>
          )}
        </div>

        {/* Hamburger mobile */}
        <button
          className="md:hidden flex flex-col gap-1.5 ml-auto cursor-pointer"
          onClick={() => setMenuOpen((p) => !p)}
          aria-label="Menu"
        >
          <span
            className={`block w-5 h-0.5 transition-all duration-300 ${menuOpen ? "bg-naruto-orange rotate-45 translate-y-2" : "bg-white/70"}`}
          />
          <span
            className={`block w-5 h-0.5 transition-all duration-300 ${menuOpen ? "opacity-0" : "bg-white/70"}`}
          />
          <span
            className={`block w-5 h-0.5 transition-all duration-300 ${menuOpen ? "bg-naruto-orange -rotate-45 -translate-y-2" : "bg-white/70"}`}
          />
        </button>
      </div>

      {/* Menu mobile */}
      <div
        className={[
          "md:hidden absolute top-[calc(100%+10px)] left-0 right-0 rounded-2xl border border-white/10 backdrop-blur-2xl shadow-2xl overflow-hidden transition-all duration-300",
          menuOpen
            ? "opacity-100 scale-100"
            : "opacity-0 scale-95 pointer-events-none",
        ].join(" ")}
        style={{ background: "rgba(5,5,5,0.97)" }}
      >
        <ul className="p-3 space-y-1">
          {LINKS.map((l) => {
            const active = isActive(l.href, l.exact);
            return (
              <li key={l.href}>
                <Link
                  href={l.href}
                  onClick={() => {
                    setMenuOpen(false);
                    trackEvent(EVENTS.NAV_CLICK, { page: l.href });
                  }}
                  className={[
                    "flex items-center px-4 py-3 rounded-xl text-sm font-semibold transition-all",
                    active
                      ? "text-naruto-orange bg-[rgba(255,102,0,0.12)]"
                      : "text-white/60 hover:text-white hover:bg-white/5",
                  ].join(" ")}
                >
                  {l.label}
                </Link>
              </li>
            );
          })}
        </ul>
        <div className="px-4 pb-4 pt-2 border-t border-white/8">
          <UserMenu />
        </div>
      </div>
    </nav>
  );
}
