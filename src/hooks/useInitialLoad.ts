import { useEffect, useState } from "react";

/**
 * Simulates the initial data-fetch window for a page so loading skeletons
 * (shimmer placeholders) are shown briefly on first paint.
 *
 * SSR-safe: returns `true` on the server and on the first client render, then
 * flips to `false` after `delayMs` — so the server HTML and the hydrated client
 * markup match (no hydration mismatch) before the real content fades in.
 */
export function useInitialLoad(delayMs = 700) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), delayMs);
    return () => clearTimeout(t);
  }, [delayMs]);

  return loading;
}
