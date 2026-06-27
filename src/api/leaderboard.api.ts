/**
 * LEADERBOARD domain — self-contained API module.
 *
 * Public rankings + the signed-in user's own standing, filterable by period and
 * bank. Competing (appearing in the rankings) is feature-gated for trial users
 * via `leaderboard_competition`; viewing the board is always allowed. The route
 * shows the upgrade teaser for the gated case using the shared trial hook — the
 * backend leaderboard endpoints themselves return real data (no locked shape).
 *
 * Endpoints (all under /api/v1):
 *   GET /leaderboard         — ranked entries (period/bankId filters, limit-capped)
 *   GET /leaderboard/banks   — banks that have leaderboard data (per-bank tabs)
 *   GET /leaderboard/me      — the current user's rank in the same window
 *
 * Note: GET /leaderboard returns a plain array capped by `limit` (max 100); it
 * is NOT an envelope-paginated list, so pagination is done client-side over the
 * fetched window.
 *
 * Do NOT edit the shared client/mappers/types — kept local per convention.
 */
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/api/client";

// ── Period (mirrors LeaderboardPeriod) ──
export type LeaderboardPeriod = "weekly" | "monthly" | "all_time";

export type RankDirection = "up" | "down" | "same" | "new";

// ── Backend wire shapes (mirror leaderboard interfaces) ──
export interface BackendRankMovement {
  direction: RankDirection;
  delta: number;
}

export interface BackendLeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  avatar: string | null;
  specialty: string | null;
  averageScore: number;
  totalQuestions: number;
  totalSessions: number;
  movement: BackendRankMovement | null;
}

export interface BackendLeaderboardBank {
  bankId: string;
  bankName: string;
  participants: number;
  sessions: number;
}

export interface BackendLeaderboardRank {
  rank: number | null;
  averageScore: number;
  totalQuestions: number;
  totalSessions: number;
  percentile: number;
  totalRanked: number;
  movement: BackendRankMovement | null;
}

// ── Frontend domain shapes ──
export interface RankMovement {
  direction: RankDirection;
  /** Signed positions vs last period; 0 for "same"/"new". */
  delta: number;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  avatar: string | null;
  specialty: string | null;
  /** Mean session score across the window, whole-number percentage. */
  avgScore: number;
  totalQuestions: number;
  totalSessions: number;
  movement: RankMovement | null;
  /** Derived: initials for the avatar chip. */
  initials: string;
}

export interface LeaderboardBank {
  bankId: string;
  bankName: string;
  participants: number;
  sessions: number;
}

export interface MyRank {
  rank: number | null;
  avgScore: number;
  totalQuestions: number;
  totalSessions: number;
  percentile: number;
  totalRanked: number;
  movement: RankMovement | null;
}

// ── Boundary mappers ──
function round(n: number): number {
  return Math.round(n);
}

function initialsFrom(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function mapMovement(m: BackendRankMovement | null): RankMovement | null {
  return m ? { direction: m.direction, delta: m.delta } : null;
}

export function mapEntry(e: BackendLeaderboardEntry): LeaderboardEntry {
  return {
    rank: e.rank,
    userId: e.userId,
    name: e.name,
    avatar: e.avatar,
    specialty: e.specialty,
    avgScore: round(e.averageScore),
    totalQuestions: e.totalQuestions,
    totalSessions: e.totalSessions,
    movement: mapMovement(e.movement),
    initials: initialsFrom(e.name),
  };
}

export function mapBank(b: BackendLeaderboardBank): LeaderboardBank {
  return {
    bankId: b.bankId,
    bankName: b.bankName,
    participants: b.participants,
    sessions: b.sessions,
  };
}

export function mapRank(r: BackendLeaderboardRank): MyRank {
  return {
    rank: r.rank,
    avgScore: round(r.averageScore),
    totalQuestions: r.totalQuestions,
    totalSessions: r.totalSessions,
    percentile: round(r.percentile),
    totalRanked: r.totalRanked,
    movement: mapMovement(r.movement),
  };
}

// ── Query params (mirror LeaderboardQueryDto) ──
export interface LeaderboardParams {
  period?: LeaderboardPeriod;
  /** UUID of a specific bank; omit for the overall board. */
  bankId?: string;
  /** Server cap is 1..100 (defaults to 20 server-side). */
  limit?: number;
}

function toQuery(p: LeaderboardParams): Record<string, string | number | undefined> {
  return {
    period: p.period,
    bankId: p.bankId,
    limit: p.limit,
  };
}

// ── Endpoint functions ──
export const leaderboardApi = {
  async list(params: LeaderboardParams = {}): Promise<LeaderboardEntry[]> {
    const data = await apiClient.get<BackendLeaderboardEntry[]>("/leaderboard", {
      params: toQuery({ limit: 100, ...params }),
    });
    return data.map(mapEntry);
  },

  async banks(): Promise<LeaderboardBank[]> {
    const data = await apiClient.get<BackendLeaderboardBank[]>("/leaderboard/banks");
    return data.map(mapBank);
  },

  async myRank(params: LeaderboardParams = {}): Promise<MyRank> {
    const data = await apiClient.get<BackendLeaderboardRank>("/leaderboard/me", {
      params: toQuery(params),
    });
    return mapRank(data);
  },
};

// ── Query keys ──
export const leaderboardKeys = {
  all: ["leaderboard"] as const,
  list: (params: LeaderboardParams) => [...leaderboardKeys.all, "list", params] as const,
  banks: () => [...leaderboardKeys.all, "banks"] as const,
  myRank: (params: LeaderboardParams) => [...leaderboardKeys.all, "me", params] as const,
};

// ── Hooks ──

/** Ranked leaderboard window (period + optional bank filter). */
export function useLeaderboard(params: LeaderboardParams = {}) {
  return useQuery({
    queryKey: leaderboardKeys.list(params),
    queryFn: () => leaderboardApi.list(params),
    staleTime: 30_000,
  });
}

/** Banks that have leaderboard data, for the per-bank tabs. */
export function useLeaderboardBanks() {
  return useQuery({
    queryKey: leaderboardKeys.banks(),
    queryFn: leaderboardApi.banks,
    staleTime: 5 * 60_000,
  });
}

/** The signed-in user's rank in the same window. */
export function useMyRank(params: LeaderboardParams = {}) {
  return useQuery({
    queryKey: leaderboardKeys.myRank(params),
    queryFn: () => leaderboardApi.myRank(params),
    staleTime: 30_000,
  });
}
