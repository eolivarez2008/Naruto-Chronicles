// Délai configurable entre requêtes Jikan
export const JIKAN_DELAY_MS = 500;
const MAX_RETRY = 4;
const MAX_RETRY_WAIT = 30_000;

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Fetch avec backoff exponentiel sur 429
export async function fetchWithRetry(
  url: string,
  attempt = 0,
): Promise<Response> {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
      Accept: "application/json",
    },
  });

  if (res.status === 429 && attempt < MAX_RETRY) {
    const retryAfter = parseInt(res.headers.get("retry-after") ?? "0", 10);
    const wait = Math.min(
      retryAfter > 0 ? retryAfter * 1000 : 1_000 * 2 ** attempt,
      MAX_RETRY_WAIT,
    );

    console.warn(
      `⏳ 429 — attente ${wait / 1000}s (tentative ${attempt + 1}/${MAX_RETRY})`,
    );

    await sleep(wait);
    return fetchWithRetry(url, attempt + 1);
  }

  if (res.status === 403 && attempt < MAX_RETRY) {
    const wait = 1500 * (attempt + 1);
    console.warn(`⛔ 403 retry ${attempt + 1}/${MAX_RETRY}`);

    await sleep(wait);
    return fetchWithRetry(url, attempt + 1);
  }

  return res;
}

// Fetch JSON typé avec retry
export async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetchWithRetry(url);

  if (res.status === 403) {
    throw new Error(`Jikan 403 — accès temporairement bloqué — ${url}`);
  }

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} — ${url}`);
  }

  return res.json() as Promise<T>;
}

// Fetch JSON avec timeout — pour sources externes non-critiques
export async function fetchJsonSafe<T>(
  url: string,
  timeoutMs = 15_000,
): Promise<T | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) {
      console.warn(`⚠ HTTP ${res.status} — ${url}`);
      return null;
    }
    return (await res.json()) as T;
  } catch (err: unknown) {
    if (err instanceof Error && err.name === "AbortError") {
      console.warn(`⏱ Timeout (${timeoutMs / 1000}s) — ${url}`);
    } else {
      console.warn(`⚠ ${String(err)} — ${url}`);
    }
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// Normalisation de chaîne pour la recherche
export function normalizeString(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}
