/**
 * SYSTEM-SETTINGS domain — self-contained API module (super_admin only).
 *
 * Backend is a flat key/value settings store driven by a catalog. Settings are
 * grouped by category; sensitive values are MASKED on read and only the real
 * value is returned on explicit, audited reveal. Secrets are NEVER persisted to
 * localStorage — they are fetched on demand and held in component state only.
 *
 * Wires (all under /api/v1, controller `admin/settings`):
 *   GET    /admin/settings                      — all settings grouped by category
 *   GET    /admin/settings/:category            — one category's resolved settings
 *   GET    /admin/settings/integrations/status  — per-integration configured flags
 *   PATCH  /admin/settings                       — bulk upsert { settings: [{key,value}] }
 *   POST   /admin/settings/reveal                — { key } -> { key, value } (decrypted)
 *   POST   /admin/settings/test/:integration     — connection test (reachability)
 *   POST   /admin/settings/ai/test-prompt        — run Gemini on a sample MCQ
 *
 * Backend wire types + hooks live HERE (not in @/api/types|mappers) to avoid
 * cross-domain collisions, per project convention.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { apiClient } from "@/api/client";

// ── Known setting categories (mirror SettingDefinition['category']). ──
export type SettingCategory =
  | "general"
  | "integration"
  | "email"
  | "trial"
  | "branding"
  | "protection";

export type SettingSource = "db" | "env" | "default" | "unset";

/** Integration names the backend exposes for status + connection tests. */
export type IntegrationName = "gemini" | "paystack" | "smtp" | "google" | "resend" | "storage";

// ── Backend wire shapes (interfaces/settings.interface.ts). ──

/** A single resolved setting (sensitive values arrive MASKED, never raw). */
export interface ResolvedSetting {
  key: string;
  category: string;
  value: string | null;
  isSensitive: boolean;
  isConfigured: boolean;
  source: SettingSource;
  label?: string;
}

export interface SettingsGroup {
  category: string;
  settings: ResolvedSetting[];
}

export interface IntegrationStatus {
  integration: string;
  configured: boolean;
  status: "configured" | "not_configured" | "error";
  detail?: string;
}

export interface ConnectionTestResult {
  integration: string;
  success: boolean;
  message: string;
}

/** Minimal clinical breakdown returned by the AI test prompt. */
export interface AiTestBreakdown {
  whyCorrect: string;
  whyOthersAreWrong: { label: string; reason: string }[];
  keyLearningPoint: string;
}

export interface AiTestPromptResult {
  integration: string;
  success: boolean;
  message: string;
  model: string | null;
  sampleQuestion: string;
  breakdown: AiTestBreakdown | null;
  errorCode?: "not_configured" | "request_failed" | "invalid_response";
}

export interface RevealedSecret {
  key: string;
  value: string | null;
}

// ── Write payload (mirrors UpdateSettingsDto). ──
export interface SettingUpdate {
  key: string;
  value: string;
}

/**
 * Flatten the grouped response into a `key -> ResolvedSetting` map — the shape
 * the admin forms consume (read masked value / source / configured flag by key).
 */
export function flattenSettings(groups: SettingsGroup[]): Record<string, ResolvedSetting> {
  const map: Record<string, ResolvedSetting> = {};
  for (const group of groups) {
    for (const s of group.settings) map[s.key] = s;
  }
  return map;
}

/** Convenience: read a setting's masked/plain value (or fallback) from the map. */
export function settingValue(
  map: Record<string, ResolvedSetting>,
  key: string,
  fallback = "",
): string {
  return map[key]?.value ?? fallback;
}

export function settingBool(map: Record<string, ResolvedSetting>, key: string): boolean {
  const v = map[key]?.value;
  return v === "true" || v === "1";
}

export const settingsApi = {
  /** All settings grouped by category (sensitive values masked). */
  async getAll(): Promise<SettingsGroup[]> {
    return apiClient.get<SettingsGroup[]>("/admin/settings");
  },

  async getCategory(category: SettingCategory | string): Promise<ResolvedSetting[]> {
    return apiClient.get<ResolvedSetting[]>(`/admin/settings/${category}`);
  },

  async integrationStatus(): Promise<IntegrationStatus[]> {
    return apiClient.get<IntegrationStatus[]>("/admin/settings/integrations/status");
  },

  /** Bulk upsert. Empty string clears a value; sensitive keys are re-encrypted server-side. */
  async update(settings: SettingUpdate[]): Promise<SettingsGroup[]> {
    return apiClient.patch<SettingsGroup[]>("/admin/settings", { settings });
  },

  /** Reveal one secret's decrypted value on demand (audited). NEVER cache to storage. */
  async reveal(key: string): Promise<RevealedSecret> {
    return apiClient.post<RevealedSecret>("/admin/settings/reveal", { key });
  },

  /** Run a live reachability test against one integration. */
  async testConnection(integration: IntegrationName): Promise<ConnectionTestResult> {
    return apiClient.post<ConnectionTestResult>(`/admin/settings/test/${integration}`);
  },

  /** Run the configured AI provider end-to-end against a sample MCQ. */
  async testPrompt(): Promise<AiTestPromptResult> {
    return apiClient.post<AiTestPromptResult>("/admin/settings/ai/test-prompt");
  },
};

// ── Query keys ──
export const settingsKeys = {
  all: ["settings"] as const,
  groups: () => [...settingsKeys.all, "groups"] as const,
  category: (category: string) => [...settingsKeys.all, "category", category] as const,
  integrationStatus: () => [...settingsKeys.all, "integration-status"] as const,
};

// ── Hooks ──

/** All settings grouped by category. */
export function useSettings() {
  return useQuery({
    queryKey: settingsKeys.groups(),
    queryFn: settingsApi.getAll,
    staleTime: 30_000,
  });
}

/** All settings flattened to a `key -> ResolvedSetting` map. */
export function useSettingsMap() {
  const query = useSettings();
  // Memoise on the query's data reference. Without this, flattenSettings would
  // return a NEW object every render, so each tab's `useEffect(…, [map])` that
  // seeds local form state from the server would re-run on every render and
  // revert whatever the admin types (fields appear "frozen"). React Query keeps
  // `query.data` referentially stable until it actually changes, so this makes
  // `map` stable and the form editable.
  const data = useMemo(() => (query.data ? flattenSettings(query.data) : undefined), [query.data]);
  return { ...query, data };
}

export function useIntegrationStatus() {
  return useQuery({
    queryKey: settingsKeys.integrationStatus(),
    queryFn: settingsApi.integrationStatus,
    staleTime: 30_000,
  });
}

function useInvalidateSettings() {
  const qc = useQueryClient();
  return () => {
    void qc.invalidateQueries({ queryKey: settingsKeys.all });
  };
}

/** Bulk save settings. */
export function useUpdateSettings() {
  const invalidate = useInvalidateSettings();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (settings: SettingUpdate[]) => settingsApi.update(settings),
    onSuccess: (groups) => {
      qc.setQueryData(settingsKeys.groups(), groups);
      invalidate();
    },
  });
}

/** Reveal one secret on demand. The value is returned to the caller only. */
export function useRevealSecret() {
  return useMutation({
    mutationFn: (key: string) => settingsApi.reveal(key),
  });
}

/** Test an integration connection (reachability ping). */
export function useTestIntegration() {
  return useMutation({
    mutationFn: (integration: IntegrationName) => settingsApi.testConnection(integration),
  });
}

/** Run the AI test prompt against the sample MCQ. */
export function useTestAiPrompt() {
  return useMutation({
    mutationFn: () => settingsApi.testPrompt(),
  });
}
