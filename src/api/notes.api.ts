/**
 * HIGH-YIELD NOTES domain — self-contained API module.
 *
 * Backend wire types + boundary mapper + endpoint functions + TanStack Query
 * hooks. Kept inside this file (not in the shared @/api/types|mappers) to avoid
 * cross-domain collisions, per project convention.
 *
 * The source PDF is NEVER served. Pages are streamed as watermarked images
 * behind short-lived, per-user signed URLs; every access is re-validated
 * server-side. Tier enforcement (whole-note `locked` + per-page `locked`) is
 * decided by the backend — the UI only respects those flags.
 *
 * Endpoints (all under /api/v1):
 *   GET /notes                       — tier-filtered list (paginated, user-scoped)
 *   GET /notes/:id                   — note detail (topics + per-page lock flags)
 *   GET /notes/:id/pages/:pageNumber — issue a signed image URL for one page
 *   GET /notes/assets/:token         — (server) streams the watermarked PNG; the
 *                                      page-URL endpoint returns the absolute URL
 *
 * Field mapping (backend NoteListItemDto / NoteUserDetailDto -> frontend view):
 *   tier   <- accessTier ('trial_and_paid'|'paid_only'|'none')
 *   locked <- locked (whole-note blur + Premium tag)
 *
 * GAPS (backend does not provide these on the user DTOs):
 *   - categoryName / examTypeName: only categoryId / examTypeId are returned, so
 *     the list filters by id; human-readable names are not available here. The
 *     category/exam *filter selects* therefore key off ids (see route note).
 *   - coverColor: the legacy card used a per-note color; not on the DTO -> a
 *     stable color is derived client-side from the note id.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient, BASE_URL } from "@/api/client";

// ── Backend enums (mirror src/database/entities/enums.ts). ──
export type BackendNoteAccessTier = "trial_and_paid" | "paid_only" | "none";
export type BackendNoteStatus = "processing" | "ready" | "failed";

// ── Backend wire shapes (inside the envelope's `data`). ──
export interface BackendNoteListItem {
  id: string;
  title: string;
  description: string | null;
  coverImageUrl: string | null;
  categoryId: string | null;
  examTypeId: string | null;
  accessTier: BackendNoteAccessTier;
  pageCount: number;
  status: BackendNoteStatus;
  locked: boolean;
}

export interface BackendNoteTopic {
  id: string;
  title: string;
  sortOrder: number;
  isHiddenForTrial: boolean;
}

export interface BackendNoteUserPage {
  pageNumber: number;
  topicId: string | null;
  locked: boolean;
}

export interface BackendNoteUserDetail {
  id: string;
  title: string;
  description: string | null;
  coverImageUrl: string | null;
  categoryId: string | null;
  examTypeId: string | null;
  accessTier: BackendNoteAccessTier;
  pageCount: number;
  status: BackendNoteStatus;
  locked: boolean;
  topics: BackendNoteTopic[];
  pages: BackendNoteUserPage[];
}

export interface BackendNotePageUrl {
  url: string;
  expiresIn: number;
}

// ── Frontend domain shapes (what the UI consumes). ──
export type NoteTier = BackendNoteAccessTier;

export interface NoteListItem {
  id: string;
  title: string;
  description: string;
  coverImageUrl: string | null;
  categoryId: string | null;
  examTypeId: string | null;
  tier: NoteTier;
  pageCount: number;
  status: BackendNoteStatus;
  /** Whole-note lock (blur + Premium tag) for this user. */
  locked: boolean;
  /** Stable, derived card color (GAP: no backend color field). */
  coverColor: string;
}

export interface NoteTopic {
  id: string;
  title: string;
  sortOrder: number;
  isHiddenForTrial: boolean;
}

export interface NotePage {
  pageNumber: number;
  topicId: string | null;
  /** Per-page lock from the tier (e.g. trial-hidden topic/page). */
  locked: boolean;
}

export interface NoteDetail {
  id: string;
  title: string;
  description: string;
  coverImageUrl: string | null;
  categoryId: string | null;
  examTypeId: string | null;
  tier: NoteTier;
  pageCount: number;
  status: BackendNoteStatus;
  locked: boolean;
  coverColor: string;
  topics: NoteTopic[];
  pages: NotePage[];
}

export interface NotePageUrl {
  url: string;
  /** Seconds the signed URL stays valid (short-lived by design). */
  expiresIn: number;
}

// ── Card color: stable hue derived from the note id (no backend color). ──
const NOTE_COLORS = [
  "#0E7C7B",
  "#3B82F6",
  "#7C3AED",
  "#DB2777",
  "#D97706",
  "#059669",
  "#DC2626",
  "#0891B2",
];

function colorForId(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return NOTE_COLORS[hash % NOTE_COLORS.length];
}

// ── Boundary mappers ──
export function mapNoteListItem(n: BackendNoteListItem): NoteListItem {
  return {
    id: n.id,
    title: n.title,
    description: n.description ?? "",
    coverImageUrl: n.coverImageUrl,
    categoryId: n.categoryId,
    examTypeId: n.examTypeId,
    tier: n.accessTier,
    pageCount: n.pageCount,
    status: n.status,
    locked: n.locked,
    coverColor: colorForId(n.id),
  };
}

export function mapNoteDetail(n: BackendNoteUserDetail): NoteDetail {
  return {
    id: n.id,
    title: n.title,
    description: n.description ?? "",
    coverImageUrl: n.coverImageUrl,
    categoryId: n.categoryId,
    examTypeId: n.examTypeId,
    tier: n.accessTier,
    pageCount: n.pageCount,
    status: n.status,
    locked: n.locked,
    coverColor: colorForId(n.id),
    topics: n.topics.map((t) => ({
      id: t.id,
      title: t.title,
      sortOrder: t.sortOrder,
      isHiddenForTrial: t.isHiddenForTrial,
    })),
    pages: n.pages.map((p) => ({
      pageNumber: p.pageNumber,
      topicId: p.topicId,
      locked: p.locked,
    })),
  };
}

/**
 * Resolve a possibly-relative signed asset URL to an absolute one the <img> can
 * load. The backend builds an absolute URL from `storage.publicBaseUrl`, but if
 * a relative `/api/v1/...` is ever returned we anchor it to the API origin.
 */
export function resolveAssetUrl(url: string): string {
  if (/^https?:\/\//.test(url)) return url;
  const origin = BASE_URL.replace(/\/api\/v1\/?$/, "");
  return `${origin}${url.startsWith("/") ? "" : "/"}${url}`;
}

// ── List query params (server-supported subset of NoteQueryDto). ──
export interface NoteListParams {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  examTypeId?: string;
  sortOrder?: "asc" | "desc";
}

function toQuery(p: NoteListParams): Record<string, string | number | boolean | undefined> {
  return {
    page: p.page,
    limit: p.limit,
    search: p.search?.trim() || undefined,
    categoryId: p.categoryId,
    examTypeId: p.examTypeId,
    sortOrder: p.sortOrder,
  };
}

export interface NoteListResult {
  notes: NoteListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const notesApi = {
  /** Tier-filtered list of published notes for the current user. */
  async list(params: NoteListParams = {}): Promise<NoteListResult> {
    const { data, meta } = await apiClient.getPaginated<BackendNoteListItem>("/notes", {
      params: toQuery({ limit: 100, ...params }),
    });
    return {
      notes: data.map(mapNoteListItem),
      total: meta.total,
      page: meta.page,
      limit: meta.limit,
      totalPages: meta.totalPages ?? 1,
    };
  },

  /** Note detail: topics + per-page lock flags. */
  async getById(id: string): Promise<NoteDetail> {
    const data = await apiClient.get<BackendNoteUserDetail>(`/notes/${id}`);
    return mapNoteDetail(data);
  },

  /**
   * Issue a short-lived, per-user signed URL for ONE page image. Throws ApiError
   * (403) when the page is not viewable for the user's tier — the caller never
   * requests a locked page.
   */
  async getPageUrl(id: string, pageNumber: number): Promise<NotePageUrl> {
    const data = await apiClient.get<BackendNotePageUrl>(`/notes/${id}/pages/${pageNumber}`);
    return { url: resolveAssetUrl(data.url), expiresIn: data.expiresIn };
  },
};

// ── Query keys ──
export const noteKeys = {
  all: ["notes"] as const,
  list: (params: NoteListParams) => [...noteKeys.all, "list", params] as const,
  detail: (id: string) => [...noteKeys.all, "detail", id] as const,
  pageUrl: (id: string, page: number) => [...noteKeys.all, "page-url", id, page] as const,
};

// ── Hooks ──

/** Tier-filtered list of published notes. */
export function useNotes(params: NoteListParams = {}) {
  return useQuery({
    queryKey: noteKeys.list(params),
    queryFn: () => notesApi.list(params),
    staleTime: 60_000,
  });
}

/** Note detail (topics + per-page lock flags). */
export function useNote(id: string) {
  return useQuery({
    queryKey: noteKeys.detail(id),
    queryFn: () => notesApi.getById(id),
    enabled: !!id,
  });
}

/**
 * Fetch a signed page URL on demand. Implemented as a mutation so the reader can
 * request pages one at a time (and re-request when the short-lived URL expires)
 * without TanStack caching a stale, soon-to-expire URL.
 */
export function useNotePageUrl() {
  return useMutation({
    mutationFn: ({ noteId, pageNumber }: { noteId: string; pageNumber: number }) =>
      notesApi.getPageUrl(noteId, pageNumber),
  });
}

export function useInvalidateNotes() {
  const qc = useQueryClient();
  return () => void qc.invalidateQueries({ queryKey: noteKeys.all });
}
