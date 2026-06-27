/**
 * QUESTION-FLAGS domain — self-contained API module (admin flag-review queue).
 *
 * Wires the richer of the two backend flag endpoints: the questions module's
 * `/admin/question-flags` queue (vs the leaner admin module `/admin/flags`).
 * It carries nested question context (bankId, subject, isFlagged) and flagger
 * identity (name, email), plus a three-way review action.
 *
 * Endpoints (all under /api/v1, SUPER_ADMIN scope):
 *   GET   /admin/question-flags        — paginated review queue (FlagReviewQueryDto)
 *   PATCH /admin/question-flags/:id     — resolve a flag (ReviewFlagDto.action)
 *
 * Field mapping (backend FlagReviewResponseDto -> frontend FlagReview):
 *   reason        <- reason (the user-supplied note; null -> "")
 *   stem          <- question.text
 *   bankId        <- question.bankId
 *   subject       <- question.subject
 *   questionId    <- question.id
 *   userName      <- flagger.name
 *   userEmail     <- flagger.email
 *   status        <- derived: isReviewed ? "Reviewed" : "Open"
 *                    (the backend has no persisted "Cleared" status; CLEARED is an
 *                     ACTION that also lowers the question's isFlagged banner — after
 *                     it the flag is simply isReviewed=true. See GAPS.)
 *
 * GAPS (backend does not provide / persist these):
 *   - No granular flag "type" taxonomy: FlagType is only `bookmark | flag`. The
 *     queue here lists `flag` rows; there is no "Incorrect Answer/Typo/..." kind.
 *   - status is binary (Open/Reviewed) on the wire; "Cleared" vs "Dismissed" is an
 *     action distinction, not a stored state, so it can't be read back per-row.
 *   - No "Deactivate Question" endpoint here — that belongs to the questions admin
 *     surface (PATCH /admin/questions/:id), out of scope for this module.
 */
import { useMutation, useQuery, useQueryClient, type UseQueryOptions } from "@tanstack/react-query";
import { apiClient } from "./client";

/* ── Backend enums / wire types (mirror flag-review-response.dto.ts) ───────── */

/** FlagType (database/entities/enums). The queue surfaces `flag` rows. */
export type BackendFlagType = "bookmark" | "flag";

/** ReviewFlagDto.action (review-flag.dto.ts). */
export type FlagReviewAction = "reviewed" | "cleared" | "dismissed";

/** FlagQuestionRefDto */
export interface BackendFlagQuestionRef {
  id: string;
  text: string;
  bankId: string;
  subject: string | null;
  isFlagged: boolean;
}

/** FlagFlaggerDto */
export interface BackendFlagFlagger {
  id: string;
  name: string | null;
  email: string | null;
}

/** FlagReviewResponseDto */
export interface BackendFlagReview {
  id: string;
  type: BackendFlagType;
  reason: string | null;
  isReviewed: boolean;
  reviewedAt: string | null;
  reviewedById: string | null;
  createdAt: string;
  question: BackendFlagQuestionRef | null;
  flagger: BackendFlagFlagger | null;
}

/* ── Frontend domain type ─────────────────────────────────────────────────── */

/** Derived, read-back-safe status (the wire only persists isReviewed). */
export type FlagStatus = "Open" | "Reviewed";

export interface FlagReview {
  id: string;
  type: BackendFlagType;
  /** The user-supplied reason/note ("" when none). */
  reason: string;
  status: FlagStatus;
  isReviewed: boolean;
  reviewedAt: string | null;
  createdAt: string;
  /** Question context (null when the question was deleted). */
  questionId: string | null;
  stem: string;
  bankId: string | null;
  subject: string | null;
  questionIsFlagged: boolean;
  /** Flagger identity (null when the user was deleted). */
  userName: string;
  userEmail: string;
}

export interface FlagReviewPage {
  items: FlagReview[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
}

/* ── Boundary mapper ──────────────────────────────────────────────────────── */

export function mapFlagReview(f: BackendFlagReview): FlagReview {
  return {
    id: f.id,
    type: f.type,
    reason: f.reason ?? "",
    status: f.isReviewed ? "Reviewed" : "Open",
    isReviewed: f.isReviewed,
    reviewedAt: f.reviewedAt,
    createdAt: f.createdAt,
    questionId: f.question?.id ?? null,
    stem: f.question?.text ?? "",
    bankId: f.question?.bankId ?? null,
    subject: f.question?.subject ?? null,
    questionIsFlagged: f.question?.isFlagged ?? false,
    userName: f.flagger?.name ?? "Unknown user",
    userEmail: f.flagger?.email ?? "",
  };
}

/* ── List query params (FlagReviewQueryDto) ───────────────────────────────── */

export interface FlagListParams {
  page?: number;
  limit?: number;
  type?: BackendFlagType;
  isReviewed?: boolean;
  search?: string;
  sortBy?: "createdAt" | "reviewedAt" | "type";
  sortOrder?: "asc" | "desc";
}

function toQuery(p: FlagListParams): Record<string, string | number | boolean | undefined> {
  return {
    page: p.page,
    limit: p.limit,
    type: p.type,
    isReviewed: p.isReviewed,
    search: p.search?.trim() || undefined,
    sortBy: p.sortBy,
    sortOrder: p.sortOrder,
  };
}

/* ── Endpoint functions ───────────────────────────────────────────────────── */

export const flagsApi = {
  async list(params: FlagListParams = {}): Promise<FlagReviewPage> {
    const { data, meta } = await apiClient.getPaginated<BackendFlagReview>(
      "/admin/question-flags",
      { params: toQuery({ limit: 100, type: "flag", ...params }) },
    );
    return {
      items: data.map(mapFlagReview),
      total: meta.total,
      page: meta.page,
      limit: meta.limit,
      totalPages: meta.totalPages ?? 1,
      hasNext: meta.hasNext ?? false,
    };
  },

  async review(id: string, action: FlagReviewAction): Promise<FlagReview> {
    const data = await apiClient.patch<BackendFlagReview>(`/admin/question-flags/${id}`, {
      action,
    });
    return mapFlagReview(data);
  },
};

/* ── Query keys ───────────────────────────────────────────────────────────── */

export const flagKeys = {
  all: ["question-flags"] as const,
  list: (params: FlagListParams) => [...flagKeys.all, "list", params] as const,
};

/* ── Hooks ────────────────────────────────────────────────────────────────── */

export function useFlags(
  params: FlagListParams = {},
  options?: Partial<UseQueryOptions<FlagReviewPage>>,
) {
  return useQuery({
    queryKey: flagKeys.list(params),
    queryFn: () => flagsApi.list(params),
    staleTime: 30_000,
    ...options,
  });
}

function useInvalidateFlags() {
  const qc = useQueryClient();
  return () => void qc.invalidateQueries({ queryKey: flagKeys.all });
}

/** Resolve a flag with an explicit action (reviewed / cleared / dismissed). */
export function useReviewFlag() {
  const invalidate = useInvalidateFlags();
  return useMutation({
    mutationFn: ({ id, action }: { id: string; action: FlagReviewAction }) =>
      flagsApi.review(id, action),
    onSuccess: invalidate,
  });
}
