"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import TierListCardItem from "@/components/tier-list/TierListCard";
import BaseModal from "@/components/ui/BaseModal";
import type { TierListCard, TierListsApiResponse } from "@/types/tierlist";
import { TIER_LIST_PACKS } from "@/types/tierlist";
import { Globe, User } from "lucide-react";

type Tab = "mes-listes" | "decouvrir";
type SortOption = "popular" | "recent" | "oldest" | "az" | "za";

interface Props {
  myCreatedLists: Array<TierListCard & { tiersData: string }>;
  myLikedLists: Array<TierListCard & { tiersData: string }>;
  isLoggedIn: boolean;
}

// ─── Modal création ───────────────────────────────────────────────────────────

function CreateModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);
  const selectedPack = TIER_LIST_PACKS.find((p) => p.id === selected);

  const handleCreate = () => {
    if (!selected) return;
    router.push(`/tier-list/new?pack=${selected}`);
    onClose();
  };

  return (
    <BaseModal isOpen onClose={onClose} maxWidth="sm:max-w-xl">
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
                  onClick={() => setSelected(pack.id)}
                  className={[
                    "relative flex flex-col items-start gap-2 p-3.5 rounded-xl border text-left transition-all duration-150 cursor-pointer",
                    isSelected
                      ? "border-naruto-orange/50 bg-naruto-orange/8"
                      : "border-white/7 bg-white/3 hover:border-white/12 hover:bg-white/5",
                  ].join(" ")}
                >
                  <Icon className={`w-5 h-5 text-naruto-orange`} />

                  <div>
                    <p
                      className={`text-xs font-bold leading-tight transition-colors ${
                        isSelected ? "text-naruto-orange" : "text-white/80"
                      }`}
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
                      <svg
                        className="w-2.5 h-2.5 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
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
            <svg
              className="w-4 h-4"
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
            Créer
          </button>
        </div>
      </div>
    </BaseModal>
  );
}

// ─── Section Découvrir ────────────────────────────────────────────────────────

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "popular", label: "Populaires" },
  { value: "recent", label: "Récentes" },
  { value: "oldest", label: "Anciennes" },
  { value: "az", label: "A → Z" },
  { value: "za", label: "Z → A" },
];

function DiscoverSection() {
  const [lists, setLists] = useState<
    Array<TierListCard & { tiersData?: string }>
  >([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [sort, setSort] = useState<SortOption>("popular");
  const [searchRaw, setSearchRaw] = useState("");
  const [isSortOpen, setIsSortOpen] = useState(false);
  const sortMenuRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const currentSortLabel =
    SORT_OPTIONS.find((s) => s.value === sort)?.label ?? "Trier";

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        sortMenuRef.current &&
        !sortMenuRef.current.contains(e.target as Node)
      ) {
        setIsSortOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const fetchPage = useCallback(
    async (
      pageNum: number,
      currentSort: SortOption,
      currentSearch: string,
      reset = false,
    ) => {
      if (pageNum === 1 || reset) setLoading(true);
      else setLoadingMore(true);
      try {
        const params = new URLSearchParams({
          page: String(pageNum),
          limit: "12",
          sort: currentSort,
          ...(currentSearch.trim() && { search: currentSearch.trim() }),
        });
        const res = await fetch(`/api/tier-lists?${params}`);
        const json = (await res.json()) as TierListsApiResponse;
        setLists((prev) =>
          reset || pageNum === 1 ? json.data : [...prev, ...json.data],
        );
        setTotal(json.meta.total);
        setHasMore(pageNum < json.meta.totalPages);
        setPage(pageNum);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [],
  );

  useEffect(() => {
    setLists([]);
    void fetchPage(1, sort, searchRaw, true);
  }, [sort, fetchPage]);

  useEffect(() => {
    const t = setTimeout(() => {
      setLists([]);
      void fetchPage(1, sort, searchRaw, true);
    }, 400);
    return () => clearTimeout(t);
  }, [searchRaw]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && hasMore && !loadingMore)
          void fetchPage(page + 1, sort, searchRaw);
      },
      { rootMargin: "300px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [fetchPage, hasMore, loadingMore, page, sort, searchRaw]);

  const handleLike = (id: string, liked: boolean, newCount: number) => {
    setLists((prev) =>
      prev.map((l) =>
        l.id === id ? { ...l, hasLiked: liked, likesCount: newCount } : l,
      ),
    );
  };

  return (
    <div>
      <div className="relative z-110 mb-8 flex flex-wrap gap-2 sm:gap-3 items-center bg-[#050505]/80 backdrop-blur-md px-3 sm:px-4 py-2.5 sm:py-3 rounded-2xl border border-white/10">
        {/* Recherche */}
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            value={searchRaw}
            onChange={(e) => setSearchRaw(e.target.value)}
            placeholder="Rechercher une tier list…"
            className="w-full bg-white/5 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-orange-500/40 transition-all"
          />
          {searchRaw && (
            <button
              onClick={() => setSearchRaw("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50 cursor-pointer"
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
            </button>
          )}
        </div>

        {/* Menu tri déroulant */}
        <div className="relative" ref={sortMenuRef}>
          <button
            onClick={() => setIsSortOpen((v) => !v)}
            className="flex items-center gap-2 bg-white/5 rounded-xl px-3 py-2 text-sm text-white/80 hover:bg-white/10 transition-all cursor-pointer whitespace-nowrap"
          >
            <svg
              className="w-4 h-4 text-white/50"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 7h18M6 12h12M9 17h6"
              />
            </svg>
            <span className="hidden sm:inline">{currentSortLabel}</span>
            <svg
              className={`w-3 h-3 text-white/30 transition-transform ${isSortOpen ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
          <AnimatePresence>
            {isSortOpen && (
              <motion.ul
                initial={{ opacity: 0, y: -6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.97 }}
                className="absolute top-full right-0 mt-2 w-40 bg-[#141414] border border-white/10 rounded-xl overflow-hidden shadow-xl z-20"
              >
                {SORT_OPTIONS.map((opt) => (
                  <li key={opt.value}>
                    <button
                      onClick={() => {
                        setSort(opt.value);
                        setIsSortOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-4 py-2.5 text-sm text-left transition-colors cursor-pointer ${
                        sort === opt.value
                          ? "text-naruto-orange bg-naruto-orange/10"
                          : "text-white/70 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      {opt.label}
                      {sort === opt.value && (
                        <svg
                          className="w-3.5 h-3.5"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </button>
                  </li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>
      </div>

      {total > 0 && (
        <p className="text-white/20 text-xs mb-4">
          {total.toLocaleString()} tier list{total > 1 ? "s" : ""}
        </p>
      )}

      {loading ? (
        <GridSkeleton />
      ) : lists.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-center">
          <p className="text-4xl mb-3">📊</p>
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

// ─── Section Mes Listes ───────────────────────────────────────────────────────

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

  // Source de vérité unifiée : un like mis à jour se reflète dans les deux onglets
  const handleLike = (id: string, liked: boolean, count: number) => {
    setCreatedLocal((prev) =>
      prev.map((l) =>
        l.id === id ? { ...l, hasLiked: liked, likesCount: count } : l,
      ),
    );
    setLikedLocal((prev) => {
      const exists = prev.some((l) => l.id === id);
      if (!exists) {
        // Like d'une liste créée → on l'ajoute dans likées
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
      // Unlike → on retire de likées
      if (!liked) return prev.filter((l) => l.id !== id);
      return prev.map((l) =>
        l.id === id ? { ...l, hasLiked: liked, likesCount: count } : l,
      );
    });
  };

  // Non connecté : message d'invitation
  if (!isLoggedIn) {
    return (
      <div className="flex flex-col items-center py-24 text-center">
        <p className="text-5xl mb-4">🔐</p>
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
              onClick={() => setSubTab(t.id)}
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
          <p className="text-5xl mb-4">{subTab === "creees" ? "📊" : "🤍"}</p>
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
                    className="w-7 h-7 rounded-full bg-black/80 backdrop-blur border border-white/15 flex items-center justify-center text-white/60 hover:text-white transition-colors"
                    title="Modifier"
                  >
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15.232 5.232l3.536 3.536M16.732 3.732a2.5 2.5 0 013.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                      />
                    </svg>
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

// ─── Squelette ────────────────────────────────────────────────────────────────

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

// ─── Composant principal ──────────────────────────────────────────────────────

export default function TierListHomeClient({
  myCreatedLists,
  myLikedLists,
  isLoggedIn,
}: Props) {
  const [tab, setTab] = useState<Tab>("decouvrir");
  const [showCreate, setShowCreate] = useState(false);

  const TABS: Array<{ id: Tab; label: string; icon: React.ElementType }> = [
    { id: "mes-listes", label: "Mes Listes", icon: User },
    { id: "decouvrir", label: "Découvrir", icon: Globe },
  ];

  return (
    <div className="w-full">
      {/* Hero */}
      <div
        className="relative border-b border-white/6 overflow-hidden"
        style={{
          background:
            "radial-gradient(ellipse 70% 80% at 50% -20%, rgba(255,102,0,0.09) 0%, transparent 70%)",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <p className="text-naruto-orange text-xs font-bold tracking-[0.3em] uppercase mb-2">
              Communauté
            </p>
            <h1 className="text-3xl sm:text-4xl font-black text-white leading-none">
              Tier Lists
            </h1>
            <div className="accent-line w-16" />
            <p className="text-white/40 text-sm">
              Classe les ninjas, partage tes opinions.
            </p>
          </div>

          {isLoggedIn ? (
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm bg-naruto-orange hover:bg-[#e65500] text-white transition-all hover:scale-105 shadow-[0_0_24px_rgba(255,102,0,0.25)] cursor-pointer shrink-0"
            >
              <svg
                className="w-4 h-4"
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
              Créer une Tier List
            </button>
          ) : (
            <Link
              href="/profile"
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm border border-naruto-orange/30 bg-naruto-orange/8 text-naruto-orange hover:bg-naruto-orange/15 transition-all shrink-0"
            >
              Connexion pour créer
            </Link>
          )}
        </div>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex border-b border-white/6">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={[
                  "relative flex items-center gap-2 px-4 sm:px-6 py-3 text-sm font-semibold transition-all cursor-pointer",
                  tab === t.id
                    ? "text-white"
                    : "text-white/40 hover:text-white/65",
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

                <span className="hidden sm:inline">{t.label}</span>

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
      </div>

      {/* Contenu */}
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
                createdLists={myCreatedLists}
                likedLists={myLikedLists}
                isLoggedIn={isLoggedIn}
                onShowCreate={() => setShowCreate(true)}
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
