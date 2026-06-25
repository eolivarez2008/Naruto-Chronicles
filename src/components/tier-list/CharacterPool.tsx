"use client";

import { useDraggable } from "@dnd-kit/core";
import type { TierListCharacter } from "@/types/tierlist";
import SafeImage from "@/components/ui/SafeImage";
import { Leaf } from "lucide-react";

function DraggableCard({ character }: { character: TierListCharacter }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `pool-${character.id}`,
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      title={character.name}
      className={[
        "relative w-14 h-14 shrink-0 rounded-lg overflow-hidden border border-white/8 select-none",
        "cursor-grab active:cursor-grabbing transition-all duration-100",
        "hover:border-naruto-orange/35 hover:scale-105",
        isDragging ? "opacity-30 scale-95" : "",
      ].join(" ")}
    >
      <SafeImage
        src={character.image}
        alt={character.name}
        className="w-full h-full object-cover object-top pointer-events-none"
        loading="lazy"
      />
    </div>
  );
}

interface CharacterPoolProps {
  pool: TierListCharacter[];
  placedIds: Set<number>;
  loading: boolean;
  total: number;
}

export default function CharacterPool({
  pool,
  placedIds,
  loading,
  total,
}: CharacterPoolProps) {
  const available = pool.filter((c) => !placedIds.has(c.id));
  const placed = pool.filter((c) => placedIds.has(c.id));

  return (
    <div className="sticky top-6 flex flex-col max-h-[calc(100vh-6rem)] rounded-xl border border-white/8 bg-[#0d0d0d] overflow-hidden">
      {/* Header */}
      <div className="px-3 pt-3 pb-2 border-b border-white/6 shrink-0">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider">
            Personnages
          </span>
          <span className="text-[10px] text-white/20 font-mono">
            {available.length}/{total}
          </span>
        </div>
      </div>

      {/* Corps */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        {loading ? (
          <div className="flex flex-wrap gap-1 p-2">
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                className="w-14 h-14 rounded-lg bg-white/5 animate-pulse shrink-0"
              />
            ))}
          </div>
        ) : available.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center px-4">
            <Leaf size={48} className="mb-4 text-white/20" />
            <p className="text-white/25 text-xs">
              Tous les personnages sont placés !
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-1 p-2 content-start">
            {available.map((char) => (
              <DraggableCard key={char.id} character={char} />
            ))}
          </div>
        )}

        {/* Placés */}
        {placed.length > 0 && (
          <div className="border-t border-white/5 p-2">
            <p className="text-[9px] text-white/15 uppercase tracking-widest mb-1.5 px-1">
              Déjà placés
            </p>
            <div className="flex flex-wrap gap-1">
              {placed.map((char) => (
                <div
                  key={char.id}
                  className="relative w-14 h-14 shrink-0 rounded-lg overflow-hidden border border-white/4 opacity-30"
                  title={`${char.name} (placé)`}
                >
                  <SafeImage
                    src={char.image}
                    alt={char.name}
                    className="w-full h-full object-cover object-top grayscale pointer-events-none"
                  />
                  <div className="absolute inset-0 bg-black/40" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
