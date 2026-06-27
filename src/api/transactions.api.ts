/**
 * TRANSACTIONS domain — self-contained API module (admin payment ledger).
 *
 * Wires (all under /api/v1, super_admin only):
 *   GET /admin/transactions            — paginated ledger (status/plan/channel/date/search)
 *   GET /admin/transactions/:reference — single transaction + raw provider payload
 *   GET /admin/transactions/export     — CSV (raw fetch — returns text/csv, not the envelope)
 *
 * Backend wire types + boundary mapper live HERE (not in the shared
 * @/api/types|mappers) to avoid cross-domain collisions, per project convention.
 *
 * The list/detail filter `search` matches the Paystack reference or owner email.
 * `provider` is always "paystack" today. The CSV export endpoint streams a
 * text/csv body, so it must be hit with a raw fetch carrying the bearer token.
 */
import { useQuery } from "@tanstack/react-query";
import { apiClient, BASE_URL, type QueryParams } from "@/api/client";
import { useAuthStore } from "@/stores/authStore";

// ── Backend enums (mirror src/database/entities/enums.ts). ──
export type BackendPaymentStatus = "pending" | "success" | "failed";
/** Free-text plan key (e.g. "monthly", "pro_annual_2026"). */
export type BackendSubscriptionPlan = string;

// ── Backend wire shapes (AdminTransactionResponseDto / detail). ──
export interface BackendTransaction {
  id: string;
  reference: string;
  provider: string;
  channel: string | null;
  status: BackendPaymentStatus;
  plan: BackendSubscriptionPlan;
  amount: number;
  currency: string;
  userId: string;
  userName: string | null;
  userEmail: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BackendTransactionDetail extends BackendTransaction {
  providerResponse: Record<string, unknown> | null;
}

// ── Frontend view models. ──
const PLAN_LABELS: Record<BackendSubscriptionPlan, string> = {
  monthly: "Monthly",
  three_months: "3 Months",
  six_months: "6 Months",
  twelve_months: "12 Months",
  free_trial: "Free Trial",
};

export function planLabel(plan: BackendSubscriptionPlan): string {
  return PLAN_LABELS[plan] ?? plan;
}

export interface TransactionVM {
  id: string;
  reference: string;
  provider: string;
  channel: string | null;
  channelLabel: string;
  status: BackendPaymentStatus;
  plan: BackendSubscriptionPlan;
  planLabel: string;
  amount: number;
  currency: string;
  userId: string;
  userName: string;
  userEmail: string;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionDetailVM extends TransactionVM {
  providerResponse: Record<string, unknown> | null;
}

export function mapTransaction(t: BackendTransaction): TransactionVM {
  return {
    id: t.id,
    reference: t.reference,
    provider: t.provider,
    channel: t.channel,
    channelLabel: t.channel ? t.channel.replace(/_/g, " ") : "—",
    status: t.status,
    plan: t.plan,
    planLabel: planLabel(t.plan),
    amount: t.amount,
    currency: t.currency,
    userId: t.userId,
    userName: t.userName ?? "—",
    userEmail: t.userEmail ?? "—",
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
  };
}

export function mapTransactionDetail(t: BackendTransactionDetail): TransactionDetailVM {
  return { ...mapTransaction(t), providerResponse: t.providerResponse };
}

// ── List params (TransactionQueryDto + standard pagination). ──
export interface TransactionListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: BackendPaymentStatus;
  plan?: BackendSubscriptionPlan;
  channel?: string;
  provider?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export function toTransactionQuery(p: TransactionListParams): QueryParams {
  return {
    page: p.page,
    limit: p.limit,
    search: p.search?.trim() || undefined,
    status: p.status,
    plan: p.plan,
    channel: p.channel,
    provider: p.provider,
    startDate: p.startDate,
    endDate: p.endDate,
    sortBy: p.sortBy,
    sortOrder: p.sortOrder,
  };
}

export interface TransactionListResult {
  transactions: TransactionVM[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const transactionsApi = {
  async list(params: TransactionListParams = {}): Promise<TransactionListResult> {
    const { data, meta } = await apiClient.getPaginated<BackendTransaction>("/admin/transactions", {
      params: toTransactionQuery({ limit: 50, ...params }),
    });
    return {
      transactions: data.map(mapTransaction),
      total: meta.total,
      page: meta.page,
      limit: meta.limit,
      totalPages: meta.totalPages ?? 1,
    };
  },

  async getByReference(reference: string): Promise<TransactionDetailVM> {
    const data = await apiClient.get<BackendTransactionDetail>(
      `/admin/transactions/${encodeURIComponent(reference)}`,
    );
    return mapTransactionDetail(data);
  },
};

// ── CSV export (raw fetch — endpoint returns text/csv, not the envelope). ──

function buildExportUrl(path: string, params?: QueryParams): string {
  const url = new URL(`${BASE_URL}${path}`);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null) url.searchParams.append(k, String(v));
    }
  }
  return url.toString();
}

/** Export the filtered transaction ledger as CSV and trigger a browser save. */
export async function exportTransactionsCsv(params: TransactionListParams = {}): Promise<void> {
  const url = buildExportUrl("/admin/transactions/export", toTransactionQuery(params));
  const token = useAuthStore.getState().accessToken;
  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    throw new Error(`Export failed (${res.status})`);
  }
  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = `transactions-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(objectUrl);
}

// ── Query keys ──
export const transactionKeys = {
  all: ["transactions"] as const,
  list: (params: TransactionListParams) => [...transactionKeys.all, "list", params] as const,
  detail: (reference: string) => [...transactionKeys.all, "detail", reference] as const,
};

// ── Hooks ──
export function useTransactions(params: TransactionListParams = {}) {
  return useQuery({
    queryKey: transactionKeys.list(params),
    queryFn: () => transactionsApi.list(params),
    staleTime: 30_000,
  });
}

export function useTransaction(reference: string) {
  return useQuery({
    queryKey: transactionKeys.detail(reference),
    queryFn: () => transactionsApi.getByReference(reference),
    enabled: !!reference,
  });
}
