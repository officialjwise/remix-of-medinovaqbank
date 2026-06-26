import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_EMAIL_TEMPLATES } from "@/data/emailTemplates";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export type IntegrationStatus = "connected" | "not_configured" | "error";

export interface GeneralSettings {
  platformName: string;
  tagline: string;
  supportEmail: string;
  supportPhone: string;
  currency: string;
  timezone: string;
  trialDays: number;
  trialQuestionLimit: number;
  maxQuestionsPerSession: number;
  defaultSessionTimeLimitMin: number;
  maintenanceMode: boolean;
}

export interface AiSettings {
  provider: "gemini";
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
  status: IntegrationStatus;
  lastTestedAt?: string;
  callsThisMonth: number;
  estCostUsd: number;
}

export interface PaymentSettings {
  provider: "paystack";
  publicKey: string;
  secretKey: string;
  webhookSecret: string;
  mode: "test" | "live";
  webhookUrl: string;
  status: IntegrationStatus;
}

export interface OAuthSettings {
  clientId: string;
  clientSecret: string;
  callbackUrl: string;
  status: IntegrationStatus;
}

export interface SmtpSettings {
  preset: "custom" | "sendgrid" | "mailgun" | "gmail";
  host: string;
  port: string;
  username: string;
  password: string;
  fromName: string;
  fromEmail: string;
  status: IntegrationStatus;
}

export interface EmailTemplate {
  key: string;
  name: string;
  subject: string;
  body: string;
  enabled: boolean;
  /** For reminder templates — days before the event to send. */
  daysBefore?: number;
}

export interface TrialAccessSettings {
  deviceBinding: boolean;
  gracePeriodDays: number;
  /** Feature keys enabled during trial. See data/features.ts catalog. */
  features: Record<string, boolean>;
}

export interface AdminRole {
  id: string;
  name: string;
  description: string;
  system?: boolean;
  permissions: Record<string, boolean>;
}

export interface BrandingSettings {
  primaryColor: string;
  accentColor: string;
  successColor: string;
  warningColor: string;
  logoLight: string;
  logoDark: string;
  favicon: string;
  pwaIcon: string;
  loginBackground: string;
  headingFont: string;
  bodyFont: string;
  // Email + footer branding
  emailHeaderLogo: string;
  emailFooterText: string;
  companyLegalName: string;
  social: { twitter: string; facebook: string; linkedin: string; instagram: string };
}

export interface SystemSettings {
  general: GeneralSettings;
  ai: AiSettings;
  payment: PaymentSettings;
  oauth: OAuthSettings;
  smtp: SmtpSettings;
  templates: EmailTemplate[];
  trial: TrialAccessSettings;
  roles: AdminRole[];
  branding: BrandingSettings;
}

/* ------------------------------------------------------------------ */
/* Permission catalog                                                  */
/* ------------------------------------------------------------------ */

export const PERMISSION_CATALOG: { key: string; label: string; group: string }[] = [
  { key: "manage_users", label: "Manage Users", group: "People" },
  { key: "delete_users", label: "Delete Users", group: "People" },
  { key: "manage_content", label: "Manage Content", group: "Content" },
  { key: "manage_subscriptions", label: "Manage Subscriptions", group: "Revenue" },
  { key: "view_revenue", label: "View Revenue", group: "Revenue" },
  { key: "view_analytics", label: "View Analytics", group: "Insights" },
  { key: "manage_settings", label: "Manage Settings", group: "System" },
  { key: "change_api_keys", label: "Change API Keys", group: "System" },
];

/* ------------------------------------------------------------------ */
/* Defaults                                                            */
/* ------------------------------------------------------------------ */

function fullPerms(value: boolean) {
  return Object.fromEntries(PERMISSION_CATALOG.map((p) => [p.key, value]));
}

const DEFAULT_ROLES: AdminRole[] = [
  { id: "super_admin", name: "Super Admin", description: "Unrestricted access to every part of the platform.", system: true, permissions: fullPerms(true) },
  {
    id: "admin",
    name: "Admin",
    description: "Day-to-day operations. Cannot change API keys or delete users unless granted.",
    permissions: { ...fullPerms(true), change_api_keys: false, delete_users: false },
  },
  {
    id: "support",
    name: "Support",
    description: "Read-only access for the support team.",
    permissions: { ...fullPerms(false), view_analytics: true, manage_users: true },
  },
];

export const DEFAULT_SETTINGS: SystemSettings = {
  general: {
    platformName: "Medinovaqbank",
    tagline: "Master Medicine. Pass with Confidence.",
    supportEmail: "support@medinovaqbank.com",
    supportPhone: "+233 20 000 0000",
    currency: "GHS",
    timezone: "Africa/Accra",
    trialDays: 7,
    trialQuestionLimit: 10,
    maxQuestionsPerSession: 100,
    defaultSessionTimeLimitMin: 60,
    maintenanceMode: false,
  },
  ai: {
    provider: "gemini",
    apiKey: "",
    model: "gemini-1.5-flash",
    temperature: 0.4,
    maxTokens: 2048,
    status: "not_configured",
    callsThisMonth: 12841,
    estCostUsd: 8.5,
  },
  payment: {
    provider: "paystack",
    publicKey: "",
    secretKey: "",
    webhookSecret: "",
    mode: "test",
    webhookUrl: "https://api.medinovaqbank.com/webhooks/paystack",
    status: "not_configured",
  },
  oauth: {
    clientId: "",
    clientSecret: "",
    callbackUrl: "https://api.medinovaqbank.com/auth/google/callback",
    status: "not_configured",
  },
  smtp: {
    preset: "sendgrid",
    host: "smtp.sendgrid.net",
    port: "587",
    username: "apikey",
    password: "",
    fromName: "Medinovaqbank",
    fromEmail: "noreply@medinovaqbank.com",
    status: "not_configured",
  },
  templates: DEFAULT_EMAIL_TEMPLATES,
  trial: {
    deviceBinding: true,
    gracePeriodDays: 1,
    features: {
      full_bank_access: false,
      ai_breakdowns: true,
      performance_analytics: false,
      leaderboard: false,
      multi_device: false,
      question_limit: true,
    },
  },
  roles: DEFAULT_ROLES,
  branding: {
    primaryColor: "#0E7C7B",
    accentColor: "#2BC97F",
    successColor: "#1FA968",
    warningColor: "#E89A1A",
    logoLight: "",
    logoDark: "",
    favicon: "",
    pwaIcon: "",
    loginBackground: "",
    headingFont: "Inter",
    bodyFont: "Inter",
    emailHeaderLogo: "",
    emailFooterText: "Medinovaqbank · Accra, Ghana · You're receiving this because you have an account.",
    companyLegalName: "Medinovaqbank Ltd.",
    social: { twitter: "https://twitter.com/medinovaqbank", facebook: "", linkedin: "https://linkedin.com/company/medinovaqbank", instagram: "" },
  },
};

/* ------------------------------------------------------------------ */
/* Store                                                               */
/* ------------------------------------------------------------------ */

interface SettingsState {
  settings: SystemSettings;
  update: <K extends keyof SystemSettings>(section: K, value: Partial<SystemSettings[K]>) => void;
  setTemplates: (templates: EmailTemplate[]) => void;
  setRoles: (roles: AdminRole[]) => void;
  reset: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      settings: DEFAULT_SETTINGS,
      update: (section, value) =>
        set((s) => ({
          settings: {
            ...s.settings,
            [section]: Array.isArray(s.settings[section])
              ? value
              : { ...(s.settings[section] as object), ...(value as object) },
          },
        })),
      setTemplates: (templates) => set((s) => ({ settings: { ...s.settings, templates } })),
      setRoles: (roles) => set((s) => ({ settings: { ...s.settings, roles } })),
      reset: () => set({ settings: DEFAULT_SETTINGS }),
    }),
    {
      name: "medinova-settings",
      version: 3,
      // v2 expanded branding + rebuilt templates as branded HTML.
      // v3 refreshes templates again (removed "AI" wording, premium shell).
      migrate: (persisted: any, version) => {
        if (!persisted?.settings) return persisted;
        if (version < 2) {
          persisted.settings.branding = { ...DEFAULT_SETTINGS.branding, ...(persisted.settings.branding ?? {}) };
        }
        if (version < 3) {
          persisted.settings.templates = DEFAULT_EMAIL_TEMPLATES;
        }
        return persisted;
      },
    },
  ),
);

/** Convenience selector for the most-read general settings. */
export const useGeneralSettings = () => useSettingsStore((s) => s.settings.general);
