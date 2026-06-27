/**
 * USER ANALYTICS domain — self-contained API module.
 *
 * Personal performance + Gaussian percentile analytics for the signed-in user.
 * Both endpoints are feature-gated for trial users: when the user lacks the
 * feature the backend returns a "locked teaser" envelope instead of a hard
 * error, so the UI can render an upgrade prompt. Each hook surfaces that locked
 * state through a `locked` flag on the result.
 *
 * Endpoints (all under /api/v1):
 *   GET /users/me/analytics    — PerformanceAnalytics  (feature: performance_analytics)
 *   GET /users/me/percentile   — PercentileAnalytics   (feature: gaussian_percentile)
 *   GET /analytics/me          — PerformanceAnalytics  (ungated; empty arrays for
 *                                new users) — used for always-on dashboard widgets.
 *
 * Locked shape (returned in the envelope `data` when gated):
 *   { locked: true, feature: string, message: string }
 *
 * Do NOT edit the shared client/mappers/types — kept local per convention.
 */
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/api/client";

// ── Locked teaser (shared shape across feature-gated endpoints) ──
export interface LockedResponse {
  locked: true;
  feature: string;
  message: string;
}

export function isLocked(value: unknown): value is LockedResponse {
  return (
    typeof value === "object" && value !== null && (value as { locked?: unknown }).locked === true
  );
}

// ── Backend wire shapes (mirror analytics interfaces/index.ts) ──

/** Accuracy breakdown for one grouping key (subject or difficulty). */
export interface BackendBreakdownItem {
  key: string;
  answered: number;
  correct: number;
  accuracy: number;
}

export interface BackendSessionTimelineItem {
  id: string;
  completedAt: string | null;
  scorePercentage: number;
  bankId: string;
}

export interface BackendPerformanceAnalytics {
  overallAccuracy: number;
  totalSessions: number;
  totalQuestions: number;
  totalCorrect: number;
  subjectBreakdown: BackendBreakdownItem[];
  difficultyBreakdown: BackendBreakdownItem[];
  sessionTimeline: BackendSessionTimelineItem[];
  strongestAreas: BackendBreakdownItem[];
  weakestAreas: BackendBreakdownItem[];
}

export interface BackendCurvePoint {
  x: number;
  y: number;
}

export interface BackendPercentileAnalytics {
  userScore: number;
  mean: number;
  stdDev: number;
  percentile: number;
  curve: BackendCurvePoint[];
}

// ── Frontend domain shapes (what the UI consumes) ──

export interface BreakdownItem {
  /** Grouping label (subject name or difficulty level). */
  name: string;
  answered: number;
  correct: number;
  /** Accuracy as a whole-number percentage (rounded). */
  pct: number;
}

export interface SessionTimelinePoint {
  id: string;
  completedAt: string | null;
  /** Short M/D label for chart axes (empty when no completedAt). */
  date: string;
  pct: number;
  bankId: string;
}

export interface PerformanceAnalytics {
  overallAccuracy: number;
  totalSessions: number;
  totalQuestions: number;
  totalCorrect: number;
  subjectBreakdown: BreakdownItem[];
  difficultyBreakdown: BreakdownItem[];
  sessionTimeline: SessionTimelinePoint[];
  strongestAreas: BreakdownItem[];
  weakestAreas: BreakdownItem[];
}

export interface CurvePoint {
  x: number;
  y: number;
}

export interface PercentileAnalytics {
  /** The user's mean completed-session score. */
  userScore: number;
  /** Population mean. */
  mean: number;
  /** Population standard deviation. */
  stdDev: number;
  /** Empirical percentile (share of users at or below the user). */
  percentile: number;
  curve: CurvePoint[];
}

// ── Boundary mappers ──

function round(n: number): number {
  return Math.round(n);
}

function shortDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function mapBreakdown(b: BackendBreakdownItem): BreakdownItem {
  return { name: b.key, answered: b.answered, correct: b.correct, pct: round(b.accuracy) };
}

export function mapPerformance(p: BackendPerformanceAnalytics): PerformanceAnalytics {
  return {
    overallAccuracy: round(p.overallAccuracy),
    totalSessions: p.totalSessions,
    totalQuestions: p.totalQuestions,
    totalCorrect: p.totalCorrect,
    subjectBreakdown: p.subjectBreakdown.map(mapBreakdown),
    difficultyBreakdown: p.difficultyBreakdown.map(mapBreakdown),
    sessionTimeline: p.sessionTimeline.map((s) => ({
      id: s.id,
      completedAt: s.completedAt,
      date: shortDate(s.completedAt),
      pct: round(s.scorePercentage),
      bankId: s.bankId,
    })),
    strongestAreas: p.strongestAreas.map(mapBreakdown),
    weakestAreas: p.weakestAreas.map(mapBreakdown),
  };
}

export function mapPercentile(p: BackendPercentileAnalytics): PercentileAnalytics {
  return {
    userScore: p.userScore,
    mean: p.mean,
    stdDev: p.stdDev,
    percentile: p.percentile,
    curve: p.curve,
  };
}

// ── Result wrappers (data | locked teaser) ──
export type PerformanceResult =
  | { locked: false; data: PerformanceAnalytics }
  | { locked: true; teaser: LockedResponse };

export type PercentileResult =
  | { locked: false; data: PercentileAnalytics }
  | { locked: true; teaser: LockedResponse };

// ── Endpoint functions ──
export const analyticsApi = {
  async getPerformance(): Promise<PerformanceResult> {
    const raw = await apiClient.get<BackendPerformanceAnalytics | LockedResponse>(
      "/users/me/analytics",
    );
    if (isLocked(raw)) return { locked: true, teaser: raw };
    return { locked: false, data: mapPerformance(raw) };
  },

  async getPercentile(): Promise<PercentileResult> {
    const raw = await apiClient.get<BackendPercentileAnalytics | LockedResponse>(
      "/users/me/percentile",
    );
    if (isLocked(raw)) return { locked: true, teaser: raw };
    return { locked: false, data: mapPercentile(raw) };
  },

  /**
   * Ungated personal performance — always returns real data (empty arrays for a
   * brand-new user), never a locked teaser. Drives the dashboard widgets that
   * must stay visible (and honest) regardless of subscription tier.
   */
  async getPerformanceMe(): Promise<PerformanceAnalytics> {
    const raw = await apiClient.get<BackendPerformanceAnalytics>("/analytics/me");
    return mapPerformance(raw);
  },
};

// ── Query keys ──
export const analyticsKeys = {
  all: ["me-analytics"] as const,
  performance: () => [...analyticsKeys.all, "performance"] as const,
  percentile: () => [...analyticsKeys.all, "percentile"] as const,
  performanceMe: () => [...analyticsKeys.all, "performance-me"] as const,
};

// ── Hooks ──

/** Personal performance analytics (or a locked teaser for trial users). */
export function useMyAnalytics() {
  return useQuery({
    queryKey: analyticsKeys.performance(),
    queryFn: analyticsApi.getPerformance,
    staleTime: 60_000,
  });
}

/** Gaussian percentile analytics (or a locked teaser for trial users). */
export function useMyPercentile() {
  return useQuery({
    queryKey: analyticsKeys.percentile(),
    queryFn: analyticsApi.getPercentile,
    staleTime: 60_000,
  });
}

/**
 * Ungated personal performance for always-on dashboard widgets. Returns real
 * data (with empty arrays for a brand-new user) rather than a locked teaser.
 */
export function useMyPerformance() {
  return useQuery({
    queryKey: analyticsKeys.performanceMe(),
    queryFn: analyticsApi.getPerformanceMe,
    staleTime: 60_000,
  });
}
