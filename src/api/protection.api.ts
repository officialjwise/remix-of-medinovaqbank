/**
 * PROTECTION domain — self-contained API module (content-protection audit +
 * enforcement, plus the admin reported-question / flag review queue).
 *
 * Wires (all under /api/v1, super_admin scope):
 *   - GET   /admin/restrictions                    (paginated; active/userId filters)
 *   - POST  /admin/restrictions/:id/lift           (lift a restriction early)
 *   - GET   /admin/protection-events               (paginated event log; filters)
 *   - GET   /admin/protection-events/summary       (aggregate snapshot)
 *   - GET   /admin/protection-events/top-offenders (ranked offenders)
 *   - GET   /admin/flags                           (reported-question review queue)
 *   - PATCH /admin/flags/:id/review                (mark a flag reviewed)
 *
 * Backend wire types + boundary mappers + TanStack Query hooks live HERE.
 *
 * GAPS (backend DTOs do not provide these):
 *   - Restrictions/events/top-offenders/flags expose only `userId` — NO user
 *     name/email. Screens that previously showed a name fall back to userId.
 *   - Restriction status is derived client-side from isActive + restrictedUntil
 *     + liftedAt (no single status field on the DTO).
 *   - Events carry no geo "location"; only ipAddress is available.
 *   - Top-offenders has no name/email; only userId + counts.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/api/client";

/* ================================================================== */
/* Restrictions                                                        */
/* ================================================================== */

export type BackendRestrictionReason = "content_protection" | "manual";

export interface BackendRestriction {
  id: string;
  userId: string;
  reason: BackendRestrictionReason;
  restrictedAt: string;
  restrictedUntil: string;
  isActive: boolean;
  strikeCount: number;
  liftedAt: string | null;
  liftedById: string | null;
  notes: string | null;
  createdAt: string;
}

export type RestrictionStatus = "active" | "lifted" | "expired";

export const RESTRICTION_REASON_LABELS: Record<BackendRestrictionReason, string> = {
  content_protection: "Content protection",
  manual: "Manual",
};

export interface Restriction {
  id: string;
  userId: string;
  reason: BackendRestrictionReason;
  reasonLabel: string;
  /** True when reason is manual (admin-applied). */
  manual: boolean;
  restrictedAt: string;
  /** When the lock lifts (restrictedUntil). */
  unlockAt: string;
  status: RestrictionStatus;
  isActive: boolean;
  strikes: number;
  liftedAt: string | null;
  liftedById: string | null;
  notes: string | null;
  createdAt: string;
}

/** Derive a display status: lifted > active (not expired) > expired. */
function deriveRestrictionStatus(r: BackendRestriction): RestrictionStatus {
  if (r.liftedAt) return "lifted";
  const expired = new Date(r.restrictedUntil).getTime() <= Date.now();
  if (r.isActive && !expired) return "active";
  return "expired";
}

export function mapRestriction(r: BackendRestriction): Restriction {
  return {
    id: r.id,
    userId: r.userId,
    reason: r.reason,
    reasonLabel: RESTRICTION_REASON_LABELS[r.reason] ?? r.reason,
    manual: r.reason === "manual",
    restrictedAt: r.restrictedAt,
    unlockAt: r.restrictedUntil,
    status: deriveRestrictionStatus(r),
    isActive: r.isActive,
    strikes: r.strikeCount,
    liftedAt: r.liftedAt,
    liftedById: r.liftedById,
    notes: r.notes,
    createdAt: r.createdAt,
  };
}

export interface RestrictionListParams {
  page?: number;
  limit?: number;
  active?: boolean;
  userId?: string;
}

export interface RestrictionListResult {
  restrictions: Restriction[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/* ================================================================== */
/* Protection events                                                   */
/* ================================================================== */

export type BackendProtectionEventType =
  | "screenshot_attempt"
  | "screen_recording_suspected"
  | "copy_attempt"
  | "right_click"
  | "devtools_open"
  | "print_attempt"
  | "page_blur_during_protected";

export type BackendProtectionContext = "quiz_session" | "high_yield_note";

export interface BackendProtectionEvent {
  id: string;
  userId: string;
  eventType: BackendProtectionEventType;
  context: BackendProtectionContext;
  contextId: string | null;
  pageNumber: number | null;
  ipAddress: string | null;
  userAgent: string | null;
  deviceFingerprint: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export const EVENT_TYPE_LABELS: Record<BackendProtectionEventType, string> = {
  screenshot_attempt: "Screenshot attempt",
  screen_recording_suspected: "Screen recording",
  copy_attempt: "Copy attempt",
  right_click: "Right click",
  devtools_open: "DevTools open",
  print_attempt: "Print attempt",
  page_blur_during_protected: "Page blur",
};

export const ALL_EVENT_TYPES = Object.keys(EVENT_TYPE_LABELS) as BackendProtectionEventType[];

export interface ProtectionEvent {
  id: string;
  userId: string;
  type: BackendProtectionEventType;
  typeLabel: string;
  isScreenshot: boolean;
  context: BackendProtectionContext;
  contextLabel: string;
  contextId: string | null;
  page: number | null;
  ip: string;
  userAgent: string | null;
  device: string;
  createdAt: string;
}

const CONTEXT_LABELS: Record<BackendProtectionContext, string> = {
  quiz_session: "Quiz",
  high_yield_note: "Note",
};

export function mapProtectionEvent(e: BackendProtectionEvent): ProtectionEvent {
  return {
    id: e.id,
    userId: e.userId,
    type: e.eventType,
    typeLabel: EVENT_TYPE_LABELS[e.eventType] ?? e.eventType,
    isScreenshot: e.eventType === "screenshot_attempt",
    context: e.context,
    contextLabel: CONTEXT_LABELS[e.context] ?? e.context,
    contextId: e.contextId,
    page: e.pageNumber,
    ip: e.ipAddress ?? "—",
    userAgent: e.userAgent,
    device: e.deviceFingerprint ?? "—",
    createdAt: e.createdAt,
  };
}

export interface ProtectionEventListParams {
  page?: number;
  limit?: number;
  userId?: string;
  eventType?: BackendProtectionEventType;
  context?: BackendProtectionContext;
  from?: string;
  to?: string;
}

export interface ProtectionEventListResult {
  events: ProtectionEvent[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ── Summary ──
export interface ProtectionSummary {
  totalViolations: number;
  screenshotAttempts: number;
  uniqueOffendingUsers: number;
  activeRestrictions: number;
}

// ── Top offenders ──
export interface BackendTopOffender {
  userId: string;
  eventCount: number;
  screenshotAttempts: number;
  lastEventAt: string | null;
}

export interface TopOffender {
  userId: string;
  count: number;
  screenshotAttempts: number;
  lastEventAt: string | null;
}

export function mapTopOffender(o: BackendTopOffender): TopOffender {
  return {
    userId: o.userId,
    count: o.eventCount,
    screenshotAttempts: o.screenshotAttempts,
    lastEventAt: o.lastEventAt,
  };
}

export interface TopOffendersParams {
  page?: number;
  limit?: number;
  from?: string;
  to?: string;
}

/* ================================================================== */
/* Question flags (admin review queue)                                 */
/* ================================================================== */

export type BackendFlagType = "bookmark" | "flag";

export interface BackendQuestionFlag {
  id: string;
  userId: string;
  questionId: string;
  questionText: string | null;
  type: BackendFlagType;
  note: string | null;
  isReviewed: boolean;
  reviewedAt: string | null;
  createdAt: string;
}

export interface QuestionFlag {
  id: string;
  userId: string;
  questionId: string;
  questionText: string;
  type: BackendFlagType;
  note: string;
  isReviewed: boolean;
  reviewedAt: string | null;
  createdAt: string;
}

export function mapQuestionFlag(f: BackendQuestionFlag): QuestionFlag {
  return {
    id: f.id,
    userId: f.userId,
    questionId: f.questionId,
    questionText: f.questionText ?? "",
    type: f.type,
    note: f.note ?? "",
    isReviewed: f.isReviewed,
    reviewedAt: f.reviewedAt,
    createdAt: f.createdAt,
  };
}

export interface FlagListParams {
  page?: number;
  limit?: number;
  isReviewed?: boolean;
}

export interface FlagListResult {
  flags: QuestionFlag[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/* ================================================================== */
/* API                                                                 */
/* ================================================================== */

export const protectionApi = {
  // — Restrictions —
  async listRestrictions(params: RestrictionListParams = {}): Promise<RestrictionListResult> {
    const { data, meta } = await apiClient.getPaginated<BackendRestriction>("/admin/restrictions", {
      params: {
        page: params.page,
        limit: params.limit ?? 100,
        active: params.active,
        userId: params.userId,
      },
    });
    return {
      restrictions: data.map(mapRestriction),
      total: meta.total,
      page: meta.page,
      limit: meta.limit,
      totalPages: meta.totalPages ?? 1,
    };
  },

  async liftRestriction(id: string): Promise<Restriction> {
    const data = await apiClient.post<BackendRestriction>(`/admin/restrictions/${id}/lift`);
    return mapRestriction(data);
  },

  // — Protection events —
  async listEvents(params: ProtectionEventListParams = {}): Promise<ProtectionEventListResult> {
    const { data, meta } = await apiClient.getPaginated<BackendProtectionEvent>(
      "/admin/protection-events",
      {
        params: {
          page: params.page,
          limit: params.limit ?? 100,
          userId: params.userId,
          eventType: params.eventType,
          context: params.context,
          from: params.from,
          to: params.to,
        },
      },
    );
    return {
      events: data.map(mapProtectionEvent),
      total: meta.total,
      page: meta.page,
      limit: meta.limit,
      totalPages: meta.totalPages ?? 1,
    };
  },

  async summary(): Promise<ProtectionSummary> {
    return apiClient.get<ProtectionSummary>("/admin/protection-events/summary");
  },

  async topOffenders(params: TopOffendersParams = {}): Promise<TopOffender[]> {
    const { data } = await apiClient.getPaginated<BackendTopOffender>(
      "/admin/protection-events/top-offenders",
      {
        params: {
          page: params.page,
          limit: params.limit ?? 5,
          from: params.from,
          to: params.to,
        },
      },
    );
    return data.map(mapTopOffender);
  },

  // — Flags —
  async listFlags(params: FlagListParams = {}): Promise<FlagListResult> {
    const { data, meta } = await apiClient.getPaginated<BackendQuestionFlag>("/admin/flags", {
      params: {
        page: params.page,
        limit: params.limit ?? 100,
        isReviewed: params.isReviewed,
      },
    });
    return {
      flags: data.map(mapQuestionFlag),
      total: meta.total,
      page: meta.page,
      limit: meta.limit,
      totalPages: meta.totalPages ?? 1,
    };
  },

  async reviewFlag(id: string): Promise<QuestionFlag> {
    const data = await apiClient.patch<BackendQuestionFlag>(`/admin/flags/${id}/review`);
    return mapQuestionFlag(data);
  },
};

/* ================================================================== */
/* Query keys + hooks                                                  */
/* ================================================================== */

export const protectionKeys = {
  all: ["protection"] as const,
  restrictions: (params: RestrictionListParams) =>
    [...protectionKeys.all, "restrictions", params] as const,
  events: (params: ProtectionEventListParams) => [...protectionKeys.all, "events", params] as const,
  summary: () => [...protectionKeys.all, "summary"] as const,
  topOffenders: (params: TopOffendersParams) =>
    [...protectionKeys.all, "top-offenders", params] as const,
  flags: (params: FlagListParams) => [...protectionKeys.all, "flags", params] as const,
};

export function useRestrictions(params: RestrictionListParams = {}) {
  return useQuery({
    queryKey: protectionKeys.restrictions(params),
    queryFn: () => protectionApi.listRestrictions(params),
    staleTime: 30_000,
  });
}

export function useLiftRestriction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => protectionApi.liftRestriction(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: protectionKeys.all }),
  });
}

export function useProtectionEvents(params: ProtectionEventListParams = {}) {
  return useQuery({
    queryKey: protectionKeys.events(params),
    queryFn: () => protectionApi.listEvents(params),
    staleTime: 30_000,
  });
}

export function useProtectionSummary() {
  return useQuery({
    queryKey: protectionKeys.summary(),
    queryFn: () => protectionApi.summary(),
    staleTime: 30_000,
  });
}

export function useTopOffenders(params: TopOffendersParams = {}) {
  return useQuery({
    queryKey: protectionKeys.topOffenders(params),
    queryFn: () => protectionApi.topOffenders(params),
    staleTime: 30_000,
  });
}

export function useFlags(params: FlagListParams = {}) {
  return useQuery({
    queryKey: protectionKeys.flags(params),
    queryFn: () => protectionApi.listFlags(params),
    staleTime: 30_000,
  });
}

export function useReviewFlag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => protectionApi.reviewFlag(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: protectionKeys.all }),
  });
}
