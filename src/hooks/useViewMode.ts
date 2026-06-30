import { useEffect, useState } from "react";

/** Card-grid density modes shared across admin list pages. */
export type ViewMode = "list" | "grid" | "tiles" | "large";

const ALL: ViewMode[] = ["list", "grid", "tiles", "large"];
const storageKey = (key: string) => `medinovaq:viewmode:${key}`;

/**
 * Persisted per-page view-mode preference. `key` namespaces the choice so each
 * page remembers its own (localStorage). SSR-safe: falls back without touching
 * `window` on the server / in private mode.
 */
export function useViewMode(
  key: string,
  fallback: ViewMode = "grid",
): [ViewMode, (m: ViewMode) => void] {
  const [mode, setMode] = useState<ViewMode>(() => {
    if (typeof window === "undefined") return fallback;
    try {
      const stored = window.localStorage.getItem(storageKey(key));
      return ALL.includes(stored as ViewMode) ? (stored as ViewMode) : fallback;
    } catch {
      return fallback;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey(key), mode);
    } catch {
      /* ignore quota / disabled storage */
    }
  }, [key, mode]);

  return [mode, setMode];
}
