"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import TierListCardItem from "@/components/tier-list/TierListCard";
import BaseModal from "@/components/ui/BaseModal";
import PageHero from "@/components/ui/PageHero";
import type { TierListCard, TierListsApiResponse } from "@/types/tierlist";
import { TIER_LIST_PACKS } from "@/types/tierlist";
import type { TierListSortOption } from "@/types/tierlist";
import { TIER_LIST_SORT_OPTIONS } from "@/types/tierlist";
import {
  Plus,
  Globe,
  User,
  Pencil,
  List,
  Heart,
  Lock,
  Check,
} from "lucide-react";
import FilterToolbar from "@/components/ui/FilterToolbar";
import type { FilterOption } from "@/components/ui/FilterToolbar";
import { trackEvent, EVENTS } from "@/lib/analytics";

type Tab = "mes-listes" | "decouvrir";

interface Props {
  myCreatedLists: Array<TierListCard & { tiersData: string }>;
  myLikedLists: Array<TierListCard & { tiersData: string }>;
  isLoggedIn: boolean;
}

function getPackColor(packId: string): string {
  const pack = TIER_LIST_PACKS.find((item) => item.id === packId);
  if (!pack) return "#ffffff";
  switch (pack.filter.type) {
    case "random":
      return "#d97706";
    case "popular":
      return "#8b5cf6";
    case "kage":
      return "#06b6d4";
    default:
      return "#ffffff";
  }
}

function CreateModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);
  const selectedPack = TIER_LIST_PACKS.find((p) => p.id === selected);

  const handleCreate = () => {
    if (!selected) return;
    trackEvent(EVENTS.TIERLIST_CREATE_OPEN, { pack: selected });
    router.push(`/tier-list/new?pack=${selected}`);
    onClose();
  };

  const handlePackSelect = (packId: string) => {
    setSelected(packId);
    trackEvent(EVENTS.TIERLIST_PACK_SELECT, { pack: packId });
  };

  return (
    <BaseModal
      isOpen
      onClose={onClose}
      maxWidth="sm:max-w-xl"
      ariaLabel="Créer une nouvelle tier list"
    >
      <div className="flex flex-col">
        <div className="px-5 py-4 border-b border-white/6 shrink-0">
          <h2 className="text-base font-black text-naruto-orange">
            Nouvelle Tier List
          </h2>
          <p className="text-xs text-white/35 mt-0.5">
            Choisis un pack de personnages
          </p>
        </div>
        <div className="p-4 overflow-y-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {TIER_LIST_PACKS.map((pack) => {
              const isSelected = selected === pack.id;
              const Icon = pack.icon;
              return (
                <motion.button
                  key={pack.id}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handlePackSelect(pack.id)}
                  className={[
                    "relative flex flex-col items-start gap-2 p-3.5 rounded-xl border text-left transition-all duration-150 cursor-pointer",
                    isSelected
                      ? "border-naruto-orange/50 bg-naruto-orange/8"
                      : "border-white/7 bg-white/3 hover:border-white/12 hover:bg-white/5",
                  ].join(" ")}
                >
                  <Icon className="w-5 h-5 text-naruto-orange" />
                  <div>
                    <p
                      className={`text-xs font-bold leading-tight transition-colors ${isSelected ? "text-naruto-orange" : "text-white/80"}`}
                    >
                      {pack.label}
                    </p>
                    <p className="text-[10px] text-white/30 leading-tight mt-0.5 line-clamp-2">
                      {pack.description}
                    </p>
                  </div>
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-2 right-2 w-4 h-4 rounded-full bg-naruto-orange flex items-center justify-center shadow-lg shadow-naruto-orange/20"
                    >
                      <Check size={14} />
                    </motion.div>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>
        <div className="px-4 py-3 border-t border-white/6 shrink-0 flex items-center justify-between gap-3">
          <AnimatePresence mode="wait">
            {selectedPack ? (
              <motion.p
                key={selectedPack.id}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="text-xs text-white/40 flex items-center gap-1.5 flex-1 min-w-0"
              >
                {(() => {
                  const SelectedIcon = selectedPack.icon;
                  return (
                    <SelectedIcon className="w-4 h-4 shrink-0 text-naruto-orange" />
                  );
                })()}
                <span className="truncate">{selectedPack.description}</span>
              </motion.p>
            ) : (
              <p className="text-xs text-white/25">
                Sélectionne un pack pour continuer
              </p>
            )}
          </AnimatePresence>
          <button
            onClick={handleCreate}
            disabled={!selected}
            className={[
              "flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all shrink-0",
              selected
                ? "bg-naruto-orange hover:bg-[#e65500] text-white cursor-pointer"
                : "bg-white/5 text-white/20 cursor-not-allowed",
            ].join(" ")}
          >
            <Plus size={16} />
            Créer
          </button>
        </div>
      </div>
    </BaseModal>
  );
}

function DiscoverSection() {
  const [lists, setLists] = useState<
    Array<TierListCard & { tiersData?: string }>
  >([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [sort, setSort] = useState<TierListSortOption>("popular");
  const [pack, setPack] = useState<string>("all");
  const [searchRaw, setSearchRaw] = useState("");
  const sentinelRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const packFilterOptions: FilterOption[] = [
    { id: "all", label: "Tous les packs" },
    ...TIER_LIST_PACKS.map((p) => ({
      id: p.id,
      label: p.label,
      icon: p.icon,
      color: getPackColor(p.id),
    })),
  ];

  const fetchPage = useCallback(
    async (
      pageNum: number,
      currentSort: TierListSortOption,
      currentSearch: string,
      currentPack: string,
      reset = false,
    ) => {
      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const params = new URLSearchParams({
          page: String(pageNum),
          limit: "12",
          sort: currentSort,
          ...(currentSearch.trim() && { search: currentSearch.trim() }),
          ...(currentPack !== "all" && { pack: currentPack }),
        });
        const res = await fetch(`/api/tier-lists?${params}`, {
          signal: controller.signal,
        });
        const json = (await res.json()) as TierListsApiResponse;
        setLists((prev) =>
          reset || pageNum === 1 ? json.data : [...prev, ...json.data],
        );
        setTotal(json.meta.total);
        setHasMore(pageNum < json.meta.totalPages);
        setPage(pageNum);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [],
  );

  useEffect(() => {
    setLoading(true);
    const delay = searchRaw ? 400 : 0;
    const t = setTimeout(() => {
      void fetchPage(1, sort, searchRaw, pack, true);
    }, delay);
    return () => clearTimeout(t);
  }, [sort, pack, searchRaw, fetchPage]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && hasMore && !loadingMore)
          void fetchPage(page + 1, sort, searchRaw, pack);
      },
      { rootMargin: "300px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [fetchPage, hasMore, loadingMore, page, sort, searchRaw, pack]);

  const handleLike = (id: string, liked: boolean, newCount: number) => {
    setLists((prev) =>
      prev.map((l) =>
        l.id === id ? { ...l, hasLiked: liked, likesCount: newCount } : l,
      ),
    );
  };

  const handleSortChange = (v: string) => {
    setSort(v as TierListSortOption);
    trackEvent(EVENTS.TIERLIST_SORT, { sort: v });
  };

  const handlePackChange = (v: string) => {
    setPack(v);
    trackEvent(EVENTS.TIERLIST_FILTER, { pack: v });
  };

  const handleSearchChange = (v: string) => {
    setSearchRaw(v);
    if (v.length > 2) trackEvent(EVENTS.TIERLIST_SEARCH, { query: v });
  };

  return (
    <div>
      <FilterToolbar
        searchValue={searchRaw}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Rechercher une tier list…"
        sortOptions={TIER_LIST_SORT_OPTIONS}
        sortValue={sort}
        onSortChange={handleSortChange}
        filterOptions={packFilterOptions}
        filterValue={pack}
        onFilterChange={handlePackChange}
      />
      {loading && lists.length === 0 ? (
        <GridSkeleton />
      ) : lists.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-center">
          <List size={48} className="mb-3 text-white/20" />
          <p className="text-white/30 text-sm">
            {searchRaw
              ? `Aucune tier list pour "${searchRaw}"`
              : "Aucune tier list publique"}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            <AnimatePresence mode="popLayout" initial={false}>
              {lists.map((l, i) => (
                <TierListCardItem
                  key={l.id}
                  list={l as TierListCard & { tiersData: string }}
                  index={i}
                  onLikeToggle={handleLike}
                />
              ))}
            </AnimatePresence>
          </div>
          <div ref={sentinelRef} className="h-2 mt-4" />
          {loadingMore && (
            <div className="flex justify-center py-6">
              <div className="w-7 h-7 rounded-full border-2 border-naruto-orange border-t-transparent animate-spin" />
            </div>
          )}
        </>
      )}
    </div>
  );
}

function MyListsSection({
  createdLists,
  likedLists,
  isLoggedIn,
  onShowCreate,
}: {
  createdLists: Array<TierListCard & { tiersData: string }>;
  likedLists: Array<TierListCard & { tiersData: string }>;
  isLoggedIn: boolean;
  onShowCreate: () => void;
}) {
  const [subTab, setSubTab] = useState<"creees" | "likees">("creees");
  const [createdLocal, setCreatedLocal] = useState(createdLists);
  const [likedLocal, setLikedLocal] = useState(likedLists);

  const handleLike = (id: string, liked: boolean, count: number) => {
    setCreatedLocal((prev) =>
      prev.map((l) =>
        l.id === id ? { ...l, hasLiked: liked, likesCount: count } : l,
      ),
    );
    setLikedLocal((prev) => {
      const exists = prev.some((l) => l.id === id);
      if (!exists) {
        if (liked) {
          const fromCreated = createdLocal.find((l) => l.id === id);
          if (fromCreated)
            return [
              { ...fromCreated, hasLiked: true, likesCount: count },
              ...prev,
            ];
        }
        return prev;
      }
      if (!liked) return prev.filter((l) => l.id !== id);
      return prev.map((l) =>
        l.id === id ? { ...l, hasLiked: liked, likesCount: count } : l,
      );
    });
  };

  const handleSubTabChange = (tab: "creees" | "likees") => {
    setSubTab(tab);
    trackEvent(EVENTS.TIERLIST_TAB_SWITCH, { tab });
  };

  if (!isLoggedIn) {
    return (
      <div className="flex flex-col items-center py-24 text-center">
        <Lock size={40} className="mb-3 text-white/20" />
        <p className="text-white/50 text-base font-semibold mb-2">
          Connecte-toi pour voir tes tier lists
        </p>
        <p className="text-white/25 text-sm mb-6">
          Crée un compte gratuit pour sauvegarder et partager tes classements.
        </p>
        <Link
          href="/profile"
          className="px-6 py-2.5 rounded-xl font-bold text-sm bg-naruto-orange hover:bg-[#e65500] text-white transition-all"
        >
          Se connecter
        </Link>
      </div>
    );
  }

  const current = subTab === "creees" ? createdLocal : likedLocal;

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <div className="flex gap-1 bg-white/4 rounded-xl p-1">
          {[
            {
              id: "creees" as const,
              label: "Créées",
              count: createdLocal.length,
            },
            {
              id: "likees" as const,
              label: "Likées",
              count: likedLocal.length,
            },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => handleSubTabChange(t.id)}
              className={[
                "flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                subTab === t.id
                  ? "bg-white/10 text-white"
                  : "text-white/40 hover:text-white/65",
              ].join(" ")}
            >
              {t.label}
              {t.count > 0 && (
                <span
                  className={[
                    "px-1.5 py-0.5 rounded-full text-[10px] font-bold",
                    subTab === t.id
                      ? "bg-naruto-orange/20 text-naruto-orange"
                      : "bg-white/8 text-white/30",
                  ].join(" ")}
                >
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {current.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-center">
          <div className="mb-4 text-white/20">
            {subTab === "creees" ? <List size={48} /> : <Heart size={48} />}
          </div>
          <p className="text-white/40 text-sm mb-2">
            {subTab === "creees"
              ? "Tu n'as pas encore de tier list"
              : "Tu n'as pas encore liké de tier list"}
          </p>
          {subTab === "creees" && (
            <button
              onClick={onShowCreate}
              className="mt-4 px-6 py-2.5 rounded-xl font-bold text-sm bg-naruto-orange hover:bg-[#e65500] text-white transition-all cursor-pointer"
            >
              Créer ma première tier list
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {current.map((l, i) => (
            <div key={l.id} className="relative group">
              <TierListCardItem list={l} index={i} onLikeToggle={handleLike} />
              {subTab === "creees" && (
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <Link
                    href={`/tier-list/${l.id}/edit`}
                    onClick={() =>
                      trackEvent(EVENTS.TIERLIST_EDIT, { tierListId: l.id })
                    }
                    className="w-7 h-7 rounded-full bg-black/80 backdrop-blur border border-white/15 flex items-center justify-center text-white/60 hover:text-white transition-colors"
                    title="Modifier"
                  >
                    <Pencil size={12} />
                  </Link>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl bg-white/3 overflow-hidden animate-pulse"
        >
          <div className="h-36 bg-white/4" />
          <div className="p-3 flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-white/8" />
            <div className="flex-1 space-y-1">
              <div className="h-2.5 bg-white/8 rounded w-3/4" />
              <div className="h-2 bg-white/5 rounded w-1/2" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function TierListHomeClient({
  myCreatedLists: initialMyCreatedLists,
  myLikedLists: initialMyLikedLists,
  isLoggedIn,
}: Props) {
  const [tab, setTab] = useState<Tab>("decouvrir");
  const [showCreate, setShowCreate] = useState(false);

  const TABS: Array<{ id: Tab; label: string; icon: React.ElementType }> = [
    { id: "mes-listes", label: "Mes Listes", icon: User },
    { id: "decouvrir", label: "Découvrir", icon: Globe },
  ];

  const handleTabChange = (id: Tab) => {
    setTab(id);
    trackEvent(EVENTS.TIERLIST_TAB_SWITCH, { tab: id });
  };

  const handleShowCreate = () => {
    setShowCreate(true);
    trackEvent(EVENTS.TIERLIST_CREATE_OPEN);
  };

  const createButton = isLoggedIn ? (
    <button
      onClick={handleShowCreate}
      className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm bg-naruto-orange hover:bg-[#e65500] text-white transition-all hover:scale-105 shadow-[0_0_24px_rgba(255,102,0,0.25)] cursor-pointer shrink-0"
    >
      <Plus size={16} />
      Créer une Tier List
    </button>
  ) : (
    <Link
      href="/profile"
      className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm border border-naruto-orange/30 bg-naruto-orange/8 text-naruto-orange hover:bg-naruto-orange/15 transition-all shrink-0"
    >
      Connexion pour créer
    </Link>
  );

  return (
    <div className="w-full">
      <PageHero
        eyebrow="Communauté"
        title="Tier Lists"
        description="Classe les ninjas, partage tes opinions. Découvre les classements de la communauté ou crée le tien."
        action={createButton}
      />

        <div className="border-b border-white/6 mb-8">
          <div className="flex justify-center">
            {TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleTabChange(t.id)}
                  className={[
                    "relative flex items-center gap-2 px-4 sm:px-6 py-3 text-sm font-semibold transition-all cursor-pointer",
                    tab === t.id ? "text-white" : "text-white/40 hover:text-white/65",
                  ].join(" ")}
                >
                {(() => {
                  const Icon = t.icon;
                  return (
                    <Icon
                      className={`w-4 h-4 ${tab === t.id ? "text-naruto-orange" : ""}`}
                    />
                  );
                })()}
                <span>{t.label}</span>
                {tab === t.id && (
                  <motion.div
                    layoutId="tab-underline"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-naruto-orange rounded-full"
                  />
                )}
              </button>
            ))}
          </div>
        </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          {tab === "mes-listes" && (
            <motion.div
              key="mes-listes"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <MyListsSection
                createdLists={initialMyCreatedLists}
                likedLists={initialMyLikedLists}
                isLoggedIn={isLoggedIn}
                onShowCreate={handleShowCreate}
              />
            </motion.div>
          )}
          {tab === "decouvrir" && (
            <motion.div
              key="decouvrir"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <DiscoverSection />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showCreate && <CreateModal onClose={() => setShowCreate(false)} />}
      </AnimatePresence>
    </div>
  );
}
