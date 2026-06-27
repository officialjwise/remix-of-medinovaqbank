/**
 * PUBLIC-SETTINGS domain — self-contained API module (unauthenticated).
 *
 * Wires the SAFE, read-only subset of system settings the frontend needs before
 * (and during) sign-in: maintenance mode + message, platform name/support email,
 * trial policy (days + question limit), and non-sensitive branding fields.
 *
 *   GET /settings/public  (Public — no auth) -> PublicSettings
 *
 * Secrets / catalog-sensitive settings are NEVER exposed on this path (enforced
 * server-side). Use this in place of the legacy `@/stores/settingsStore` mock
 * for maintenance/trial reads on the public + app shells.
 */
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/api/client";

// ── Backend wire shape (mirrors interfaces/settings.interface.ts PublicSettings). ──
export interface PublicSettings {
  maintenanceMode: boolean;
  maintenanceMessage: string;
  platformName: string;
  supportEmail: string;
  trialDays: number | null;
  trialQuestionLimit: number | null;
  /** Non-sensitive branding fields, keyed without the `branding.` prefix. */
  branding: Record<string, string>;
}

/**
 * GAP: the public endpoint does not surface the trial device-binding policy
 * (an admin-only setting). The app shell defaults device binding ON — the
 * historical default — until/unless a public flag is added server-side.
 */
export const DEFAULT_DEVICE_BINDING = true;

export const publicSettingsApi = {
  async get(): Promise<PublicSettings> {
    return apiClient.get<PublicSettings>("/settings/public");
  },
};

export const publicSettingsKeys = {
  all: ["public-settings"] as const,
};

/** Public, unauthenticated system settings (maintenance + trial policy + branding). */
export function usePublicSettings() {
  return useQuery({
    queryKey: publicSettingsKeys.all,
    queryFn: publicSettingsApi.get,
    // Short stale + poll so maintenance-mode (and branding) toggles take effect
    // for everyone within ~20s instead of lingering on a stale 60s cache.
    staleTime: 15_000,
    refetchInterval: 20_000,
  });
}
