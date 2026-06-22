import type { Metadata } from "next";
import Image from "next/image";
import CharacterListClient from "@/components/character/CharacterListClient";

export const metadata: Metadata = {
  title: "Personnages",
  description:
    "Découvrez plus de 1000 personnages de l'univers Naruto — shinobi, bijuus, kages et bien plus.",
};

export default function CharactersPage() {
  return (
    <main className="min-h-screen bg-[#050505] text-white -mt-16">
      <div className="relative overflow-hidden" style={{ minHeight: "260px" }}>
        <div className="absolute inset-0">
          <Image
            src="https://github.com/sriniously/narutodb-website/blob/master/public/cards/characters.jpg?raw=true"
            alt=""
            fill
            className="object-cover object-center"
            priority
            unoptimized
          />
          <div className="absolute inset-0 backdrop-blur-sm" />
          <div className="absolute inset-0 bg-[#050505]/60" />
          <div className="absolute inset-x-0 bottom-0 h-17 bg-linear-to-t from-[#050505] to-transparent" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-30">
          <p className="text-orange-500 text-sm font-bold uppercase tracking-[0.3em] mb-3">
            Encyclopédie
          </p>
          <h1 className="text-4xl sm:text-5xl font-black text-white leading-none mb-4">
            Personnages
          </h1>
          <p className="text-white/70 text-md max-w-xl leading-relaxed">
            L&apos;intégralité des shinobi, bijuus, kages et figures de
            l&apos;univers Naruto. Cliquez sur un personnage pour découvrir ses
            détails.
          </p>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <CharacterListClient />
      </div>
    </main>
  );
}
