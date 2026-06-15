type Umami = {
  track: (eventName: string, eventData?: Record<string, unknown>) => void;
};

declare global {
  interface Window {
    umami?: Umami;
  }
}

export const trackEvent = (
  eventName: string,
  eventData?: Record<string, unknown>,
) => {
  if (typeof window !== "undefined" && window.umami) {
    window.umami.track(eventName, eventData);
  }
};
