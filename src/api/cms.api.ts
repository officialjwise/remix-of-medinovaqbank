/**
 * CMS domain wiring — public reads + admin mutations for help / legal / FAQ.
 *
 * Self-contained: backend wire types, boundary mappers, an `cmsApi` object of
 * endpoint functions, and TanStack Query hooks. Kept out of the shared
 * `@/api/types` + `@/api/mappers` to avoid cross-domain collisions.
 *
 * Backend (NestJS, all under /api/v1):
 *   Public:
 *     GET  /cms/pages/:slug      -> CmsPageResponseDto
 *     GET  /cms/help             -> Array<{ category, articles: HelpArticleResponseDto[] }>
 *     GET  /cms/faq              -> HelpArticleResponseDto[]   (category === 'FAQ')
 *     GET  /cms/help/:id         -> HelpArticleResponseDto
 *   Admin (SUPER_ADMIN, under /admin/cms):
 *     GET    /admin/cms/pages
 *     PATCH  /admin/cms/pages/:slug
 *     GET    /admin/cms/help
 *     POST   /admin/cms/help
 *     PATCH  /admin/cms/help/:id
 *     DELETE /admin/cms/help/:id
 */
import { useMutation, useQuery, useQueryClient, type UseQueryOptions } from "@tanstack/react-query";
import { ApiError } from "./client";
import { apiClient } from "./client";

// ── Backend wire shapes (mirror dto/cms.dto.ts) ─────────────────────────────

export interface BackendCmsPage {
  slug: string;
  title: string;
  contentHtml: string;
  metaDescription: string | null;
  isPublished: boolean;
  updatedAt: string;
}

export interface BackendHelpArticle {
  id: string;
  category: string;
  title: string;
  contentHtml: string;
  tags: string[];
  sortOrder: number;
  isPublished: boolean;
  updatedAt: string;
}

export interface BackendHelpGroup {
  category: string;
  articles: BackendHelpArticle[];
}

// ── Frontend domain shapes ──────────────────────────────────────────────────

/** A legal / informational page (terms, privacy, refund, …). */
export interface CmsPage {
  slug: string;
  title: string;
  /** Rich HTML body. */
  body: string;
  metaDescription?: string;
  isPublished: boolean;
  updatedAt: string;
}

/** A help-center article. */
export interface CmsHelpArticle {
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

/** A FAQ entry derived from a help article in the `FAQ` category. */
export interface CmsFaqEntry {
  id: string;
  category: string;
  question: string;
  /** Rich HTML answer. */
  answer: string;
}

export interface CmsHelpGroup {
  category: string;
  articles: CmsHelpArticle[];
}

// ── Boundary mappers ────────────────────────────────────────────────────────

export function mapCmsPage(p: BackendCmsPage): CmsPage {
  return {
    slug: p.slug,
    title: p.title,
    body: p.contentHtml,
    metaDescription: p.metaDescription ?? undefined,
    isPublished: p.isPublished,
    updatedAt: p.updatedAt,
  };
}

export function mapHelpArticle(a: BackendHelpArticle): CmsHelpArticle {
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

export function mapHelpGroup(g: BackendHelpGroup): CmsHelpGroup {
  return { category: g.category, articles: (g.articles ?? []).map(mapHelpArticle) };
}

/** FAQ articles carry the question in `title` and the answer in `contentHtml`. */
export function mapFaqEntry(a: BackendHelpArticle): CmsFaqEntry {
  return {
    id: a.id,
    category: a.category,
    question: a.title,
    answer: a.contentHtml,
  };
}

// ── Canonical backend page slugs (frontend uses friendlier names) ───────────

/** Maps a frontend page key to the backend CMS slug it is stored under. */
export const CMS_PAGE_SLUGS = {
  terms: "terms",
  privacy: "privacy",
  refund: "refund_policy",
  cookie: "cookie_policy",
  about: "about",
  contact: "contact",
} as const;

export type CmsPageKey = keyof typeof CMS_PAGE_SLUGS;

// ── Admin mutation inputs (mirror Update/Create DTOs) ───────────────────────

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

export const cmsApi = {
  // Public
  async getPage(slug: string): Promise<CmsPage> {
    return mapCmsPage(await apiClient.get<BackendCmsPage>(`/cms/pages/${slug}`));
  },
  async getHelp(): Promise<CmsHelpGroup[]> {
    const groups = await apiClient.get<BackendHelpGroup[]>("/cms/help");
    return groups.map(mapHelpGroup);
  },
  async getFaq(): Promise<CmsFaqEntry[]> {
    const items = await apiClient.get<BackendHelpArticle[]>("/cms/faq");
    return items.map(mapFaqEntry);
  },
  async getArticle(id: string): Promise<CmsHelpArticle> {
    return mapHelpArticle(await apiClient.get<BackendHelpArticle>(`/cms/help/${id}`));
  },

  // Admin
  async listPages(): Promise<CmsPage[]> {
    const pages = await apiClient.get<BackendCmsPage[]>("/admin/cms/pages");
    return pages.map(mapCmsPage);
  },
  async updatePage(slug: string, input: UpdateCmsPageInput): Promise<CmsPage> {
    return mapCmsPage(await apiClient.patch<BackendCmsPage>(`/admin/cms/pages/${slug}`, input));
  },
  async listHelp(): Promise<CmsHelpArticle[]> {
    const items = await apiClient.get<BackendHelpArticle[]>("/admin/cms/help");
    return items.map(mapHelpArticle);
  },
  async createHelp(input: CreateHelpArticleInput): Promise<CmsHelpArticle> {
    return mapHelpArticle(await apiClient.post<BackendHelpArticle>("/admin/cms/help", input));
  },
  async updateHelp(id: string, input: UpdateHelpArticleInput): Promise<CmsHelpArticle> {
    return mapHelpArticle(
      await apiClient.patch<BackendHelpArticle>(`/admin/cms/help/${id}`, input),
    );
  },
  async deleteHelp(id: string): Promise<void> {
    await apiClient.delete<null>(`/admin/cms/help/${id}`);
  },
};

// ── Query keys ──────────────────────────────────────────────────────────────

export const cmsKeys = {
  all: ["cms"] as const,
  page: (slug: string) => ["cms", "page", slug] as const,
  help: () => ["cms", "help"] as const,
  faq: () => ["cms", "faq"] as const,
  article: (id: string) => ["cms", "article", id] as const,
  adminPages: () => ["cms", "admin", "pages"] as const,
  adminHelp: () => ["cms", "admin", "help"] as const,
};

// ── Public query hooks ──────────────────────────────────────────────────────

/**
 * Fetch a published CMS page by frontend key (resolves the backend slug).
 *
 * Returns `undefined` (not an error) when the page is missing (404) so callers
 * can fall back to static content gracefully. Other errors still surface.
 */
export function useCmsPage(
  key: CmsPageKey,
  options?: Omit<UseQueryOptions<CmsPage | undefined>, "queryKey" | "queryFn">,
) {
  const slug = CMS_PAGE_SLUGS[key];
  return useQuery<CmsPage | undefined>({
    queryKey: cmsKeys.page(slug),
    queryFn: async () => {
      try {
        return await cmsApi.getPage(slug);
      } catch (err) {
        if (err instanceof ApiError && err.statusCode === 404) return undefined;
        throw err;
      }
    },
    staleTime: 5 * 60_000,
    retry: false,
    ...options,
  });
}

export function useCmsHelp(
  options?: Omit<UseQueryOptions<CmsHelpGroup[]>, "queryKey" | "queryFn">,
) {
  return useQuery<CmsHelpGroup[]>({
    queryKey: cmsKeys.help(),
    queryFn: () => cmsApi.getHelp(),
    staleTime: 5 * 60_000,
    ...options,
  });
}

export function useCmsFaq(options?: Omit<UseQueryOptions<CmsFaqEntry[]>, "queryKey" | "queryFn">) {
  return useQuery<CmsFaqEntry[]>({
    queryKey: cmsKeys.faq(),
    queryFn: () => cmsApi.getFaq(),
    staleTime: 5 * 60_000,
    ...options,
  });
}

export function useCmsArticle(id: string, enabled = true) {
  return useQuery<CmsHelpArticle>({
    queryKey: cmsKeys.article(id),
    queryFn: () => cmsApi.getArticle(id),
    enabled: enabled && !!id,
    staleTime: 5 * 60_000,
  });
}

// ── Admin query + mutation hooks ────────────────────────────────────────────

export function useAdminCmsPages(enabled = true) {
  return useQuery<CmsPage[]>({
    queryKey: cmsKeys.adminPages(),
    queryFn: () => cmsApi.listPages(),
    enabled,
  });
}

export function useAdminHelpArticles(enabled = true) {
  return useQuery<CmsHelpArticle[]>({
    queryKey: cmsKeys.adminHelp(),
    queryFn: () => cmsApi.listHelp(),
    enabled,
  });
}

export function useUpdateCmsPage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ slug, input }: { slug: string; input: UpdateCmsPageInput }) =>
      cmsApi.updatePage(slug, input),
    onSuccess: (page) => {
      qc.invalidateQueries({ queryKey: cmsKeys.adminPages() });
      qc.invalidateQueries({ queryKey: cmsKeys.page(page.slug) });
    },
  });
}

export function useCreateHelpArticle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateHelpArticleInput) => cmsApi.createHelp(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: cmsKeys.adminHelp() });
      qc.invalidateQueries({ queryKey: cmsKeys.help() });
      qc.invalidateQueries({ queryKey: cmsKeys.faq() });
    },
  });
}

export function useUpdateHelpArticle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateHelpArticleInput }) =>
      cmsApi.updateHelp(id, input),
    onSuccess: (article) => {
      qc.invalidateQueries({ queryKey: cmsKeys.adminHelp() });
      qc.invalidateQueries({ queryKey: cmsKeys.help() });
      qc.invalidateQueries({ queryKey: cmsKeys.faq() });
      qc.invalidateQueries({ queryKey: cmsKeys.article(article.id) });
    },
  });
}

export function useDeleteHelpArticle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cmsApi.deleteHelp(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: cmsKeys.adminHelp() });
      qc.invalidateQueries({ queryKey: cmsKeys.help() });
      qc.invalidateQueries({ queryKey: cmsKeys.faq() });
    },
  });
}
