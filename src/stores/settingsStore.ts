import { create } from "zustand";
import { persist } from "zustand/middleware";

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
  logoLight: string;
  logoDark: string;
  favicon: string;
  loginBackground: string;
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

const DEFAULT_TEMPLATES: EmailTemplate[] = [
  { key: "welcome", name: "Welcome", subject: "Welcome to {{platformName}}, {{name}} 👋", body: "Hi {{name}},\n\nWelcome to {{platformName}}! Your medical exam prep journey starts now.\n\nGet started with your free trial — {{trialDays}} days and {{trialQuestions}} questions on us.", enabled: true },
  { key: "trial_started", name: "Trial Started", subject: "Your {{platformName}} trial is live", body: "Hi {{name}},\n\nYour {{trialDays}}-day free trial has started. Explore the question banks and AI clinical breakdowns.", enabled: true },
  { key: "trial_expiring", name: "Trial Expiring", subject: "{{daysLeft}} days left in your trial", body: "Hi {{name}},\n\nYour free trial ends in {{daysLeft}} days. Upgrade now to keep your progress and unlock the full library.", enabled: true, daysBefore: 2 },
  { key: "trial_expired", name: "Trial Expired", subject: "Your trial has ended", body: "Hi {{name}},\n\nYour free trial has ended. Subscribe to any plan to continue practising on {{platformName}}.", enabled: true },
  { key: "subscription_confirmation", name: "Subscription Confirmation", subject: "You're subscribed to {{planName}} 🎉", body: "Hi {{name}},\n\nThanks for subscribing to {{planName}}. You now have full access until {{renewsAt}}.", enabled: true },
  { key: "subscription_expiring", name: "Subscription Expiring", subject: "Your {{planName}} plan renews soon", body: "Hi {{name}},\n\nYour {{planName}} plan expires in {{daysLeft}} days. Renew to avoid interruption.", enabled: true, daysBefore: 5 },
  { key: "payment_failed", name: "Payment Failed", subject: "Payment failed for {{planName}}", body: "Hi {{name}},\n\nWe couldn't process your payment for {{planName}}. Please update your payment method.", enabled: true },
  { key: "password_reset", name: "Password Reset", subject: "Reset your {{platformName}} password", body: "Hi {{name}},\n\nClick the link below to reset your password. This link expires in 60 minutes.\n\n{{resetLink}}", enabled: true },
];

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
  templates: DEFAULT_TEMPLATES,
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
    logoLight: "",
    logoDark: "",
    favicon: "",
    loginBackground: "",
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
    { name: "medinova-settings", version: 1 },
  ),
);

/** Convenience selector for the most-read general settings. */
export const useGeneralSettings = () => useSettingsStore((s) => s.settings.general);
