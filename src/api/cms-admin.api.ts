/**
 * ADMIN CMS domain — self-contained admin API module.
 *
 * Wires the SUPER_ADMIN content-management endpoints (all under /api/v1, scoped
 * to super_admin by CmsAdminController @ /admin/cms):
 *   GET    /admin/cms/pages          -> CmsPageResponseDto[]
 *   PATCH  /admin/cms/pages/:slug    -> CmsPageResponseDto
 *   GET    /admin/cms/help           -> HelpArticleResponseDto[]
 *   POST   /admin/cms/help           -> HelpArticleResponseDto
 *   PATCH  /admin/cms/help/:id       -> HelpArticleResponseDto
 *   DELETE /admin/cms/help/:id       -> null
 *
 * Backend wire types + boundary mappers are kept local (not in @/api/types or
 * @/api/mappers) to avoid cross-domain collisions. This admin module is
 * deliberately self-contained: it owns its own query keys (["cms-admin", …]) so
 * its invalidation never tangles with the public-read cms.api.ts module.
 */
import { useMutation, useQuery, useQueryClient, type UseQueryOptions } from "@tanstack/react-query";
import { apiClient } from "@/api/client";

// ── Backend wire shapes (mirror dto/cms.dto.ts) ─────────────────────────────

export interface BackendAdminCmsPage {
  slug: string;
  title: string;
  contentHtml: string;
  metaDescription: string | null;
  isPublished: boolean;
  updatedAt: string;
}

export interface BackendAdminHelpArticle {
  id: string;
  category: string;
  title: string;
  contentHtml: string;
  tags: string[];
  sortOrder: number;
  isPublished: boolean;
  updatedAt: string;
}

// ── Frontend domain shapes ──────────────────────────────────────────────────

export interface AdminCmsPage {
  slug: string;
  title: string;
  /** Rich HTML body. */
  body: string;
  metaDescription?: string;
  isPublished: boolean;
  updatedAt: string;
}

export interface AdminHelpArticle {
  id: string;
  category: string;
  title: string;
  /** Rich HTML body. */
  body: string;
  tags: string[];
  sortOrder: number;
  isPublished: boolean;
  updatedAt: string;
}

// ── Boundary mappers ────────────────────────────────────────────────────────

export function mapAdminCmsPage(p: BackendAdminCmsPage): AdminCmsPage {
  return {
    slug: p.slug,
    title: p.title,
    body: p.contentHtml,
    metaDescription: p.metaDescription ?? undefined,
    isPublished: p.isPublished,
    updatedAt: p.updatedAt,
  };
}

export function mapAdminHelpArticle(a: BackendAdminHelpArticle): AdminHelpArticle {
  return {
    id: a.id,
    category: a.category,
    title: a.title,
    body: a.contentHtml,
    tags: a.tags ?? [],
    sortOrder: a.sortOrder,
    isPublished: a.isPublished,
    updatedAt: a.updatedAt,
  };
}

// ── Write payloads (mirror Update/Create DTOs) ──────────────────────────────

export interface UpdateCmsPageInput {
  title?: string;
  contentHtml?: string;
  metaDescription?: string;
  isPublished?: boolean;
}

export interface CreateHelpArticleInput {
  category: string;
  title: string;
  contentHtml: string;
  tags?: string[];
  sortOrder?: number;
  isPublished?: boolean;
}

export interface UpdateHelpArticleInput {
  category?: string;
  title?: string;
  contentHtml?: string;
  tags?: string[];
  sortOrder?: number;
  isPublished?: boolean;
}

// ── Endpoint functions ──────────────────────────────────────────────────────

export const cmsAdminApi = {
  async listPages(): Promise<AdminCmsPage[]> {
    const data = await apiClient.get<BackendAdminCmsPage[]>("/admin/cms/pages");
    return data.map(mapAdminCmsPage);
  },

  async updatePage(slug: string, input: UpdateCmsPageInput): Promise<AdminCmsPage> {
    return mapAdminCmsPage(
      await apiClient.patch<BackendAdminCmsPage>(`/admin/cms/pages/${slug}`, input),
    );
  },

  async listHelp(): Promise<AdminHelpArticle[]> {
    const data = await apiClient.get<BackendAdminHelpArticle[]>("/admin/cms/help");
    return data.map(mapAdminHelpArticle);
  },

  async createHelp(input: CreateHelpArticleInput): Promise<AdminHelpArticle> {
    return mapAdminHelpArticle(
      await apiClient.post<BackendAdminHelpArticle>("/admin/cms/help", input),
    );
  },

  async updateHelp(id: string, input: UpdateHelpArticleInput): Promise<AdminHelpArticle> {
    return mapAdminHelpArticle(
      await apiClient.patch<BackendAdminHelpArticle>(`/admin/cms/help/${id}`, input),
    );
  },

  async deleteHelp(id: string): Promise<void> {
    await apiClient.delete<null>(`/admin/cms/help/${id}`);
  },
};

// ── Query keys ──────────────────────────────────────────────────────────────

export const cmsAdminKeys = {
  all: ["cms-admin"] as const,
  pages: () => [...cmsAdminKeys.all, "pages"] as const,
  help: () => [...cmsAdminKeys.all, "help"] as const,
};

// ── Query hooks ──────────────────────────────────────────────────────────────

export function useAdminCmsPages(options?: Partial<UseQueryOptions<AdminCmsPage[]>>) {
  return useQuery({
    queryKey: cmsAdminKeys.pages(),
    queryFn: () => cmsAdminApi.listPages(),
    staleTime: 30_000,
    ...options,
  });
}

export function useAdminHelpArticles(options?: Partial<UseQueryOptions<AdminHelpArticle[]>>) {
  return useQuery({
    queryKey: cmsAdminKeys.help(),
    queryFn: () => cmsAdminApi.listHelp(),
    staleTime: 30_000,
    ...options,
  });
}

// ── Mutation hooks ────────────────────────────────────────────────────────────

export function useUpdateCmsPage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ slug, input }: { slug: string; input: UpdateCmsPageInput }) =>
      cmsAdminApi.updatePage(slug, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: cmsAdminKeys.pages() });
      // Public-read cms.api.ts caches the same page under ["cms", "page", slug].
      void qc.invalidateQueries({ queryKey: ["cms"] });
    },
  });
}

export function useCreateHelpArticle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateHelpArticleInput) => cmsAdminApi.createHelp(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: cmsAdminKeys.help() });
      void qc.invalidateQueries({ queryKey: ["cms"] });
    },
  });
}

export function useUpdateHelpArticle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateHelpArticleInput }) =>
      cmsAdminApi.updateHelp(id, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: cmsAdminKeys.help() });
      void qc.invalidateQueries({ queryKey: ["cms"] });
    },
  });
}

export function useDeleteHelpArticle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cmsAdminApi.deleteHelp(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: cmsAdminKeys.help() });
      void qc.invalidateQueries({ queryKey: ["cms"] });
    },
  });
}
