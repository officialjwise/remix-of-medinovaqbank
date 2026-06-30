/**
 * QUESTION-BANKS domain — self-contained API module.
 *
 * Backend wire types + boundary mapper + endpoint functions + TanStack Query
 * hooks. Kept inside this file (not in the shared @/api/types|mappers) to avoid
 * cross-domain collisions, per project convention.
 *
 * Endpoints (all under /api/v1):
 *   GET    /question-banks              — public list (active + public only)
 *   GET    /question-banks/:id          — public detail
 *   GET    /admin/question-banks        — admin list (active + inactive)
 *   GET    /admin/question-banks/:id    — (reuses public detail; admin scope is the
 *                                          same entity — no dedicated admin GET-one)
 *   POST   /admin/question-banks        — admin create
 *   PATCH  /admin/question-banks/:id    — admin update / toggle active
 *   DELETE /admin/question-banks/:id    — admin soft-delete (deactivate)
 *
 * Field mapping (backend BankResponseDto -> frontend Bank view model):
 *   subject       <- categoryName
 *   isFree        <- isPublic (INVERTED: public bank => paid; non-public => free preview*)
 *   questionCount <- totalQuestions
 *   examType      <- examTypes[0]?.name (single, for display) ; examTypeIds kept for forms
 *   subjectColor / accentHex: derived CLIENT-SIDE from the subject via subjectColors.
 *
 * GAPS (backend does not provide these):
 *   - sessionsCount: no per-bank session count on the DTO -> defaulted to 0.
 *   - topics[]: no topics field on the bank DTO -> empty array (kept for UI shape).
 *   - The public list/detail filters examType/free CLIENT-SIDE: BankQueryDto only
 *     supports categoryId / difficulty / isActive / search / pagination.
 *
 * (*) "isFree" here means "shown as a free preview to non-subscribers". The backend
 * `isPublic` flag gates public visibility; we map non-public banks to the "free
 * preview" toggle the admin UI exposes. This is the inversion the task specifies.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import { subjectTheme } from "@/data/subjectColors";

// ── Backend enums (mirror src/database/entities/enums.ts). ──
export type BackendDifficulty = "easy" | "medium" | "hard";

// ── Backend wire shape (BankResponseDto, inside the envelope's `data`). ──
export interface BackendBank {
  id: string;
  name: string;
  description: string | null;
  categoryId: string;
  categoryName: string | null;
  examType: string | null;
  examTypes: Array<{ id: string; name: string }>;
  coverImageUrl: string | null;
  totalQuestions: number;
  sessionsCount: number | null;
  difficulty: BackendDifficulty;
  isActive: boolean;
  isPublic: boolean;
  createdById: string;
  createdAt: string;
}

// ── Frontend display difficulty (mirrors the legacy `Difficulty` union). ──
export type DisplayDifficulty = "Beginner" | "Intermediate" | "Advanced";

const DIFFICULTY_TO_DISPLAY: Record<BackendDifficulty, DisplayDifficulty> = {
  easy: "Beginner",
  medium: "Intermediate",
  hard: "Advanced",
};

const DISPLAY_TO_DIFFICULTY: Record<DisplayDifficulty, BackendDifficulty> = {
  Beginner: "easy",
  Intermediate: "medium",
  Advanced: "hard",
};

export function toDisplayDifficulty(d: BackendDifficulty): DisplayDifficulty {
  return DIFFICULTY_TO_DISPLAY[d] ?? "Intermediate";
}

export function toBackendDifficulty(d: DisplayDifficulty): BackendDifficulty {
  return DISPLAY_TO_DIFFICULTY[d] ?? "medium";
}

// ── Frontend domain shape (mirrors the legacy `QuestionBank` so existing UI
//    call-sites need minimal adaptation). ──
export interface Bank {
  id: string;
  name: string;
  description: string;
  /** <- categoryName (or "Uncategorized" when null). */
  subject: string;
  categoryId: string;
  /** Derived client-side from subject (subjectColors lookup). */
  subjectColor: string;
  /** Derived client-side from subject (subjectColors lookup). */
  accentHex: string;
  questionCount: number;
  /** Display difficulty (Beginner/Intermediate/Advanced). */
  difficulty: DisplayDifficulty;
  /** Single exam-type name (examTypes[0]) — for card display. */
  examType: string;
  /** All exam-type associations (id + name) — used by edit forms. */
  examTypes: Array<{ id: string; name: string }>;
  examTypeIds: string[];
  coverImageUrl: string | null;
  isActive: boolean;
  isPublic: boolean;
  /** <- isPublic INVERTED. true => surfaced as a free preview. */
  isFree: boolean;
  createdById: string;
  createdAt: string;
  /** Quiz sessions taken on this bank (from the list query; 0 elsewhere). */
  sessionsCount: number;
  /** GAP: no backend topics field -> []. */
  topics: string[];
}

/**
 * Build the Tailwind gradient class the legacy cards expect from a hex accent.
 * The mock used `from-[#xxx] to-[#yyy]`; we render a single-hue gradient.
 */
function gradientFromHex(hex: string): string {
  return `from-[${hex}] to-[${hex}]`;
}

// ── Boundary mapper: backend BankResponseDto -> frontend Bank. ──
export function mapBank(b: BackendBank): Bank {
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
    questionCount: b.totalQuestions,
    difficulty: toDisplayDifficulty(b.difficulty),
    examType: b.examTypes[0]?.name ?? b.examType ?? "",
    examTypes: b.examTypes,
    examTypeIds: b.examTypes.map((e) => e.id),
    coverImageUrl: b.coverImageUrl,
    isActive: b.isActive,
    isPublic: b.isPublic,
    isFree: !b.isPublic,
    createdById: b.createdById,
    createdAt: b.createdAt,
    sessionsCount: b.sessionsCount ?? 0,
    topics: [],
  };
}

// ── List query params (server-supported subset of BankQueryDto). ──
export interface BankListParams {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  difficulty?: BackendDifficulty;
  /** Admin only — filter active/inactive. */
  isActive?: boolean;
  sortBy?: "createdAt" | "name" | "totalQuestions" | "difficulty";
  sortOrder?: "asc" | "desc";
}

function toQuery(p: BankListParams): Record<string, string | number | boolean | undefined> {
  return {
    page: p.page,
    limit: p.limit,
    search: p.search?.trim() || undefined,
    categoryId: p.categoryId,
    difficulty: p.difficulty,
    isActive: p.isActive,
    sortBy: p.sortBy,
    sortOrder: p.sortOrder,
  };
}

// ── Write payloads (mirror Create/UpdateBankDto). ──
export interface BankCreateInput {
  name: string;
  description?: string;
  categoryId: string;
  examTypeIds?: string[];
  coverImageUrl?: string;
  difficulty?: BackendDifficulty;
  isPublic?: boolean;
}

export interface BankUpdateInput {
  name?: string;
  description?: string;
  categoryId?: string;
  examTypeIds?: string[];
  coverImageUrl?: string;
  difficulty?: BackendDifficulty;
  isPublic?: boolean;
  isActive?: boolean;
}

export interface BankListResult {
  banks: Bank[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const banksApi = {
  /** Public — active + public banks (paginated). */
  async listPublic(params: BankListParams = {}): Promise<BankListResult> {
    const { data, meta } = await apiClient.getPaginated<BackendBank>("/question-banks", {
      params: toQuery({ limit: 100, ...params }),
    });
    return {
      banks: data.map(mapBank),
      total: meta.total,
      page: meta.page,
      limit: meta.limit,
      totalPages: meta.totalPages ?? 1,
    };
  },

  /** Public — single bank detail. */
  async getById(id: string): Promise<Bank> {
    const data = await apiClient.get<BackendBank>(`/question-banks/${id}`);
    return mapBank(data);
  },

  /** Admin — single bank detail (admin scope: includes inactive/private banks). */
  async getByIdAdmin(id: string): Promise<Bank> {
    const data = await apiClient.get<BackendBank>(`/admin/question-banks/${id}`);
    return mapBank(data);
  },

  /** Admin — all banks (active + inactive), paginated. */
  async listAdmin(params: BankListParams = {}): Promise<BankListResult> {
    const { data, meta } = await apiClient.getPaginated<BackendBank>("/admin/question-banks", {
      params: toQuery({ limit: 100, ...params }),
    });
    return {
      banks: data.map(mapBank),
      total: meta.total,
      page: meta.page,
      limit: meta.limit,
      totalPages: meta.totalPages ?? 1,
    };
  },

  async create(input: BankCreateInput): Promise<Bank> {
    const data = await apiClient.post<BackendBank>("/admin/question-banks", input);
    return mapBank(data);
  },

  async update(id: string, input: BankUpdateInput): Promise<Bank> {
    const data = await apiClient.patch<BackendBank>(`/admin/question-banks/${id}`, input);
    return mapBank(data);
  },

  /** Soft delete (deactivate). */
  async remove(id: string): Promise<Bank> {
    const data = await apiClient.delete<BackendBank>(`/admin/question-banks/${id}`);
    return mapBank(data);
  },
};

// ── Query keys ──
export const bankKeys = {
  all: ["question-banks"] as const,
  publicList: (params: BankListParams) => [...bankKeys.all, "public", params] as const,
  adminList: (params: BankListParams) => [...bankKeys.all, "admin", params] as const,
  detail: (id: string) => [...bankKeys.all, "detail", id] as const,
};

// ── Hooks ──

/** Public paginated list of active + public banks. */
export function usePublicBanks(params: BankListParams = {}) {
  return useQuery({
    queryKey: bankKeys.publicList(params),
    queryFn: () => banksApi.listPublic(params),
    staleTime: 60_000,
  });
}

/** Public single-bank detail. */
export function useBank(id: string) {
  return useQuery({
    queryKey: bankKeys.detail(id),
    queryFn: () => banksApi.getById(id),
    enabled: !!id,
  });
}

/** Admin single-bank detail (admin scope: includes inactive/private banks). */
export function useAdminBank(id: string) {
  return useQuery({
    queryKey: [...bankKeys.detail(id), "admin"] as const,
    queryFn: () => banksApi.getByIdAdmin(id),
    enabled: !!id,
  });
}

/** Admin paginated list (active + inactive). */
export function useAdminBanks(params: BankListParams = {}) {
  return useQuery({
    queryKey: bankKeys.adminList(params),
    queryFn: () => banksApi.listAdmin(params),
    staleTime: 30_000,
  });
}

function useInvalidateBanks() {
  const qc = useQueryClient();
  return () => void qc.invalidateQueries({ queryKey: bankKeys.all });
}

export function useCreateBank() {
  const invalidate = useInvalidateBanks();
  return useMutation({
    mutationFn: (input: BankCreateInput) => banksApi.create(input),
    onSuccess: invalidate,
  });
}

export function useUpdateBank() {
  const invalidate = useInvalidateBanks();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: BankUpdateInput }) =>
      banksApi.update(id, input),
    onSuccess: invalidate,
  });
}

/** Convenience toggle — flips isActive via the update endpoint. */
export function useToggleBankActive() {
  const invalidate = useInvalidateBanks();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      banksApi.update(id, { isActive }),
    onSuccess: invalidate,
  });
}

export function useDeleteBank() {
  const invalidate = useInvalidateBanks();
  return useMutation({
    mutationFn: (id: string) => banksApi.remove(id),
    onSuccess: invalidate,
  });
}
