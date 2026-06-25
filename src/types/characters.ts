import {
  Flame,
  Wind,
  Zap,
  Mountain,
  Droplets,
  Leaf,
  Snowflake,
  MountainSnow,
  CloudLightning,
  ThermometerSnowflake,
  Magnet,
  CircleSlash,
  LucideIcon,
  Sun,
  Moon,
} from "lucide-react";

// ─── Carte personnage (grille) ────────────────────────────────────────────────

export interface CharacterCard {
  id: number;
  name: string;
  image: string | null;
  rank: string | null;
  natureType: string[];
  popularity: number;
}

// ─── Détail personnage (modal) ────────────────────────────────────────────────

export interface CharacterDetail {
  id: number;
  name: string;
  image: string | null;
  sex: string | null;
  birthdate: string | null;
  age: Record<string, string> | null;
  height: Record<string, string> | null;
  rank: Record<string, string> | null;
  natureType: string[];
  jutsu: string[];
  family: Record<string, string>;
  debut: {
    manga?: string;
    anime?: string;
    novel?: string;
    movie?: string;
    game?: string;
  };
}

// ─── Réponse API ──────────────────────────────────────────────────────────────

export interface CharactersApiResponse {
  data: CharacterCard[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ─── Helpers natures ──────────────────────────────────────────────────────────

export function formatNatureName(name: string): string {
  return name
    .replace(/\s*Release\s*/g, "")
    .replace(/\s*\(Affinity\)\s*/g, "")
    .trim();
}

export const NATURE_COLORS: Record<string, string> = {
  Fire: "#ef4444",
  Wind: "#22d3ee",
  Lightning: "#facc15",
  Earth: "#a78bfa",
  Water: "#3b82f6",
  Wood: "#4ade80",
  Ice: "#bae6fd",
  Lava: "#f97316",
  Storm: "#818cf8",
  Boil: "#fb923c",
  Magnet: "#fbbf24",
  Dust: "#e5e7eb",
  Yin: "#6b7280",
  Yang: "#f3f4f6",
  "Yin–Yang": "#9ca3af",
};

export const NATURE_ICONS: Record<string, LucideIcon> = {
  Fire: Flame,
  Wind: Wind,
  Lightning: Zap,
  Earth: Mountain,
  Water: Droplets,
  Wood: Leaf,
  Ice: Snowflake,
  Lava: MountainSnow,
  Storm: CloudLightning,
  Boil: ThermometerSnowflake,
  Magnet: Magnet,
  Yin: Moon,
  Yang: Sun,
  "Yin–Yang": CircleSlash,
};
