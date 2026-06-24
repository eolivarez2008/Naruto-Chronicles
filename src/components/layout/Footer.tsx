"use client";

import Link from "next/link";
import { Flame, ArrowRight, Map, Scale, Copyright, Github } from "lucide-react";

const FOOTER_LINKS = {
  navigation: [
    { name: "Accueil", href: "/" },
    { name: "Histoire", href: "/story" },
    { name: "Personnages", href: "/characters" },
    { name: "Vidéos", href: "/videos" },
    { name: "Tier List", href: "/tier-list" },
    { name: "Saga", href: "/saga" },
    { name: "Contact", href: "/contact" },
    { name: "Profil", href: "/profile" },
  ],
};

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-black/40 backdrop-blur-xl border-t border-white/10 pt-16 pb-12 px-6 mt-20">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
          {/* LOGO & DESCRIPTION */}
          <div className="md:col-span-5 flex flex-col items-center md:items-start text-center md:text-left space-y-6">
            <div className="space-y-4 flex flex-col items-center md:items-start">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-naruto-orange rounded-xl flex items-center justify-center shadow-lg shadow-naruto-orange/20 shrink-0">
                  <Flame size={20} className="text-white" />
                </div>
                <span className="text-white font-black tracking-tighter text-xl uppercase italic">
                  Naruto Chronicles
                </span>
              </div>
              <p className="text-white/40 text-[13px] leading-relaxed max-w-sm pt-2">
                L'encyclopédie ultime sur l'univers de Masashi Kishimoto.
                Explorez l'histoire, les personnages et créez vos propres Tier
                Lists de ninjas.
              </p>
            </div>

            <div className="flex items-center gap-2 text-white/20 pt-2">
              <Copyright size={14} />
              <span className="text-[10px] font-mono uppercase tracking-widest font-bold">
                2023-2026 — Développé par Emilien OLIVAREZ
              </span>
            </div>
          </div>

          {/* EXPLORER */}
          <div className="md:col-span-3 md:col-start-7 flex flex-col items-center md:items-start space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center shrink-0">
                <Map size={18} className="text-white/70" />
              </div>
              <h4 className="text-[11px] font-black text-white uppercase tracking-[0.2em]">
                Explorer
              </h4>
            </div>

            <nav>
              <ul className="space-y-2 flex flex-col items-center md:items-start">
                {FOOTER_LINKS.navigation.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="group flex items-center gap-2 text-[12px] text-white/40 hover:text-naruto-orange transition-all"
                    >
                      <ArrowRight
                        size={10}
                        className="hidden md:block opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all"
                      />
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          {/* LÉGAL / GITHUB */}
          <div className="md:col-span-3 flex flex-col items-center md:items-start space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center shrink-0">
                <Scale size={18} className="text-white/70" />
              </div>
              <h4 className="text-[11px] font-black text-white uppercase tracking-[0.2em]">
                Ressources
              </h4>
            </div>

            <div className="space-y-4 flex flex-col items-center md:items-start">
              <Link
                href="/legal"
                className="group flex items-center gap-2 text-[12px] text-white/40 hover:text-white transition-all"
              >
                Mentions Légales & CGU
              </Link>
              <a
                href="https://github.com/eolivarez2008/Naruto-Chronicles"
                target="_blank"
                className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs text-white transition-all"
              >
                <Github size={14} />
                Projet Open Source
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
