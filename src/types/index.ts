// ─── Character / Image types ──────────────────────────────────────────────────

export type CharacterType = "personnages" | "invocations" | "demons";

export interface Character {
  name: string;
  url: string;
  type: CharacterType;
}

// ─── Saga types ───────────────────────────────────────────────────────────────

export interface Saga {
  id: string;
  title: string;
  shortTitle?: string;
  description: string;
  image: string;
  imageAlt: string;
  externalUrl: string;
  umamiSaga: string;
  underlineWidth: string;
}

// ─── Navigation types ─────────────────────────────────────────────────────────

export interface NavLink {
  label: string;
  href: string;
  umamiPage: string;
}
