// Typage du SDK Umami injecté via script
type UmamiInstance = {
  track: (eventName: string, eventData?: Record<string, unknown>) => void;
};

declare global {
  interface Window {
    umami?: UmamiInstance;
  }
}

// Wrapper sécurisé — no-op si Umami n'est pas chargé
export function trackEvent(
  eventName: string,
  eventData?: Record<string, unknown>,
): void {
  if (typeof window !== "undefined" && window.umami) {
    window.umami.track(eventName, eventData);
  }
}

// Événements prédéfinis pour cohérence du tracking
export const EVENTS = {
  // Navigation
  NAV_CLICK: "nav-click",

  // Personnages
  CHARACTER_OPEN: "character-modal-open",
  CHARACTER_SEARCH: "character-search",

  // Vidéos
  VIDEO_OPEN: "video-modal-open",
  VIDEO_LIKE: "video-like",
  VIDEO_SEARCH: "video-search",
  VIDEO_FILTER: "video-filter",

  // Contact
  CONTACT_SUBMIT: "contact-submit",

  // Auth
  AUTH_LOGIN: "auth-login",
  AUTH_LOGOUT: "auth-logout",
  AUTH_DELETE: "auth-account-delete",
} as const;
