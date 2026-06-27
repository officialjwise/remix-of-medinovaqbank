/**
 * ADMIN-SESSIONS domain — self-contained API module (device session monitor).
 *
 * Wires the super-admin device-session endpoints (all under /api/v1):
 *   GET    /admin/sessions               — active sessions across users (paginated)
 *   GET    /admin/sessions/suspicious    — flagged sessions (paginated)
 *   POST   /admin/sessions/:id/terminate — force-terminate a session
 *   DELETE /admin/users/:id/device-lock  — clear a user's trial device lock
 *
 * Backend wire types + boundary mapper live HERE (not in shared @/api/types or
 * @/api/mappers) to avoid cross-domain collisions, per project convention.
 *
 * The `DeviceSessionResponseDto.deviceFingerprint` arrives already truncated
 * (first 12 chars + ellipsis) from the backend.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/api/client";

// ── Backend wire shape (mirrors DeviceSessionResponseDto). ──
export interface BackendDeviceSession {
  id: string;
  userId: string;
  userName: string | null;
  userEmail: string | null;
  deviceFingerprint: string;
  userAgent: string | null;
  ipAddress: string | null;
  country: string | null;
  countryCode: string | null;
  region: string | null;
  city: string | null;
  deviceType: string | null;
  browser: string | null;
  os: string | null;
  currentActivity: string;
  loginAt: string;
  lastPingAt: string;
  isActive: boolean;
  isSuspicious: boolean;
  suspiciousReasons: string[] | null;
}

// ── Frontend view model. ──
export interface DeviceSession {
  id: string;
  userId: string;
  userName: string | null;
  userEmail: string | null;
  deviceFingerprint: string;
  userAgent: string | null;
  ipAddress: string | null;
  country: string | null;
  countryCode: string | null;
  region: string | null;
  city: string | null;
  deviceType: string | null;
  browser: string | null;
  os: string | null;
  /** Free-text activity label (e.g. "browsing", "in-quiz"). */
  currentActivity: string;
  loginAt: string;
  lastPingAt: string;
  isActive: boolean;
  isSuspicious: boolean;
  suspiciousReasons: string[];
  // ── Derived display helpers ──
  /** Best human label for the user: name → email → "Unknown user" (never the UUID). */
  userLabel: string;
  /** "City, Country" (or whichever parts are present). */
  locationLabel: string;
  /** Minutes since lastPingAt — drives "active N min ago". */
  lastActivityMinAgo: number;
  /** Minutes between loginAt and now — session duration so far. */
  durationMin: number;
}

function minutesSince(iso: string): number {
  const ms = Date.now() - new Date(iso).getTime();
  return Math.max(0, Math.round(ms / 60_000));
}

function locationLabel(city: string | null, country: string | null): string {
  return [city, country].filter(Boolean).join(", ") || "Unknown";
}

// ── Boundary mapper: backend DTO -> frontend DeviceSession. ──
export function mapSession(s: BackendDeviceSession): DeviceSession {
  return {
    ...s,
    suspiciousReasons: s.suspiciousReasons ?? [],
    userLabel: s.userName?.trim() || s.userEmail?.trim() || "Unknown user",
    locationLabel: locationLabel(s.city, s.country),
    lastActivityMinAgo: minutesSince(s.lastPingAt),
    durationMin: minutesSince(s.loginAt),
  };
}

// ── List params (server-supported subset of PaginationDto). ──
export interface SessionListParams {
  page?: number;
  limit?: number;
  search?: string;
  sortOrder?: "asc" | "desc";
}

function toQuery(p: SessionListParams): Record<string, string | number | undefined> {
  return {
    page: p.page,
    limit: p.limit,
    search: p.search?.trim() || undefined,
    sortOrder: p.sortOrder,
  };
}

export interface SessionListResult {
  sessions: DeviceSession[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ── Admin quiz-session monitor (mirrors AdminQuizSessionResponseDto). ──
export interface BackendAdminQuizSession {
  id: string;
  userId: string;
  userName: string | null;
  userEmail: string | null;
  bankId: string;
  bankName: string | null;
  mode: "tutor" | "quiz";
  status: "in_progress" | "completed" | "abandoned";
  totalQuestions: number;
  answeredCount: number;
  correctCount: number;
  scorePercentage: number | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

/** Frontend view model for the admin "Quiz Sessions" tab. */
export interface AdminQuizSession {
  id: string;
  publicId: string;
  userId: string;
  userName: string;
  initials: string;
  bankId: string;
  bankName: string;
  mode: "TUTOR" | "QUIZ";
  scorePct: number;
  questionsAnswered: number;
  totalQuestions: number;
  status: "completed" | "in-progress" | "abandoned";
  durationMin: number;
  date: string;
}

export interface AdminQuizSessionResult {
  sessions: AdminQuizSession[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

function initialsOf(label: string): string {
  const parts = label.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function mapAdminQuizSession(s: BackendAdminQuizSession): AdminQuizSession {
  const label = s.userName?.trim() || s.userEmail?.trim() || "Unknown user";
  const startMs = s.startedAt ? new Date(s.startedAt).getTime() : null;
  const endMs = s.completedAt ? new Date(s.completedAt).getTime() : Date.now();
  return {
    id: s.id,
    publicId: s.id.slice(0, 8),
    userId: s.userId,
    userName: label,
    initials: initialsOf(label),
    bankId: s.bankId,
    bankName: s.bankName?.trim() || "—",
    mode: s.mode === "tutor" ? "TUTOR" : "QUIZ",
    scorePct: Math.round(s.scorePercentage ?? 0),
    questionsAnswered: s.answeredCount,
    totalQuestions: s.totalQuestions,
    status:
      s.status === "in_progress"
        ? "in-progress"
        : s.status === "abandoned"
          ? "abandoned"
          : "completed",
    durationMin: startMs ? Math.max(0, Math.round((endMs - startMs) / 60_000)) : 0,
    date: s.completedAt ?? s.createdAt,
  };
}

export const adminSessionsApi = {
  /** Active sessions across all users (paginated). */
  async listActive(params: SessionListParams = {}): Promise<SessionListResult> {
    const { data, meta } = await apiClient.getPaginated<BackendDeviceSession>("/admin/sessions", {
      params: toQuery({ limit: 50, ...params }),
    });
    return {
      sessions: data.map(mapSession),
      total: meta.total,
      page: meta.page,
      limit: meta.limit,
      totalPages: meta.totalPages ?? 1,
    };
  },

  /** Flagged / suspicious sessions (paginated). */
  async listSuspicious(params: SessionListParams = {}): Promise<SessionListResult> {
    const { data, meta } = await apiClient.getPaginated<BackendDeviceSession>(
      "/admin/sessions/suspicious",
      { params: toQuery({ limit: 50, ...params }) },
    );
    return {
      sessions: data.map(mapSession),
      total: meta.total,
      page: meta.page,
      limit: meta.limit,
      totalPages: meta.totalPages ?? 1,
    };
  },

  /** Full device-session history across users (active + ended), newest first. */
  async listHistory(params: SessionListParams = {}): Promise<SessionListResult> {
    const { data, meta } = await apiClient.getPaginated<BackendDeviceSession>(
      "/admin/sessions/history",
      { params: toQuery({ limit: 50, ...params }) },
    );
    return {
      sessions: data.map(mapSession),
      total: meta.total,
      page: meta.page,
      limit: meta.limit,
      totalPages: meta.totalPages ?? 1,
    };
  },

  /** Every user's quiz sessions, newest first (cross-user monitor). */
  async listQuizSessions(params: SessionListParams = {}): Promise<AdminQuizSessionResult> {
    const { data, meta } = await apiClient.getPaginated<BackendAdminQuizSession>(
      "/admin/quiz-sessions",
      { params: toQuery({ limit: 50, ...params }) },
    );
    return {
      sessions: data.map(mapAdminQuizSession),
      total: meta.total,
      page: meta.page,
      limit: meta.limit,
      totalPages: meta.totalPages ?? 1,
    };
  },

  /** Force-terminate a session (marks it inactive). */
  async terminate(sessionId: string): Promise<void> {
    await apiClient.post<null>(`/admin/sessions/${sessionId}/terminate`);
  },

  /** Clear a user's trial device lock so they can re-bind on next login. */
  async clearDeviceLock(userId: string): Promise<void> {
    await apiClient.delete<null>(`/admin/users/${userId}/device-lock`);
  },
};

// ── Query keys ──
export const sessionKeys = {
  all: ["admin-sessions"] as const,
  active: (params: SessionListParams) => [...sessionKeys.all, "active", params] as const,
  suspicious: (params: SessionListParams) => [...sessionKeys.all, "suspicious", params] as const,
  history: (params: SessionListParams) => [...sessionKeys.all, "history", params] as const,
  quiz: (params: SessionListParams) => [...sessionKeys.all, "quiz", params] as const,
};

// ── Hooks ──

export function useSessionHistory(params: SessionListParams = {}) {
  return useQuery({
    queryKey: sessionKeys.history(params),
    queryFn: () => adminSessionsApi.listHistory(params),
    staleTime: 15_000,
  });
}

export function useAdminQuizSessions(params: SessionListParams = {}) {
  return useQuery({
    queryKey: sessionKeys.quiz(params),
    queryFn: () => adminSessionsApi.listQuizSessions(params),
    staleTime: 15_000,
  });
}

export function useActiveSessions(params: SessionListParams = {}) {
  return useQuery({
    queryKey: sessionKeys.active(params),
    queryFn: () => adminSessionsApi.listActive(params),
    staleTime: 15_000,
    refetchInterval: 30_000,
  });
}

export function useSuspiciousSessions(params: SessionListParams = {}) {
  return useQuery({
    queryKey: sessionKeys.suspicious(params),
    queryFn: () => adminSessionsApi.listSuspicious(params),
    staleTime: 30_000,
  });
}

function useInvalidateSessions() {
  const qc = useQueryClient();
  return () => void qc.invalidateQueries({ queryKey: sessionKeys.all });
}

export function useTerminateSession() {
  const invalidate = useInvalidateSessions();
  return useMutation({
    mutationFn: (sessionId: string) => adminSessionsApi.terminate(sessionId),
    onSuccess: invalidate,
  });
}

export function useClearDeviceLock() {
  const invalidate = useInvalidateSessions();
  return useMutation({
    mutationFn: (userId: string) => adminSessionsApi.clearDeviceLock(userId),
    onSuccess: invalidate,
  });
}
