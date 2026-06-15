import type { Metadata } from "next";
import { getCharacters } from "@/lib/getCharacters";
import CharacterSection from "@/components/character/CharacterSection";
import type { CharacterType } from "@/types";

export const metadata: Metadata = {
  title: "Personnages",
  description:
    "Tous les ninjas, invocations et démons à queues de l'univers Naruto.",
};

const SECTIONS: { type: CharacterType; label: string }[] = [
  { type: "personnages", label: "Ninja" },
  { type: "invocations", label: "Invocations" },
  { type: "demons", label: "Démons à queues" },
];

export default async function CharactersPage() {
  const all = await getCharacters();

  const grouped = SECTIONS.reduce<Record<CharacterType, typeof all>>(
    (acc, s) => {
      acc[s.type] = all.filter((c) => c.type === s.type);
      return acc;
    },
    { personnages: [], invocations: [], demons: [] },
  );

  return (
    <div className="w-full max-w-7xl mx-auto px-6 py-12 space-y-14">
      {SECTIONS.map((s, si) => (
        <CharacterSection
          key={s.type}
          type={s.type}
          label={s.label}
          characters={grouped[s.type]}
          delay={si * 120}
        />
      ))}
    </div>
  );
}
