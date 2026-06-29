"use client";

import { Info } from "lucide-react";
import type { ArcLang } from "@/lib/arcLang";

interface TranslationBannerProps {
  lang: ArcLang;
  hasFr: boolean;
  onToggle: (lang: ArcLang) => void;
}

export default function TranslationBanner({
  lang,
  hasFr,
  onToggle,
}: TranslationBannerProps) {
  if (!hasFr) return null;

  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3 rounded-xl bg-white/4 border border-white/8">
      <div className="flex items-center gap-3 min-w-0">
        <Info size={15} className="text-white/30 shrink-0" />

        <div className="text-white/40 leading-relaxed text-[11px] sm:text-xs">
          {lang === "fr" ? (
            <p>
              Ce contenu a été traduit automatiquement.
              <span className="block sm:inline">
                {" "}
                <button
                  onClick={() => onToggle("en")}
                  className="text-white/60 underline underline-offset-2 hover:text-white transition-colors cursor-pointer"
                >
                  Afficher l'original en anglais
                </button>{" "}
                ou{" "}
                <a
                  href="/contact"
                  className="text-white/60 underline underline-offset-2 hover:text-white transition-colors"
                >
                  signaler une erreur
                </a>
                .
              </span>
            </p>
          ) : (
            <p>
              Vous consultez la version originale en anglais.
              <span className="block sm:inline">
                {" "}
                <button
                  onClick={() => onToggle("fr")}
                  className="text-white/60 underline underline-offset-2 hover:text-white transition-colors cursor-pointer"
                >
                  Revenir à la traduction française
                </button>
                .
              </span>
            </p>
          )}
        </div>
      </div>

      <div className="flex p-1 rounded-lg bg-black/20 border border-white/5 shrink-0 h-fit">
        <button
          onClick={() => onToggle("fr")}
          className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
            lang === "fr"
              ? "bg-white/10 text-white shadow-sm"
              : "text-white/30 hover:text-white/50"
          }`}
        >
          FR
        </button>
        <button
          onClick={() => onToggle("en")}
          className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
            lang === "en"
              ? "bg-white/10 text-white shadow-sm"
              : "text-white/30 hover:text-white/50"
          }`}
        >
          EN
        </button>
      </div>
    </div>
  );
}
