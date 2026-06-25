"use client";

import { useState, useRef } from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { TierRank, TierListCharacter } from "@/types/tierlist";
import SafeImage from "@/components/ui/SafeImage";
import { X, Trash2, Pencil } from "lucide-react";

function SortableChar({
  chrId,
  tierId,
  character,
  onRemove,
}: {
  chrId: number;
  tierId: string;
  character?: TierListCharacter;
  onRemove: (tierId: string, chrId: number) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `${tierId}:${chrId}` });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
      }}
      {...attributes}
      {...listeners}
      className="group/card relative w-14 h-14 shrink-0 rounded-lg overflow-hidden border border-white/8 cursor-grab active:cursor-grabbing select-none"
      title={character?.name}
    >
      <SafeImage
        src={character?.image}
        alt={character?.name ?? "?"}
        className="w-full h-full object-cover object-top pointer-events-none"
      />
      <div className="absolute inset-0 bg-black/0 group-hover/card:bg-black/55 transition-colors flex items-center justify-center">
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onRemove(tierId, chrId);
          }}
          className="opacity-0 group-hover/card:opacity-100 transition-opacity cursor-pointer p-1 rounded-full bg-white/10 hover:bg-red-500/30"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}

interface TierRowProps {
  tier: TierRank;
  allCharacters: Map<number, TierListCharacter>;
  isOver: boolean;
  onRemoveCharacter: (tierId: string, chrId: number) => void;
  onLabelChange: (tierId: string, label: string) => void;
  onColorChange: (tierId: string, color: string) => void;
  onDelete: (tierId: string) => void;
}

export default function TierRowComponent({
  tier,
  allCharacters,
  isOver,
  onRemoveCharacter,
  onLabelChange,
  onColorChange,
  onDelete,
}: TierRowProps) {
  const [editingLabel, setEditingLabel] = useState(false);
  const [labelVal, setLabelVal] = useState(tier.label);
  const labelRef = useRef<HTMLInputElement>(null);
  const colorRef = useRef<HTMLInputElement>(null);
  const { setNodeRef, isOver: dndIsOver } = useDroppable({ id: tier.id });
  const highlighted = isOver || dndIsOver;

  const commitLabel = () => {
    setEditingLabel(false);
    const t = labelVal.trim().slice(0, 4);
    if (t) onLabelChange(tier.id, t);
    else setLabelVal(tier.label);
  };

  return (
    <div
      className={[
        "flex items-stretch min-h-18 transition-colors",
        highlighted ? "bg-naruto-orange/4" : "",
      ].join(" ")}
    >
      {/* Label */}
      <div
        className="flex items-center justify-center shrink-0 w-16 select-none"
        style={{
          backgroundColor: `${tier.color}20`,
          borderRight: `3px solid ${tier.color}`,
        }}
      >
        {editingLabel ? (
          <input
            ref={labelRef}
            value={labelVal}
            autoFocus
            onChange={(e) => setLabelVal(e.target.value.slice(0, 4))}
            onBlur={commitLabel}
            onKeyDown={(e) => {
              if (e.key === "Enter") labelRef.current?.blur();
              if (e.key === "Escape") {
                setLabelVal(tier.label);
                setEditingLabel(false);
              }
            }}
            className="w-11 text-center font-black text-lg bg-transparent focus:outline-none"
            style={{ color: tier.color }}
          />
        ) : (
          <button
            onClick={() => {
              setEditingLabel(true);
              setLabelVal(tier.label);
            }}
            className="group/lbl flex flex-col items-center gap-0.5 cursor-pointer"
            title="Renommer"
          >
            <span
              className="font-black text-xl leading-none"
              style={{ color: tier.color }}
            >
              {tier.label}
            </span>
            <Pencil
              size={10}
              className="text-white/15 group-hover/lbl:text-white/40 transition-colors"
            />
          </button>
        )}
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={[
          "flex-1 flex flex-wrap gap-1.5 p-2 items-center content-center min-h-18",
          highlighted
            ? "outline-1 outline-dashed outline-naruto-orange/30 rounded-r"
            : "",
        ].join(" ")}
      >
        <SortableContext
          items={tier.characterIds.map((id) => `${tier.id}:${id}`)}
          strategy={horizontalListSortingStrategy}
        >
          {tier.characterIds.map((chrId) => (
            <SortableChar
              key={chrId}
              chrId={chrId}
              tierId={tier.id}
              character={allCharacters.get(chrId)}
              onRemove={onRemoveCharacter}
            />
          ))}
        </SortableContext>
        {tier.characterIds.length === 0 && (
          <p
            className={[
              "text-xs italic select-none px-2",
              highlighted ? "text-naruto-orange/40" : "text-white/12",
            ].join(" ")}
          >
            {highlighted ? "Déposer ici" : "Glisse des personnages ici"}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col items-center justify-center gap-1.5 px-2 shrink-0 border-l border-white/5">
        <button
          onClick={() => colorRef.current?.click()}
          className="w-5 h-5 rounded-full border-2 border-white/15 hover:border-white/35 transition-all cursor-pointer relative"
          style={{ backgroundColor: tier.color }}
          title="Couleur"
        >
          <input
            ref={colorRef}
            type="color"
            value={tier.color}
            onChange={(e) => onColorChange(tier.id, e.target.value)}
            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
          />
        </button>
        <button
          onClick={() => onDelete(tier.id)}
          className="w-5 h-5 rounded flex items-center justify-center text-white/15 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}
