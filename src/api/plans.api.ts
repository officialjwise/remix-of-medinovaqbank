/**
 * PLANS domain — self-contained API module (subscription plans + free trial).
 *
 * Wires:
 *   - GET    /subscriptions/plans         (public — active paid + trial plans)
 *   - GET    /subscriptions/trial-plan    (public — the managed free-trial plan)
 *   - GET    /admin/plans                 (super_admin — all plans + subscriberCount)
 *   - GET    /admin/plans/:id             (super_admin — single plan)
 *   - POST   /admin/plans                 (super_admin — create)
 *   - PATCH  /admin/plans/:id             (super_admin — update / toggle active)
 *   - DELETE /admin/plans/:id             (super_admin — deactivate)
 *
 * Backend wire types + boundary mappers live HERE (not in @/api/types /
 * @/api/mappers) to avoid cross-domain collisions, per project convention.
 *
 * The frontend `Plan` view model intentionally mirrors the legacy
 * `@/stores/plansStore` `Plan` shape (durationLabel, badgeLabel, bullets[],
 * catalogFeatures{}, subscribers, …) so existing UI call-sites need minimal
 * adaptation. Single backend `price` + `durationDays` are mapped to the
 * display fields; `features[]` -> `bullets`; `featureMappings[]` ->
 * `catalogFeatures` (keyed by featureKey), carrying BOTH the feature id/key.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/api/client";

// ── Plan key: free-text slug (e.g. "monthly", "pro_annual_2026"). ──
export type BackendSubscriptionPlan = string;

/** One row in a plan card's feature list (JSONB on PlanConfiguration). */
export interface BackendPlanFeature {
  text: string;
  included: boolean;
  sortOrder: number;
}

/** Links a plan to a catalog feature, with an optional numeric limit. */
export interface BackendPlanFeatureMapping {
  featureKey: string;
  included: boolean;
  limitValue: number | null;
  sortOrder: number;
}

// ── Backend wire shape (PlanResponseDto, inside the envelope's `data`). ──
export interface BackendPlan {
  id: string;
  plan: BackendSubscriptionPlan;
  name: string;
  durationDays: number;
  price: number;
  currency: string;
  badge: string | null;
  features: BackendPlanFeature[];
  featureMappings: BackendPlanFeatureMapping[];
  isTrial: boolean;
  isActive: boolean;
  sortOrder: number;
  /** Active subscriber count — only populated on admin listings. */
  subscriberCount?: number;
}

// ── Frontend domain shape (mirrors the legacy plansStore `Plan`). ──
export interface PlanBullet {
  id: string;
  text: string;
  included: boolean;
}

export interface CatalogSelection {
  /** Carried so write payloads round-trip the exact catalog feature. */
  featureKey: string;
  /** The catalog feature's DB id, when resolvable. Empty when unknown. */
  featureId?: string;
  included: boolean;
  limit?: number; // -1 = unlimited
}

/**
 * Rich, display-oriented plan shape the public pricing surfaces and the Paystack
 * checkout modal consume (months, currency, perMonth, badge tone). Derived from
 * a backend `Plan` via `toDurationPlan` (see routes/pricing.tsx). Lives here —
 * NOT in a mock data module — so the payment shim and checkout modal can import
 * a real type. The `id` is the backend plan key string in the live wiring.
 */
export interface DurationPlan {
  id: string;
  name: string;
  durationLabel: string;
  months: number;
  price: number;
  currency: "GHS";
  perMonth: number;
  badge?: { label: string; tone: "accent" | "amber" | "navy" };
  features: string[];
  savePct?: number;
  cta: string;
}

export interface Plan {
  id: string;
  /** Backend plan enum key (monthly | three_months | … | free_trial). */
  planKey: BackendSubscriptionPlan;
  name: string;
  price: number; // GHS
  currency: string;
  durationDays: number;
  durationLabel: string;
  badgeLabel: string;
  sortOrder: number;
  active: boolean;
  subscribers: number;
  isTrial?: boolean;
  /** Derived from durationDays for trial plans. */
  trialDays?: number;
  /** Derived from the `question_limit` mapping for trial plans. */
  questionCap?: number;
  bullets: PlanBullet[];
  catalogFeatures: Record<string, CatalogSelection>;
}

/** GHS-friendly duration label derived from a single durationDays value. */
export function deriveDurationLabel(durationDays: number, isTrial?: boolean): string {
  if (isTrial) return `${durationDays} days free`;
  const months = Math.round(durationDays / 30);
  if (months <= 1) return "/month";
  if (months === 12) return "/year";
  return `/ ${months} months`;
}

/**
 * Boundary mapper: backend PlanResponseDto → frontend Plan view model.
 * `featureIdByKey` (from the feature catalog) lets us carry the feature id
 * alongside the key on each catalog selection.
 */
export function mapPlan(p: BackendPlan, featureIdByKey?: Record<string, string>): Plan {
  const bullets: PlanBullet[] = [...p.features]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((f, i) => ({ id: `${p.id}-b${i}`, text: f.text, included: f.included }));

  const catalogFeatures: Record<string, CatalogSelection> = {};
  for (const m of p.featureMappings ?? []) {
    catalogFeatures[m.featureKey] = {
      featureKey: m.featureKey,
      featureId: featureIdByKey?.[m.featureKey],
      included: m.included,
      limit: m.limitValue ?? undefined,
    };
  }

  const questionCapMapping = (p.featureMappings ?? []).find(
    (m) => m.featureKey === "question_limit",
  );

  return {
    id: p.id,
    planKey: p.plan,
    name: p.name,
    price: p.price,
    currency: p.currency,
    durationDays: p.durationDays,
    durationLabel: deriveDurationLabel(p.durationDays, p.isTrial),
    badgeLabel: p.badge ?? "",
    sortOrder: p.sortOrder,
    active: p.isActive,
    subscribers: p.subscriberCount ?? 0,
    isTrial: p.isTrial,
    trialDays: p.isTrial ? p.durationDays : undefined,
    questionCap: questionCapMapping?.limitValue ?? undefined,
    bullets,
    catalogFeatures,
  };
}

// ── Write payloads (mirror Create/UpdatePlanDto). ──
export interface PlanFeatureInput {
  text: string;
  included: boolean;
  sortOrder: number;
}

export interface PlanFeatureMappingInput {
  featureKey: string;
  included: boolean;
  limitValue?: number;
  sortOrder: number;
}

export interface PlanCreateInput {
  plan: BackendSubscriptionPlan;
  name: string;
  durationDays: number;
  price: number;
  currency?: string;
  badge?: string;
  sortOrder?: number;
  features?: PlanFeatureInput[];
  featureMappings?: PlanFeatureMappingInput[];
  isTrial?: boolean;
}

export interface PlanUpdateInput {
  name?: string;
  durationDays?: number;
  price?: number;
  currency?: string;
  badge?: string;
  sortOrder?: number;
  isActive?: boolean;
  features?: PlanFeatureInput[];
  featureMappings?: PlanFeatureMappingInput[];
}

/**
 * Build the backend create/update payload from an edited frontend Plan.
 * `features` <- bullets; `featureMappings` <- catalogFeatures.
 */
export function toPlanWritePayload(
  v: Plan,
): Omit<PlanCreateInput, "plan" | "isTrial"> & { isActive?: boolean } {
  const features: PlanFeatureInput[] = v.bullets
    .filter((b) => b.text.trim())
    .map((b, i) => ({ text: b.text.trim(), included: b.included, sortOrder: i }));

  const featureMappings: PlanFeatureMappingInput[] = Object.values(v.catalogFeatures).map(
    (sel, i) => ({
      featureKey: sel.featureKey,
      included: sel.included,
      // -1 (unlimited) is a valid sentinel; the backend column is nullable
      // numeric but accepts >= 0 via the DTO, so map unlimited to undefined.
      limitValue: sel.limit !== undefined && sel.limit >= 0 ? sel.limit : undefined,
      sortOrder: i,
    }),
  );

  return {
    name: v.name.trim(),
    durationDays: v.durationDays,
    price: v.price,
    currency: v.currency || "GHS",
    badge: v.badgeLabel.trim() || undefined,
    sortOrder: v.sortOrder,
    isActive: v.active,
    features,
    featureMappings,
  };
}

export const plansApi = {
  /** Public — active plans (paid + trial). */
  async listActive(featureIdByKey?: Record<string, string>): Promise<Plan[]> {
    const data = await apiClient.get<BackendPlan[]>("/subscriptions/plans");
    return data.map((p) => mapPlan(p, featureIdByKey));
  },

  /** Public — the managed free-trial plan (or null). */
  async getTrial(featureIdByKey?: Record<string, string>): Promise<Plan | null> {
    const data = await apiClient.get<BackendPlan | null>("/subscriptions/trial-plan");
    return data ? mapPlan(data, featureIdByKey) : null;
  },

  /** Admin — all plans, includes subscriberCount. */
  async listAll(featureIdByKey?: Record<string, string>): Promise<Plan[]> {
    const data = await apiClient.get<BackendPlan[]>("/admin/plans");
    return data.map((p) => mapPlan(p, featureIdByKey));
  },

  async getById(id: string, featureIdByKey?: Record<string, string>): Promise<Plan> {
    const data = await apiClient.get<BackendPlan>(`/admin/plans/${id}`);
    return mapPlan(data, featureIdByKey);
  },

  async create(input: PlanCreateInput): Promise<Plan> {
    const data = await apiClient.post<BackendPlan>("/admin/plans", input);
    return mapPlan(data);
  },

  async update(id: string, input: PlanUpdateInput): Promise<Plan> {
    const data = await apiClient.patch<BackendPlan>(`/admin/plans/${id}`, input);
    return mapPlan(data);
  },

  async deactivate(id: string): Promise<Plan> {
    const data = await apiClient.delete<BackendPlan>(`/admin/plans/${id}`);
    return mapPlan(data);
  },
};

// ── Query keys ──
export const planKeys = {
  all: ["plans"] as const,
  active: () => [...planKeys.all, "active"] as const,
  trial: () => [...planKeys.all, "trial"] as const,
  admin: () => [...planKeys.all, "admin"] as const,
  detail: (id: string) => [...planKeys.all, "detail", id] as const,
};

/**
 * Public list of active plans. The trial plan is also returned by
 * /subscriptions/plans, so derive paid/trial views from a single fetch.
 */
export function useActivePlans(featureIdByKey?: Record<string, string>) {
  return useQuery({
    queryKey: planKeys.active(),
    queryFn: () => plansApi.listActive(featureIdByKey),
    staleTime: 5 * 60_000,
  });
}

/** Active paid plans only, sorted — the canonical pricing list. */
export function usePaidPlans(featureIdByKey?: Record<string, string>) {
  const query = useActivePlans(featureIdByKey);
  const paid = (query.data ?? [])
    .filter((p) => !p.isTrial && p.active)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  return { ...query, data: paid };
}

/** The trial plan (from the dedicated endpoint). */
export function useTrialPlan(featureIdByKey?: Record<string, string>) {
  return useQuery({
    queryKey: planKeys.trial(),
    queryFn: () => plansApi.getTrial(featureIdByKey),
    staleTime: 5 * 60_000,
  });
}

/** Admin list (with subscriberCount) for the management screens. */
export function useAdminPlans(featureIdByKey?: Record<string, string>) {
  return useQuery({
    queryKey: planKeys.admin(),
    queryFn: () => plansApi.listAll(featureIdByKey),
    staleTime: 60_000,
  });
}

/** Single plan for the edit screen. */
export function useAdminPlan(id: string, featureIdByKey?: Record<string, string>) {
  return useQuery({
    queryKey: planKeys.detail(id),
    queryFn: () => plansApi.getById(id, featureIdByKey),
    enabled: !!id,
  });
}

function useInvalidatePlans() {
  const qc = useQueryClient();
  return () => void qc.invalidateQueries({ queryKey: planKeys.all });
}

export function useCreatePlan() {
  const invalidate = useInvalidatePlans();
  return useMutation({
    mutationFn: (input: PlanCreateInput) => plansApi.create(input),
    onSuccess: invalidate,
  });
}

export function useUpdatePlan() {
  const invalidate = useInvalidatePlans();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: PlanUpdateInput }) =>
      plansApi.update(id, input),
    onSuccess: invalidate,
  });
}

/** Convenience toggle — flips isActive via the update endpoint. */
export function useTogglePlan() {
  const invalidate = useInvalidatePlans();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      plansApi.update(id, { isActive }),
    onSuccess: invalidate,
  });
}

export function useDeactivatePlan() {
  const invalidate = useInvalidatePlans();
  return useMutation({
    mutationFn: (id: string) => plansApi.deactivate(id),
    onSuccess: invalidate,
  });
}
