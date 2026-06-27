/**
 * DASHBOARD domain — self-contained API module.
 *
 * Backend wire types + boundary mapper + endpoint function + TanStack Query
 * hook. Kept inside this file (not in the shared @/api/types|mappers) to avoid
 * cross-domain collisions, per project convention.
 *
 * Endpoint (under /api/v1):
 *   GET /dashboard/summary — aggregated KPIs + study streak + recent sessions +
 *                            recommended banks for the signed-in user.
 *
 * Field mapping (DashboardSummaryDto -> DashboardSummary view model):
 *   recentSessions[].mode/status: lowercased backend enums mapped to the
 *     uppercase display unions the rest of the UI uses.
 *   recommendedBanks[].subject <- categoryName ; subjectColor/accentHex derived
 *     client-side via subjectTheme (same as banks.api).
 *
 * GAP: the backend does not expose per-day weekly activity, subject/topic
 * breakdowns, or leaderboard rows — those dashboard widgets remain on stable
 * module-scope placeholders until backend support lands.
 */
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import { subjectTheme } from "@/data/subjectColors";

// ── Backend enums (mirror src/database/entities/enums.ts). ──
export type BackendSessionMode = "tutor" | "quiz";
export type BackendSessionStatus = "in_progress" | "completed" | "abandoned" | "expired";

// ── Display unions (match quiz.api / the rest of the UI). ──
export type DisplayMode = "TUTOR" | "QUIZ";
export type DisplayStatus = "IN_PROGRESS" | "COMPLETED" | "ABANDONED" | "EXPIRED";

const MODE_TO_DISPLAY: Record<BackendSessionMode, DisplayMode> = {
  tutor: "TUTOR",
  quiz: "QUIZ",
};

const STATUS_TO_DISPLAY: Record<BackendSessionStatus, DisplayStatus> = {
  in_progress: "IN_PROGRESS",
  completed: "COMPLETED",
  abandoned: "ABANDONED",
  expired: "EXPIRED",
};

// ── Backend wire shapes (DashboardSummaryDto). ──
interface BackendKpis {
  totalSessions: number;
  completedSessions: number;
  inProgressSessions: number;
  totalQuestionsAnswered: number;
  totalCorrect: number;
  accuracy: number;
  averageScore: number;
}

interface BackendStudyStreak {
  current: number;
  longest: number;
  lastActiveDay: string | null;
  activeToday: boolean;
}

interface BackendRecentSession {
  id: string;
  bankId: string;
  bankName: string | null;
  mode: BackendSessionMode;
  status: BackendSessionStatus;
  totalQuestions: number;
  answeredCount: number;
  correctCount: number;
  scorePercentage: number | null;
  startedAt: string;
  completedAt: string | null;
}

interface BackendRecommendedBank {
  id: string;
  name: string;
  description: string | null;
  categoryId: string;
  categoryName: string | null;
  examType: string | null;
  coverImageUrl: string | null;
  totalQuestions: number;
  difficulty: string;
}

interface BackendDashboardSummary {
  kpis: BackendKpis;
  studyStreak: BackendStudyStreak;
  recentSessions: BackendRecentSession[];
  recommendedBanks: BackendRecommendedBank[];
}

// ── Frontend domain shapes. ──
export interface DashboardKpis {
  totalSessions: number;
  completedSessions: number;
  inProgressSessions: number;
  totalQuestionsAnswered: number;
  totalCorrect: number;
  accuracy: number;
  averageScore: number;
}

export interface StudyStreak {
  current: number;
  longest: number;
  lastActiveDay: string | null;
  activeToday: boolean;
}

export interface RecentSession {
  id: string;
  bankId: string;
  bankName: string;
  mode: DisplayMode;
  status: DisplayStatus;
  inProgress: boolean;
  totalQuestions: number;
  answeredCount: number;
  correctCount: number;
  /** scorePercentage (0 when null). */
  scorePct: number;
  startedAt: string;
  completedAt: string | null;
}

export interface RecommendedBank {
  id: string;
  name: string;
  description: string;
  subject: string;
  categoryId: string;
  /** Tailwind gradient class derived from subject (matches bank cards). */
  subjectColor: string;
  accentHex: string;
  examType: string;
  coverImageUrl: string | null;
  questionCount: number;
  difficulty: string;
}

export interface DashboardSummary {
  kpis: DashboardKpis;
  studyStreak: StudyStreak;
  recentSessions: RecentSession[];
  recommendedBanks: RecommendedBank[];
}

function gradientFromHex(hex: string): string {
  return `from-[${hex}] to-[${hex}]`;
}

function mapRecentSession(s: BackendRecentSession): RecentSession {
  const status = STATUS_TO_DISPLAY[s.status] ?? "COMPLETED";
  return {
    id: s.id,
    bankId: s.bankId,
    bankName: s.bankName ?? `${s.totalQuestions}-question session`,
    mode: MODE_TO_DISPLAY[s.mode] ?? "QUIZ",
    status,
    inProgress: status === "IN_PROGRESS",
    totalQuestions: s.totalQuestions,
    answeredCount: s.answeredCount,
    correctCount: s.correctCount,
    scorePct: Math.round(s.scorePercentage ?? 0),
    startedAt: s.startedAt,
    completedAt: s.completedAt,
  };
}

function mapRecommendedBank(b: BackendRecommendedBank): RecommendedBank {
  const subject = b.categoryName ?? "Uncategorized";
  const theme = subjectTheme(subject);
  return {
    id: b.id,
    name: b.name,
    description: b.description ?? "",
    subject,
    categoryId: b.categoryId,
    subjectColor: gradientFromHex(theme.hex),
    accentHex: theme.hex,
    examType: b.examType ?? "",
    coverImageUrl: b.coverImageUrl,
    questionCount: b.totalQuestions,
    difficulty: b.difficulty,
  };
}

// ── Boundary mapper. ──
export function mapDashboardSummary(s: BackendDashboardSummary): DashboardSummary {
  return {
    kpis: s.kpis,
    studyStreak: s.studyStreak,
    recentSessions: s.recentSessions.map(mapRecentSession),
    recommendedBanks: s.recommendedBanks.map(mapRecommendedBank),
  };
}

export const dashboardApi = {
  async getSummary(): Promise<DashboardSummary> {
    const data = await apiClient.get<BackendDashboardSummary>("/dashboard/summary");
    return mapDashboardSummary(data);
  },
};

// ── Query keys ──
export const dashboardKeys = {
  all: ["dashboard"] as const,
  summary: () => [...dashboardKeys.all, "summary"] as const,
};

// ── Hooks ──

/** Aggregated dashboard summary for the signed-in user. */
export function useDashboardSummary() {
  return useQuery({
    queryKey: dashboardKeys.summary(),
    queryFn: dashboardApi.getSummary,
    staleTime: 30_000,
  });
}
