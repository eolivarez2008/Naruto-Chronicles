// ─── Character Card (grille) ──────────────────────────────────────────────────

export interface CharacterCard {
  id: number;
  name: string;
  image: string | null;
  rank: string | null;
  natureType: string[];
}

// ─── Character Detail (modal) ─────────────────────────────────────────────────

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

export const formatNatureName = (name: string) => {
  return name
    .replace(/\s*Release\s*/g, "")
    .replace(/\s*\(Affinity\)\s*/g, "")
    .trim();
};

// ─── API Response ─────────────────────────────────────────────────────────────

export interface CharactersApiResponse {
  data: CharacterCard[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ─── Nature Types ─────────────────────────────────────────────────────────────

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

export const NATURE_ICONS: Record<string, string> = {
  Fire: "🔥",
  Wind: "🌀",
  Lightning: "⚡",
  Earth: "🪨",
  Water: "💧",
  Wood: "🌿",
  Ice: "❄️",
  Lava: "🌋",
  Storm: "⛈️",
  Boil: "♨️",
  Magnet: "🧲",
  Yin: "☯️",
  Yang: "☯️",
  "Yin–Yang": "☯️",
};
