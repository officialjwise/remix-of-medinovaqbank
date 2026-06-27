/**
 * ADMIN REPORTS domain — self-contained API module.
 *
 * Backend wire types + boundary mapper + endpoint functions + TanStack Query
 * hooks. Kept inside this file (not in the shared @/api/types|mappers) to avoid
 * cross-domain collisions, per project convention.
 *
 * Endpoints (all under /api/v1, all SUPER_ADMIN-gated):
 *   GET    /admin/reports               — report catalog (ReportResponseDto[])
 *   POST   /admin/reports/:id/run       — compute the report, returns ReportRunResult
 *   GET    /admin/reports/:id/export    — CSV (raw fetch — text/csv, not the envelope)
 *   POST   /admin/reports/:id/schedule  — upsert email schedule (ScheduleResponseDto)
 *
 * Field mapping (backend ReportResponseDto -> frontend ReportVM):
 *   1:1 except `lastRunAt`/`createdAt`/`updatedAt` are passed through as ISO
 *   strings (the backend serialises Date -> string over the wire).
 *
 * GAPS:
 *   - The catalog endpoint returns no per-report schedule; the schedule is only
 *     visible in the POST .../schedule response. The UI therefore tracks the
 *     last-saved schedule locally per session (not persisted view-side).
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient, BASE_URL } from "@/api/client";
import { useAuthStore } from "@/stores/authStore";

// ── Backend enums (mirror src/database/entities/report.entity.ts). ──
export type BackendReportType = "users" | "revenue" | "content" | "engagement";

export const ALL_REPORT_TYPES: readonly BackendReportType[] = [
  "users",
  "revenue",
  "content",
  "engagement",
] as const;

export const REPORT_TYPE_LABELS: Record<BackendReportType, string> = {
  users: "Users",
  revenue: "Revenue",
  content: "Content",
  engagement: "Engagement",
};

// ── Backend wire shapes (inside the envelope's `data`). ──
export interface BackendReport {
  id: string;
  name: string;
  description: string | null;
  type: BackendReportType;
  lastRunAt: string | null;
  config: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

/** Flat key/value rows produced by a report computation. */
export type ReportRow = Record<string, string | number>;

export interface BackendReportRunResult {
  reportId: string;
  type: BackendReportType;
  computedAt: string;
  rows: ReportRow[];
}

export interface BackendSchedule {
  id: string;
  reportId: string;
  frequency: string;
  recipients: string[];
  isActive: boolean;
  nextRunAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// ── Frontend domain shapes. ──
export interface ReportVM {
  id: string;
  name: string;
  description: string;
  type: BackendReportType;
  typeLabel: string;
  lastRunAt: string | null;
  config: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface ReportRunResultVM {
  reportId: string;
  type: BackendReportType;
  computedAt: string;
  rows: ReportRow[];
}

export interface ScheduleVM {
  id: string;
  reportId: string;
  frequency: string;
  recipients: string[];
  isActive: boolean;
  nextRunAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// ── Boundary mappers. ──
export function mapReport(r: BackendReport): ReportVM {
  return {
    id: r.id,
    name: r.name,
    description: r.description ?? "",
    type: r.type,
    typeLabel: REPORT_TYPE_LABELS[r.type] ?? r.type,
    lastRunAt: r.lastRunAt,
    config: r.config ?? {},
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

export function mapRunResult(r: BackendReportRunResult): ReportRunResultVM {
  return {
    reportId: r.reportId,
    type: r.type,
    computedAt: r.computedAt,
    rows: r.rows ?? [],
  };
}

export function mapSchedule(s: BackendSchedule): ScheduleVM {
  return {
    id: s.id,
    reportId: s.reportId,
    frequency: s.frequency,
    recipients: s.recipients ?? [],
    isActive: s.isActive,
    nextRunAt: s.nextRunAt,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
  };
}

// ── Write payload (mirrors ScheduleReportDto). ──
export interface ScheduleInput {
  frequency: string;
  recipients: string[];
  isActive?: boolean;
}

export const reportsApi = {
  /** Admin — full report catalog. */
  async getCatalog(): Promise<ReportVM[]> {
    const data = await apiClient.get<BackendReport[]>("/admin/reports");
    return data.map(mapReport);
  },

  /** Admin — compute a report and return its rows. */
  async run(id: string): Promise<ReportRunResultVM> {
    const data = await apiClient.post<BackendReportRunResult>(`/admin/reports/${id}/run`);
    return mapRunResult(data);
  },

  /** Admin — upsert the report's email schedule. */
  async schedule(id: string, input: ScheduleInput): Promise<ScheduleVM> {
    const data = await apiClient.post<BackendSchedule>(`/admin/reports/${id}/schedule`, input);
    return mapSchedule(data);
  },
};

// ── CSV export (raw fetch — endpoint returns text/csv, not the envelope). ──

/**
 * Export a report as CSV and trigger a browser save. The endpoint streams a
 * text/csv body, so it must be hit with a raw fetch carrying the bearer token.
 */
export async function exportReportCsv(id: string, name?: string): Promise<void> {
  const url = `${BASE_URL}/admin/reports/${id}/export`;
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
  const safe = (name ?? "report").replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  a.download = `${safe}-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(objectUrl);
}

// ── Query keys ──
export const reportKeys = {
  all: ["reports"] as const,
  catalog: () => [...reportKeys.all, "catalog"] as const,
};

// ── Hooks ──

/** Admin report catalog. */
export function useReports() {
  return useQuery({
    queryKey: reportKeys.catalog(),
    queryFn: () => reportsApi.getCatalog(),
    staleTime: 30_000,
  });
}

/** Run a report — invalidates the catalog so `lastRunAt` refreshes. */
export function useRunReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => reportsApi.run(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: reportKeys.all }),
  });
}

/** Upsert a report's email schedule. */
export function useScheduleReport() {
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ScheduleInput }) =>
      reportsApi.schedule(id, input),
  });
}
