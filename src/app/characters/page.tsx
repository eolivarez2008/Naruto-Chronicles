import type { Metadata } from "next";
import PageHero from "@/components/ui/PageHero";
import CharacterListClient from "@/components/character/CharacterListClient";

export const metadata: Metadata = {
  title: "Personnages",
  description:
    "Découvrez plus de 1000 personnages de l'univers Naruto — shinobi, bijuus, kages et bien plus.",
};

export default function CharactersPage() {
  return (
    <main className="min-h-screen bg-[#050505] text-white -mt-16 pt-16">
      <PageHero
        eyebrow="Encyclopédie"
        title="Personnages"
        description="L'intégralité des shinobi, bijuus, kages et figures de l'univers Naruto. Cliquez sur un personnage pour découvrir ses détails."
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <CharacterListClient />
      </div>
    </main>
  );
}
