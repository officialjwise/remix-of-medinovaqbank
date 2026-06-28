import { getDeviceFingerprint } from "@/lib/device";
import { useAuthStore } from "@/stores/authStore";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api/v1";

/** Standard backend response envelope. */
interface Envelope<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  metadata?: {
    requestId?: string;
    correlationId?: string;
    timestamp?: string;
    pagination?: PaginationMeta;
  };
  errors?: unknown[];
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages?: number;
  hasNext?: boolean;
  hasPrev?: boolean;
}

export interface Paginated<T> {
  data: T[];
  meta: PaginationMeta;
}

export type QueryParams = Record<string, string | number | boolean | null | undefined>;

export interface RequestConfig {
  params?: QueryParams;
  signal?: AbortSignal;
  headers?: Record<string, string>;
}

/** Normalized error thrown by every client call (clean message + status + field errors). */
export class ApiError extends Error {
  statusCode: number;
  errors: unknown[];
  constructor(message: string, statusCode: number, errors: unknown[] = []) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

function buildUrl(path: string, params?: QueryParams): string {
  const base = path.startsWith("http") ? path : `${BASE_URL}${path}`;
  if (!params) return base;
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) qs.append(key, String(value));
  }
  const s = qs.toString();
  return s ? `${base}?${s}` : base;
}

/**
 * When the API is reached through an ngrok tunnel (e.g. while testing real
 * client IPs/geolocation), ngrok shows a browser interstitial for plain
 * requests. Sending this header bypasses it so API JSON calls work normally.
 */
const USES_NGROK = /ngrok(-free)?\.(dev|app|io)/i.test(BASE_URL);

async function buildHeaders(
  body: unknown,
  extra?: Record<string, string>,
): Promise<Record<string, string>> {
  const headers: Record<string, string> = { ...extra };
  const isForm = typeof FormData !== "undefined" && body instanceof FormData;
  // Let the browser set the multipart boundary for FormData uploads.
  if (!isForm && body !== undefined) headers["Content-Type"] = "application/json";

  const token = useAuthStore.getState().accessToken;
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const fp = await getDeviceFingerprint(); // null on the server
  if (fp) headers["X-Device-Fingerprint"] = fp;

  if (USES_NGROK) headers["ngrok-skip-browser-warning"] = "true";

  return headers;
}

function isAuthEndpoint(path: string): boolean {
  return /\/auth\/(login|refresh|register|forgot-password|reset-password|google)/.test(path);
}

// ── Single-flight refresh on 401. ──
let refreshing: Promise<boolean> | null = null;

export async function runRefresh(): Promise<boolean> {
  if (!refreshing) {
    refreshing = (async () => {
      const { refreshToken, setTokens } = useAuthStore.getState();
      if (!refreshToken) return false;
      try {
        const res = await fetch(`${BASE_URL}/auth/refresh`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(USES_NGROK ? { "ngrok-skip-browser-warning": "true" } : {}),
          },
          body: JSON.stringify({ refreshToken }),
        });
        if (!res.ok) return false;
        const env = (await res.json()) as Envelope<{ accessToken: string; refreshToken: string }>;
        setTokens(env.data.accessToken, env.data.refreshToken);
        return true;
      } catch {
        return false;
      }
    })();
    void refreshing.finally(() => {
      refreshing = null;
    });
  }
  return refreshing;
}

/** Public routes that must never be force-redirected to /login on a 401. */
const PUBLIC_PATHS = new Set([
  "/",
  "/about",
  "/contact",
  "/faq",
  "/help",
  "/pricing",
  "/privacy",
  "/terms",
  "/refund",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
]);
const PUBLIC_PREFIXES = ["/auth", "/payment"];

function isPublicPath(pathname: string): boolean {
  return (
    PUBLIC_PATHS.has(pathname) ||
    PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))
  );
}

function handleAuthFailure(): void {
  useAuthStore.getState().logout();
  // Only bounce to /login from a protected page. A 401 from a public page (e.g.
  // an anonymous visitor on the marketing homepage) must NOT redirect — the page
  // is meant to render for everyone.
  if (typeof window !== "undefined" && !isPublicPath(window.location.pathname)) {
    window.location.href = "/login";
  }
}

async function call<T>(
  method: string,
  path: string,
  body?: unknown,
  config?: RequestConfig,
  retried = false,
): Promise<Envelope<T>> {
  const isForm = typeof FormData !== "undefined" && body instanceof FormData;
  let res: Response;
  try {
    res = await fetch(buildUrl(path, config?.params), {
      method,
      headers: await buildHeaders(body, config?.headers),
      body: body === undefined ? undefined : isForm ? (body as FormData) : JSON.stringify(body),
      signal: config?.signal,
    });
  } catch (err) {
    // Network/transport failure (no response).
    throw new ApiError(err instanceof Error ? err.message : "Network error", 0);
  }

  // Attempt one refresh-and-retry on 401 (except for auth endpoints themselves).
  if (res.status === 401 && !retried && !isAuthEndpoint(path)) {
    const refreshed = await runRefresh();
    if (refreshed) return call<T>(method, path, body, config, true);
    handleAuthFailure();
  }

  let env: Envelope<T> | null = null;
  try {
    env = (await res.json()) as Envelope<T>;
  } catch {
    env = null;
  }

  if (!res.ok || !env || env.success === false) {
    const message = env?.message || res.statusText || "Request failed";
    const statusCode = env?.statusCode ?? res.status;
    const errors = env?.errors ?? [];
    throw new ApiError(message, statusCode, Array.isArray(errors) ? errors : [errors]);
  }
  return env;
}

export const apiClient = {
  async get<T>(path: string, config?: RequestConfig): Promise<T> {
    return (await call<T>("GET", path, undefined, config)).data;
  },

  /** GET a list endpoint, returning both rows and pagination metadata. */
  async getPaginated<T>(path: string, config?: RequestConfig): Promise<Paginated<T>> {
    const env = await call<T[]>("GET", path, undefined, config);
    return {
      data: env.data,
      meta: env.metadata?.pagination ?? {
        total: env.data.length,
        page: 1,
        limit: env.data.length,
      },
    };
  },

  async post<T>(path: string, body?: unknown, config?: RequestConfig): Promise<T> {
    return (await call<T>("POST", path, body, config)).data;
  },

  async patch<T>(path: string, body?: unknown, config?: RequestConfig): Promise<T> {
    return (await call<T>("PATCH", path, body, config)).data;
  },

  async put<T>(path: string, body?: unknown, config?: RequestConfig): Promise<T> {
    return (await call<T>("PUT", path, body, config)).data;
  },

  async delete<T>(path: string, body?: unknown, config?: RequestConfig): Promise<T> {
    return (await call<T>("DELETE", path, body, config)).data;
  },
};

export { BASE_URL };
