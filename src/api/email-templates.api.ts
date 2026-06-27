/**
 * EMAIL TEMPLATES domain — self-contained admin API module.
 *
 * Wires the SUPER_ADMIN email-template management endpoints (all under
 * /api/v1/admin, scoped to super_admin by the backend):
 *   GET    /admin/email-templates              -> EmailTemplateResponseDto[]
 *   GET    /admin/email-templates/:key         -> EmailTemplateResponseDto
 *   PATCH  /admin/email-templates/:key         -> EmailTemplateResponseDto
 *   POST   /admin/email-templates/:key/preview -> { subject, html }
 *   POST   /admin/email-templates/:key/test-send -> { delivered }
 *   POST   /admin/email-templates/:key/reset   -> EmailTemplateResponseDto
 *   GET    /admin/email-logs                   -> EmailLogResponseDto[] + pagination
 *
 * Backend wire types + boundary mappers live HERE (not in @/api/types /
 * @/api/mappers) to avoid cross-domain collisions, per project convention.
 */
import { useMutation, useQuery, useQueryClient, type UseQueryOptions } from "@tanstack/react-query";
import { apiClient } from "@/api/client";

// ── Backend wire shapes (mirror dto/email-template-response.dto.ts) ──────────

export interface BackendEmailTemplate {
  id: string;
  key: string;
  name: string;
  subject: string;
  bodyHtml: string;
  description: string | null;
  availableVariables: string[];
  category: string;
  isActive: boolean;
  updatedAt: string;
}

/** EmailLog status values (mirror email-log-query.dto IsIn). */
export type EmailLogStatus = "sent" | "failed" | "skipped";

export interface BackendEmailLog {
  id: string;
  templateKey: string | null;
  recipient: string;
  subject: string;
  status: string;
  error: string | null;
  userId: string | null;
  createdAt: string;
}

// ── Frontend domain shapes ──────────────────────────────────────────────────

export interface EmailTemplate {
  id: string;
  key: string;
  name: string;
  subject: string;
  /** Rich HTML body (handlebars-style {{var}} placeholders). */
  bodyHtml: string;
  description?: string;
  /** Variable names usable in subject/body, e.g. ["name", "verifyUrl"]. */
  availableVariables: string[];
  category: string;
  isActive: boolean;
  updatedAt: string;
}

export interface EmailLog {
  id: string;
  templateKey?: string;
  recipient: string;
  subject: string;
  status: string;
  error?: string;
  userId?: string;
  createdAt: string;
}

/** Result of POST /preview — fully rendered subject + html. */
export interface EmailPreview {
  subject: string;
  html: string;
}

// ── Boundary mappers ────────────────────────────────────────────────────────

export function mapEmailTemplate(t: BackendEmailTemplate): EmailTemplate {
  return {
    id: t.id,
    key: t.key,
    name: t.name,
    subject: t.subject,
    bodyHtml: t.bodyHtml,
    description: t.description ?? undefined,
    availableVariables: t.availableVariables ?? [],
    category: t.category,
    isActive: t.isActive,
    updatedAt: t.updatedAt,
  };
}

export function mapEmailLog(l: BackendEmailLog): EmailLog {
  return {
    id: l.id,
    templateKey: l.templateKey ?? undefined,
    recipient: l.recipient,
    subject: l.subject,
    status: l.status,
    error: l.error ?? undefined,
    userId: l.userId ?? undefined,
    createdAt: l.createdAt,
  };
}

// ── Write payloads (mirror UpdateEmailTemplateDto / Preview / TestSend) ──────

export interface UpdateEmailTemplateInput {
  name?: string;
  subject?: string;
  bodyHtml?: string;
  description?: string;
  availableVariables?: string[];
  isActive?: boolean;
}

export interface PreviewEmailInput {
  /** Overrides merged over the template's built-in sample data. */
  sampleContext?: Record<string, unknown>;
}

export interface TestSendInput {
  to: string;
  sampleContext?: Record<string, unknown>;
}

export interface EmailLogsParams {
  page?: number;
  limit?: number;
  status?: EmailLogStatus;
  templateKey?: string;
}

export interface EmailLogsPage {
  items: EmailLog[];
  total: number;
  page: number;
  limit: number;
}

// ── Endpoint functions ──────────────────────────────────────────────────────

export const emailTemplatesApi = {
  async list(): Promise<EmailTemplate[]> {
    const data = await apiClient.get<BackendEmailTemplate[]>("/admin/email-templates");
    return data.map(mapEmailTemplate);
  },

  async getByKey(key: string): Promise<EmailTemplate> {
    return mapEmailTemplate(
      await apiClient.get<BackendEmailTemplate>(`/admin/email-templates/${key}`),
    );
  },

  async update(key: string, input: UpdateEmailTemplateInput): Promise<EmailTemplate> {
    return mapEmailTemplate(
      await apiClient.patch<BackendEmailTemplate>(`/admin/email-templates/${key}`, input),
    );
  },

  async preview(key: string, input: PreviewEmailInput = {}): Promise<EmailPreview> {
    return apiClient.post<EmailPreview>(`/admin/email-templates/${key}/preview`, input);
  },

  async testSend(key: string, input: TestSendInput): Promise<{ delivered: boolean }> {
    return apiClient.post<{ delivered: boolean }>(`/admin/email-templates/${key}/test-send`, input);
  },

  async reset(key: string): Promise<EmailTemplate> {
    return mapEmailTemplate(
      await apiClient.post<BackendEmailTemplate>(`/admin/email-templates/${key}/reset`, {}),
    );
  },

  async logs(params: EmailLogsParams = {}): Promise<EmailLogsPage> {
    const { data, meta } = await apiClient.getPaginated<BackendEmailLog>("/admin/email-logs", {
      params: {
        page: params.page,
        limit: params.limit,
        status: params.status,
        templateKey: params.templateKey,
      },
    });
    return {
      items: data.map(mapEmailLog),
      total: meta.total,
      page: meta.page,
      limit: meta.limit,
    };
  },
};

// ── Query keys ──────────────────────────────────────────────────────────────

export const emailTemplateKeys = {
  all: ["email-templates"] as const,
  list: () => [...emailTemplateKeys.all, "list"] as const,
  detail: (key: string) => [...emailTemplateKeys.all, "detail", key] as const,
  logs: (params: EmailLogsParams) => [...emailTemplateKeys.all, "logs", params] as const,
};

// ── Query hooks ──────────────────────────────────────────────────────────────

export function useEmailTemplates(options?: Partial<UseQueryOptions<EmailTemplate[]>>) {
  return useQuery({
    queryKey: emailTemplateKeys.list(),
    queryFn: () => emailTemplatesApi.list(),
    staleTime: 60_000,
    ...options,
  });
}

export function useEmailTemplate(key: string, enabled = true) {
  return useQuery({
    queryKey: emailTemplateKeys.detail(key),
    queryFn: () => emailTemplatesApi.getByKey(key),
    enabled: enabled && !!key,
  });
}

export function useEmailLogs(
  params: EmailLogsParams = {},
  options?: Partial<UseQueryOptions<EmailLogsPage>>,
) {
  return useQuery({
    queryKey: emailTemplateKeys.logs(params),
    queryFn: () => emailTemplatesApi.logs(params),
    ...options,
  });
}

// ── Mutation hooks ────────────────────────────────────────────────────────────

function useInvalidateEmailTemplates() {
  const qc = useQueryClient();
  return () => void qc.invalidateQueries({ queryKey: emailTemplateKeys.all });
}

export function useUpdateEmailTemplate() {
  const invalidate = useInvalidateEmailTemplates();
  return useMutation({
    mutationFn: ({ key, input }: { key: string; input: UpdateEmailTemplateInput }) =>
      emailTemplatesApi.update(key, input),
    onSuccess: invalidate,
  });
}

export function useResetEmailTemplate() {
  const invalidate = useInvalidateEmailTemplates();
  return useMutation({
    mutationFn: (key: string) => emailTemplatesApi.reset(key),
    onSuccess: invalidate,
  });
}

/**
 * Render a template preview on demand. Not a query (POST + ephemeral) so it is
 * exposed as a mutation; callers read `data` for the rendered { subject, html }.
 */
export function usePreviewEmailTemplate() {
  return useMutation({
    mutationFn: ({ key, input }: { key: string; input?: PreviewEmailInput }) =>
      emailTemplatesApi.preview(key, input),
  });
}

export function useTestSendEmailTemplate() {
  return useMutation({
    mutationFn: ({ key, input }: { key: string; input: TestSendInput }) =>
      emailTemplatesApi.testSend(key, input),
  });
}
