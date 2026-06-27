/**
 * EXPLANATIONS domain — self-contained API module.
 *
 * Fetches the structured clinical breakdown for a single submitted answer. The
 * breakdown is generated server-side (never branded as AI) and may be briefly
 * unavailable right after submission while it is produced — callers should poll
 * or show a graceful "preparing" state. Returns `null` when unavailable.
 *
 * Endpoint (under /api/v1):
 *   GET /explanations/:answerId -> ClinicalBreakdown | null
 */
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "./client";

// ── Backend wire shape (ClinicalBreakdown) — also the FE shape (1:1). ──
export interface WrongOptionReason {
  label: string;
  reason: string;
}

export interface WhenWouldBeCorrect {
  label: string;
  scenario: string;
}

export interface ClinicalBreakdown {
  whyCorrect: string;
  /** null when the student answered correctly or skipped. */
  whyStudentWasWrong: string | null;
  whyOthersAreWrong: WrongOptionReason[];
  /** The clinical scenario in which each wrong option WOULD be correct. */
  whenWouldBeCorrect: WhenWouldBeCorrect[];
  keyLearningPoint: string;
  relatedConcepts: string[];
}

// ── Endpoint function ──
export const explanationsApi = {
  /** Returns the breakdown, or null if not yet generated / unavailable. */
  async getForAnswer(answerId: string): Promise<ClinicalBreakdown | null> {
    return apiClient.get<ClinicalBreakdown | null>(`/explanations/${answerId}`);
  },
};

// ── Query keys ──
export const explanationKeys = {
  all: ["explanations"] as const,
  byAnswer: (answerId: string) => [...explanationKeys.all, answerId] as const,
};

// ── Hooks ──

/**
 * Fetch the clinical breakdown for a submitted answer.
 *
 * Because generation is asynchronous on the backend, this keeps polling while
 * the breakdown is still null (every 1.5s, capped by the query lifetime) so the
 * tutor panel fills in as soon as it's ready.
 */
export function useExplanation(answerId: string | null | undefined) {
  return useQuery({
    queryKey: explanationKeys.byAnswer(answerId ?? "none"),
    queryFn: () => explanationsApi.getForAnswer(answerId as string),
    enabled: !!answerId,
    staleTime: 5 * 60_000,
    refetchInterval: (query) => (query.state.data === null ? 1500 : false),
  });
}
