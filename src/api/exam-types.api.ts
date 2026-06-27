/**
 * EXAM-TYPES domain — self-contained API module.
 *
 * Wires:
 *   - GET    /exam-types               (public — active only)
 *   - GET    /admin/exam-types         (super_admin — includes bankCount)
 *   - POST   /admin/exam-types         (super_admin — create)
 *   - PATCH  /admin/exam-types/:id     (super_admin — update / toggle)
 *   - DELETE /admin/exam-types/:id     (super_admin — delete)
 *
 * Backend wire types + boundary mappers live here (not in the shared
 * @/api/types / @/api/mappers) to avoid cross-domain collisions, per
 * project convention.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/api/client";

// ── Backend wire shape (ExamTypeResponseDto, inside the envelope's `data`). ──
export interface BackendExamType {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  colorScheme: string | null;
  isActive: boolean;
  sortOrder: number;
  /** Present on the admin list endpoint only. */
  bankCount?: number;
  createdAt: string;
}

// ── Frontend domain shape (mirrors the legacy ExamTypeRecord field names so
//    existing UI call-sites need minimal adaptation). ──
export interface ExamType {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  isActive: boolean;
  sortOrder: number;
  /** 0 when the source endpoint doesn't report counts (public list). */
  bankCount: number;
  createdAt: string;
}

const DEFAULT_COLOR = "#0E7C7B";
const DEFAULT_ICON = "GraduationCap";

/** Boundary mapper: backend → frontend domain. */
export function mapExamType(e: BackendExamType): ExamType {
  return {
    id: e.id,
    name: e.name,
    description: e.description ?? "",
    color: e.colorScheme ?? DEFAULT_COLOR,
    icon: e.icon ?? DEFAULT_ICON,
    isActive: e.isActive,
    sortOrder: e.sortOrder,
    bankCount: e.bankCount ?? 0,
    createdAt: e.createdAt,
  };
}

// ── Write payloads (mirror Create/UpdateExamTypeDto). ──
export interface ExamTypeCreateInput {
  name: string;
  description?: string;
  icon?: string;
  colorScheme?: string;
  sortOrder?: number;
}

export interface ExamTypeUpdateInput {
  name?: string;
  description?: string;
  icon?: string;
  colorScheme?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export const examTypesApi = {
  /** Public — active exam types only. */
  async listActive(): Promise<ExamType[]> {
    const data = await apiClient.get<BackendExamType[]>("/exam-types");
    return data.map(mapExamType);
  },

  /** Admin — all exam types, includes bankCount. */
  async listAll(): Promise<ExamType[]> {
    const data = await apiClient.get<BackendExamType[]>("/admin/exam-types");
    return data.map(mapExamType);
  },

  async create(input: ExamTypeCreateInput): Promise<ExamType> {
    const data = await apiClient.post<BackendExamType>("/admin/exam-types", input);
    return mapExamType(data);
  },

  async update(id: string, input: ExamTypeUpdateInput): Promise<ExamType> {
    const data = await apiClient.patch<BackendExamType>(`/admin/exam-types/${id}`, input);
    return mapExamType(data);
  },

  async remove(id: string): Promise<ExamType> {
    const data = await apiClient.delete<BackendExamType>(`/admin/exam-types/${id}`);
    return mapExamType(data);
  },
};

// ── Query keys ──
export const examTypeKeys = {
  all: ["exam-types"] as const,
  active: () => [...examTypeKeys.all, "active"] as const,
  admin: () => [...examTypeKeys.all, "admin"] as const,
};

/**
 * Public list of active exam types. Used by bank create selectors, the
 * notes editor, and the marketing/home surface.
 */
export function useExamTypes() {
  return useQuery({
    queryKey: examTypeKeys.active(),
    queryFn: () => examTypesApi.listActive(),
    staleTime: 5 * 60_000,
  });
}

/** Admin list (with bankCount) for the management screen. */
export function useAdminExamTypes() {
  return useQuery({
    queryKey: examTypeKeys.admin(),
    queryFn: () => examTypesApi.listAll(),
    staleTime: 60_000,
  });
}

function useInvalidateExamTypes() {
  const qc = useQueryClient();
  return () => void qc.invalidateQueries({ queryKey: examTypeKeys.all });
}

export function useCreateExamType() {
  const invalidate = useInvalidateExamTypes();
  return useMutation({
    mutationFn: (input: ExamTypeCreateInput) => examTypesApi.create(input),
    onSuccess: invalidate,
  });
}

export function useUpdateExamType() {
  const invalidate = useInvalidateExamTypes();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ExamTypeUpdateInput }) =>
      examTypesApi.update(id, input),
    onSuccess: invalidate,
  });
}

/** Convenience toggle — flips isActive via the update endpoint. */
export function useToggleExamType() {
  const invalidate = useInvalidateExamTypes();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      examTypesApi.update(id, { isActive }),
    onSuccess: invalidate,
  });
}

export function useDeleteExamType() {
  const invalidate = useInvalidateExamTypes();
  return useMutation({
    mutationFn: (id: string) => examTypesApi.remove(id),
    onSuccess: invalidate,
  });
}
