/**
 * FEATURE-CATALOG domain — self-contained API module.
 *
 * Wires (FeaturesController @ /admin/features, super_admin):
 *   - GET    /admin/features        (list — active catalog features)
 *   - POST   /admin/features        (create)
 *   - PATCH  /admin/features/:id    (update / toggle active)
 *   - DELETE /admin/features/:id    (deactivate)
 *
 * Backend wire types + boundary mappers live HERE (not in @/api/types /
 * @/api/mappers) to avoid cross-domain collisions, per project convention.
 *
 * The frontend `PlatformFeature` view model mirrors the legacy
 * `@/data/features` shape so existing UI call-sites need minimal adaptation.
 * Backend `FeatureType` ('boolean' | 'numeric_limit') is mapped to the
 * frontend literal union ('boolean' | 'limit') at the boundary, carrying BOTH
 * the feature `id` and `key`.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/api/client";

// ── Backend enum (mirror src/database/entities/enums.ts FeatureType). ──
export type BackendFeatureType = "boolean" | "numeric_limit";

// ── Backend wire shape (FeatureResponseDto). ──
export interface BackendFeature {
  id: string;
  key: string;
  name: string;
  description: string | null;
  type: BackendFeatureType;
  isActive: boolean;
  sortOrder: number;
}

// ── Frontend domain shape (mirrors @/data/features PlatformFeature). ──
export type FeatureType = "boolean" | "limit";

export interface PlatformFeature {
  /** DB id — present from the backend; carried so write/delete can target it. */
  id: string;
  key: string;
  name: string;
  description: string;
  type: FeatureType;
  isActive: boolean;
  sortOrder: number;
  /**
   * Default numeric value for `limit` features. The backend does not persist a
   * per-feature default, so this is a UI-only convenience (-1 = unlimited).
   */
  defaultLimit?: number;
}

const toFeFeatureType = (t: BackendFeatureType): FeatureType =>
  t === "numeric_limit" ? "limit" : "boolean";

const toBeFeatureType = (t: FeatureType): BackendFeatureType =>
  t === "limit" ? "numeric_limit" : "boolean";

/** Boundary mapper: backend → frontend domain. */
export function mapFeature(f: BackendFeature): PlatformFeature {
  const type = toFeFeatureType(f.type);
  return {
    id: f.id,
    key: f.key,
    name: f.name,
    description: f.description ?? "",
    type,
    isActive: f.isActive,
    sortOrder: f.sortOrder,
    defaultLimit: type === "limit" ? -1 : undefined,
  };
}

// ── Write payloads (mirror Create/UpdateFeatureDto). ──
export interface FeatureCreateInput {
  key: string;
  name: string;
  description?: string;
  type?: FeatureType;
  sortOrder?: number;
}

export interface FeatureUpdateInput {
  name?: string;
  description?: string;
  type?: FeatureType;
  sortOrder?: number;
  isActive?: boolean;
}

export const featuresApi = {
  async list(): Promise<PlatformFeature[]> {
    const data = await apiClient.get<BackendFeature[]>("/admin/features");
    return data.map(mapFeature);
  },

  async create(input: FeatureCreateInput): Promise<PlatformFeature> {
    const body = {
      key: input.key,
      name: input.name,
      description: input.description,
      type: input.type ? toBeFeatureType(input.type) : undefined,
      sortOrder: input.sortOrder,
    };
    const data = await apiClient.post<BackendFeature>("/admin/features", body);
    return mapFeature(data);
  },

  async update(id: string, input: FeatureUpdateInput): Promise<PlatformFeature> {
    const body = {
      name: input.name,
      description: input.description,
      type: input.type ? toBeFeatureType(input.type) : undefined,
      sortOrder: input.sortOrder,
      isActive: input.isActive,
    };
    const data = await apiClient.patch<BackendFeature>(`/admin/features/${id}`, body);
    return mapFeature(data);
  },

  async remove(id: string): Promise<PlatformFeature> {
    const data = await apiClient.delete<BackendFeature>(`/admin/features/${id}`);
    return mapFeature(data);
  },
};

// ── Query keys ──
export const featureKeys = {
  all: ["features"] as const,
  list: () => [...featureKeys.all, "list"] as const,
};

/** Catalog of platform features. Admin-only endpoint. */
export function useFeatures() {
  return useQuery({
    queryKey: featureKeys.list(),
    queryFn: () => featuresApi.list(),
    staleTime: 5 * 60_000,
  });
}

/** Lookup map: feature key -> feature id. Useful for plan ↔ catalog wiring. */
export function useFeatureIdByKey(): Record<string, string> {
  const { data } = useFeatures();
  const map: Record<string, string> = {};
  for (const f of data ?? []) map[f.key] = f.id;
  return map;
}

function useInvalidateFeatures() {
  const qc = useQueryClient();
  return () => void qc.invalidateQueries({ queryKey: featureKeys.all });
}

export function useCreateFeature() {
  const invalidate = useInvalidateFeatures();
  return useMutation({
    mutationFn: (input: FeatureCreateInput) => featuresApi.create(input),
    onSuccess: invalidate,
  });
}

export function useUpdateFeature() {
  const invalidate = useInvalidateFeatures();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: FeatureUpdateInput }) =>
      featuresApi.update(id, input),
    onSuccess: invalidate,
  });
}

export function useDeleteFeature() {
  const invalidate = useInvalidateFeatures();
  return useMutation({
    mutationFn: (id: string) => featuresApi.remove(id),
    onSuccess: invalidate,
  });
}
