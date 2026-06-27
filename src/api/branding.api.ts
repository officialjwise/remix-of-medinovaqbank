/**
 * BRANDING domain — self-contained API module.
 *
 * The backend resolves all `branding.*` catalog settings into a FLAT object
 * keyed by SHORT name (e.g. `appName`, `colorPrimary`, `logoLightUrl`). The
 * public endpoint exposes the same (all branding fields are non-sensitive); the
 * admin endpoint is identical but role-gated and writable.
 *
 * Wires (all under /api/v1):
 *   GET    /branding         — public branding (Public)
 *   GET    /admin/branding   — super_admin read (same shape)
 *   PATCH  /admin/branding   — super_admin update { settings: [{key,value}] };
 *                              keys may be short (`appName`) or full
 *                              (`branding.appName`) — the service normalises.
 *
 * Backend wire types + hooks live HERE (not in @/api/types|mappers) to avoid
 * cross-domain collisions, per project convention.
 *
 * The view model is a typed projection of the known short keys (see
 * BRANDING_FIELDS in the backend catalog), with safe string defaults so forms
 * never receive `undefined`. Unknown keys still round-trip via the raw record.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/api/client";

/** Raw wire shape: flat record of short key -> string. */
export type BackendBranding = Record<string, string>;

/** Known branding short keys (mirror BRANDING_FIELDS in settings.catalog.ts). */
export const BRANDING_KEYS = [
  "appName",
  "tagline",
  "legalName",
  "supportEmail",
  "supportPhone",
  "companyAddress",
  "logoLightUrl",
  "logoDarkUrl",
  "emailLogoUrl",
  "faviconUrl",
  "pwaIconUrl",
  "loginBackgroundUrl",
  "colorPrimary",
  "colorAccent",
  "colorSuccess",
  "colorWarning",
  "fontHeading",
  "fontBody",
  "socialTwitter",
  "socialFacebook",
  "socialInstagram",
  "socialLinkedin",
  "socialYoutube",
  "socialWhatsapp",
  "emailFooterText",
  "unsubscribeUrl",
] as const;

export type BrandingKey = (typeof BRANDING_KEYS)[number];

/** Typed view model — every known key resolved to a string (empty when unset). */
export type Branding = Record<BrandingKey, string>;

const DEFAULTS: Branding = {
  appName: "Medinovaqbank",
  tagline: "Professional Medical Question Bank",
  legalName: "Medinovaqbank",
  supportEmail: "",
  supportPhone: "",
  companyAddress: "",
  logoLightUrl: "",
  logoDarkUrl: "",
  emailLogoUrl: "",
  faviconUrl: "",
  pwaIconUrl: "",
  loginBackgroundUrl: "",
  colorPrimary: "#2563eb",
  colorAccent: "#7c3aed",
  colorSuccess: "#16a34a",
  colorWarning: "#f59e0b",
  fontHeading: "Inter",
  fontBody: "Inter",
  socialTwitter: "",
  socialFacebook: "",
  socialInstagram: "",
  socialLinkedin: "",
  socialYoutube: "",
  socialWhatsapp: "",
  emailFooterText: "© Medinovaqbank · Professional Medical Question Bank",
  unsubscribeUrl: "",
};

/** Boundary mapper: raw flat record -> typed Branding (with defaults). */
export function mapBranding(raw: BackendBranding): Branding {
  const out = { ...DEFAULTS };
  for (const key of BRANDING_KEYS) {
    if (raw[key] !== undefined && raw[key] !== "") out[key] = raw[key];
  }
  return out;
}

/** Build the PATCH payload from a (partial) branding edit. Uses short keys. */
export function toBrandingUpdates(
  values: Partial<Branding>,
): Array<{ key: string; value: string }> {
  return Object.entries(values)
    .filter(([key]) => (BRANDING_KEYS as readonly string[]).includes(key))
    .map(([key, value]) => ({ key, value: value ?? "" }));
}

export const brandingApi = {
  /** Public branding (no auth). */
  async getPublic(): Promise<Branding> {
    const data = await apiClient.get<BackendBranding>("/branding");
    return mapBranding(data);
  },

  /** Admin branding (super_admin). */
  async getAdmin(): Promise<Branding> {
    const data = await apiClient.get<BackendBranding>("/admin/branding");
    return mapBranding(data);
  },

  /** Update branding fields; returns the full resolved branding. */
  async update(values: Partial<Branding>): Promise<Branding> {
    const data = await apiClient.patch<BackendBranding>("/admin/branding", {
      settings: toBrandingUpdates(values),
    });
    return mapBranding(data);
  },

  /** Upload a branding image (multipart 'file') and return its public URL. */
  async uploadAsset(file: File | Blob): Promise<string> {
    const form = new FormData();
    form.append("file", file, "branding-asset");
    const data = await apiClient.post<{ url: string }>("/admin/branding/upload", form);
    return data.url;
  },
};

// ── Query keys ──
export const brandingKeys = {
  all: ["branding"] as const,
  public: () => [...brandingKeys.all, "public"] as const,
  admin: () => [...brandingKeys.all, "admin"] as const,
};

// ── Hooks ──

export function usePublicBranding() {
  return useQuery({
    queryKey: brandingKeys.public(),
    queryFn: brandingApi.getPublic,
    staleTime: 5 * 60_000,
  });
}

export function useAdminBranding() {
  return useQuery({
    queryKey: brandingKeys.admin(),
    queryFn: brandingApi.getAdmin,
    staleTime: 60_000,
  });
}

export function useUpdateBranding() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: Partial<Branding>) => brandingApi.update(values),
    onSuccess: (branding) => {
      qc.setQueryData(brandingKeys.admin(), branding);
      void qc.invalidateQueries({ queryKey: brandingKeys.all });
    },
  });
}
