/**
 * ADMIN-SUBSCRIPTIONS domain — self-contained API module.
 *
 * Wires (all under /api/v1, super_admin scope):
 *   - GET  /admin/subscriptions               (paginated list; plan/status filters)
 *   - POST /admin/subscriptions/override       (grant/replace a subscription)
 *   - POST /admin/subscriptions/:id/cancel     (cancel immediately)
 *   - POST /admin/subscriptions/:id/extend     (add N days)
 *
 * Backend wire types + boundary mapper + TanStack Query hooks live HERE (not in
 * the shared @/api/types|mappers) to avoid cross-domain collisions, per project
 * convention. Plan CRUD lives in plans.api.ts — NOT duplicated here.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/api/client";

// ── Backend enums (mirror src/database/entities/enums.ts). ──
export type BackendSubscriptionPlan =
  | "monthly"
  | "three_months"
  | "six_months"
  | "twelve_months"
  | "free_trial";

export type BackendSubscriptionStatus = "active" | "expired" | "cancelled" | "trial";

// ── Backend wire shape (SubscriptionResponseDto, inside envelope `data`). ──
export interface BackendSubscription {
  id: string;
  userId: string;
  userName: string | null;
  userEmail: string | null;
  plan: BackendSubscriptionPlan;
  status: BackendSubscriptionStatus;
  amountPaid: number;
  currency: string;
  startDate: string;
  endDate: string;
  daysRemaining: number;
  cancelledAt: string | null;
  createdAt: string;
}

// ── Display maps ──
export const PLAN_LABELS: Record<BackendSubscriptionPlan, string> = {
  monthly: "Monthly",
  three_months: "3 Months",
  six_months: "6 Months",
  twelve_months: "12 Months",
  free_trial: "Free Trial",
};

export const STATUS_LABELS: Record<BackendSubscriptionStatus, string> = {
  active: "Active",
  expired: "Expired",
  cancelled: "Cancelled",
  trial: "Trial",
};

// ── Frontend domain shape. ──
export interface AdminSubscription {
  id: string;
  userId: string;
  userName: string | null;
  userEmail: string | null;
  plan: BackendSubscriptionPlan;
  planLabel: string;
  status: BackendSubscriptionStatus;
  statusLabel: string;
  amountPaid: number;
  currency: string;
  startDate: string;
  endDate: string;
  daysRemaining: number;
  cancelledAt: string | null;
  createdAt: string;
}

export function mapSubscription(s: BackendSubscription): AdminSubscription {
  return {
    id: s.id,
    userId: s.userId,
    userName: s.userName,
    userEmail: s.userEmail,
    plan: s.plan,
    planLabel: PLAN_LABELS[s.plan] ?? s.plan,
    status: s.status,
    statusLabel: STATUS_LABELS[s.status] ?? s.status,
    amountPaid: s.amountPaid,
    currency: s.currency,
    startDate: s.startDate,
    endDate: s.endDate,
    daysRemaining: s.daysRemaining,
    cancelledAt: s.cancelledAt,
    createdAt: s.createdAt,
  };
}

// ── List params (server-supported subset of SubscriptionQueryDto). ──
export interface SubscriptionListParams {
  page?: number;
  limit?: number;
  plan?: BackendSubscriptionPlan;
  status?: BackendSubscriptionStatus;
}

function toQuery(p: SubscriptionListParams): Record<string, string | number | undefined> {
  return {
    page: p.page,
    limit: p.limit,
    plan: p.plan,
    status: p.status,
  };
}

export interface SubscriptionListResult {
  subscriptions: AdminSubscription[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ── Write payloads (mirror Override/Extend DTOs). ──
export interface OverrideSubscriptionInput {
  userId: string;
  plan: BackendSubscriptionPlan;
  /** ISO date string (>= now). */
  endDate: string;
  reason: string;
}

export interface ExtendSubscriptionInput {
  days: number;
  reason?: string;
}

export const adminSubscriptionsApi = {
  async list(params: SubscriptionListParams = {}): Promise<SubscriptionListResult> {
    const { data, meta } = await apiClient.getPaginated<BackendSubscription>(
      "/admin/subscriptions",
      { params: toQuery({ limit: 50, ...params }) },
    );
    return {
      subscriptions: data.map(mapSubscription),
      total: meta.total,
      page: meta.page,
      limit: meta.limit,
      totalPages: meta.totalPages ?? 1,
    };
  },

  async override(input: OverrideSubscriptionInput): Promise<AdminSubscription> {
    const data = await apiClient.post<BackendSubscription>("/admin/subscriptions/override", input);
    return mapSubscription(data);
  },

  async cancel(id: string): Promise<AdminSubscription> {
    const data = await apiClient.post<BackendSubscription>(`/admin/subscriptions/${id}/cancel`);
    return mapSubscription(data);
  },

  async extend(id: string, input: ExtendSubscriptionInput): Promise<AdminSubscription> {
    const data = await apiClient.post<BackendSubscription>(
      `/admin/subscriptions/${id}/extend`,
      input,
    );
    return mapSubscription(data);
  },
};

// ── Query keys ──
export const adminSubscriptionKeys = {
  all: ["admin-subscriptions"] as const,
  list: (params: SubscriptionListParams) => [...adminSubscriptionKeys.all, "list", params] as const,
};

export function useAdminSubscriptions(params: SubscriptionListParams = {}) {
  return useQuery({
    queryKey: adminSubscriptionKeys.list(params),
    queryFn: () => adminSubscriptionsApi.list(params),
    staleTime: 30_000,
  });
}

function useInvalidateSubscriptions() {
  const qc = useQueryClient();
  return () => void qc.invalidateQueries({ queryKey: adminSubscriptionKeys.all });
}

export function useOverrideSubscription() {
  const invalidate = useInvalidateSubscriptions();
  return useMutation({
    mutationFn: (input: OverrideSubscriptionInput) => adminSubscriptionsApi.override(input),
    onSuccess: invalidate,
  });
}

export function useCancelSubscription() {
  const invalidate = useInvalidateSubscriptions();
  return useMutation({
    mutationFn: (id: string) => adminSubscriptionsApi.cancel(id),
    onSuccess: invalidate,
  });
}

export function useExtendSubscription() {
  const invalidate = useInvalidateSubscriptions();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ExtendSubscriptionInput }) =>
      adminSubscriptionsApi.extend(id, input),
    onSuccess: invalidate,
  });
}
