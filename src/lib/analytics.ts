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

  // Tier Lists
  TIERLIST_CREATE_OPEN: "tierlist-create-modal-open",
  TIERLIST_PACK_SELECT: "tierlist-pack-select",
  TIERLIST_CREATE: "tierlist-create",
  TIERLIST_EDIT: "tierlist-edit",
  TIERLIST_DELETE: "tierlist-delete",
  TIERLIST_LIKE: "tierlist-like",
  TIERLIST_SHARE: "tierlist-share",
  TIERLIST_FILTER: "tierlist-filter",
  TIERLIST_SORT: "tierlist-sort",
  TIERLIST_SEARCH: "tierlist-search",
  TIERLIST_TAB_SWITCH: "tierlist-tab-switch",

  // Story
  STORY_ARC_OPEN: "story-arc-open",
  STORY_LANG_TOGGLE: "story-lang-toggle",
  STORY_FILTER: "story-filter",
  STORY_SORT: "story-sort",
  STORY_SEARCH: "story-search",
  STORY_NAV_PREV: "story-nav-prev",
  STORY_NAV_NEXT: "story-nav-next",

  // Saga
  SAGA_VIEW: "saga-view",

  // Contact
  CONTACT_SUBMIT: "contact-submit",

  // Auth
  AUTH_LOGIN: "auth-login",
  AUTH_LOGOUT: "auth-logout",
  AUTH_DELETE: "auth-account-delete",
  AUTH_CONSENT_ACCEPT: "auth-consent-accept",
  AUTH_CONSENT_REFUSE: "auth-consent-refuse",

  // Profile
  PROFILE_TAB_SWITCH: "profile-tab-switch",
  PROFILE_VIDEO_CLICK: "profile-video-click",

  // Footer
  FOOTER_LINK_CLICK: "footer-link-click",
  FOOTER_GITHUB_CLICK: "footer-github-click",
} as const;
