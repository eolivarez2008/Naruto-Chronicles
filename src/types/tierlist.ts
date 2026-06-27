import {
  Star,
  Sparkle,
  Sparkles,
  Crown,
  LucideIcon,
  SunDim,
  SunMedium,
  Sun,
} from "lucide-react";

// ─── Structure d'un rang ──────────────────────────────────────────────────────

export interface TierRank {
  id: string;
  label: string;
  color: string;
  characterIds: number[];
}

// ─── Rangs par défaut ─────────────────────────────────────────────────────────

export const DEFAULT_TIERS: TierRank[] = [
  { id: "s", label: "S", color: "#ef4444", characterIds: [] },
  { id: "a", label: "A", color: "#f97316", characterIds: [] },
  { id: "b", label: "B", color: "#eab308", characterIds: [] },
  { id: "c", label: "C", color: "#22c55e", characterIds: [] },
  { id: "d", label: "D", color: "#3b82f6", characterIds: [] },
  { id: "f", label: "F", color: "#8b5cf6", characterIds: [] },
];

// ─── Packs disponibles ────────────────────────────────────────────────────────

export interface TierListPack {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  filter: PackFilter;
}

export type PackFilter =
  | { type: "random"; count: number }
  | { type: "popular"; count: number }
  | { type: "kage" };

export const TIER_LIST_PACKS: TierListPack[] = [
  {
    id: "random10",
    label: "10 Aléatoires",
    description: "10 personnages tirés au sort rien que pour toi",
    icon: SunDim,
    filter: { type: "random", count: 10 },
  },
  {
    id: "random20",
    label: "20 Aléatoires",
    description: "20 personnages aléatoirement choisis",
    icon: SunMedium,
    filter: { type: "random", count: 20 },
  },
  {
    id: "random50",
    label: "50 Aléatoires",
    description: "50 personnages sélectionnés au hasard",
    icon: Sun,
    filter: { type: "random", count: 50 },
  },
  {
    id: "popular10",
    label: "Top 10 populaires",
    description: "Les 10 personnages préférés de la communauté",
    icon: Sparkle,
    filter: { type: "popular", count: 10 },
  },
  {
    id: "popular20",
    label: "Top 20 populaires",
    description: "Les 20 personnages les plus appéciés de la communauté",
    icon: Sparkles,
    filter: { type: "popular", count: 20 },
  },
  {
    id: "popular50",
    label: "Top 50 populaires",
    description: "Les 50 personnages les plus appéciés de la communauté",
    icon: Star,
    filter: { type: "popular", count: 50 },
  },
  {
    id: "kage",
    label: "Kage",
    description: "Tous les chefs de village ayant atteint le rang de Kage",
    icon: Crown,
    filter: { type: "kage" },
  },
];

// ─── Carte Tier List ──────────────────────────────────────────────────────────

export interface TierListCard {
  id: string;
  title: string;
  isPublic: boolean;
  packUsed: string;
  likesCount: number;
  hasLiked?: boolean;
  author: {
    id: string;
    name: string | null;
    image: string | null;
    avatarSnapshot: string | null;
  };
  createdAt: string;
  updatedAt: string;
}

// ─── Tier List complète ───────────────────────────────────────────────────────

export interface TierListFull extends TierListCard {
  tiers: TierRank[];
  characters: TierListCharacter[];
}

// ─── Personnage allégé pour l'éditeur ────────────────────────────────────────

export interface TierListCharacter {
  id: number;
  name: string;
  image: string | null;
  rank: string | null;
  natureType: string[];
  popularity: number;
}

// ─── Réponses API ─────────────────────────────────────────────────────────────

export interface TierListsApiResponse {
  data: TierListCard[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface TierListLikeResponse {
  liked: boolean;
  likesCount: number;
}

// ─── Payload sauvegarde ───────────────────────────────────────────────────────

export interface SaveTierListPayload {
  title: string;
  isPublic: boolean;
  packUsed: string;
  tiers: TierRank[];
}

// ─── Toolbar ─────────────────────────────────────────────────────

export type TierListSortOption = "popular" | "recent" | "old" | "az" | "za";

export const TIER_LIST_SORT_OPTIONS: {
  value: TierListSortOption;
  label: string;
}[] = [
  { value: "popular", label: "Populaire" },
  { value: "recent", label: "Récent" },
  { value: "old", label: "Ancien" },
  { value: "az", label: "A → Z" },
  { value: "za", label: "Z → A" },
];

export interface EditorInitialData {
  title: string;
  isPublic: boolean;
  tiers: TierRank[];
}

// ─── Props de l'éditeur ─────────────────────────────────────────────────────

export interface EditorProps {
  mode: "create" | "edit";
  tierListId?: string;
  packId: string;
  initialData?: EditorInitialData;
}
