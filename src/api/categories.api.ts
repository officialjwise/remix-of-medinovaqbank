/**
 * CATEGORIES domain — self-contained API module.
 *
 * Backend wire types + boundary mapper + endpoint functions + TanStack Query
 * hooks. Kept inside this file (not in the shared @/api/types|mappers) to avoid
 * cross-domain collisions.
 *
 * Endpoints (all under /api/v1):
 *   GET    /categories              — public list (active only)
 *   GET    /admin/categories        — admin list (all)
 *   POST   /admin/categories        — admin create
 *   PATCH  /admin/categories/:id    — admin update
 *   DELETE /admin/categories/:id    — admin deactivate (soft delete)
 *
 * GAPS (backend does not provide these — see store/route notes):
 *   - bankCount / questionCount: not in CategoryResponseDto → defaulted to 0.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./client";

// ── Backend wire shape (SubcategoryResponseDto) ──
export interface BackendSubcategory {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
}

// ── Backend wire shape (CategoryResponseDto) ──
export interface BackendCategory {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  colorScheme: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  subcategories: BackendSubcategory[];
}

export interface CreateSubcategoryBody {
  name: string;
  slug?: string;
  sortOrder?: number;
}

export interface UpdateSubcategoryBody {
  name?: string;
  slug?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface CreateCategoryBody {
  name: string;
  description?: string;
  icon?: string;
  colorScheme?: string;
  sortOrder?: number;
}

export interface UpdateCategoryBody {
  name?: string;
  description?: string;
  icon?: string;
  colorScheme?: string;
  sortOrder?: number;
  isActive?: boolean;
}

// ── Frontend domain shape (what the UI consumes) ──
export interface Subcategory {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  /** Mapped from backend `colorScheme`. */
  color: string;
  description: string | null;
  icon: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  /** Server-provided subcategories for this category. */
  subcategories: Subcategory[];
  /** Not provided by the backend yet — defaulted to 0 (GAP). */
  bankCount: number;
  /** Not provided by the backend yet — defaulted to 0 (GAP). */
  questionCount: number;
}

/** Derive a URL-safe slug from a category name (backend has no slug field). */
export function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// ── Boundary mapper ──
export function mapSubcategory(s: BackendSubcategory): Subcategory {
  return {
    id: s.id,
    categoryId: s.categoryId,
    name: s.name,
    slug: s.slug,
    sortOrder: s.sortOrder,
    isActive: s.isActive,
    createdAt: s.createdAt,
  };
}

export function mapCategory(c: BackendCategory): Category {
  return {
    id: c.id,
    name: c.name,
    slug: slugify(c.name),
    color: c.colorScheme,
    description: c.description,
    icon: c.icon,
    isActive: c.isActive,
    sortOrder: c.sortOrder,
    createdAt: c.createdAt,
    subcategories: (c.subcategories ?? []).map(mapSubcategory),
    bankCount: 0,
    questionCount: 0,
  };
}

// ── Endpoint functions ──
export const categoriesApi = {
  /** Public active categories. */
  async listActive(): Promise<Category[]> {
    const data = await apiClient.get<BackendCategory[]>("/categories");
    return data.map(mapCategory);
  },

  /** Admin: all categories (active + inactive). */
  async listAll(): Promise<Category[]> {
    const data = await apiClient.get<BackendCategory[]>("/admin/categories");
    return data.map(mapCategory);
  },

  async create(body: CreateCategoryBody): Promise<Category> {
    const data = await apiClient.post<BackendCategory>("/admin/categories", body);
    return mapCategory(data);
  },

  async update(id: string, body: UpdateCategoryBody): Promise<Category> {
    const data = await apiClient.patch<BackendCategory>(`/admin/categories/${id}`, body);
    return mapCategory(data);
  },

  async remove(id: string): Promise<Category> {
    const data = await apiClient.delete<BackendCategory>(`/admin/categories/${id}`);
    return mapCategory(data);
  },

  // ── Subcategories — `categoryId` is the internal category UUID. ──
  async createSubcategory(categoryId: string, body: CreateSubcategoryBody): Promise<Subcategory> {
    const data = await apiClient.post<BackendSubcategory>(
      `/admin/categories/${categoryId}/subcategories`,
      body,
    );
    return mapSubcategory(data);
  },

  async updateSubcategory(
    categoryId: string,
    subId: string,
    body: UpdateSubcategoryBody,
  ): Promise<Subcategory> {
    const data = await apiClient.patch<BackendSubcategory>(
      `/admin/categories/${categoryId}/subcategories/${subId}`,
      body,
    );
    return mapSubcategory(data);
  },

  async deleteSubcategory(categoryId: string, subId: string): Promise<{ id: string }> {
    return apiClient.delete<{ id: string }>(
      `/admin/categories/${categoryId}/subcategories/${subId}`,
    );
  },
};

// ── Query keys ──
export const categoryKeys = {
  all: ["categories"] as const,
  active: () => [...categoryKeys.all, "active"] as const,
  admin: () => [...categoryKeys.all, "admin"] as const,
};

// ── Hooks ──

/** Public list of active categories (used by note upload/edit selects). */
export function useCategories() {
  return useQuery({
    queryKey: categoryKeys.active(),
    queryFn: categoriesApi.listActive,
    staleTime: 60_000,
  });
}

/** Admin list (all categories, including inactive). */
export function useAdminCategories() {
  return useQuery({
    queryKey: categoryKeys.admin(),
    queryFn: categoriesApi.listAll,
    staleTime: 30_000,
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateCategoryBody) => categoriesApi.create(body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: categoryKeys.all });
    },
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateCategoryBody }) =>
      categoriesApi.update(id, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: categoryKeys.all });
    },
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => categoriesApi.remove(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: categoryKeys.all });
    },
  });
}

export function useCreateSubcategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ categoryId, body }: { categoryId: string; body: CreateSubcategoryBody }) =>
      categoriesApi.createSubcategory(categoryId, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: categoryKeys.all });
    },
  });
}

export function useUpdateSubcategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      categoryId,
      subId,
      body,
    }: {
      categoryId: string;
      subId: string;
      body: UpdateSubcategoryBody;
    }) => categoriesApi.updateSubcategory(categoryId, subId, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: categoryKeys.all });
    },
  });
}

export function useDeleteSubcategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ categoryId, subId }: { categoryId: string; subId: string }) =>
      categoriesApi.deleteSubcategory(categoryId, subId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: categoryKeys.all });
    },
  });
}
