/**
 * ADMIN HIGH-YIELD NOTES domain — self-contained API module.
 *
 * Backend wire types + boundary mapper + endpoint functions + TanStack Query
 * hooks. Kept inside this file (not in the shared @/api/types|mappers) to avoid
 * cross-domain collisions, per project convention. This mirrors the shape of
 * @/api/notes.api (user-facing reader) and @/api/questions.api (admin CRUD +
 * multipart upload).
 *
 * The admin uploads a PDF; the backend rasterises every page to a watermarked
 * PNG via poppler and streams those images to users behind short-lived signed
 * URLs. The source PDF is NEVER served. Admin screens manage metadata, the
 * topic set, and per-page topic/trial assignment — they do not see the page
 * bytes (the admin page DTO carries no image URL, only number + status flags).
 *
 * Endpoints (all under /api/v1, SUPER_ADMIN):
 *   POST   /admin/notes/upload            — multipart: file (PDF) + metadata
 *   GET    /admin/notes                   — paginated admin list (all fields)
 *   GET    /admin/notes/:id               — { note, topics, pages }
 *   PATCH  /admin/notes/:id               — update metadata / toggle active
 *   DELETE /admin/notes/:id               — soft delete (sets isActive=false)
 *   PATCH  /admin/notes/:id/topics        — upsert the topic set (by id)
 *   PATCH  /admin/notes/:id/pages/:pageId — assign a page to a topic / trial flag
 *   POST   /admin/notes/:id/reprocess     — re-run PDF→image conversion
 *
 * Field mapping (backend NoteAdminResponseDto -> frontend view):
 *   tier    <- accessTier ('trial_and_paid'|'paid_only'|'none')
 *   active  <- isActive
 *
 * GAP: the admin page DTO exposes no image URL (the watermarked PNG is private),
 * so the "Page Preview" shows per-page number + the note's processing status +
 * topic/trial assignment, never synthesized text.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/api/client";

// ── Backend enums (mirror src/database/entities/enums.ts). ──
export type BackendNoteAccessTier = "trial_and_paid" | "paid_only" | "none";
export type BackendNoteStatus = "processing" | "ready" | "failed";

// ── Backend wire shapes (inside the envelope's `data`). ──
export interface BackendAdminNote {
  id: string;
  title: string;
  description: string | null;
  categoryId: string | null;
  examTypeId: string | null;
  coverImageUrl: string | null;
  accessTier: BackendNoteAccessTier;
  pageCount: number;
  status: BackendNoteStatus;
  conversionProgress: number;
  processingError: string | null;
  isActive: boolean;
  createdById: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BackendAdminTopic {
  id: string;
  title: string;
  sortOrder: number;
  isHiddenForTrial: boolean;
}

export interface BackendAdminPage {
  id: string;
  pageNumber: number;
  topicId: string | null;
  isHiddenForTrial: boolean;
}

export interface BackendAdminNoteDetail {
  note: BackendAdminNote;
  topics: BackendAdminTopic[];
  pages: BackendAdminPage[];
}

// ── Frontend domain shapes (what the management UI consumes). ──
export type NoteTier = BackendNoteAccessTier;
export type NoteStatus = BackendNoteStatus;

export interface AdminNoteListItem {
  id: string;
  title: string;
  description: string;
  categoryId: string | null;
  examTypeId: string | null;
  coverImageUrl: string | null;
  tier: NoteTier;
  pageCount: number;
  status: NoteStatus;
  /** 0–100 background conversion progress (drives the live progress bar). */
  conversionProgress: number;
  processingError: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminNoteTopic {
  id: string;
  title: string;
  sortOrder: number;
  isHiddenForTrial: boolean;
}

export interface AdminNotePage {
  id: string;
  pageNumber: number;
  topicId: string | null;
  isHiddenForTrial: boolean;
}

export interface AdminNoteDetail extends AdminNoteListItem {
  topics: AdminNoteTopic[];
  pages: AdminNotePage[];
}

// ── Tier labels (frontend display). ──
export const TIER_LABELS: Record<NoteTier, string> = {
  trial_and_paid: "Trial + Paid",
  paid_only: "Paid Only",
  none: "Hidden",
};

export const STATUS_LABELS: Record<NoteStatus, string> = {
  processing: "Processing",
  ready: "Ready",
  failed: "Failed",
};

// ── Boundary mappers ──
export function mapAdminNote(n: BackendAdminNote): AdminNoteListItem {
  return {
    id: n.id,
    title: n.title,
    description: n.description ?? "",
    categoryId: n.categoryId,
    examTypeId: n.examTypeId,
    coverImageUrl: n.coverImageUrl,
    tier: n.accessTier,
    pageCount: n.pageCount,
    status: n.status,
    conversionProgress: n.conversionProgress ?? (n.status === "ready" ? 100 : 0),
    processingError: n.processingError,
    active: n.isActive,
    createdAt: n.createdAt,
    updatedAt: n.updatedAt,
  };
}

export function mapAdminTopic(t: BackendAdminTopic): AdminNoteTopic {
  return {
    id: t.id,
    title: t.title,
    sortOrder: t.sortOrder,
    isHiddenForTrial: t.isHiddenForTrial,
  };
}

export function mapAdminPage(p: BackendAdminPage): AdminNotePage {
  return {
    id: p.id,
    pageNumber: p.pageNumber,
    topicId: p.topicId,
    isHiddenForTrial: p.isHiddenForTrial,
  };
}

export function mapAdminNoteDetail(d: BackendAdminNoteDetail): AdminNoteDetail {
  return {
    ...mapAdminNote(d.note),
    topics: d.topics.map(mapAdminTopic),
    pages: d.pages.map(mapAdminPage),
  };
}

// ── List query params (server-supported subset of NoteQueryDto). ──
export interface AdminNoteListParams {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  accessTier?: NoteTier;
  status?: NoteStatus;
  isActive?: boolean;
  sortOrder?: "asc" | "desc";
}

function toQuery(p: AdminNoteListParams): Record<string, string | number | boolean | undefined> {
  return {
    page: p.page,
    limit: p.limit,
    search: p.search?.trim() || undefined,
    categoryId: p.categoryId,
    accessTier: p.accessTier,
    status: p.status,
    isActive: p.isActive,
    sortOrder: p.sortOrder,
  };
}

export interface AdminNoteListResult {
  notes: AdminNoteListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ── Write payloads. ──
/** Multipart upload metadata (the File is appended separately as `file`). */
export interface UploadNoteInput {
  file: File;
  title: string;
  description?: string;
  categoryId?: string;
  examTypeId?: string;
  accessTier: NoteTier;
}

/** Mirrors UpdateNoteDto — all fields optional (patch). */
export interface UpdateNoteInput {
  title?: string;
  description?: string;
  categoryId?: string;
  examTypeId?: string;
  coverImageUrl?: string;
  accessTier?: NoteTier;
  isActive?: boolean;
}

/** Mirrors TopicInputDto — `id` present updates, omitted creates. */
export interface TopicInput {
  id?: string;
  title: string;
  sortOrder?: number;
  isHiddenForTrial?: boolean;
}

/** Mirrors UpdatePageDto. */
export interface UpdatePageInput {
  topicId?: string;
  isHiddenForTrial?: boolean;
}

// ── Endpoint functions ──
export const adminNotesApi = {
  /** Admin paginated list. */
  async list(params: AdminNoteListParams = {}): Promise<AdminNoteListResult> {
    const { data, meta } = await apiClient.getPaginated<BackendAdminNote>("/admin/notes", {
      params: toQuery({ limit: 100, ...params }),
    });
    return {
      notes: data.map(mapAdminNote),
      total: meta.total,
      page: meta.page,
      limit: meta.limit,
      totalPages: meta.totalPages ?? 1,
    };
  },

  /** Note detail: note + topics + per-page assignment. */
  async getById(id: string): Promise<AdminNoteDetail> {
    const data = await apiClient.get<BackendAdminNoteDetail>(`/admin/notes/${id}`);
    return mapAdminNoteDetail(data);
  },

  /** Upload a PDF (multipart) + metadata; returns the created note. */
  async upload(input: UploadNoteInput): Promise<AdminNoteListItem> {
    const form = new FormData();
    form.append("file", input.file);
    form.append("title", input.title);
    if (input.description) form.append("description", input.description);
    if (input.categoryId) form.append("categoryId", input.categoryId);
    if (input.examTypeId) form.append("examTypeId", input.examTypeId);
    form.append("accessTier", input.accessTier);
    const data = await apiClient.post<BackendAdminNote>("/admin/notes/upload", form);
    return mapAdminNote(data);
  },

  async update(id: string, input: UpdateNoteInput): Promise<AdminNoteListItem> {
    const data = await apiClient.patch<BackendAdminNote>(`/admin/notes/${id}`, input);
    return mapAdminNote(data);
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete<null>(`/admin/notes/${id}`);
  },

  /** Upsert the note's topic set (by id). Returns the new ordered set. */
  async updateTopics(id: string, topics: TopicInput[]): Promise<AdminNoteTopic[]> {
    const data = await apiClient.patch<BackendAdminTopic[]>(`/admin/notes/${id}/topics`, {
      topics,
    });
    return data.map(mapAdminTopic);
  },

  /** Assign a single page to a topic and/or toggle its trial visibility. */
  async updatePage(id: string, pageId: string, input: UpdatePageInput): Promise<AdminNotePage> {
    const data = await apiClient.patch<BackendAdminPage>(
      `/admin/notes/${id}/pages/${pageId}`,
      input,
    );
    return mapAdminPage(data);
  },

  /** Re-run PDF→image conversion. */
  async reprocess(id: string): Promise<AdminNoteListItem> {
    const data = await apiClient.post<BackendAdminNote>(`/admin/notes/${id}/reprocess`);
    return mapAdminNote(data);
  },
};

// ── Query keys ──
export const adminNoteKeys = {
  all: ["admin-notes"] as const,
  list: (params: AdminNoteListParams) => [...adminNoteKeys.all, "list", params] as const,
  detail: (id: string) => [...adminNoteKeys.all, "detail", id] as const,
};

// ── Hooks ──

/** Admin note list (paginated, filterable). Polls fast while a note is still
 * converting so the progress bar advances live, then settles once all are done. */
export function useAdminNotes(params: AdminNoteListParams = {}) {
  return useQuery({
    queryKey: adminNoteKeys.list(params),
    queryFn: () => adminNotesApi.list(params),
    staleTime: 30_000,
    refetchInterval: (query) =>
      (query.state.data?.notes ?? []).some((n) => n.status === "processing")
        ? 1500
        : false,
  });
}

/** Note detail (note + topics + pages). Polls while the note is still converting. */
export function useAdminNote(id: string) {
  return useQuery({
    queryKey: adminNoteKeys.detail(id),
    queryFn: () => adminNotesApi.getById(id),
    enabled: !!id,
    refetchInterval: (query) =>
      query.state.data?.status === "processing" ? 1500 : false,
  });
}

function useInvalidateAdminNotes() {
  const qc = useQueryClient();
  return () => void qc.invalidateQueries({ queryKey: adminNoteKeys.all });
}

/** Upload a PDF + metadata (multipart). */
export function useUploadNote() {
  const invalidate = useInvalidateAdminNotes();
  return useMutation({
    mutationFn: (input: UploadNoteInput) => adminNotesApi.upload(input),
    onSuccess: invalidate,
  });
}

export function useUpdateNote() {
  const qc = useQueryClient();
  const invalidate = useInvalidateAdminNotes();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateNoteInput }) =>
      adminNotesApi.update(id, input),
    onSuccess: (_data, { id }) => {
      invalidate();
      void qc.invalidateQueries({ queryKey: adminNoteKeys.detail(id) });
    },
  });
}

export function useDeleteNote() {
  const invalidate = useInvalidateAdminNotes();
  return useMutation({
    mutationFn: (id: string) => adminNotesApi.remove(id),
    onSuccess: invalidate,
  });
}

export function useUpdateNoteTopics() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, topics }: { id: string; topics: TopicInput[] }) =>
      adminNotesApi.updateTopics(id, topics),
    onSuccess: (_data, { id }) => void qc.invalidateQueries({ queryKey: adminNoteKeys.detail(id) }),
  });
}

export function useUpdateNotePage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, pageId, input }: { id: string; pageId: string; input: UpdatePageInput }) =>
      adminNotesApi.updatePage(id, pageId, input),
    onSuccess: (_data, { id }) => void qc.invalidateQueries({ queryKey: adminNoteKeys.detail(id) }),
  });
}

export function useReprocessNote() {
  const qc = useQueryClient();
  const invalidate = useInvalidateAdminNotes();
  return useMutation({
    mutationFn: (id: string) => adminNotesApi.reprocess(id),
    onSuccess: (_data, id) => {
      invalidate();
      void qc.invalidateQueries({ queryKey: adminNoteKeys.detail(id) });
    },
  });
}
