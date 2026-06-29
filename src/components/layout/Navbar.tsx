"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { trackEvent, EVENTS } from "@/lib/analytics";
import UserMenu from "@/components/layout/UserMenu";
import { useSession } from "next-auth/react";
import {
  Home,
  BookOpen,
  Users,
  PlayCircle,
  ListOrdered,
  Map,
  Mail,
  Menu,
  X,
  User,
} from "lucide-react";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setIsOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const navLinks = [
    { name: "ACCUEIL", href: "/", icon: <Home size={20} /> },
    { name: "HISTOIRE", href: "/story", icon: <BookOpen size={20} /> },
    { name: "PERSONNAGES", href: "/characters", icon: <Users size={20} /> },
    { name: "VIDEOS", href: "/videos", icon: <PlayCircle size={20} /> },
    { name: "TIER LIST", href: "/tier-list", icon: <ListOrdered size={20} /> },
    { name: "SAGA", href: "/saga", icon: <Map size={20} /> },
    { name: "CONTACT", href: "/contact", icon: <Mail size={20} /> },
  ];

  const hasConsented = session?.user?.consentGiven === true;

  return (
    <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-10003 w-[92%] max-w-225 pointer-events-none font-sans">
      <div className="flex flex-col items-center justify-center w-full">
        <div className="relative w-full bg-[#050505]/80 backdrop-blur-2xl border border-white/10 pointer-events-auto rounded-4xl p-2 shadow-[0_15px_35px_rgba(0,0,0,0.5)]">
          <div className="flex items-center justify-between w-full h-11 px-4">
            <span className="lg:hidden text-white font-black tracking-tighter text-xs uppercase italic opacity-90">
              Naruto <span className="text-naruto-orange">Chronicles</span>
            </span>

            <div className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => {
                const isActive =
                  link.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    onClick={() =>
                      trackEvent(EVENTS.NAV_CLICK, { page: link.href })
                    }
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-[11px] font-bold transition-all duration-300 whitespace-nowrap ${isActive ? "bg-naruto-orange/10 text-naruto-orange" : "text-zinc-400 hover:bg-white/5"}`}
                  >
                    {link.icon}
                    <span>{link.name}</span>
                  </Link>
                );
              })}
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden lg:flex items-center pl-2 border-l border-white/10 ml-2 shrink-0">
                {hasConsented ? (
                  <UserMenu />
                ) : (
                  <Link
                    href="/profile"
                    onClick={() => trackEvent(EVENTS.AUTH_LOGIN)}
                    className="p-2 rounded-full bg-white/5 text-white/55 hover:text-white hover:bg-white/10 transition-all"
                  >
                    <User size={20} />
                  </Link>
                )}
              </div>

              <button
                onClick={() => setIsOpen(!isOpen)}
                aria-label={isOpen ? "Fermer le menu" : "Ouvrir le menu"}
                aria-expanded={isOpen}
                className="lg:hidden text-white p-2 hover:bg-white/5 rounded-full transition-colors active:scale-95"
              >
                {isOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>

          <div
            className={`lg:hidden flex flex-col gap-1 overflow-hidden transition-all duration-500 ease-in-out ${isOpen ? "max-h-150 opacity-100 mt-4 pb-2" : "max-h-0 opacity-0"}`}
          >
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() =>
                    trackEvent(EVENTS.NAV_CLICK, { page: link.href })
                  }
                  className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl text-sm font-bold transition-all duration-300 ${isActive ? "bg-naruto-orange/10 text-naruto-orange" : "text-zinc-400 hover:bg-white/5"}`}
                >
                  <span
                    className={
                      isActive ? "text-naruto-orange" : "text-zinc-500"
                    }
                  >
                    {link.icon}
                  </span>
                  {link.name}
                </Link>
              );
            })}
            <div className="mt-2 pt-2 border-t border-white/5">
              <UserMenu isMobile />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
