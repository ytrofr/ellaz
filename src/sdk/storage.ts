import type { SaveStore } from "./types";

// localStorage-backed save store, namespaced per game id. Every access is
// try/catch-wrapped so Incognito / disabled storage never crashes a game
// (Poki/CrazyGames requirement + best-effort-enrichment rule).
export function createSaveStore(gameId: string): SaveStore {
  const prefix = `ellaz:${gameId}:`;
  return {
    get<T>(key: string, fallback: T): T {
      try {
        const raw = localStorage.getItem(prefix + key);
        return raw === null ? fallback : (JSON.parse(raw) as T);
      } catch {
        return fallback;
      }
    },
    set<T>(key: string, value: T): void {
      try {
        localStorage.setItem(prefix + key, JSON.stringify(value));
      } catch {
        /* storage unavailable — ignore */
      }
    },
    remove(key: string): void {
      try {
        localStorage.removeItem(prefix + key);
      } catch {
        /* ignore */
      }
    },
  };
}
