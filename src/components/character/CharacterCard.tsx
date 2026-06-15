import Image from "next/image";
import type { Character } from "@/types";

interface CharacterCardProps {
  char: Character;
}

export default function CharacterCard({ char }: CharacterCardProps) {
  const name = char.name.replace(/\.[^/.]+$/, "");

  return (
    <div className="group flex flex-col items-center gap-2 p-2 rounded-xl border border-transparent hover:border-white/10 hover:bg-white/4 transition-all duration-200">
      <div className="relative w-full aspect-square max-w-27.5 overflow-hidden rounded-xl">
        <Image
          src={char.url}
          alt={name}
          fill
          sizes="110px"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        {/* Orange glow on hover */}
        <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-transparent group-hover:ring-[rgba(255,102,0,0.4)] transition-all duration-300" />
      </div>
      <p className="text-white/70 text-xs font-medium text-center leading-snug group-hover:text-white transition-colors line-clamp-2 max-w-27.5">
        {name}
      </p>
    </div>
  );
}
