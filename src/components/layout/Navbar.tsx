"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { label: "Accueil", href: "/", exact: true },
  { label: "Histoire", href: "/story" },
  { label: "Personnages", href: "/characters" },
  { label: "Saga", href: "/saga" },
  { label: "Contact", href: "/contact" },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string, exact?: boolean) =>
    exact
      ? pathname === href
      : pathname === href || pathname.startsWith(href + "/");

  return (
    <nav
      className="fixed top-4 left-1/2 -translate-x-1/2 z-50"
      style={{ width: "min(95vw, 600px)" }}
    >
      <div
        className="relative flex items-center justify-center px-6 h-15 rounded-2xl border border-white/10 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.08)]"
        style={{ background: "rgba(10,10,10,0.75)" }}
      >
        {/* Desktop */}
        <ul className="hidden md:flex items-center gap-4">
          {LINKS.map((l) => {
            const active = isActive(l.href, l.exact);
            return (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className={[
                    "relative px-5 py-2 rounded-xl text-[14px] font-semibold transition-all duration-200",
                    active
                      ? "text-naruto-orange bg-[rgba(255,102,0,0.12)]"
                      : "text-white/60 hover:text-white hover:bg-white/5",
                  ].join(" ")}
                >
                  {active && (
                    <span className="absolute inset-x-4 bottom-1 h-px bg-linear-to-r from-naruto-orange to-transparent rounded-full" />
                  )}
                  {l.label}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Mobile button */}
        <button
          className="md:hidden flex flex-col gap-1.25 absolute right-4"
          onClick={() => setMenuOpen((p) => !p)}
          aria-label="Menu"
        >
          <span
            className={`block w-6 h-0.5 transition-all duration-300 ${menuOpen ? "bg-naruto-orange rotate-45 translate-y-1.75" : "bg-white/70"}`}
          />
          <span
            className={`block w-6 h-0.5 transition-all duration-300 ${menuOpen ? "opacity-0" : "bg-white/70"}`}
          />
          <span
            className={`block w-6 h-0.5 transition-all duration-300 ${menuOpen ? "bg-naruto-orange -rotate-45 -translate-y-1.75" : "bg-white/70"}`}
          />
        </button>
      </div>

      {/* Mobile menu */}
      <div
        className={[
          "md:hidden absolute top-[calc(100%+10px)] left-0 right-0 rounded-2xl border border-white/10 backdrop-blur-2xl shadow-2xl overflow-hidden transition-all duration-300",
          menuOpen
            ? "opacity-100 scale-100"
            : "opacity-0 scale-95 pointer-events-none",
        ].join(" ")}
        style={{ background: "rgba(5,5,5,0.95)" }}
      >
        <ul className="p-3 space-y-1">
          {LINKS.map((l) => {
            const active = isActive(l.href, l.exact);
            return (
              <li key={l.href}>
                <Link
                  href={l.href}
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
      </div>
    </nav>
  );
}
