/**
 * ADMIN-USERS domain — self-contained API module (super-admin user management).
 *
 * Wires (all under /api/v1, super_admin only):
 *   GET    /admin/users                     — paginated list (search/role/isActive)
 *   GET    /admin/users/stats               — aggregate header counts
 *   GET    /admin/users/:id                 — full detail (profile + counts)
 *   PATCH  /admin/users/:id                 — edit profile / isActive
 *   PATCH  /admin/users/:id/role            — change role
 *   DELETE /admin/users/:id                 — hard delete
 *   POST   /admin/users/:id/suspend         — suspend (reason)
 *   POST   /admin/users/:id/reactivate      — reactivate
 *   POST   /admin/users/:id/ban             — ban (reason)
 *   POST   /admin/users/:id/flag            — flag for review (reason)
 *   POST   /admin/users/bulk                — bulk action over many ids
 *   GET    /admin/users/:id/sessions        — paginated quiz sessions
 *   GET    /admin/users/:id/subscriptions   — paginated subscriptions
 *   GET    /admin/users/:id/activity        — paginated audit-trail entries
 *   GET    /admin/users/export              — CSV (raw fetch — see buildAdminExportUrl)
 *   GET    /admin/users/:id/export          — single-user CSV
 *
 * Backend wire types + boundary mappers live HERE (not in the shared
 * @/api/types|mappers) to avoid cross-domain collisions, per project convention.
 *
 * Boundary mapping (UserResponseDto -> AdminUserVM):
 *   role     'user' | 'super_admin'  ->  'USER' | 'SUPER_ADMIN'
 *   status   'active'|'suspended'|'banned' (+ derived 'flagged' when flaggedAt set)
 *   The CSV export endpoints return a text/csv body, NOT the JSON envelope, so they
 *   must be hit with a raw fetch carrying the bearer token (apiClient unwraps JSON).
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient, BASE_URL, type QueryParams } from "@/api/client";
import { useAuthStore } from "@/stores/authStore";

// ── Backend enums (mirror src/database/entities/enums.ts). ──
export type BackendUserRole = "user" | "admin" | "super_admin";
export type BackendUserStatus = "active" | "suspended" | "banned";
export type BackendAuthProvider = "google" | "local";
export type BackendSessionMode = "tutor" | "quiz";
export type BackendSessionStatus = "in_progress" | "completed" | "abandoned";
/** Free-text plan key (e.g. "monthly", "pro_annual_2026"). */
export type BackendSubscriptionPlan = string;
export type BackendSubscriptionStatus = "active" | "expired" | "cancelled" | "trial";

// ── Frontend display unions. ──
export type DisplayRole = "USER" | "ADMIN" | "SUPER_ADMIN";
/** Roles an admin may assign from the dashboard (super_admin is out-of-band). */
export const ASSIGNABLE_DISPLAY_ROLES: DisplayRole[] = ["USER", "ADMIN"];

// ── Backend wire shapes. ──
export interface BackendUser {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
  role: BackendUserRole;
  provider: BackendAuthProvider;
  specialty: string | null;
  institution: string | null;
  country: string;
  isActive: boolean;
  status: BackendUserStatus;
  statusReason: string | null;
  flaggedAt: string | null;
  flagReason: string | null;
  isEmailVerified: boolean;
  trialQuestionsUsed: number;
  lastActiveAt: string | null;
  createdAt: string;
}

export interface BackendSubscriptionSummary {
  id: string;
  userId: string;
  plan: BackendSubscriptionPlan;
  status: BackendSubscriptionStatus;
  amountPaid: number;
  currency: string;
  startDate: string;
  endDate: string;
  cancelledAt: string | null;
  createdAt: string;
}

export interface BackendUserDetail {
  user: BackendUser;
  sessionCount: number;
  subscriptionCount: number;
  transactionCount: number;
  suspiciousLoginCount: number;
  activeSubscription: BackendSubscriptionSummary | null;
}

export interface BackendUserStats {
  total: number;
  active: number;
  suspended: number;
  banned: number;
  flagged: number;
  trial: number;
  subscribed: number;
  newLast30Days: number;
}

export interface BackendAdminSession {
  id: string;
  userId: string;
  bankId: string;
  mode: BackendSessionMode;
  status: BackendSessionStatus;
  totalQuestions: number;
  answeredCount: number;
  correctCount: number;
  scorePercentage: number | null;
  startedAt: string;
  completedAt: string | null;
  createdAt: string;
}

export interface BackendActivityLog {
  id: string;
  actorId: string | null;
  actorName: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  details: Record<string, unknown>;
  ipAddress: string | null;
  createdAt: string;
}

// ── Frontend view models. ──
/** Effective account standing surfaced in the UI. `flagged` is derived. */
export type AdminUserStatus = BackendUserStatus | "flagged";

export interface AdminUserVM {
  id: string;
  email: string;
  name: string;
  initials: string;
  avatar: string | null;
  role: DisplayRole;
  provider: BackendAuthProvider;
  specialty: string;
  institution: string;
  country: string;
  isActive: boolean;
  status: BackendUserStatus;
  /** status, or "flagged" when a flag is set and the account is otherwise active. */
  displayStatus: AdminUserStatus;
  statusReason: string | null;
  isFlagged: boolean;
  flaggedAt: string | null;
  flagReason: string | null;
  isEmailVerified: boolean;
  trialQuestionsUsed: number;
  lastActiveAt: string | null;
  createdAt: string;
}

export interface AdminUserDetailVM {
  user: AdminUserVM;
  sessionCount: number;
  subscriptionCount: number;
  transactionCount: number;
  suspiciousLoginCount: number;
  activeSubscription: BackendSubscriptionSummary | null;
}

const ROLE_TO_DISPLAY: Record<BackendUserRole, DisplayRole> = {
  user: "USER",
  admin: "ADMIN",
  super_admin: "SUPER_ADMIN",
};

const DISPLAY_TO_ROLE: Record<DisplayRole, BackendUserRole> = {
  USER: "user",
  ADMIN: "admin",
  SUPER_ADMIN: "super_admin",
};

export function toBackendRole(r: DisplayRole): BackendUserRole {
  return DISPLAY_TO_ROLE[r] ?? "user";
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// ── Boundary mapper. ──
export function mapUser(u: BackendUser): AdminUserVM {
  const isFlagged = u.flaggedAt != null;
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    initials: initialsOf(u.name),
    avatar: u.avatar,
    role: ROLE_TO_DISPLAY[u.role] ?? "USER",
    provider: u.provider,
    specialty: u.specialty ?? "",
    institution: u.institution ?? "",
    country: u.country,
    isActive: u.isActive,
    status: u.status,
    displayStatus: isFlagged && u.status === "active" ? "flagged" : u.status,
    statusReason: u.statusReason,
    isFlagged,
    flaggedAt: u.flaggedAt,
    flagReason: u.flagReason,
    isEmailVerified: u.isEmailVerified,
    trialQuestionsUsed: u.trialQuestionsUsed,
    lastActiveAt: u.lastActiveAt,
    createdAt: u.createdAt,
  };
}

export function mapUserDetail(d: BackendUserDetail): AdminUserDetailVM {
  return {
    user: mapUser(d.user),
    sessionCount: d.sessionCount,
    subscriptionCount: d.subscriptionCount,
    transactionCount: d.transactionCount,
    suspiciousLoginCount: d.suspiciousLoginCount,
    activeSubscription: d.activeSubscription,
  };
}

// ── List params (UserQueryDto + standard pagination). ──
export interface AdminUserListParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: BackendUserRole;
  isActive?: boolean;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export function toUserQuery(p: AdminUserListParams): QueryParams {
  return {
    page: p.page,
    limit: p.limit,
    search: p.search?.trim() || undefined,
    role: p.role,
    isActive: p.isActive,
    sortBy: p.sortBy,
    sortOrder: p.sortOrder,
  };
}

// ── Write payloads. ──
export interface AdminUserUpdateInput {
  name?: string;
  specialty?: string;
  institution?: string;
  country?: string;
  avatar?: string;
  isActive?: boolean;
}

export type BulkUserAction = "suspend" | "ban" | "reactivate" | "delete";

export interface BulkUserActionInput {
  action: BulkUserAction;
  userIds: string[];
}

export interface AdminUserListResult {
  users: AdminUserVM[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedVM<T> {
  rows: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const adminUsersApi = {
  async list(params: AdminUserListParams = {}): Promise<AdminUserListResult> {
    const { data, meta } = await apiClient.getPaginated<BackendUser>("/admin/users", {
      params: toUserQuery({ limit: 50, ...params }),
    });
    return {
      users: data.map(mapUser),
      total: meta.total,
      page: meta.page,
      limit: meta.limit,
      totalPages: meta.totalPages ?? 1,
    };
  },

  async stats(): Promise<BackendUserStats> {
    return apiClient.get<BackendUserStats>("/admin/users/stats");
  },

  async detail(id: string): Promise<AdminUserDetailVM> {
    const data = await apiClient.get<BackendUserDetail>(`/admin/users/${id}`);
    return mapUserDetail(data);
  },

  async update(id: string, input: AdminUserUpdateInput): Promise<AdminUserVM> {
    const data = await apiClient.patch<BackendUser>(`/admin/users/${id}`, input);
    return mapUser(data);
  },

  async updateRole(id: string, role: BackendUserRole): Promise<AdminUserVM> {
    const data = await apiClient.patch<BackendUser>(`/admin/users/${id}/role`, { role });
    return mapUser(data);
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete<null>(`/admin/users/${id}`);
  },

  async suspend(id: string, reason?: string): Promise<AdminUserVM> {
    const data = await apiClient.post<BackendUser>(`/admin/users/${id}/suspend`, { reason });
    return mapUser(data);
  },

  async reactivate(id: string): Promise<AdminUserVM> {
    const data = await apiClient.post<BackendUser>(`/admin/users/${id}/reactivate`, {});
    return mapUser(data);
  },

  async ban(id: string, reason?: string): Promise<AdminUserVM> {
    const data = await apiClient.post<BackendUser>(`/admin/users/${id}/ban`, { reason });
    return mapUser(data);
  },

  async flag(id: string, reason?: string): Promise<AdminUserVM> {
    const data = await apiClient.post<BackendUser>(`/admin/users/${id}/flag`, { reason });
    return mapUser(data);
  },

  async bulk(input: BulkUserActionInput): Promise<{ affected: number }> {
    return apiClient.post<{ affected: number }>("/admin/users/bulk", input);
  },

  async sessions(
    id: string,
    params: { page?: number; limit?: number } = {},
  ): Promise<PaginatedVM<BackendAdminSession>> {
    const { data, meta } = await apiClient.getPaginated<BackendAdminSession>(
      `/admin/users/${id}/sessions`,
      { params: { limit: 50, ...params } },
    );
    return {
      rows: data,
      total: meta.total,
      page: meta.page,
      limit: meta.limit,
      totalPages: meta.totalPages ?? 1,
    };
  },

  async subscriptions(
    id: string,
    params: { page?: number; limit?: number } = {},
  ): Promise<PaginatedVM<BackendSubscriptionSummary>> {
    const { data, meta } = await apiClient.getPaginated<BackendSubscriptionSummary>(
      `/admin/users/${id}/subscriptions`,
      { params: { limit: 50, ...params } },
    );
    return {
      rows: data,
      total: meta.total,
      page: meta.page,
      limit: meta.limit,
      totalPages: meta.totalPages ?? 1,
    };
  },

  async activity(
    id: string,
    params: { page?: number; limit?: number } = {},
  ): Promise<PaginatedVM<BackendActivityLog>> {
    const { data, meta } = await apiClient.getPaginated<BackendActivityLog>(
      `/admin/users/${id}/activity`,
      { params: { limit: 50, ...params } },
    );
    return {
      rows: data,
      total: meta.total,
      page: meta.page,
      limit: meta.limit,
      totalPages: meta.totalPages ?? 1,
    };
  },
};

// ── CSV export (raw fetch — the endpoint returns text/csv, not the envelope). ──

function buildExportUrl(path: string, params?: QueryParams): string {
  const url = new URL(`${BASE_URL}${path}`);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null) url.searchParams.append(k, String(v));
    }
  }
  return url.toString();
}

/**
 * Download a CSV from an authenticated /admin export endpoint and trigger a
 * browser save. apiClient can't be reused (it unwraps the JSON envelope), so we
 * raw-fetch with the bearer token and stream the body into a Blob.
 */
async function downloadCsv(url: string, filename: string): Promise<void> {
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
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(objectUrl);
}

/** Export the filtered user list as CSV (honours the same query as the table). */
export async function exportUsersCsv(params: AdminUserListParams = {}): Promise<void> {
  const url = buildExportUrl("/admin/users/export", toUserQuery(params));
  const stamp = new Date().toISOString().slice(0, 10);
  await downloadCsv(url, `users-${stamp}.csv`);
}

/** Export a single user's record as CSV. */
export async function exportUserCsv(id: string): Promise<void> {
  const url = buildExportUrl(`/admin/users/${id}/export`);
  await downloadCsv(url, `user-${id}.csv`);
}

// ── Query keys ──
export const adminUserKeys = {
  all: ["admin-users"] as const,
  list: (params: AdminUserListParams) => [...adminUserKeys.all, "list", params] as const,
  stats: () => [...adminUserKeys.all, "stats"] as const,
  detail: (id: string) => [...adminUserKeys.all, "detail", id] as const,
  sessions: (id: string) => [...adminUserKeys.all, "sessions", id] as const,
  subscriptions: (id: string) => [...adminUserKeys.all, "subscriptions", id] as const,
  activity: (id: string) => [...adminUserKeys.all, "activity", id] as const,
};

// ── Hooks ──
export function useAdminUsers(params: AdminUserListParams = {}) {
  return useQuery({
    queryKey: adminUserKeys.list(params),
    queryFn: () => adminUsersApi.list(params),
    staleTime: 30_000,
  });
}

export function useAdminUserStats() {
  return useQuery({
    queryKey: adminUserKeys.stats(),
    queryFn: () => adminUsersApi.stats(),
    staleTime: 30_000,
  });
}

export function useAdminUserDetail(id: string) {
  return useQuery({
    queryKey: adminUserKeys.detail(id),
    queryFn: () => adminUsersApi.detail(id),
    enabled: !!id,
  });
}

export function useAdminUserSessions(id: string, params: { page?: number; limit?: number } = {}) {
  return useQuery({
    queryKey: [...adminUserKeys.sessions(id), params],
    queryFn: () => adminUsersApi.sessions(id, params),
    enabled: !!id,
  });
}

export function useAdminUserSubscriptions(
  id: string,
  params: { page?: number; limit?: number } = {},
) {
  return useQuery({
    queryKey: [...adminUserKeys.subscriptions(id), params],
    queryFn: () => adminUsersApi.subscriptions(id, params),
    enabled: !!id,
  });
}

export function useAdminUserActivity(id: string, params: { page?: number; limit?: number } = {}) {
  return useQuery({
    queryKey: [...adminUserKeys.activity(id), params],
    queryFn: () => adminUsersApi.activity(id, params),
    enabled: !!id,
  });
}

function useInvalidateAdminUsers() {
  const qc = useQueryClient();
  return () => void qc.invalidateQueries({ queryKey: adminUserKeys.all });
}

export function useUpdateAdminUser() {
  const invalidate = useInvalidateAdminUsers();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: AdminUserUpdateInput }) =>
      adminUsersApi.update(id, input),
    onSuccess: invalidate,
  });
}

export function useUpdateAdminUserRole() {
  const invalidate = useInvalidateAdminUsers();
  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: BackendUserRole }) =>
      adminUsersApi.updateRole(id, role),
    onSuccess: invalidate,
  });
}

export function useDeleteAdminUser() {
  const invalidate = useInvalidateAdminUsers();
  return useMutation({
    mutationFn: (id: string) => adminUsersApi.remove(id),
    onSuccess: invalidate,
  });
}

export function useSuspendUser() {
  const invalidate = useInvalidateAdminUsers();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      adminUsersApi.suspend(id, reason),
    onSuccess: invalidate,
  });
}

export function useReactivateUser() {
  const invalidate = useInvalidateAdminUsers();
  return useMutation({
    mutationFn: (id: string) => adminUsersApi.reactivate(id),
    onSuccess: invalidate,
  });
}

export function useBanUser() {
  const invalidate = useInvalidateAdminUsers();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => adminUsersApi.ban(id, reason),
    onSuccess: invalidate,
  });
}

export function useFlagUser() {
  const invalidate = useInvalidateAdminUsers();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => adminUsersApi.flag(id, reason),
    onSuccess: invalidate,
  });
}

export function useBulkUserAction() {
  const invalidate = useInvalidateAdminUsers();
  return useMutation({
    mutationFn: (input: BulkUserActionInput) => adminUsersApi.bulk(input),
    onSuccess: invalidate,
  });
}
