import CharacterCard from "./CharacterCard";
import type { Character, CharacterType } from "@/types";

interface CharacterSectionProps {
  type: CharacterType;
  label: string;
  characters: Character[];
  delay?: number;
}

/**
 * Server Component — section titrée + grille de CharacterCards.
 */
export default function CharacterSection({
  label,
  characters,
  delay = 0,
}: CharacterSectionProps) {
  return (
    <section className="fade-in-up" style={{ animationDelay: `${delay}ms` }}>
      {/* Section header */}
      <div className="flex items-end gap-4 mb-6">
        <div>
          <h2
            className="text-2xl font-bold tracking-tight text-white"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            {label}
          </h2>
          <span className="accent-line w-12" />
        </div>
      </div>

      {/* Glass container */}
      <div className="rounded-2xl border border-white/8 bg-linear-to-b from-white/4 to-transparent backdrop-blur-md p-4">
        <div className="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(120px,1fr))]">
          {characters.map((char) => (
            <CharacterCard key={char.name} char={char} />
          ))}
        </div>
      </div>
    </section>
  );
}
