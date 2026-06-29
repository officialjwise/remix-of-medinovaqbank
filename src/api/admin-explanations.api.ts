/**
 * ADMIN CLINICAL BREAKDOWNS domain — self-contained API module.
 *
 * Clinical breakdowns are generated once per question and stored server-side
 * (`questions.aiBreakdown`). Generation runs as a bounded background batch; this
 * module drives the admin-facing controls for it:
 *   - kick off generation for a bank (or all questions), and
 *   - poll coverage (total / with-breakdown / missing) to show live progress.
 *
 * Endpoints (under /api/v1, SUPER_ADMIN):
 *   POST /admin/explanations/generate  { bankId?, force?, limit? } -> 202 (background)
 *   GET  /admin/explanations/status?bankId=… -> { total, withBreakdown, missing }
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/api/client";

// ── Wire shapes (inside the envelope's `data`). 1:1 with the FE shape. ──
export interface BreakdownStatus {
  total: number;
  withBreakdown: number;
  missing: number;
}

export interface GenerateBreakdownsInput {
  bankId?: string;
  /** Regenerate every (scoped) question, not only those missing one. */
  force?: boolean;
  /** Max questions to process this run (1–1000). */
  limit?: number;
}

// ── Endpoint functions ──
export const adminExplanationsApi = {
  /** Kick off the background backfill. Resolves on the 202 (work continues server-side). */
  async generate(input: GenerateBreakdownsInput = {}): Promise<void> {
    await apiClient.post<null>("/admin/explanations/generate", {
      bankId: input.bankId,
      force: input.force,
      limit: input.limit,
    });
  },

  /** Breakdown coverage for a bank (or all active questions when no bankId). */
  async status(bankId?: string): Promise<BreakdownStatus> {
    return apiClient.get<BreakdownStatus>("/admin/explanations/status", {
      params: { bankId },
    });
  },
};

// ── Query keys ──
export const adminExplanationKeys = {
  all: ["admin-explanations"] as const,
  status: (bankId?: string) => [...adminExplanationKeys.all, "status", bankId ?? "all"] as const,
};

// ── Hooks ──

/**
 * Poll breakdown coverage. Pass `poll: true` (e.g. while a generation run is in
 * flight) to refetch every ~2s until nothing is missing, then settle.
 */
export function useBreakdownStatus(
  bankId: string | undefined,
  options: { enabled?: boolean; poll?: boolean } = {},
) {
  const { enabled = true, poll = false } = options;
  return useQuery({
    queryKey: adminExplanationKeys.status(bankId),
    queryFn: () => adminExplanationsApi.status(bankId),
    enabled,
    staleTime: 5_000,
    refetchInterval: (query) => (poll && (query.state.data?.missing ?? 0) > 0 ? 2000 : false),
  });
}

/** Trigger background generation, then refresh the matching status query. */
export function useGenerateBreakdowns() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: GenerateBreakdownsInput) => adminExplanationsApi.generate(input),
    onSuccess: (_data, input) =>
      void qc.invalidateQueries({ queryKey: adminExplanationKeys.status(input.bankId) }),
  });
}
