/**
 * API-KEYS domain — self-contained API module (API keys + webhooks).
 *
 * Backend wire types + boundary mapper + endpoint functions + TanStack Query
 * hooks. Kept inside this file (not in the shared @/api/types|mappers) to avoid
 * cross-domain collisions, per project convention.
 *
 * Endpoints (all under /api/v1, super_admin only):
 *   GET    /admin/api-keys               — list (safe view: prefix only)
 *   POST   /admin/api-keys               — create (returns full key ONCE)
 *   POST   /admin/api-keys/:id/rotate    — rotate (returns NEW full key ONCE)
 *   DELETE /admin/api-keys/:id           — revoke (sets revokedAt)
 *   GET    /admin/webhooks               — list
 *   POST   /admin/webhooks               — create
 *   DELETE /admin/webhooks/:id           — delete
 *
 * IMPORTANT: the plaintext `key` is returned ONLY on create/rotate
 * (ApiKeyWithSecretResponseDto). It can never be retrieved again — the caller
 * must surface it in a one-time reveal. The list view only ever has `prefix`.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/api/client";

// ── Backend wire shapes (inside the envelope's `data`). ──
export interface BackendApiKey {
  id: string;
  name: string;
  prefix: string;
  scopes: string[];
  lastUsedAt: string | null;
  revokedAt: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

/** Create/rotate response — carries the plaintext key once. */
export interface BackendApiKeyWithSecret extends BackendApiKey {
  key: string;
}

export interface BackendWebhook {
  id: string;
  url: string;
  events: string[];
  secret: string;
  isActive: boolean;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

// ── Frontend domain shapes. ──
export interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  scopes: string[];
  lastUsedAt: string | null;
  revokedAt: string | null;
  /** Derived: a revoked key has revokedAt set. */
  isRevoked: boolean;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

/** Returned once on create/rotate — adds the plaintext key. */
export interface ApiKeyWithSecret extends ApiKey {
  key: string;
}

export interface Webhook {
  id: string;
  url: string;
  events: string[];
  secret: string;
  isActive: boolean;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

// ── Boundary mappers. ──
export function mapApiKey(k: BackendApiKey): ApiKey {
  return {
    id: k.id,
    name: k.name,
    prefix: k.prefix,
    scopes: k.scopes ?? [],
    lastUsedAt: k.lastUsedAt,
    revokedAt: k.revokedAt,
    isRevoked: k.revokedAt != null,
    createdById: k.createdById,
    createdAt: k.createdAt,
    updatedAt: k.updatedAt,
  };
}

export function mapApiKeyWithSecret(k: BackendApiKeyWithSecret): ApiKeyWithSecret {
  return { ...mapApiKey(k), key: k.key };
}

export function mapWebhook(w: BackendWebhook): Webhook {
  return {
    id: w.id,
    url: w.url,
    events: w.events ?? [],
    secret: w.secret,
    isActive: w.isActive,
    createdById: w.createdById,
    createdAt: w.createdAt,
    updatedAt: w.updatedAt,
  };
}

// ── Write payloads (mirror Create DTOs). ──
export interface ApiKeyCreateInput {
  name: string;
  scopes?: string[];
}

export interface WebhookCreateInput {
  url: string;
  events: string[];
  isActive?: boolean;
}

export const apiKeysApi = {
  async list(): Promise<ApiKey[]> {
    const data = await apiClient.get<BackendApiKey[]>("/admin/api-keys");
    return data.map(mapApiKey);
  },

  async create(input: ApiKeyCreateInput): Promise<ApiKeyWithSecret> {
    const data = await apiClient.post<BackendApiKeyWithSecret>("/admin/api-keys", input);
    return mapApiKeyWithSecret(data);
  },

  async rotate(id: string): Promise<ApiKeyWithSecret> {
    const data = await apiClient.post<BackendApiKeyWithSecret>(`/admin/api-keys/${id}/rotate`);
    return mapApiKeyWithSecret(data);
  },

  async revoke(id: string): Promise<ApiKey> {
    const data = await apiClient.delete<BackendApiKey>(`/admin/api-keys/${id}`);
    return mapApiKey(data);
  },

  async listWebhooks(): Promise<Webhook[]> {
    const data = await apiClient.get<BackendWebhook[]>("/admin/webhooks");
    return data.map(mapWebhook);
  },

  async createWebhook(input: WebhookCreateInput): Promise<Webhook> {
    const data = await apiClient.post<BackendWebhook>("/admin/webhooks", input);
    return mapWebhook(data);
  },

  async deleteWebhook(id: string): Promise<void> {
    await apiClient.delete<null>(`/admin/webhooks/${id}`);
  },
};

// ── Query keys ──
export const apiKeyKeys = {
  all: ["api-keys"] as const,
  keys: () => [...apiKeyKeys.all, "keys"] as const,
  webhooks: () => [...apiKeyKeys.all, "webhooks"] as const,
};

// ── Hooks ──
export function useApiKeys() {
  return useQuery({
    queryKey: apiKeyKeys.keys(),
    queryFn: () => apiKeysApi.list(),
    staleTime: 30_000,
  });
}

function useInvalidateKeys() {
  const qc = useQueryClient();
  return () => void qc.invalidateQueries({ queryKey: apiKeyKeys.keys() });
}

export function useCreateApiKey() {
  const invalidate = useInvalidateKeys();
  return useMutation({
    mutationFn: (input: ApiKeyCreateInput) => apiKeysApi.create(input),
    onSuccess: invalidate,
  });
}

export function useRotateApiKey() {
  const invalidate = useInvalidateKeys();
  return useMutation({
    mutationFn: (id: string) => apiKeysApi.rotate(id),
    onSuccess: invalidate,
  });
}

export function useRevokeApiKey() {
  const invalidate = useInvalidateKeys();
  return useMutation({
    mutationFn: (id: string) => apiKeysApi.revoke(id),
    onSuccess: invalidate,
  });
}

export function useWebhooks() {
  return useQuery({
    queryKey: apiKeyKeys.webhooks(),
    queryFn: () => apiKeysApi.listWebhooks(),
    staleTime: 30_000,
  });
}

function useInvalidateWebhooks() {
  const qc = useQueryClient();
  return () => void qc.invalidateQueries({ queryKey: apiKeyKeys.webhooks() });
}

export function useCreateWebhook() {
  const invalidate = useInvalidateWebhooks();
  return useMutation({
    mutationFn: (input: WebhookCreateInput) => apiKeysApi.createWebhook(input),
    onSuccess: invalidate,
  });
}

export function useDeleteWebhook() {
  const invalidate = useInvalidateWebhooks();
  return useMutation({
    mutationFn: (id: string) => apiKeysApi.deleteWebhook(id),
    onSuccess: invalidate,
  });
}
