/**
 * ADMIN-ANALYTICS domain — self-contained API module.
 *
 * Wires the platform KPI dashboard + the granular admin analytics endpoints into
 * TanStack Query hooks. Backend wire types + boundary helpers live HERE (not in
 * the shared @/api/types|mappers) to avoid cross-domain collisions, per project
 * convention.
 *
 * Endpoints (all under /api/v1, all @Roles(SUPER_ADMIN)):
 *   GET /admin/dashboard                       — AdminService dashboard KPIs (+ recentActivity)
 *   GET /admin/analytics/dashboard             — AdminAnalytics dashboard KPIs (avgScore, …)
 *   GET /admin/analytics/engagement            — DAU/WAU/MAU, stickiness, dropout, daily series
 *   GET /admin/analytics/completion-rate       — overall + daily completion-rate series
 *   GET /admin/analytics/new-users             — today / 7d / 30d + daily series
 *   GET /admin/analytics/churn                 — active/cancelled/expired + monthly churn
 *   GET /admin/analytics/plan-distribution     — active-by-plan + by-status
 *   GET /admin/analytics/content               — subject + topic performance
 *   GET /admin/analytics/specialties           — users grouped by specialty
 *   GET /admin/analytics/status-counts         — user status tallies
 *   GET /admin/analytics/quiz-performance      — mode split, avg time, hardest/easiest
 *
 * The backend already returns clean numeric series; the boundary mappers below
 * mostly RELABEL series fields to the keys the recharts components consume
 * (e.g. DailyCountPoint{day,count} -> {day,count}; KeyedCount{key,count} ->
 * {name,value,fill}). No data is invented — anything the backend doesn't expose
 * is recorded as a GAP in the route files.
 */
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/api/client";

// ── Shared backend series primitives (mirror analytics/interfaces). ──
export interface MonthlyCountPoint {
  /** ISO `YYYY-MM`. */
  month: string;
  count: number;
}

export interface DailyCountPoint {
  /** ISO `YYYY-MM-DD`. */
  day: string;
  count: number;
}

export interface DailyRatePoint {
  day: string;
  /** Percentage (0–100). */
  rate: number;
}

export interface KeyedCount {
  key: string;
  count: number;
}

export interface KeyedAvgTime {
  key: string;
  avgTimeSeconds: number;
  answered: number;
}

// ── /admin/dashboard (AdminService.getDashboard). ──
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

export interface BackendAdminDashboard {
  totalUsers: number;
  activeUsers: number;
  newUsersThisMonth: number;
  totalBanks: number;
  totalQuestions: number;
  totalSessions: number;
  completedSessions: number;
  activeSubscriptions: number;
  totalRevenue: number;
  pendingFlags: number;
  recentActivity: BackendActivityLog[];
}

// ── /admin/analytics/dashboard (AdminAnalyticsService.getDashboard). ──
export interface BackendAnalyticsDashboard {
  totalUsers: number;
  activeUsers: number;
  totalSessions: number;
  completedSessions: number;
  totalQuestions: number;
  totalRevenue: number;
  activeSubscriptions: number;
  /** Mean completed-session score, as a percentage. */
  avgScore: number;
}

// ── /admin/analytics/engagement. ──
export interface BackendEngagement {
  dau: number;
  wau: number;
  mau: number;
  stickiness: number;
  avgSessionDurationSeconds: number;
  dropoutRate: number;
  newUsers: number;
  returningUsers: number;
  dailyActiveSeries: DailyCountPoint[];
}

// ── /admin/analytics/completion-rate. ──
export interface BackendCompletionRate {
  overallCompletionRate: number;
  totalCompleted: number;
  totalAbandoned: number;
  series: DailyRatePoint[];
}

// ── /admin/analytics/new-users. ──
export interface BackendNewUsers {
  last30Days: number;
  last7Days: number;
  today: number;
  series: DailyCountPoint[];
}

// ── /admin/analytics/churn. ──
export interface BackendChurn {
  activeSubscriptions: number;
  cancelledLast30Days: number;
  expiredLast30Days: number;
  churnRate: number;
  monthlyChurn: MonthlyCountPoint[];
}

// ── /admin/analytics/plan-distribution. ──
export interface BackendPlanDistribution {
  activeByPlan: KeyedCount[];
  byStatus: KeyedCount[];
  totalActive: number;
}

// ── /admin/analytics/content. ──
export interface BackendSubjectPerformance {
  subject: string;
  answered: number;
  correct: number;
  accuracy: number;
}

export interface BackendTopicPerformance {
  subject: string;
  topic: string;
  answered: number;
  correct: number;
  accuracy: number;
}

export interface BackendContent {
  subjectPerformance: BackendSubjectPerformance[];
  topTopics: BackendTopicPerformance[];
  lowestTopics: BackendTopicPerformance[];
}

// ── /admin/analytics/specialties. ──
export interface BackendSpecialties {
  distribution: KeyedCount[];
  totalUsers: number;
}

// ── /admin/analytics/status-counts. ──
export interface BackendStatusCounts {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  emailVerifiedUsers: number;
  emailUnverifiedUsers: number;
  trialUsers: number;
  subscribedUsers: number;
}

// ── /admin/analytics/quiz-performance. ──
export interface BackendQuestionPerformance {
  id: string;
  subject: string;
  topic: string | null;
  difficulty: string;
  timesAnswered: number;
  timesCorrect: number;
  accuracy: number;
}

export interface BackendQuizPerformance {
  modeSplit: KeyedCount[];
  avgAnswerTimeSeconds: number;
  avgTimeByDifficulty: KeyedAvgTime[];
  hardestQuestions: BackendQuestionPerformance[];
  easiestQuestions: BackendQuestionPerformance[];
}

// ───────────────────────────────────────────────────────────────────────────
// Boundary helpers — relabel series to the recharts component inputs.
// ───────────────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/** `2026-06` -> `Jun`. Falls back to the raw label when unparseable. */
export function monthLabel(iso: string): string {
  const m = /^(\d{4})-(\d{2})$/.exec(iso);
  if (!m) return iso;
  const idx = Number(m[2]) - 1;
  return MONTH_NAMES[idx] ?? iso;
}

/** `2026-06-24` -> `24` (day-of-month, for dense daily axes). */
export function dayLabel(iso: string): string {
  const m = /^\d{4}-\d{2}-(\d{2})$/.exec(iso);
  return m ? String(Number(m[1])) : iso;
}

const PLAN_LABELS: Record<string, string> = {
  monthly: "Monthly",
  three_months: "3-Month",
  six_months: "6-Month",
  twelve_months: "12-Month",
  free_trial: "Free Trial",
};

/** Pretty plan label from the backend enum key (passthrough otherwise). */
export function planLabel(key: string): string {
  return PLAN_LABELS[key] ?? key;
}

const STATUS_LABELS: Record<string, string> = {
  active: "Active",
  cancelled: "Cancelled",
  expired: "Expired",
  pending: "Pending",
  trial: "Trial",
};

export function statusLabel(key: string): string {
  return STATUS_LABELS[key] ?? key.charAt(0).toUpperCase() + key.slice(1);
}

const DIFFICULTY_LABELS: Record<string, string> = {
  easy: "Beginner",
  medium: "Intermediate",
  hard: "Advanced",
};

export function difficultyLabel(key: string): string {
  return DIFFICULTY_LABELS[key] ?? key;
}

/** Stable palette reused for pie/category fills. */
export const CHART_PALETTE = [
  "#0E7C7B",
  "#2BC97F",
  "#3B82F6",
  "#E89A1A",
  "#7C3AED",
  "#E11D48",
  "#15A89C",
  "#6366F1",
] as const;

// ───────────────────────────────────────────────────────────────────────────
// API surface.
// ───────────────────────────────────────────────────────────────────────────

export const adminAnalyticsApi = {
  getDashboard: () => apiClient.get<BackendAdminDashboard>("/admin/dashboard"),
  getAnalyticsDashboard: () =>
    apiClient.get<BackendAnalyticsDashboard>("/admin/analytics/dashboard"),
  getEngagement: () => apiClient.get<BackendEngagement>("/admin/analytics/engagement"),
  getCompletionRate: () => apiClient.get<BackendCompletionRate>("/admin/analytics/completion-rate"),
  getNewUsers: () => apiClient.get<BackendNewUsers>("/admin/analytics/new-users"),
  getChurn: () => apiClient.get<BackendChurn>("/admin/analytics/churn"),
  getPlanDistribution: () =>
    apiClient.get<BackendPlanDistribution>("/admin/analytics/plan-distribution"),
  getContent: () => apiClient.get<BackendContent>("/admin/analytics/content"),
  getSpecialties: () => apiClient.get<BackendSpecialties>("/admin/analytics/specialties"),
  getStatusCounts: () => apiClient.get<BackendStatusCounts>("/admin/analytics/status-counts"),
  getQuizPerformance: () =>
    apiClient.get<BackendQuizPerformance>("/admin/analytics/quiz-performance"),
};

// ── Query keys ──
export const adminAnalyticsKeys = {
  all: ["admin-analytics"] as const,
  dashboard: () => [...adminAnalyticsKeys.all, "dashboard"] as const,
  analyticsDashboard: () => [...adminAnalyticsKeys.all, "analytics-dashboard"] as const,
  engagement: () => [...adminAnalyticsKeys.all, "engagement"] as const,
  completionRate: () => [...adminAnalyticsKeys.all, "completion-rate"] as const,
  newUsers: () => [...adminAnalyticsKeys.all, "new-users"] as const,
  churn: () => [...adminAnalyticsKeys.all, "churn"] as const,
  planDistribution: () => [...adminAnalyticsKeys.all, "plan-distribution"] as const,
  content: () => [...adminAnalyticsKeys.all, "content"] as const,
  specialties: () => [...adminAnalyticsKeys.all, "specialties"] as const,
  statusCounts: () => [...adminAnalyticsKeys.all, "status-counts"] as const,
  quizPerformance: () => [...adminAnalyticsKeys.all, "quiz-performance"] as const,
};

const STALE = 60_000;

// ── Hooks ──

export function useAdminDashboard() {
  return useQuery({
    queryKey: adminAnalyticsKeys.dashboard(),
    queryFn: adminAnalyticsApi.getDashboard,
    staleTime: STALE,
  });
}

export function useAnalyticsDashboard() {
  return useQuery({
    queryKey: adminAnalyticsKeys.analyticsDashboard(),
    queryFn: adminAnalyticsApi.getAnalyticsDashboard,
    staleTime: STALE,
  });
}

export function useEngagementAnalytics() {
  return useQuery({
    queryKey: adminAnalyticsKeys.engagement(),
    queryFn: adminAnalyticsApi.getEngagement,
    staleTime: STALE,
  });
}

export function useCompletionRateAnalytics() {
  return useQuery({
    queryKey: adminAnalyticsKeys.completionRate(),
    queryFn: adminAnalyticsApi.getCompletionRate,
    staleTime: STALE,
  });
}

export function useNewUsersAnalytics() {
  return useQuery({
    queryKey: adminAnalyticsKeys.newUsers(),
    queryFn: adminAnalyticsApi.getNewUsers,
    staleTime: STALE,
  });
}

export function useChurnAnalytics() {
  return useQuery({
    queryKey: adminAnalyticsKeys.churn(),
    queryFn: adminAnalyticsApi.getChurn,
    staleTime: STALE,
  });
}

export function usePlanDistributionAnalytics() {
  return useQuery({
    queryKey: adminAnalyticsKeys.planDistribution(),
    queryFn: adminAnalyticsApi.getPlanDistribution,
    staleTime: STALE,
  });
}

export function useContentAnalytics() {
  return useQuery({
    queryKey: adminAnalyticsKeys.content(),
    queryFn: adminAnalyticsApi.getContent,
    staleTime: STALE,
  });
}

export function useSpecialtyAnalytics() {
  return useQuery({
    queryKey: adminAnalyticsKeys.specialties(),
    queryFn: adminAnalyticsApi.getSpecialties,
    staleTime: STALE,
  });
}

export function useStatusCountsAnalytics() {
  return useQuery({
    queryKey: adminAnalyticsKeys.statusCounts(),
    queryFn: adminAnalyticsApi.getStatusCounts,
    staleTime: STALE,
  });
}

export function useQuizPerformanceAnalytics() {
  return useQuery({
    queryKey: adminAnalyticsKeys.quizPerformance(),
    queryFn: adminAnalyticsApi.getQuizPerformance,
    staleTime: STALE,
  });
}
