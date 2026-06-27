/**
 * NOTIFICATIONS domain — self-contained API module.
 *
 * Backend wire types + boundary mapper + endpoint functions + TanStack Query
 * hooks. The list endpoint scopes rows to the CURRENT user (no audience query
 * param); audience is a property carried on each row instead. Pagination for
 * the list lives INSIDE `data` (data.pagination), not in the envelope metadata,
 * so the list uses `apiClient.get` rather than `getPaginated`.
 */
import { useMutation, useQuery, useQueryClient, type UseQueryOptions } from "@tanstack/react-query";
import { apiClient } from "./client";

/* ── Backend wire types (mirror NotificationResponseDto) ─────────────────── */

/** Raw backend notification type enum (database/entities/enums NotificationType). */
export type BackendNotificationType =
  | "signup"
  | "payment_success"
  | "payment_failed"
  | "flagged_question"
  | "suspicious_login"
  | "subscription_event"
  | "trial_expiring"
  | "rank_change"
  | "achievement"
  | "new_bank"
  | "system_error";

export type BackendNotificationAudience = "user" | "admin";

/** NotificationResponseDto */
export interface BackendNotification {
  id: string;
  type: BackendNotificationType;
  audience: BackendNotificationAudience;
  title: string;
  message: string;
  data: Record<string, unknown> | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

/** Payload returned inside `data` of GET /notifications. */
interface BackendNotificationListPayload {
  items: BackendNotification[];
  unreadCount: number;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/* ── Frontend domain type ─────────────────────────────────────────────────── */

/** Audience as used by the UI (matches the old store union). */
export type NotifAudience = "admin" | "user";

/**
 * Frontend notification type union. Matches the UI's existing TYPE_META keys so
 * the panel/bell render without changes. Backend `system_error` →
 * `api_error`, `subscription_event` → `subscription`, `trial_expiring` →
 * `trial`, `rank_change` → `rank`.
 */
export type NotifType =
  | "signup"
  | "payment_failed"
  | "payment_success"
  | "flagged_question"
  | "suspicious_login"
  | "api_error"
  | "subscription"
  | "trial"
  | "rank"
  | "new_bank"
  | "achievement";

export interface AppNotification {
  id: string;
  audience: NotifAudience;
  type: NotifType;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  /** Optional deep-link target, surfaced from backend `data.href` if present. */
  href?: string;
}

export interface NotificationsPage {
  items: AppNotification[];
  unreadCount: number;
  total: number;
  page: number;
  totalPages: number;
  hasNext: boolean;
}

/* ── Boundary mapper ──────────────────────────────────────────────────────── */

const TYPE_MAP: Record<BackendNotificationType, NotifType> = {
  signup: "signup",
  payment_success: "payment_success",
  payment_failed: "payment_failed",
  flagged_question: "flagged_question",
  suspicious_login: "suspicious_login",
  subscription_event: "subscription",
  trial_expiring: "trial",
  rank_change: "rank",
  achievement: "achievement",
  new_bank: "new_bank",
  system_error: "api_error",
};

function mapType(t: BackendNotificationType): NotifType {
  return TYPE_MAP[t] ?? "signup";
}

export function mapNotification(n: BackendNotification): AppNotification {
  const href = n.data && typeof n.data.href === "string" ? (n.data.href as string) : undefined;
  return {
    id: n.id,
    audience: n.audience,
    type: mapType(n.type),
    title: n.title,
    body: n.message,
    createdAt: n.createdAt,
    read: n.isRead,
    href,
  };
}

/* ── Endpoint functions ───────────────────────────────────────────────────── */

export interface NotificationsListParams {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
}

export const notificationsApi = {
  async list(params: NotificationsListParams = {}): Promise<NotificationsPage> {
    const payload = await apiClient.get<BackendNotificationListPayload>("/notifications", {
      params: {
        page: params.page,
        limit: params.limit,
        unreadOnly: params.unreadOnly,
      },
    });
    return {
      items: payload.items.map(mapNotification),
      unreadCount: payload.unreadCount,
      total: payload.pagination.total,
      page: payload.pagination.page,
      totalPages: payload.pagination.totalPages,
      hasNext: payload.pagination.hasNext,
    };
  },

  async unreadCount(): Promise<number> {
    const res = await apiClient.get<{ unreadCount: number }>("/notifications/unread-count");
    return res.unreadCount;
  },

  markRead: (id: string) => apiClient.patch<BackendNotification>(`/notifications/${id}/read`),

  markAllRead: () => apiClient.patch<{ updated: number }>("/notifications/read-all"),

  remove: (id: string) => apiClient.delete<null>(`/notifications/${id}`),
};

/* ── Query keys ───────────────────────────────────────────────────────────── */

export const notificationKeys = {
  all: ["notifications"] as const,
  list: (params: NotificationsListParams) => [...notificationKeys.all, "list", params] as const,
  unreadCount: () => [...notificationKeys.all, "unread-count"] as const,
};

/* ── Hooks ────────────────────────────────────────────────────────────────── */

export function useNotifications(
  params: NotificationsListParams = {},
  options?: Partial<UseQueryOptions<NotificationsPage>>,
) {
  return useQuery({
    queryKey: notificationKeys.list(params),
    queryFn: () => notificationsApi.list(params),
    ...options,
  });
}

/**
 * Unread badge count. Polls on a short interval as a fallback until realtime
 * push lands in a later phase.
 */
export function useUnreadCount(options?: Partial<UseQueryOptions<number>>) {
  return useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: () => notificationsApi.unreadCount(),
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
    ...options,
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

export function useRemoveNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsApi.remove(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}
