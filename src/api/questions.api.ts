/**
 * QUESTIONS domain — self-contained API module (admin question management +
 * user flagging). Backend wire types + boundary mapper + endpoint functions +
 * TanStack Query hooks, all kept HERE (not in the shared @/api/types|mappers)
 * to avoid cross-domain collisions.
 *
 * Endpoints (all under /api/v1):
 *   GET    /admin/questions                       — paginated admin list (all fields)
 *   POST   /admin/questions                       — create
 *   PATCH  /admin/questions/:id                   — update / toggle active
 *   DELETE /admin/questions/:id                   — delete
 *   POST   /admin/questions/upload-image          — multipart image upload -> { url }
 *   POST   /admin/question-banks/:bankId/upload   — bulk CSV/XLSX upload -> BulkUploadResult
 *   GET    /admin/uploads/template                — XLSX template download (binary)
 *   GET    /admin/question-banks                  — bank list (for selects/headers)
 *   POST   /questions/flags                        — user flags a question
 *   DELETE /questions/flags/:questionId            — user removes a flag (?type=)
 *   GET    /questions/flags/me                     — the current user's flags
 *
 * Option model bridge:
 *   Backend stores options as rows { id, label (A–E), text, isCorrect, imageUrl }.
 *   The FE form/preview uses a key-based model { key: A–E, text, imageUrl } +
 *   a single `correctKey`. We assign stable A–E letters by the row's `label`
 *   (sorted) for display, and on write map FE options -> rows with `isCorrect`
 *   derived from `correctKey`.
 */
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient, BASE_URL, ApiError } from "@/api/client";
import { useAuthStore } from "@/stores/authStore";
import type { Difficulty } from "@/types";

// ── Backend enums / wire shapes ──
export type BackendDifficulty = "easy" | "medium" | "hard";
export type FlagType = "bookmark" | "flag";

/** A single persisted flag row as returned by GET /questions/flags/me. */
export interface BackendQuestionFlag {
  id: string;
  questionId: string;
  type: FlagType;
  note: string | null;
  /** Question stem (left-joined by the backend) — for the bookmarks list. */
  questionText: string | null;
  createdAt: string;
}

/** FE-facing flag shape (the wire shape is already clean; kept for symmetry). */
export interface QuestionFlag {
  id: string;
  questionId: string;
  type: FlagType;
  note: string | null;
  questionText: string | null;
  createdAt: string;
}

export function mapFlag(f: BackendQuestionFlag): QuestionFlag {
  return {
    id: f.id,
    questionId: f.questionId,
    type: f.type,
    note: f.note ?? null,
    questionText: f.questionText ?? null,
    createdAt: f.createdAt,
  };
}

export interface BackendQuestionOption {
  id: string;
  label: string; // 'A'..'E'
  text: string;
  imageUrl: string | null;
  isCorrect?: boolean; // present in admin views
}

export interface BackendQuestion {
  id: string;
  bankId: string;
  bankName: string | null;
  text: string;
  imageUrl: string | null;
  difficulty: BackendDifficulty;
  subject: string;
  topic: string | null;
  tags: string[];
  orderIndex: number | null;
  isFlagged: boolean;
  isActive: boolean;
  timesAnswered: number;
  timesCorrect: number;
  options: BackendQuestionOption[];
  explanation?: string | null;
  createdAt: string;
}

/** Minimal bank shape used by selects/headers (subset of BankResponseDto). */
export interface BackendBankLite {
  id: string;
  name: string;
  examType: string | null;
  difficulty: BackendDifficulty;
  isActive: boolean;
  totalQuestions: number;
}

// ── Difficulty mapping (backend easy/medium/hard <-> FE Beginner/Intermediate/Advanced). ──
const DIFFICULTY_TO_FE: Record<BackendDifficulty, Difficulty> = {
  easy: "Beginner",
  medium: "Intermediate",
  hard: "Advanced",
};
const DIFFICULTY_TO_BE: Record<Difficulty, BackendDifficulty> = {
  Beginner: "easy",
  Intermediate: "medium",
  Advanced: "hard",
};
export function toFeDifficulty(d: BackendDifficulty): Difficulty {
  return DIFFICULTY_TO_FE[d] ?? "Intermediate";
}
export function toBeDifficulty(d: Difficulty): BackendDifficulty {
  return DIFFICULTY_TO_BE[d] ?? "medium";
}

// ── Frontend domain shape (what the management UI consumes). ──
export interface AdminQuestionOption {
  /** Stable display letter A–E (from the backend row `label`). */
  key: string;
  text: string;
  imageUrl?: string;
}

export interface AdminQuestion {
  id: string;
  bankId: string;
  /** Bank name for the all-questions list column ("" when unknown). */
  bankName: string;
  stem: string;
  imageUrl: string;
  difficulty: Difficulty;
  topic: string;
  /** Backend `subject` — kept so create/update can round-trip it. */
  subject: string;
  tags: string[];
  orderIndex: number | null;
  isActive: boolean;
  isFlagged: boolean;
  timesAnswered: number;
  timesCorrect: number;
  /** Derived: % of attempts answered correctly (0 when never answered). */
  correctRate: number;
  hasImage: boolean;
  options: AdminQuestionOption[];
  correctKey: string;
  baseExplanation: string;
  createdAt: string;
}

// ── Boundary mapper ──
export function mapQuestion(q: BackendQuestion): AdminQuestion {
  const sorted = [...(q.options ?? [])].sort((a, b) => a.label.localeCompare(b.label));
  const options: AdminQuestionOption[] = sorted.map((o) => ({
    key: o.label,
    text: o.text,
    imageUrl: o.imageUrl ?? undefined,
  }));
  const correctKey = sorted.find((o) => o.isCorrect)?.label ?? sorted[0]?.label ?? "A";
  const correctRate =
    q.timesAnswered > 0 ? Math.round((q.timesCorrect / q.timesAnswered) * 100) : 0;
  const hasImage = !!q.imageUrl || sorted.some((o) => !!o.imageUrl);

  return {
    id: q.id,
    bankId: q.bankId,
    bankName: q.bankName ?? "",
    stem: q.text,
    imageUrl: q.imageUrl ?? "",
    difficulty: toFeDifficulty(q.difficulty),
    topic: q.topic ?? "",
    subject: q.subject,
    tags: q.tags ?? [],
    orderIndex: q.orderIndex,
    isActive: q.isActive,
    isFlagged: q.isFlagged,
    timesAnswered: q.timesAnswered,
    timesCorrect: q.timesCorrect,
    correctRate,
    hasImage,
    options,
    correctKey,
    baseExplanation: q.explanation ?? "",
    createdAt: q.createdAt,
  };
}

export function mapBankLite(b: BackendBankLite): BankLite {
  return { id: b.id, name: b.name, examType: b.examType, isActive: b.isActive };
}
export interface BankLite {
  id: string;
  name: string;
  examType: string | null;
  isActive: boolean;
}

// ── Write payloads (mirror Create/UpdateQuestionDto + QuestionOptionDto). ──
export interface QuestionOptionInput {
  label: string; // 'A'..'E'
  text: string;
  imageUrl?: string;
  isCorrect: boolean;
}

export interface CreateQuestionBody {
  bankId: string;
  text: string;
  imageUrl?: string;
  explanation?: string;
  difficulty?: BackendDifficulty;
  subject: string;
  topic?: string;
  tags?: string[];
  orderIndex?: number;
  options: QuestionOptionInput[];
}

export interface UpdateQuestionBody {
  text?: string;
  imageUrl?: string;
  explanation?: string;
  difficulty?: BackendDifficulty;
  subject?: string;
  topic?: string;
  tags?: string[];
  orderIndex?: number;
  isActive?: boolean;
  options?: QuestionOptionInput[];
}

/** The minimal slice of the FE form values needed to build a write payload. */
export interface QuestionWriteInput {
  bankId: string;
  stem: string;
  imageUrl?: string;
  difficulty: Difficulty;
  topic?: string;
  /** Backend requires a subject; fall back to topic, then a default. */
  subject?: string;
  tags?: string[];
  baseExplanation?: string;
  options: { key: string; text: string; imageUrl?: string }[];
  correctKey: string;
}

/** Build the backend option rows (label + isCorrect) from the FE key model. */
export function toOptionRows(
  options: { key: string; text: string; imageUrl?: string }[],
  correctKey: string,
): QuestionOptionInput[] {
  return options.map((o) => ({
    label: o.key,
    text: o.text.trim(),
    imageUrl: o.imageUrl || undefined,
    isCorrect: o.key === correctKey,
  }));
}

function resolveSubject(v: QuestionWriteInput): string {
  return (v.subject || v.topic || "General").trim();
}

export function toCreateBody(v: QuestionWriteInput): CreateQuestionBody {
  return {
    bankId: v.bankId,
    text: v.stem.trim(),
    imageUrl: v.imageUrl || undefined,
    explanation: v.baseExplanation?.trim() || undefined,
    difficulty: toBeDifficulty(v.difficulty),
    subject: resolveSubject(v),
    topic: v.topic?.trim() || undefined,
    tags: v.tags?.length ? v.tags : undefined,
    options: toOptionRows(v.options, v.correctKey),
  };
}

export function toUpdateBody(v: QuestionWriteInput): UpdateQuestionBody {
  return {
    text: v.stem.trim(),
    imageUrl: v.imageUrl || undefined,
    explanation: v.baseExplanation?.trim() || undefined,
    difficulty: toBeDifficulty(v.difficulty),
    subject: resolveSubject(v),
    topic: v.topic?.trim() || undefined,
    tags: v.tags ?? [],
    options: toOptionRows(v.options, v.correctKey),
  };
}

// ── Bulk-upload result (mirrors BulkUploadResult). ──
export interface BulkUploadError {
  row: number;
  reason: string;
}
export interface BulkUploadResult {
  total: number;
  created: number;
  failed: number;
  errors: BulkUploadError[];
}

// ── List query params. ──
export interface AdminQuestionQuery {
  page?: number;
  limit?: number;
  bankId?: string;
  difficulty?: BackendDifficulty;
  topic?: string;
  isActive?: boolean;
  isFlagged?: boolean;
  /** Word-order-independent partial search over stem/topic/subject (server-side). */
  search?: string;
  /** Allowlisted server sort column (createdAt | orderIndex | ...). */
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// ── Endpoint functions ──
export const questionsApi = {
  /** Admin paginated list. */
  async list(params: AdminQuestionQuery = {}) {
    const query: Record<string, string | number | boolean | undefined> = {
      page: params.page,
      limit: params.limit,
      bankId: params.bankId,
      difficulty: params.difficulty,
      topic: params.topic,
      isActive: params.isActive,
      isFlagged: params.isFlagged,
      search: params.search?.trim() || undefined,
      sortBy: params.sortBy,
      sortOrder: params.sortOrder,
    };
    const res = await apiClient.getPaginated<BackendQuestion>("/admin/questions", {
      params: query,
    });
    return { data: res.data.map(mapQuestion), meta: res.meta };
  },

  /** Single question by id (publicId or uuid) — used by the edit screen so it
   *  works regardless of which server page the question lives on. */
  async getById(id: string): Promise<AdminQuestion> {
    const data = await apiClient.get<BackendQuestion>(`/admin/questions/${id}`);
    return mapQuestion(data);
  },

  async create(body: CreateQuestionBody): Promise<AdminQuestion> {
    const data = await apiClient.post<BackendQuestion>("/admin/questions", body);
    return mapQuestion(data);
  },

  async update(id: string, body: UpdateQuestionBody): Promise<AdminQuestion> {
    const data = await apiClient.patch<BackendQuestion>(`/admin/questions/${id}`, body);
    return mapQuestion(data);
  },

  async remove(id: string): Promise<AdminQuestion> {
    const data = await apiClient.delete<BackendQuestion>(`/admin/questions/${id}`);
    return mapQuestion(data);
  },

  /**
   * Soft-delete many questions in ONE request. Replaces firing a DELETE per id
   * (which tripped the throttler on multi-select). Returns the server's counts.
   */
  async bulkRemove(ids: string[]): Promise<{ deleted: number; skipped: number }> {
    return apiClient.post<{ deleted: number; skipped: number }>("/admin/questions/bulk-delete", {
      questionIds: ids,
    });
  },

  /** Bulk activate/deactivate in ONE request (replaces a PATCH per id). */
  async bulkSetActive(
    ids: string[],
    isActive: boolean,
  ): Promise<{ updated: number; skipped: number }> {
    return apiClient.post<{ updated: number; skipped: number }>("/admin/questions/bulk-status", {
      questionIds: ids,
      isActive,
    });
  },

  /** Upload a question/option image; returns the stored URL. */
  async uploadImage(file: File): Promise<string> {
    const form = new FormData();
    form.append("file", file);
    const data = await apiClient.post<{ url: string }>("/admin/questions/upload-image", form);
    return data.url;
  },

  /** Bulk-create questions from a CSV/XLSX file under a bank. */
  async bulkUpload(bankId: string, file: File): Promise<BulkUploadResult> {
    const form = new FormData();
    form.append("file", file);
    return apiClient.post<BulkUploadResult>(`/admin/question-banks/${bankId}/upload`, form);
  },

  /** Bank list for selects/headers. */
  async listBanks(): Promise<BankLite[]> {
    const res = await apiClient.getPaginated<BackendBankLite>("/admin/question-banks");
    return res.data.map(mapBankLite);
  },

  /** User flags (or bookmarks) a question. */
  async flag(questionId: string, type: FlagType = "flag", note?: string): Promise<void> {
    await apiClient.post("/questions/flags", { questionId, type, note });
  },

  /** Remove the user's flag (or bookmark) for a question. */
  async removeFlag(questionId: string, type: FlagType = "flag"): Promise<void> {
    await apiClient.delete(`/questions/flags/${questionId}`, undefined, { params: { type } });
  },

  /** The current user's flags + bookmarks (source of truth for the runtime). */
  async myFlags(): Promise<QuestionFlag[]> {
    const data = await apiClient.get<BackendQuestionFlag[]>("/questions/flags/me");
    return data.map(mapFlag);
  },
};

/**
 * Download the XLSX bulk-upload template. The endpoint streams a binary file
 * (no JSON envelope), so we hit it with a raw fetch carrying the auth token and
 * trigger a browser download. SSR-safe: bails out if there's no DOM.
 */
export async function downloadQuestionTemplate(): Promise<void> {
  if (typeof window === "undefined") return;
  const token = useAuthStore.getState().accessToken;
  const res = await fetch(`${BASE_URL}/admin/uploads/template`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    throw new ApiError("Could not download template", res.status);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "question-upload-template.xlsx";
  a.click();
  URL.revokeObjectURL(url);
}

// ── Query keys ──
export const questionKeys = {
  all: ["questions"] as const,
  list: (params: AdminQuestionQuery) => [...questionKeys.all, "list", params] as const,
  banks: ["question-banks-lite"] as const,
  myFlags: ["question-flags", "me"] as const,
};

// ── Hooks ──

/** Admin question list (paginated, filterable). */
export function useAdminQuestions(params: AdminQuestionQuery = {}) {
  return useQuery({
    queryKey: questionKeys.list(params),
    queryFn: () => questionsApi.list(params),
    staleTime: 30_000,
    // Keep the current page visible while the next page/filter loads (no
    // "No questions found" flash between server pages).
    placeholderData: keepPreviousData,
  });
}

/** Single question (for the edit screen). */
export function useAdminQuestion(id: string) {
  return useQuery({
    queryKey: [...questionKeys.all, "detail", id],
    queryFn: () => questionsApi.getById(id),
    enabled: !!id,
  });
}

/** Bank list (for form selects, headers, move targets). */
export function useQuestionBanksLite() {
  return useQuery({
    queryKey: questionKeys.banks,
    queryFn: questionsApi.listBanks,
    staleTime: 60_000,
  });
}

function useInvalidateQuestions() {
  const qc = useQueryClient();
  return () => void qc.invalidateQueries({ queryKey: questionKeys.all });
}

export function useCreateQuestion() {
  const invalidate = useInvalidateQuestions();
  return useMutation({
    mutationFn: (input: QuestionWriteInput) => questionsApi.create(toCreateBody(input)),
    onSuccess: invalidate,
  });
}

export function useUpdateQuestion() {
  const invalidate = useInvalidateQuestions();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: QuestionWriteInput }) =>
      questionsApi.update(id, toUpdateBody(input)),
    onSuccess: invalidate,
  });
}

/** Toggle active via the update endpoint. */
export function useToggleQuestionActive() {
  const invalidate = useInvalidateQuestions();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      questionsApi.update(id, { isActive }),
    onSuccess: invalidate,
  });
}

export function useDeleteQuestion() {
  const invalidate = useInvalidateQuestions();
  return useMutation({
    mutationFn: (id: string) => questionsApi.remove(id),
    onSuccess: invalidate,
  });
}

export function useBulkUploadQuestions() {
  const invalidate = useInvalidateQuestions();
  return useMutation({
    mutationFn: ({ bankId, file }: { bankId: string; file: File }) =>
      questionsApi.bulkUpload(bankId, file),
    onSuccess: invalidate,
  });
}

/** Soft-delete many questions in one request (single invalidate, no 429 storm). */
export function useBulkDeleteQuestions() {
  const invalidate = useInvalidateQuestions();
  return useMutation({
    mutationFn: (ids: string[]) => questionsApi.bulkRemove(ids),
    onSuccess: invalidate,
  });
}

/** Bulk activate/deactivate in one request (single invalidate, no 429 storm). */
export function useBulkSetActiveQuestions() {
  const invalidate = useInvalidateQuestions();
  return useMutation({
    mutationFn: ({ ids, isActive }: { ids: string[]; isActive: boolean }) =>
      questionsApi.bulkSetActive(ids, isActive),
    onSuccess: invalidate,
  });
}

/** The current user's flags + bookmarks (source of truth for bookmark/flag UI). */
export function useMyFlags() {
  return useQuery({
    queryKey: questionKeys.myFlags,
    queryFn: questionsApi.myFlags,
    staleTime: 30_000,
  });
}

/**
 * User-facing flag mutation. Pass a default `type` at the hook level
 * (e.g. `useFlagQuestion({ type: "bookmark" })`); a per-call `type` still
 * wins. Invalidates the cached "my flags" list on success.
 */
export function useFlagQuestion(defaults: { type?: FlagType } = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      questionId,
      type = defaults.type ?? "flag",
      note,
    }: {
      questionId: string;
      type?: FlagType;
      note?: string;
    }) => questionsApi.flag(questionId, type, note),
    onSuccess: () => void qc.invalidateQueries({ queryKey: questionKeys.myFlags }),
  });
}

/** User-facing un-flag / un-bookmark mutation. */
export function useRemoveFlag(defaults: { type?: FlagType } = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      questionId,
      type = defaults.type ?? "flag",
    }: {
      questionId: string;
      type?: FlagType;
    }) => questionsApi.removeFlag(questionId, type),
    onSuccess: () => void qc.invalidateQueries({ queryKey: questionKeys.myFlags }),
  });
}
