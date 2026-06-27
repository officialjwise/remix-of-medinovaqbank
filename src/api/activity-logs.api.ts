/**
 * ADMIN ACTIVITY-LOGS domain — self-contained API module.
 *
 * Backend wire types + boundary mapper + endpoint functions + TanStack Query
 * hooks. Kept inside this file (not in the shared @/api/types|mappers) to avoid
 * cross-domain collisions, per project convention.
 *
 * Endpoints (all under /api/v1, all SUPER_ADMIN-gated):
 *   GET /admin/activity-logs         — paginated audit feed (ActivityLogResponseDto[])
 *   GET /admin/activity-logs/export  — CSV (raw fetch — text/csv, not the envelope)
 *
 * Query filters (ActivityLogQueryDto extends PaginationDto):
 *   page, limit, sortBy(createdAt|action|entityType), sortOrder(asc|desc),
 *   action, entityType, actorId.
 *
 * Field mapping (backend ActivityLogResponseDto -> frontend ActivityLogVM):
 *   1:1; `details` defaults to {} and Date fields arrive as ISO strings.
 */
import { useQuery } from "@tanstack/react-query";
import { apiClient, BASE_URL, type QueryParams } from "@/api/client";
import { useAuthStore } from "@/stores/authStore";

// ── Backend wire shape (inside the envelope's `data`). ──
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

// ── Frontend domain shape. ──
export interface ActivityLogVM {
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

// ── Boundary mapper. ──
export function mapActivityLog(l: BackendActivityLog): ActivityLogVM {
  return {
    id: l.id,
    actorId: l.actorId,
    actorName: l.actorName,
    action: l.action,
    entityType: l.entityType,
    entityId: l.entityId,
    details: l.details ?? {},
    ipAddress: l.ipAddress,
    createdAt: l.createdAt,
  };
}

// ── List query params (server-supported subset of ActivityLogQueryDto). ──
export interface ActivityLogListParams {
  page?: number;
  limit?: number;
  sortBy?: "createdAt" | "action" | "entityType";
  sortOrder?: "asc" | "desc";
  action?: string;
  entityType?: string;
  actorId?: string;
}

export function toActivityLogQuery(p: ActivityLogListParams): QueryParams {
  return {
    page: p.page,
    limit: p.limit,
    sortBy: p.sortBy,
    sortOrder: p.sortOrder,
    action: p.action?.trim() || undefined,
    entityType: p.entityType?.trim() || undefined,
    actorId: p.actorId?.trim() || undefined,
  };
}

export interface ActivityLogListResult {
  logs: ActivityLogVM[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const activityLogsApi = {
  /** Admin — paginated audit feed. */
  async list(params: ActivityLogListParams = {}): Promise<ActivityLogListResult> {
    const { data, meta } = await apiClient.getPaginated<BackendActivityLog>(
      "/admin/activity-logs",
      { params: toActivityLogQuery(params) },
    );
    return {
      logs: data.map(mapActivityLog),
      total: meta.total,
      page: meta.page,
      limit: meta.limit,
      totalPages: meta.totalPages ?? 1,
    };
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

/** Export the filtered audit feed as CSV and trigger a browser save. */
export async function exportActivityLogsCsv(params: ActivityLogListParams = {}): Promise<void> {
  const url = buildExportUrl("/admin/activity-logs/export", toActivityLogQuery(params));
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
  a.download = `activity-logs-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(objectUrl);
}

// ── Query keys ──
export const activityLogKeys = {
  all: ["activity-logs"] as const,
  list: (params: ActivityLogListParams) => [...activityLogKeys.all, "list", params] as const,
};

// ── Hooks ──

/** Admin paginated audit feed. */
export function useActivityLogs(params: ActivityLogListParams = {}) {
  return useQuery({
    queryKey: activityLogKeys.list(params),
    queryFn: () => activityLogsApi.list(params),
    staleTime: 15_000,
  });
}
