/**
 * PAYMENTS + SUBSCRIPTION-STATUS domain — self-contained API module.
 *
 * Backend wire types + boundary mappers + endpoint functions + TanStack Query
 * hooks. Kept inside this file (not in the shared @/api/types|mappers) to avoid
 * cross-domain collisions, per project convention.
 *
 * Endpoints (all under /api/v1):
 *   GET  /subscriptions/status          — auth'd combined subscription + trial summary
 *                                          (the task referred to this as
 *                                           "GET /users/me/subscription"; no such route
 *                                           exists — the real status summary is
 *                                           /subscriptions/status. See GAP/notes.)
 *   GET  /subscriptions/me              — auth'd active subscription row (or null)
 *   POST /payments/initialize           — { plan } -> { authorizationUrl, reference, ... }
 *   GET  /payments/verify/:reference    — verifies + reflects subscription
 *   GET  /payments/history              — paginated transaction history
 *
 * Plan LISTS are intentionally NOT here — reuse plans.api.ts
 * (useActivePlans / usePaidPlans / useTrialPlan).
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import type { BackendSubscriptionPlan } from "@/api/plans.api";

export type { BackendSubscriptionPlan };

// ── Backend enums (mirror src/database/entities/enums.ts). ──
export type BackendSubscriptionStatusValue = "active" | "expired" | "cancelled" | "trial";
export type BackendPaymentStatus = "pending" | "success" | "failed";

// ── Backend wire: SubscriptionStatusSummary (GET /subscriptions/status). ──
export interface BackendSubscriptionStatus {
  hasActiveSubscription: boolean;
  plan: BackendSubscriptionPlan | null;
  status: BackendSubscriptionStatusValue | null;
  startDate: string | null;
  endDate: string | null;
  daysRemaining: number;
  isTrial: boolean;
  isTrialActive: boolean;
  trialStartedAt: string | null;
  trialEndsAt: string | null;
  trialDaysRemaining: number;
  trialQuestionsUsed: number;
  trialLimit: number | null;
  trialQuestionsRemaining: number | null;
  canAccessQuiz: boolean;
  features: Array<{ key: string; name?: string; included: boolean; limit?: number | null }>;
}

// ── Backend wire: SubscriptionResponseDto (GET /subscriptions/me). ──
export interface BackendSubscription {
  id: string;
  userId: string;
  plan: BackendSubscriptionPlan;
  status: BackendSubscriptionStatusValue;
  amountPaid: number;
  currency: string;
  startDate: string;
  endDate: string;
  daysRemaining: number;
  cancelledAt: string | null;
  createdAt: string;
}

// ── Backend wire: InitializePaymentResponseDto. ──
export interface BackendInitializePayment {
  authorizationUrl: string;
  accessCode: string;
  reference: string;
  amount: number;
  currency: string;
}

// ── Backend wire: PaymentTransactionResponseDto. ──
export interface BackendPaymentTransaction {
  id: string;
  plan: BackendSubscriptionPlan;
  amount: number;
  currency: string;
  reference: string;
  status: BackendPaymentStatus;
  createdAt: string;
}

// ── Human labels for the backend plan keys (display only). ──
const PLAN_LABELS: Record<BackendSubscriptionPlan, string> = {
  monthly: "Monthly",
  three_months: "3 Months Access",
  six_months: "6 Months Access",
  twelve_months: "12 Months Access",
  free_trial: "Free Trial",
};

export function planLabel(plan: BackendSubscriptionPlan | null | undefined): string {
  return plan ? (PLAN_LABELS[plan] ?? plan) : "—";
}

// ── Frontend status summary (camelCase ISO -> kept as-is; helpers derived). ──
export interface SubscriptionStatusView {
  hasActiveSubscription: boolean;
  plan: BackendSubscriptionPlan | null;
  planName: string;
  status: BackendSubscriptionStatusValue | null;
  startDate: string | null;
  endDate: string | null;
  daysRemaining: number;
  isTrial: boolean;
  isTrialActive: boolean;
  trialEndsAt: string | null;
  trialDaysRemaining: number;
  trialQuestionsUsed: number;
  trialLimit: number | null;
  trialQuestionsRemaining: number | null;
  canAccessQuiz: boolean;
}

export function mapStatus(s: BackendSubscriptionStatus): SubscriptionStatusView {
  return {
    hasActiveSubscription: s.hasActiveSubscription,
    plan: s.plan,
    planName: planLabel(s.plan),
    status: s.status,
    startDate: s.startDate,
    endDate: s.endDate,
    daysRemaining: s.daysRemaining,
    isTrial: s.isTrial,
    isTrialActive: s.isTrialActive,
    trialEndsAt: s.trialEndsAt,
    trialDaysRemaining: s.trialDaysRemaining,
    trialQuestionsUsed: s.trialQuestionsUsed,
    trialLimit: s.trialLimit,
    trialQuestionsRemaining: s.trialQuestionsRemaining,
    canAccessQuiz: s.canAccessQuiz,
  };
}

// ── Frontend payment-transaction view. ──
export interface PaymentTransactionView {
  id: string;
  plan: BackendSubscriptionPlan;
  planName: string;
  amount: number;
  currency: string;
  reference: string;
  status: BackendPaymentStatus;
  /** Title-cased status for badges (Successful / Failed / Pending). */
  statusLabel: string;
  createdAt: string;
}

const PAYMENT_STATUS_LABELS: Record<BackendPaymentStatus, string> = {
  pending: "Pending",
  success: "Successful",
  failed: "Failed",
};

export function mapTransaction(t: BackendPaymentTransaction): PaymentTransactionView {
  return {
    id: t.id,
    plan: t.plan,
    planName: planLabel(t.plan),
    amount: t.amount,
    currency: t.currency,
    reference: t.reference,
    status: t.status,
    statusLabel: PAYMENT_STATUS_LABELS[t.status] ?? t.status,
    createdAt: t.createdAt,
  };
}

export interface VerifyResultView {
  transaction: PaymentTransactionView;
  /** The (re)activated subscription, when the verify reflected one. */
  subscription: BackendSubscription | null;
}

// ── Endpoint functions ──
export const paymentsApi = {
  /** Auth'd combined subscription + trial status summary. */
  async getStatus(): Promise<SubscriptionStatusView> {
    const data = await apiClient.get<BackendSubscriptionStatus>("/subscriptions/status");
    return mapStatus(data);
  },

  /** Auth'd active subscription row (or null). */
  async getMine(): Promise<BackendSubscription | null> {
    return apiClient.get<BackendSubscription | null>("/subscriptions/me");
  },

  /** Start a Paystack checkout for a plan; returns the redirect URL + reference. */
  async initialize(plan: BackendSubscriptionPlan): Promise<BackendInitializePayment> {
    return apiClient.post<BackendInitializePayment>("/payments/initialize", { plan });
  },

  /** Verify a payment by reference; the backend reflects the subscription. */
  async verify(reference: string): Promise<VerifyResultView> {
    const data = await apiClient.get<{
      transaction: BackendPaymentTransaction;
      subscription: BackendSubscription | null;
    }>(`/payments/verify/${encodeURIComponent(reference)}`);
    return {
      transaction: mapTransaction(data.transaction),
      subscription: data.subscription,
    };
  },

  /** Paginated payment-transaction history (newest first per backend). */
  async history(params: { page?: number; limit?: number } = {}): Promise<PaymentTransactionView[]> {
    const { data } = await apiClient.getPaginated<BackendPaymentTransaction>("/payments/history", {
      params: { limit: 50, ...params },
    });
    return data.map(mapTransaction);
  },
};

// ── Query keys ──
export const paymentKeys = {
  all: ["payments"] as const,
  status: () => [...paymentKeys.all, "status"] as const,
  mine: () => [...paymentKeys.all, "mine"] as const,
  history: (params: { page?: number; limit?: number }) =>
    [...paymentKeys.all, "history", params] as const,
};

// ── Hooks ──

/** Combined subscription + trial status for the current user. */
export function useSubscriptionStatus() {
  return useQuery({
    queryKey: paymentKeys.status(),
    queryFn: paymentsApi.getStatus,
    staleTime: 30_000,
    // SSR-safe: only fetch in the browser (auth token lives client-side).
    enabled: typeof window !== "undefined",
  });
}

/** Active subscription row (or null) for the current user. */
export function useMySubscription() {
  return useQuery({
    queryKey: paymentKeys.mine(),
    queryFn: paymentsApi.getMine,
    staleTime: 30_000,
    enabled: typeof window !== "undefined",
  });
}

/** Paginated payment history. */
export function usePaymentHistory(params: { page?: number; limit?: number } = {}) {
  return useQuery({
    queryKey: paymentKeys.history(params),
    queryFn: () => paymentsApi.history(params),
    staleTime: 30_000,
    enabled: typeof window !== "undefined",
  });
}

/** Initialize a Paystack checkout. Resolve with the redirect URL + reference. */
export function useInitializePayment() {
  return useMutation({
    mutationFn: (plan: BackendSubscriptionPlan) => paymentsApi.initialize(plan),
  });
}

/**
 * Verify a payment by reference. On success, invalidate subscription/status and
 * history so the UI reflects the new entitlement.
 */
export function useVerifyPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (reference: string) => paymentsApi.verify(reference),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: paymentKeys.all });
    },
  });
}
