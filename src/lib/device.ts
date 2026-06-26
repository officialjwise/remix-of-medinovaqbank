/**
 * Stable per-browser device fingerprint sent as `X-Device-Fingerprint` on every
 * request so the backend can bind trial accounts to a device. It is an opaque,
 * stable string (the backend re-hashes it server-side) derived from coarse,
 * non-PII signals and cached in localStorage so it survives reloads.
 *
 * SSR-safe: returns null on the server (no navigator/crypto/localStorage there);
 * authenticated/device-bound requests run in the browser.
 */

const FP_KEY = "medinova_device_fp";
let cached: string | null = null;

export function isBrowser(): boolean {
  return typeof window !== "undefined";
}

/** Compute (once) and cache the fingerprint. Null on the server. */
export async function getDeviceFingerprint(): Promise<string | null> {
  if (!isBrowser()) return null;
  if (cached) return cached;

  const stored = localStorage.getItem(FP_KEY);
  if (stored) {
    cached = stored;
    return stored;
  }

  const components = [
    navigator.userAgent,
    navigator.language,
    window.screen.colorDepth,
    `${window.screen.width}x${window.screen.height}`,
    new Date().getTimezoneOffset(),
  ];
  const data = new TextEncoder().encode(components.join("||"));
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashHex = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  cached = hashHex.slice(0, 16);
  localStorage.setItem(FP_KEY, cached);
  return cached;
}

/** Synchronous best-effort read (module cache → localStorage). Null if not yet computed. */
export function getCachedFingerprint(): string | null {
  if (cached) return cached;
  if (!isBrowser()) return null;
  cached = localStorage.getItem(FP_KEY);
  return cached;
}
