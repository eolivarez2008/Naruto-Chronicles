"use client";

import { useState, useEffect, useCallback, useId } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import type {
  TierRank,
  TierListCharacter,
  SaveTierListPayload,
} from "@/types/tierlist";
import { DEFAULT_TIERS } from "@/types/tierlist";
import TierRowComponent from "@/components/tier-list/TierRow";
import CharacterPool from "@/components/tier-list/CharacterPool";
import SafeImage from "@/components/ui/SafeImage";

interface EditorProps {
  mode: "create" | "edit";
  tierListId?: string;
  packId: string;
  initialData?: {
    title: string;
    isPublic: boolean;
    tiers: TierRank[];
  };
}

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

// ─── Modal confirmation suppression ──────────────────────────────────────────

function DeleteModal({
  onConfirm,
  onCancel,
  loading,
}: {
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onCancel}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative z-10 w-full max-w-sm rounded-2xl border border-white/10 bg-[#111] p-6 shadow-2xl"
      >
        <h2 className="text-base font-black text-white mb-2">
          Supprimer cette tier list ?
        </h2>
        <p className="text-sm text-white/40 mb-6">
          Cette action est irréversible. La tier list sera définitivement
          supprimée.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-2 rounded-xl text-sm font-semibold border border-white/10 text-white/50 hover:bg-white/5 transition-all cursor-pointer"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-2 rounded-xl text-sm font-bold bg-red-500/90 hover:bg-red-500 text-white transition-all cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading && (
              <div className="w-3.5 h-3.5 rounded-full border border-white border-t-transparent animate-spin" />
            )}
            Supprimer
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────

export default function TierListEditor({
  mode,
  tierListId,
  packId,
  initialData,
}: EditorProps) {
  const router = useRouter();
  const dndId = useId();

  const [title, setTitle] = useState(initialData?.title ?? "");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [tiers, setTiers] = useState<TierRank[]>(
    initialData?.tiers?.length
      ? initialData.tiers
      : DEFAULT_TIERS.map((t) => ({ ...t, id: uid() })),
  );

  const [pool, setPool] = useState<TierListCharacter[]>([]);
  const [poolLoading, setPoolLoading] = useState(true);
  const [poolTotal, setPoolTotal] = useState(0);
  const [activeChrId, setActiveChrId] = useState<number | null>(null);
  const [overTierId, setOverTierId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 8 },
    }),
  );

  const fetchPool = useCallback(async () => {
    setPoolLoading(true);
    try {
      const params = new URLSearchParams({
        pack: packId,
        page: "1",
        limit: "200",
      });
      const res = await fetch(`/api/tier-lists/characters?${params}`);
      const json = (await res.json()) as {
        data: TierListCharacter[];
        meta: { total: number };
      };

      let allChars = json.data;

      if (mode === "edit" && initialData?.tiers?.length) {
        const placedIds = [
          ...new Set(initialData.tiers.flatMap((t) => t.characterIds)),
        ];
        const fetchedIds = new Set(allChars.map((c) => c.id));
        const missingIds = placedIds.filter((id) => !fetchedIds.has(id));

        if (missingIds.length > 0) {
          const missingRes = await fetch(
            `/api/tier-lists/characters/by-ids?ids=${missingIds.join(",")}`,
          );
          if (missingRes.ok) {
            const missingJson = (await missingRes.json()) as {
              data: TierListCharacter[];
            };
            const existingIds = new Set(allChars.map((c) => c.id));
            allChars = [
              ...allChars,
              ...missingJson.data.filter((c) => !existingIds.has(c.id)),
            ];
          }
        }
      }

      setPool(allChars);
      setPoolTotal(json.meta.total);
    } finally {
      setPoolLoading(false);
    }
  }, [packId, mode, initialData?.tiers]);

  useEffect(() => {
    void fetchPool();
  }, [fetchPool]);

  const handleDragStart = (e: DragStartEvent) => {
    const id = String(e.active.id);
    const chrId = id.startsWith("pool-")
      ? parseInt(id.replace("pool-", ""))
      : parseInt(id.split(":")[1]);
    setActiveChrId(isNaN(chrId) ? null : chrId);
  };

  const handleDragOver = (e: DragOverEvent) => {
    const s = e.over?.id ? String(e.over.id) : null;
    setOverTierId(
      s
        ? (tiers.find((t) => t.id === s || s.startsWith(`${t.id}:`))?.id ??
            null)
        : null,
    );
  };

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    setActiveChrId(null);
    setOverTierId(null);
    if (!over) return;
    const aStr = String(active.id);
    const oStr = String(over.id);
    const chrId = aStr.startsWith("pool-")
      ? parseInt(aStr.replace("pool-", ""))
      : parseInt(aStr.split(":")[1]);
    if (isNaN(chrId)) return;
    const targetId =
      tiers.find((t) => t.id === oStr)?.id ??
      tiers.find((t) => oStr.startsWith(`${t.id}:`))?.id ??
      tiers.find((t) => t.characterIds.some((c) => `${t.id}:${c}` === oStr))
        ?.id;
    if (!targetId) return;
    const sourceId = tiers.find((t) => t.characterIds.includes(chrId))?.id;
    setTiers((prev) =>
      prev.map((tier) => {
        if (tier.id === sourceId && tier.id !== targetId)
          return {
            ...tier,
            characterIds: tier.characterIds.filter((id) => id !== chrId),
          };
        if (tier.id === targetId) {
          if (tier.characterIds.includes(chrId)) return tier;
          return { ...tier, characterIds: [...tier.characterIds, chrId] };
        }
        return tier;
      }),
    );
  };

  const removeFromTier = (tierId: string, chrId: number) =>
    setTiers((prev) =>
      prev.map((t) =>
        t.id === tierId
          ? { ...t, characterIds: t.characterIds.filter((id) => id !== chrId) }
          : t,
      ),
    );

  const addTier = () =>
    setTiers((prev) => [
      ...prev,
      { id: uid(), label: "?", color: "#6b7280", characterIds: [] },
    ]);

  const deleteTier = (id: string) =>
    setTiers((prev) => prev.filter((t) => t.id !== id));
  const updateTierLabel = (id: string, label: string) =>
    setTiers((prev) => prev.map((t) => (t.id === id ? { ...t, label } : t)));
  const updateTierColor = (id: string, color: string) =>
    setTiers((prev) => prev.map((t) => (t.id === id ? { ...t, color } : t)));

  const placedIds = new Set(tiers.flatMap((t) => t.characterIds));
  const charMap = new Map(pool.map((c) => [c.id, c]));
  const activeChar =
    activeChrId != null ? (charMap.get(activeChrId) ?? null) : null;

  const handleSave = async () => {
    if (!title.trim()) {
      setSaveError("Le titre est requis.");
      return;
    }
    setSaving(true);
    setSaveError(null);
    const normalizedTiers: TierRank[] = tiers.map((t) => ({
      ...t,
      characterIds: (Array.isArray(t.characterIds) ? t.characterIds : [])
        .map(Number)
        .filter((id) => Number.isInteger(id) && id > 0),
    }));
    const payload: SaveTierListPayload = {
      title: title.trim(),
      isPublic: true,
      packUsed: packId,
      tiers: normalizedTiers,
    };
    try {
      const url =
        mode === "edit" && tierListId
          ? `/api/tier-lists/${tierListId}`
          : "/api/tier-lists";
      const res = await fetch(url, {
        method: mode === "edit" ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as {
        id?: string;
        ok?: boolean;
        error?: string;
      };
      if (!res.ok) {
        setSaveError(data.error ?? "Erreur lors de la sauvegarde.");
        return;
      }
      router.push(`/tier-list/${mode === "edit" ? tierListId! : data.id!}`);
    } catch {
      setSaveError("Erreur réseau. Réessaie.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!tierListId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/tier-lists/${tierListId}`, {
        method: "DELETE",
      });
      if (res.ok) router.push("/tier-list");
    } catch {
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  return (
    <div className="w-full min-h-screen">
      {/* Barre top*/}
      <div className="border-b border-white/8 bg-black/92 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
          <input
            type="text"
            value={title}
            maxLength={100}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Titre de ta tier list…"
            className="flex-1 bg-transparent text-white font-bold text-sm focus:outline-none placeholder:text-white/20 min-w-0"
          />
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Annuler — create */}
            {mode === "create" && (
              <button
                onClick={() => router.push("/tier-list")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-white/40 hover:text-white border border-white/8 hover:bg-white/5 transition-all cursor-pointer"
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                <span className="hidden sm:inline">Annuler</span>
              </button>
            )}
            {/* Supprimer — edit */}
            {mode === "edit" && tierListId && (
              <button
                onClick={() => setShowDeleteModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-red-400/70 hover:text-red-400 border border-red-500/15 hover:border-red-500/30 hover:bg-red-500/5 transition-all cursor-pointer"
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                <span className="hidden sm:inline">Supprimer</span>
              </button>
            )}
            {/* Publier / Mettre à jour */}
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold bg-naruto-orange hover:bg-[#e65500] text-white transition-all cursor-pointer disabled:opacity-60"
            >
              {saving ? (
                <div className="w-3 h-3 rounded-full border border-white border-t-transparent animate-spin" />
              ) : (
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
              {mode === "edit" ? "Mettre à jour" : "Publier"}
            </button>
          </div>
        </div>
        {saveError && (
          <p className="text-center text-red-400 text-xs py-2 bg-red-950/30 border-t border-red-900/30">
            {saveError}
          </p>
        )}
      </div>

      <DndContext
        id={dndId}
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col lg:flex-row gap-6">
          <div className="flex-1 min-w-0">
            <div className="rounded-xl overflow-hidden border border-white/8 bg-naruto-surface">
              <div className="px-4 py-2 border-b border-white/6 flex items-center justify-between bg-naruto-surface">
                <h2 className="text-sm font-bold text-white truncate">
                  {title || "Tier List"}
                </h2>
                <span className="text-[10px] text-white/20 font-mono shrink-0">
                  naruto.eolivarez.site
                </span>
              </div>
              <div className="divide-y divide-white/5">
                {tiers.map((tier) => (
                  <TierRowComponent
                    key={tier.id}
                    tier={tier}
                    allCharacters={charMap}
                    isOver={overTierId === tier.id}
                    onRemoveCharacter={removeFromTier}
                    onLabelChange={updateTierLabel}
                    onColorChange={updateTierColor}
                    onDelete={deleteTier}
                  />
                ))}
              </div>
              {tiers.length === 0 && (
                <div className="p-10 text-center text-white/20 text-sm">
                  Aucun rang
                </div>
              )}
            </div>
            <button
              onClick={addTier}
              className="mt-3 w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-dashed border-white/8 text-white/20 hover:text-white/40 hover:border-white/15 text-xs transition-all cursor-pointer"
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Ajouter un rang
            </button>
          </div>

          <div className="w-full lg:w-72 xl:w-80 shrink-0">
            <CharacterPool
              pool={pool}
              placedIds={placedIds}
              loading={poolLoading}
              total={poolTotal}
            />
          </div>
        </div>

        <DragOverlay dropAnimation={{ duration: 150, easing: "ease" }}>
          {activeChar && (
            <div className="w-14 h-14 rounded-lg overflow-hidden border-2 border-naruto-orange shadow-2xl shadow-naruto-orange/30 opacity-95 rotate-2">
              <SafeImage
                src={activeChar.image}
                alt={activeChar.name}
                className="w-full h-full object-cover object-top"
                loading="eager"
              />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      <AnimatePresence>
        {showDeleteModal && (
          <DeleteModal
            onConfirm={handleDelete}
            onCancel={() => setShowDeleteModal(false)}
            loading={deleting}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
