import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  Copy,
  Eye,
  EyeOff,
  KeyRound,
  Mail,
  Newspaper,
  Palette,
  Pencil,
  Plus,
  Save,
  Send,
  ShieldCheck,
  Sliders,
  Sparkles,
  Lock,
  TestTube2,
  Trash2,
  Upload,
  Loader2,
  UserCog,
  Wallet,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";
import { FONT_NAMES, fontStack } from "@/lib/fonts";
import {
  useProtectionStore,
  EVENT_LABELS,
  ALL_EVENT_TYPES,
  type ProtectionEventType,
} from "@/stores/protectionStore";
import {
  useSettingsStore,
  PERMISSION_CATALOG,
  type IntegrationStatus,
  type EmailTemplate,
  type AdminRole,
  type BrandingSettings,
} from "@/stores/settingsStore";
import { useFeatureCatalogStore } from "@/stores/featureCatalogStore";
import {
  useCmsStore,
  type FaqEntry,
  type HelpArticle,
  type Testimonial,
  type AboutContent,
  type ContactInfo,
  type CmsContent,
} from "@/stores/cmsStore";
import { ToggleSwitch } from "@/components/ui/toggle-switch";
import { RichTextEditor } from "@/components/shared/RichTextEditor";
import { renderBrandedEmail, fillVars } from "@/lib/emailRender";
import { DEFAULT_EMAIL_TEMPLATES } from "@/lib/emailTemplateDefaults";
import { emailTemplatesApi } from "@/api/email-templates.api";
import { useAuthStore } from "@/stores/authStore";
import { ApiError } from "@/api/client";
import {
  useSettingsMap,
  useUpdateSettings,
  useRevealSecret,
  useTestIntegration,
  useTestAiPrompt,
  settingValue,
  settingBool,
  type IntegrationName,
  type ResolvedSetting,
  type SettingUpdate,
} from "@/api/settings.api";
import {
  useAdminBranding,
  useUpdateBranding,
  brandingApi,
  type Branding,
} from "@/api/branding.api";

export const Route = createFileRoute("/admin/settings/system")({
  head: () => ({
    meta: [{ title: "Admin · Settings — Medinovaqbank" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminSettings,
});

type TabKey =
  | "general"
  | "integrations"
  | "email"
  | "trial"
  | "protection"
  | "roles"
  | "branding"
  | "cms";

const TABS: { key: TabKey; label: string; icon: typeof Sliders }[] = [
  { key: "general", label: "General", icon: Sliders },
  { key: "integrations", label: "Integrations & API Keys", icon: KeyRound },
  { key: "email", label: "Email Templates", icon: Mail },
  { key: "trial", label: "Trial & Access", icon: ShieldCheck },
  { key: "protection", label: "Security & Protection", icon: ShieldAlert },
  { key: "roles", label: "Roles & Permissions", icon: UserCog },
  { key: "branding", label: "Branding", icon: Palette },
  { key: "cms", label: "CMS", icon: Newspaper },
];

function AdminSettings() {
  const [tab, setTab] = useState<TabKey>("general");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">System Settings</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          The control center for your platform. Everything here persists — no configuration lives in
          code.
        </p>
      </div>

      <div className="sticky top-16 z-10 -mx-4 border-b border-border bg-background/80 px-4 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="flex gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={`-mb-px inline-flex flex-shrink-0 items-center gap-2 whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
                  active
                    ? "border-accent text-accent"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" /> {t.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        {tab === "general" && <GeneralTab />}
        {tab === "integrations" && <IntegrationsTab />}
        {tab === "email" && <EmailTemplatesTab />}
        {tab === "trial" && <TrialTab />}
        {tab === "protection" && <ProtectionTab />}
        {tab === "roles" && <RolesTab />}
        {tab === "branding" && <BrandingTab />}
        {tab === "cms" && <CmsTab />}
      </div>
    </div>
  );
}

/* ───────────── Shared settings save helper ───────────── */
function useSaveSettings() {
  const update = useUpdateSettings();
  const save = (settings: SettingUpdate[], successMsg: string) => {
    update.mutate(settings, {
      onSuccess: () => toast.success(successMsg),
      onError: (err) =>
        toast.error(err instanceof ApiError ? err.message : "Could not save settings"),
    });
  };
  return { save, isSaving: update.isPending };
}

/* ───────────── Tab 1 — General ───────────── */
// Backend-backed keys: general.platformName/supportEmail/maintenanceMode/
// maintenanceMessage + trial.durationDays/questionLimit. Tagline/currency/
// timezone/session limits have no backend catalog key (see gaps).
function GeneralTab() {
  const { data: map, isLoading } = useSettingsMap();
  const { save, isSaving } = useSaveSettings();

  const [platformName, setPlatformName] = useState("");
  const [supportEmail, setSupportEmail] = useState("");
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState("");
  const [trialDays, setTrialDays] = useState(0);
  const [trialLimit, setTrialLimit] = useState(0);

  useEffect(() => {
    if (!map) return;
    setPlatformName(settingValue(map, "general.platformName", "Medinovaqbank"));
    setSupportEmail(settingValue(map, "general.supportEmail"));
    setMaintenanceMode(settingBool(map, "general.maintenanceMode"));
    setMaintenanceMessage(settingValue(map, "general.maintenanceMessage"));
    setTrialDays(Number(settingValue(map, "trial.durationDays", "0")) || 0);
    setTrialLimit(Number(settingValue(map, "trial.questionLimit", "0")) || 0);
  }, [map]);

  if (isLoading) return <SettingsSkeleton />;

  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="Platform" desc="Core identity and contact details shown across the app.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Platform Name">
              <Input value={platformName} onChange={setPlatformName} />
            </Field>
            <Field label="Support Email">
              <Input value={supportEmail} onChange={setSupportEmail} />
            </Field>
          </div>
          <Field label="Maintenance Message">
            <Input value={maintenanceMessage} onChange={setMaintenanceMessage} />
          </Field>
          <SaveBar
            saving={isSaving}
            onSave={() =>
              save(
                [
                  { key: "general.platformName", value: platformName },
                  { key: "general.supportEmail", value: supportEmail },
                  { key: "general.maintenanceMessage", value: maintenanceMessage },
                ],
                "General settings saved",
              )
            }
          />
        </Card>

        <Card title="Trial & Maintenance" desc="Free-trial limits and platform availability.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Free Trial Duration (days)">
              <NumberInput value={trialDays} onChange={setTrialDays} />
            </Field>
            <Field label="Free Trial Question Limit">
              <NumberInput value={trialLimit} onChange={setTrialLimit} />
            </Field>
          </div>
          <div className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-border bg-surface-alt/40 px-4 py-3 text-sm font-medium text-foreground">
            <span>
              Maintenance mode
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                Non-admins see a maintenance page when enabled.
              </span>
            </span>
            <ToggleSwitch
              checked={maintenanceMode}
              onChange={setMaintenanceMode}
              ariaLabel="Maintenance mode"
            />
          </div>
          <SaveBar
            saving={isSaving}
            onSave={() =>
              save(
                [
                  { key: "trial.durationDays", value: String(trialDays) },
                  { key: "trial.questionLimit", value: String(trialLimit) },
                  { key: "general.maintenanceMode", value: String(maintenanceMode) },
                ],
                maintenanceMode ? "Maintenance mode ON" : "Trial & maintenance saved",
              )
            }
          />
        </Card>
      </div>
    </div>
  );
}

function SettingsSkeleton() {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {[0, 1].map((i) => (
        <div
          key={i}
          className="h-64 animate-pulse rounded-2xl border border-border bg-surface-alt/40"
        />
      ))}
    </div>
  );
}

/* ───────────── Tab 2 — Integrations & API Keys ───────────── */
// Backend-backed catalog keys (all persisted, sensitive values encrypted):
//   integration.gemini.apiKey/model/temperature/maxTokens
//   integration.google.clientId/clientSecret
//   integration.paystack.secretKey/publicKey/webhookSecret
//   integration.smtp.host/port/username/password/fromName/fromEmail
//   integration.resend.apiKey/fromEmail
// `isConfigured` from the resolved map drives each card's status badge — no
// fake Math.random tests; reveal/test/save all hit the real backend.

/** Map the backend `isConfigured` flag to the UI status badge state. */
function configuredStatus(map: Record<string, ResolvedSetting> | undefined, keys: string[]) {
  if (!map) return "not_configured" as IntegrationStatus;
  return keys.every((k) => map[k]?.isConfigured) ? "connected" : "not_configured";
}

/** Run a real integration test with loading/success/error toasts. */
function useTestConnection() {
  const test = useTestIntegration();
  const run = (integration: IntegrationName, label: string) => {
    toast.loading(`Testing ${label}…`, { id: `test-${integration}` });
    test.mutate(integration, {
      onSuccess: (res) =>
        res.success
          ? toast.success(res.message || `${label} connection succeeded`, {
              id: `test-${integration}`,
            })
          : toast.error(res.message || `${label} connection failed`, { id: `test-${integration}` }),
      onError: (err) =>
        toast.error(err instanceof ApiError ? err.message : `${label} connection failed`, {
          id: `test-${integration}`,
        }),
    });
  };
  return { run, isTesting: test.isPending };
}

// Verified available on the Generative Language API (ListModels). Pro models are
// preferred for clinical accuracy; flash tiers are cheaper/faster fallbacks.
const GEMINI_MODELS = [
  "gemini-3.1-pro-preview",
  "gemini-3-pro-preview",
  "gemini-3.5-flash",
  "gemini-2.5-pro",
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
] as const;

function IntegrationsTab() {
  const { data: map, isLoading } = useSettingsMap();
  const { save, isSaving } = useSaveSettings();
  const reveal = useRevealSecret();
  const aiTest = useTestConnection();
  const payTest = useTestConnection();
  const oauthTest = useTestConnection();
  const smtpTest = useTestConnection();
  const resendTest = useTestConnection();
  const aiPrompt = useTestAiPrompt();

  const [advanced, setAdvanced] = useState(false);

  // ── Gemini ──
  const [geminiKey, setGeminiKey] = useState("");
  const [geminiModel, setGeminiModel] = useState<string>(GEMINI_MODELS[0]);
  const [geminiTemp, setGeminiTemp] = useState(0.4);
  const [geminiMaxTokens, setGeminiMaxTokens] = useState(2048);

  // ── Google OAuth ──
  const [googleClientId, setGoogleClientId] = useState("");
  const [googleClientSecret, setGoogleClientSecret] = useState("");

  // ── Paystack ──
  const [paystackPublic, setPaystackPublic] = useState("");
  const [paystackSecret, setPaystackSecret] = useState("");
  const [paystackWebhook, setPaystackWebhook] = useState("");

  // ── SMTP ──
  const [smtpHost, setSmtpHost] = useState("");
  const [smtpPort, setSmtpPort] = useState("");
  const [smtpUser, setSmtpUser] = useState("");
  const [smtpPass, setSmtpPass] = useState("");
  const [smtpFromName, setSmtpFromName] = useState("");
  const [smtpFromEmail, setSmtpFromEmail] = useState("");
  const [smtpPreset, setSmtpPreset] = useState<"custom" | "sendgrid" | "mailgun" | "gmail">(
    "custom",
  );

  // ── Resend ──
  const [resendKey, setResendKey] = useState("");
  const [resendFrom, setResendFrom] = useState("");

  useEffect(() => {
    if (!map) return;
    setGeminiKey(settingValue(map, "integration.gemini.apiKey"));
    setGeminiModel(settingValue(map, "integration.gemini.model", GEMINI_MODELS[0]));
    setGeminiTemp(Number(settingValue(map, "integration.gemini.temperature", "0.4")) || 0);
    setGeminiMaxTokens(Number(settingValue(map, "integration.gemini.maxTokens", "2048")) || 0);

    setGoogleClientId(settingValue(map, "integration.google.clientId"));
    setGoogleClientSecret(settingValue(map, "integration.google.clientSecret"));

    setPaystackPublic(settingValue(map, "integration.paystack.publicKey"));
    setPaystackSecret(settingValue(map, "integration.paystack.secretKey"));
    setPaystackWebhook(settingValue(map, "integration.paystack.webhookSecret"));

    setSmtpHost(settingValue(map, "integration.smtp.host"));
    setSmtpPort(settingValue(map, "integration.smtp.port", "587"));
    setSmtpUser(settingValue(map, "integration.smtp.username"));
    setSmtpPass(settingValue(map, "integration.smtp.password"));
    setSmtpFromName(settingValue(map, "integration.smtp.fromName"));
    setSmtpFromEmail(settingValue(map, "integration.smtp.fromEmail"));

    setResendKey(settingValue(map, "integration.resend.apiKey"));
    setResendFrom(settingValue(map, "integration.resend.fromEmail"));
  }, [map]);

  /** Reveal a secret by catalog key via the audited backend endpoint. */
  const revealKey = (key: string) => async () => (await reveal.mutateAsync(key)).value;

  function runAiPrompt() {
    toast.loading("Running Gemini on a sample question…", { id: "ai-prompt" });
    aiPrompt.mutate(undefined, {
      onSuccess: (res) =>
        res.success
          ? toast.success(res.message || "AI test prompt succeeded", { id: "ai-prompt" })
          : toast.error(res.message || "AI test prompt failed", { id: "ai-prompt" }),
      onError: (err) =>
        toast.error(err instanceof ApiError ? err.message : "AI test prompt failed", {
          id: "ai-prompt",
        }),
    });
  }

  if (isLoading) return <SettingsSkeleton />;

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border bg-surface-alt/60 p-4 text-sm text-muted-foreground">
        All third-party credentials are entered here and stored encrypted in the backend. They never
        live in code or env files, and the full key is never shown again after saving — only the
        last 4 characters, unless explicitly revealed.
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        {/* AI Provider — Gemini */}
        <IntegrationCard
          icon={<Sparkles className="h-5 w-5 text-accent" />}
          title="AI Provider"
          desc="Generates clinical breakdowns for quiz questions."
          status={configuredStatus(map, ["integration.gemini.apiKey"])}
        >
          <div className="flex flex-wrap gap-2">
            <Radio label="Google Gemini" checked readOnly />
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-[1fr_220px]">
            <Field label="API Key">
              <SecretInput
                value={geminiKey}
                onChange={setGeminiKey}
                onReveal={revealKey("integration.gemini.apiKey")}
                placeholder="AIza…"
              />
            </Field>
            <Field label="Model">
              <Select value={geminiModel} onChange={setGeminiModel} options={[...GEMINI_MODELS]} />
            </Field>
          </div>

          <button
            type="button"
            onClick={() => setAdvanced((a) => !a)}
            className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform ${advanced ? "rotate-180" : ""}`}
            />{" "}
            Advanced
          </button>
          {advanced && (
            <div className="mt-3 grid gap-4 md:grid-cols-2">
              <Field label="Temperature">
                <NumberInput step="0.1" value={geminiTemp} onChange={setGeminiTemp} />
              </Field>
              <Field label="Max Tokens">
                <NumberInput value={geminiMaxTokens} onChange={setGeminiMaxTokens} />
              </Field>
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-surface-alt/60 p-3">
            <button
              type="button"
              onClick={runAiPrompt}
              disabled={aiPrompt.isPending}
              className="inline-flex h-8 items-center gap-2 rounded-md border border-border bg-surface px-3 text-xs font-semibold hover:bg-surface-alt disabled:opacity-50"
            >
              <Sparkles className="h-3.5 w-3.5" /> {aiPrompt.isPending ? "Testing…" : "Test Prompt"}
            </button>
            <button
              type="button"
              onClick={() => aiTest.run("gemini", "Gemini")}
              disabled={aiTest.isTesting}
              className="inline-flex h-8 items-center gap-2 rounded-md border border-border bg-surface px-3 text-xs font-semibold hover:bg-surface-alt disabled:opacity-50"
            >
              <TestTube2 className="h-3.5 w-3.5" /> Test Connection
            </button>
          </div>
          <SaveBar
            label="Save AI Settings"
            saving={isSaving}
            onSave={() =>
              save(
                [
                  { key: "integration.gemini.apiKey", value: geminiKey },
                  { key: "integration.gemini.model", value: geminiModel },
                  { key: "integration.gemini.temperature", value: String(geminiTemp) },
                  { key: "integration.gemini.maxTokens", value: String(geminiMaxTokens) },
                ],
                "AI provider saved",
              )
            }
          />
        </IntegrationCard>

        {/* Google OAuth */}
        <IntegrationCard
          icon={<KeyRound className="h-5 w-5 text-accent" />}
          title="Google OAuth"
          desc="Credentials for Sign in with Google."
          status={configuredStatus(map, [
            "integration.google.clientId",
            "integration.google.clientSecret",
          ])}
        >
          <div className="grid gap-4">
            <Field label="Client ID">
              <SecretInput
                value={googleClientId}
                onChange={setGoogleClientId}
                onReveal={revealKey("integration.google.clientId")}
                placeholder="…apps.googleusercontent.com"
              />
            </Field>
            <Field label="Client Secret">
              <SecretInput
                value={googleClientSecret}
                onChange={setGoogleClientSecret}
                onReveal={revealKey("integration.google.clientSecret")}
                placeholder="GOCSPX-…"
              />
            </Field>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={() => oauthTest.run("google", "Google OAuth")}
              disabled={oauthTest.isTesting}
              className="inline-flex h-8 items-center gap-2 rounded-md border border-border bg-surface px-3 text-xs font-semibold hover:bg-surface-alt disabled:opacity-50"
            >
              <TestTube2 className="h-3.5 w-3.5" /> Test Connection
            </button>
          </div>
          <SaveBar
            label="Save OAuth Settings"
            saving={isSaving}
            onSave={() =>
              save(
                [
                  { key: "integration.google.clientId", value: googleClientId },
                  { key: "integration.google.clientSecret", value: googleClientSecret },
                ],
                "Google OAuth saved",
              )
            }
          />
        </IntegrationCard>
      </div>

      {/* Payment — Paystack */}
      <IntegrationCard
        icon={<Wallet className="h-5 w-5 text-accent" />}
        title="Payment Gateway"
        desc="Card & mobile-money processing for subscriptions."
        status={configuredStatus(map, ["integration.paystack.secretKey"])}
      >
        <div className="flex flex-wrap gap-2">
          <Radio label="Paystack" checked readOnly />
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Field label="Public Key">
            <SecretInput
              value={paystackPublic}
              onChange={setPaystackPublic}
              onReveal={revealKey("integration.paystack.publicKey")}
              placeholder="pk_…"
            />
          </Field>
          <Field label="Secret Key">
            <SecretInput
              value={paystackSecret}
              onChange={setPaystackSecret}
              onReveal={revealKey("integration.paystack.secretKey")}
              placeholder="sk_…"
            />
          </Field>
          <Field label="Webhook Secret">
            <SecretInput
              value={paystackWebhook}
              onChange={setPaystackWebhook}
              onReveal={revealKey("integration.paystack.webhookSecret")}
              placeholder="whsec_…"
            />
          </Field>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-end gap-3 rounded-lg bg-surface-alt/60 p-3">
          <button
            type="button"
            onClick={() => payTest.run("paystack", "Paystack")}
            disabled={payTest.isTesting}
            className="inline-flex h-8 items-center gap-2 rounded-md border border-border bg-surface px-3 text-xs font-semibold hover:bg-surface-alt disabled:opacity-50"
          >
            <Wallet className="h-3.5 w-3.5" /> Test Connection
          </button>
        </div>
        <SaveBar
          label="Save Payment Settings"
          saving={isSaving}
          onSave={() =>
            save(
              [
                { key: "integration.paystack.publicKey", value: paystackPublic },
                { key: "integration.paystack.secretKey", value: paystackSecret },
                { key: "integration.paystack.webhookSecret", value: paystackWebhook },
              ],
              "Payment gateway saved",
            )
          }
        />
      </IntegrationCard>

      <div className="grid gap-5 xl:grid-cols-2">
        {/* SMTP */}
        <IntegrationCard
          icon={<Mail className="h-5 w-5 text-accent" />}
          title="Email / SMTP"
          desc="Outbound server for transactional email."
          status={configuredStatus(map, ["integration.smtp.host", "integration.smtp.password"])}
        >
          <Field label="Provider Preset">
            <Select
              value={smtpPreset}
              onChange={(v) => {
                const presets: Record<string, { host: string; port: string; username: string }> = {
                  sendgrid: { host: "smtp.sendgrid.net", port: "587", username: "apikey" },
                  mailgun: {
                    host: "smtp.mailgun.org",
                    port: "587",
                    username: "postmaster@your-domain",
                  },
                  gmail: { host: "smtp.gmail.com", port: "465", username: "you@gmail.com" },
                  custom: { host: "", port: "587", username: "" },
                };
                const p = presets[v] ?? presets.custom;
                setSmtpPreset(v as typeof smtpPreset);
                setSmtpHost(p.host);
                setSmtpPort(p.port);
                setSmtpUser(p.username);
              }}
              options={["sendgrid", "mailgun", "gmail", "custom"]}
            />
          </Field>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Field label="Host">
              <Input value={smtpHost} onChange={setSmtpHost} />
            </Field>
            <Field label="Port">
              <Input value={smtpPort} onChange={setSmtpPort} />
            </Field>
            <Field label="Username">
              <Input value={smtpUser} onChange={setSmtpUser} />
            </Field>
            <Field label="Password">
              <SecretInput
                value={smtpPass}
                onChange={setSmtpPass}
                onReveal={revealKey("integration.smtp.password")}
                placeholder="••••••"
              />
            </Field>
            <Field label="From Name">
              <Input value={smtpFromName} onChange={setSmtpFromName} />
            </Field>
            <Field label="From Email">
              <Input value={smtpFromEmail} onChange={setSmtpFromEmail} />
            </Field>
          </div>
          <div className="mt-4 flex items-center justify-end">
            <button
              type="button"
              onClick={() => smtpTest.run("smtp", "SMTP")}
              disabled={smtpTest.isTesting}
              className="inline-flex h-8 items-center gap-2 rounded-md border border-border bg-surface px-3 text-xs font-semibold hover:bg-surface-alt disabled:opacity-50"
            >
              <TestTube2 className="h-3.5 w-3.5" /> Test Connection
            </button>
          </div>
          <SaveBar
            label="Save SMTP Settings"
            saving={isSaving}
            onSave={() =>
              save(
                [
                  { key: "integration.smtp.host", value: smtpHost },
                  { key: "integration.smtp.port", value: smtpPort },
                  { key: "integration.smtp.username", value: smtpUser },
                  { key: "integration.smtp.password", value: smtpPass },
                  { key: "integration.smtp.fromName", value: smtpFromName },
                  { key: "integration.smtp.fromEmail", value: smtpFromEmail },
                ],
                "SMTP settings saved",
              )
            }
          />
        </IntegrationCard>

        {/* Resend */}
        <IntegrationCard
          icon={<Send className="h-5 w-5 text-accent" />}
          title="Resend"
          desc="Transactional email via the Resend API."
          status={configuredStatus(map, ["integration.resend.apiKey"])}
        >
          <div className="grid gap-4">
            <Field label="API Key">
              <SecretInput
                value={resendKey}
                onChange={setResendKey}
                onReveal={revealKey("integration.resend.apiKey")}
                placeholder="re_…"
              />
            </Field>
            <Field label="From Email">
              <Input value={resendFrom} onChange={setResendFrom} />
            </Field>
          </div>
          <div className="mt-4 flex items-center justify-end">
            <button
              type="button"
              onClick={() => resendTest.run("resend", "Resend")}
              disabled={resendTest.isTesting}
              className="inline-flex h-8 items-center gap-2 rounded-md border border-border bg-surface px-3 text-xs font-semibold hover:bg-surface-alt disabled:opacity-50"
            >
              <TestTube2 className="h-3.5 w-3.5" /> Test Connection
            </button>
          </div>
          <SaveBar
            label="Save Resend Settings"
            saving={isSaving}
            onSave={() =>
              save(
                [
                  { key: "integration.resend.apiKey", value: resendKey },
                  { key: "integration.resend.fromEmail", value: resendFrom },
                ],
                "Resend settings saved",
              )
            }
          />
        </IntegrationCard>
      </div>
    </div>
  );
}

/* ───────────── Tab 3 — Email Templates ───────────── */
const TEMPLATE_VARS = [
  "{{userName}}",
  "{{platformName}}",
  "{{planName}}",
  "{{price}}",
  "{{amount}}",
  "{{daysLeft}}",
  "{{trialEndDate}}",
  "{{loginTime}}",
  "{{location}}",
  "{{device}}",
  "{{rank}}",
  "{{score}}",
  "{{receiptNumber}}",
  "{{supportEmail}}",
  "{{ctaUrl}}",
];

function EmailTemplatesTab() {
  const templates = useSettingsStore((s) => s.settings.templates);
  const setTemplates = useSettingsStore((s) => s.setTemplates);
  const branding = useSettingsStore((s) => s.settings.branding);
  const adminEmail = useAuthStore((s) => s.user?.email);
  const [selectedKey, setSelectedKey] = useState(templates[0]?.key ?? "");
  const [editing, setEditing] = useState<EmailTemplate | null>(null);
  const [sendingTest, setSendingTest] = useState(false);

  const selected = templates.find((t) => t.key === selectedKey) ?? templates[0];

  /** Send a real test email of this template to the logged-in super admin. */
  async function sendTest(key: string) {
    if (!adminEmail) {
      toast.error("No email address on your account to send the test to");
      return;
    }
    setSendingTest(true);
    try {
      const { delivered } = await emailTemplatesApi.testSend(key, { to: adminEmail });
      if (delivered) toast.success(`Test email sent to ${adminEmail}`);
      else toast.error("The email provider did not accept the message");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send test email");
    } finally {
      setSendingTest(false);
    }
  }

  function patch(next: EmailTemplate) {
    setTemplates(templates.map((x) => (x.key === next.key ? next : x)));
  }

  function resetOne(key: string) {
    const def = DEFAULT_EMAIL_TEMPLATES.find((d) => d.key === key);
    if (!def) return;
    setTemplates(templates.map((x) => (x.key === key ? def : x)));
    setEditing((e) => (e && e.key === key ? def : e));
    toast.success(`${def.name} reset to default`);
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,360px)_1fr]">
      {/* Left — template list */}
      <Card
        title="Templates"
        desc="Branded transactional emails. Toggle, preview, and edit each one."
      >
        <ul className="-mx-1 max-h-[560px] space-y-1 overflow-y-auto pr-1">
          {templates.map((t) => {
            const active = t.key === selectedKey;
            return (
              <li key={t.key}>
                <div
                  className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 transition ${
                    active
                      ? "border-accent/40 bg-accent/5"
                      : "border-border bg-surface hover:bg-surface-alt/60"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedKey(t.key)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-semibold text-foreground">
                        {t.name}
                      </span>
                      {t.daysBefore != null && (
                        <span className="flex-shrink-0 rounded-full bg-warning/10 px-2 py-0.5 text-[10px] font-bold text-warning">
                          {t.daysBefore}d before
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {fillVars(t.subject)}
                    </p>
                  </button>
                  <ToggleSwitch
                    size="sm"
                    checked={t.enabled}
                    onChange={(v) => patch({ ...t, enabled: v })}
                    ariaLabel={`Toggle ${t.name}`}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </Card>

      {/* Right — live preview */}
      <Card
        title="Live Preview"
        desc="Exactly how the email renders with your branding and sample data."
      >
        {selected ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Subject
                </p>
                <p className="mt-0.5 text-sm font-semibold text-foreground">
                  {fillVars(selected.subject)}
                </p>
                <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                  <span
                    className={`inline-flex items-center gap-1 ${selected.enabled ? "text-success" : "text-muted-foreground"}`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${selected.enabled ? "bg-success" : "bg-muted-foreground/50"}`}
                    />
                    {selected.enabled ? "Enabled" : "Disabled"}
                  </span>
                  {selected.daysBefore != null && (
                    <span>· sends {selected.daysBefore}d before event</span>
                  )}
                </div>
              </div>
              <div className="flex flex-shrink-0 gap-2">
                <button
                  type="button"
                  disabled={sendingTest}
                  onClick={() => sendTest(selected.key)}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-xs font-semibold hover:bg-surface-alt disabled:opacity-60"
                >
                  <Send className="h-3.5 w-3.5" /> {sendingTest ? "Sending…" : "Test send"}
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(selected)}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-accent px-3 text-xs font-semibold text-accent-foreground hover:bg-accent/90"
                >
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </button>
              </div>
            </div>
            <iframe
              title="preview"
              sandbox=""
              srcDoc={renderBrandedEmail(selected.body, selected.subject, branding)}
              className="h-[520px] w-full rounded-xl border border-border bg-white"
            />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No templates configured.</p>
        )}
      </Card>

      {editing && (
        <TemplateEditor
          template={editing}
          branding={branding}
          onClose={() => setEditing(null)}
          onChange={setEditing}
          onSave={(next) => {
            patch(next);
            setSelectedKey(next.key);
            setEditing(null);
            toast.success(`${next.name} template saved`);
          }}
          onReset={() => resetOne(editing.key)}
          onTestSend={() => sendTest(editing.key)}
          testing={sendingTest}
        />
      )}
    </div>
  );
}

function TemplateEditor({
  template,
  branding,
  onClose,
  onChange,
  onSave,
  onReset,
  onTestSend,
  testing,
}: {
  template: EmailTemplate;
  branding: BrandingSettings;
  onClose: () => void;
  onChange: (t: EmailTemplate) => void;
  onSave: (t: EmailTemplate) => void;
  onReset: () => void;
  onTestSend: () => void;
  testing: boolean;
}) {
  const draft = template;
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  function insertVar(v: string) {
    const el = bodyRef.current;
    if (!el) return onChange({ ...draft, body: draft.body + v });
    const start = el.selectionStart;
    const next = draft.body.slice(0, start) + v + draft.body.slice(el.selectionEnd);
    onChange({ ...draft, body: next });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-foreground/50 p-4 pt-10 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-5xl rounded-2xl border border-border bg-surface shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h3 className="text-base font-bold text-foreground">{draft.name}</h3>
            <p className="text-xs text-muted-foreground">Editing template body & subject</p>
          </div>
          <div className="flex items-center gap-2">
            <ToggleSwitch
              size="sm"
              checked={draft.enabled}
              onChange={(v) => onChange({ ...draft, enabled: v })}
              ariaLabel="Enabled"
            />
            <span className="text-xs font-semibold text-muted-foreground">
              {draft.enabled ? "Enabled" : "Disabled"}
            </span>
          </div>
        </header>

        <div className="grid gap-0 lg:grid-cols-2">
          {/* Editor */}
          <div className="space-y-4 border-b border-border p-5 lg:border-b-0 lg:border-r">
            <Field label="Subject">
              <Input value={draft.subject} onChange={(v) => onChange({ ...draft, subject: v })} />
            </Field>
            {draft.daysBefore != null && (
              <Field label="Send days before event">
                <NumberInput
                  value={draft.daysBefore}
                  onChange={(v) => onChange({ ...draft, daysBefore: v })}
                />
              </Field>
            )}
            <Field label="Body (inner HTML)">
              <textarea
                ref={bodyRef}
                rows={14}
                value={draft.body}
                onChange={(e) => onChange({ ...draft, body: e.target.value })}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 font-mono text-xs leading-relaxed focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </Field>
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Insert variable
              </p>
              <div className="flex flex-wrap gap-1.5">
                {TEMPLATE_VARS.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => insertVar(v)}
                    className="rounded-md border border-border bg-surface-alt px-2 py-1 font-mono text-[11px] text-foreground hover:bg-surface-alt/70"
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Live preview */}
          <div className="space-y-2 bg-surface-alt/30 p-5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Live preview
            </p>
            <p className="truncate text-sm font-semibold text-foreground">
              {fillVars(draft.subject)}
            </p>
            <iframe
              title="preview"
              sandbox=""
              srcDoc={renderBrandedEmail(draft.body, draft.subject, branding)}
              className="h-[460px] w-full rounded-xl border border-border bg-white"
            />
          </div>
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-5 py-3">
          <div className="flex gap-2">
            <button
              type="button"
              disabled={testing}
              onClick={onTestSend}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-surface px-4 text-sm font-semibold hover:bg-surface-alt disabled:opacity-60"
            >
              <Send className="h-4 w-4" /> {testing ? "Sending…" : "Test send"}
            </button>
            <button
              type="button"
              onClick={onReset}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-surface px-4 text-sm font-semibold text-muted-foreground hover:bg-surface-alt hover:text-foreground"
            >
              <RotateCcw className="h-4 w-4" /> Reset to default
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="h-10 rounded-lg border border-border bg-surface px-4 text-sm font-semibold hover:bg-surface-alt"
            >
              Cancel
            </button>
            <button
              onClick={() => onSave(draft)}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-accent px-4 text-sm font-semibold text-accent-foreground hover:bg-accent/90"
            >
              <Save className="h-4 w-4" /> Save template
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}

/* ───────────── Tab 4 — Trial & Access ───────────── */
// Numeric limits persist to the backend catalog (trial.durationDays/
// questionLimit/gracePeriodDays). Device-binding + per-feature trial access
// have no catalog key yet, so they remain in the local store until the backend
// exposes them — see the gaps note.
function TrialTab() {
  const { data: map, isLoading } = useSettingsMap();
  const { save, isSaving } = useSaveSettings();
  const trial = useSettingsStore((s) => s.settings.trial);
  const updateLocal = useSettingsStore((s) => s.update);
  const catalog = useFeatureCatalogStore((s) => s.features);
  const [days, setDays] = useState(0);
  const [limit, setLimit] = useState(0);
  const [grace, setGrace] = useState(0);
  const [binding, setBinding] = useState(trial.deviceBinding);
  const [features, setFeatures] = useState(trial.features);

  useEffect(() => {
    if (!map) return;
    setDays(Number(settingValue(map, "trial.durationDays", "0")) || 0);
    setLimit(Number(settingValue(map, "trial.questionLimit", "0")) || 0);
    setGrace(Number(settingValue(map, "trial.gracePeriodDays", "0")) || 0);
  }, [map]);

  if (isLoading) return <SettingsSkeleton />;

  return (
    <div className="space-y-5">
      <Card
        title="Trial Configuration"
        desc="How long the free trial lasts and how much it includes."
      >
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Trial Duration (days)">
            <NumberInput value={days} onChange={setDays} />
          </Field>
          <Field label="Question Limit">
            <NumberInput value={limit} onChange={setLimit} />
          </Field>
          <Field label="Grace Period (days)">
            <NumberInput value={grace} onChange={setGrace} />
          </Field>
        </div>
        <div className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-border bg-surface-alt/40 px-4 py-3 text-sm font-medium text-foreground">
          <span>
            Device binding — lock trial accounts to the device they signed up on
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              Prevents trial account sharing.
            </span>
          </span>
          <ToggleSwitch checked={binding} onChange={setBinding} ariaLabel="Device binding" />
        </div>
      </Card>

      <Card
        title="Trial Feature Access"
        desc="Choose which features are available during the free trial. Unchecked features prompt an upgrade."
      >
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {catalog
            .filter((f) => f.type === "boolean")
            .map((f) => (
              <div
                key={f.key}
                className="flex items-start justify-between gap-3 rounded-lg border border-border bg-surface px-4 py-3"
              >
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-foreground">{f.name}</span>
                  <span className="block text-xs text-muted-foreground">{f.description}</span>
                </span>
                <ToggleSwitch
                  checked={features[f.key] ?? false}
                  onChange={(v) => setFeatures({ ...features, [f.key]: v })}
                  ariaLabel={f.name}
                />
              </div>
            ))}
        </div>
      </Card>

      <SaveBar
        label="Save Trial & Access"
        saving={isSaving}
        onSave={() => {
          // Device-binding + per-feature access have no backend catalog key yet,
          // so they persist locally; the numeric limits persist to the backend.
          updateLocal("trial", { deviceBinding: binding, features });
          save(
            [
              { key: "trial.durationDays", value: String(days) },
              { key: "trial.questionLimit", value: String(limit) },
              { key: "trial.gracePeriodDays", value: String(grace) },
            ],
            "Trial & access control saved",
          );
        }}
      />
    </div>
  );
}

/* ───────────── Tab — Security & Protection ───────────── */
// Policy persists to the backend catalog (protection.enabled/strikeThreshold/
// strikeWindowMinutes/lockoutDurationHours). `countedEvents` drives the
// client-side detector and has no catalog key, so it stays in the local store.
function ProtectionTab() {
  const { data: map, isLoading } = useSettingsMap();
  const { save, isSaving } = useSaveSettings();
  const settings = useProtectionStore((s) => s.settings);
  const updateSettings = useProtectionStore((s) => s.updateSettings);
  const [form, setForm] = useState(settings);

  useEffect(() => {
    if (!map) return;
    setForm((f) => ({
      ...f,
      enabled: settingBool(map, "protection.enabled"),
      strikeThreshold: Number(settingValue(map, "protection.strikeThreshold", "3")) || 0,
      strikeWindowMin: Number(settingValue(map, "protection.strikeWindowMinutes", "60")) || 0,
      lockoutHours: Number(settingValue(map, "protection.lockoutDurationHours", "24")) || 0,
    }));
  }, [map]);

  function toggleEvent(type: ProtectionEventType) {
    setForm((f) => ({
      ...f,
      countedEvents: f.countedEvents.includes(type)
        ? f.countedEvents.filter((e) => e !== type)
        : [...f.countedEvents, type],
    }));
  }

  if (isLoading) return <SettingsSkeleton />;

  return (
    <div className="space-y-5">
      <Card
        title="Content Protection"
        desc="Best-effort deterrence for quiz sessions and high-yield notes."
      >
        <div className="flex items-start justify-between gap-3 rounded-lg border border-border bg-surface-alt/40 px-4 py-3">
          <span className="min-w-0">
            <span className="block text-sm font-semibold text-foreground">
              Content protection enabled
            </span>
            <span className="mt-0.5 block text-xs text-muted-foreground">
              Best-effort deterrence: detection, watermarking, and copy/print interception. This
              raises the bar and lets you flag repeat offenders, but it cannot truly block an
              OS-level screenshot or a phone camera.
            </span>
          </span>
          <ToggleSwitch
            checked={form.enabled}
            onChange={(v) => setForm({ ...form, enabled: v })}
            ariaLabel="Content protection enabled"
          />
        </div>
      </Card>

      <Card
        title="Strike & Lockout Policy"
        desc="How many flagged attempts trigger a lockout, and for how long."
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Strike Threshold">
            <NumberInput
              value={form.strikeThreshold}
              onChange={(v) => setForm({ ...form, strikeThreshold: v })}
            />
          </Field>
          <Field label="Strike Window (minutes)">
            <NumberInput
              value={form.strikeWindowMin}
              onChange={(v) => setForm({ ...form, strikeWindowMin: v })}
            />
          </Field>
          <Field label="Lockout Duration (hours)">
            <NumberInput
              value={form.lockoutHours}
              onChange={(v) => setForm({ ...form, lockoutHours: v })}
            />
          </Field>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          A user is locked out after{" "}
          <span className="font-semibold text-foreground">{form.strikeThreshold}</span> flagged
          attempts within{" "}
          <span className="font-semibold text-foreground">{form.strikeWindowMin}</span> minutes, for{" "}
          <span className="font-semibold text-foreground">{form.lockoutHours}</span> hours. These
          thresholds drive the user-facing lockout directly — they are never hardcoded.
        </p>
      </Card>

      <Card title="Counted Events" desc="Which flagged events count toward a user's strikes.">
        <div className="flex flex-wrap gap-2">
          {ALL_EVENT_TYPES.map((type) => {
            const active = form.countedEvents.includes(type);
            return (
              <button
                key={type}
                type="button"
                onClick={() => toggleEvent(type)}
                aria-pressed={active}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                  active
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-border bg-surface text-muted-foreground hover:text-foreground"
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${active ? "bg-accent" : "bg-muted-foreground/40"}`}
                />
                {EVENT_LABELS[type]}
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Events not selected here are still logged for the audit trail, but do not count toward an
          automatic lockout.
        </p>
      </Card>

      <SaveBar
        label="Save Protection Settings"
        saving={isSaving}
        onSave={() => {
          // countedEvents has no catalog key — keep it in the local detector store.
          updateSettings({ countedEvents: form.countedEvents });
          save(
            [
              { key: "protection.enabled", value: String(form.enabled) },
              { key: "protection.strikeThreshold", value: String(form.strikeThreshold) },
              { key: "protection.strikeWindowMinutes", value: String(form.strikeWindowMin) },
              { key: "protection.lockoutDurationHours", value: String(form.lockoutHours) },
            ],
            "Protection settings saved",
          );
        }}
      />
    </div>
  );
}

/* ───────────── Tab 5 — Roles & Permissions ───────────── */
function RolesTab() {
  const roles = useSettingsStore((s) => s.settings.roles);
  const setRoles = useSettingsStore((s) => s.setRoles);
  const [draft, setDraft] = useState<AdminRole[]>(roles);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");

  const groups = [...new Set(PERMISSION_CATALOG.map((p) => p.group))];

  function setPerm(roleId: string, key: string, value: boolean) {
    setDraft(
      draft.map((r) =>
        r.id === roleId ? { ...r, permissions: { ...r.permissions, [key]: value } } : r,
      ),
    );
  }

  return (
    <div className="space-y-5">
      <Card title="Super Admin" desc="Reserved role with unrestricted access — cannot be edited.">
        <div className="flex items-center justify-between rounded-lg bg-surface-alt/60 p-4 text-sm">
          <div>
            <p className="font-semibold text-foreground">Capabilities: Everything</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Full control including API keys, deletion, and system settings.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/15 px-3 py-1 text-xs font-bold text-accent">
            <Lock className="h-3 w-3" /> Locked
          </span>
        </div>
      </Card>

      {draft
        .filter((r) => !r.system)
        .map((role) => (
          <Card key={role.id} title={role.name} desc={role.description}>
            <div className="space-y-4">
              {groups.map((g) => (
                <div key={g}>
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {g}
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                    {PERMISSION_CATALOG.filter((p) => p.group === g).map((p) => (
                      <div
                        key={p.key}
                        className="flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-medium text-foreground"
                      >
                        <span>{p.label}</span>
                        <ToggleSwitch
                          checked={role.permissions[p.key] ?? false}
                          onChange={(v) => setPerm(role.id, p.key, v)}
                          ariaLabel={`${role.name}: ${p.label}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ))}

      {creating ? (
        <Card title="New custom role" desc="Create a role with a specific permission set.">
          <Field label="Role name">
            <Input value={newName} onChange={setNewName} />
          </Field>
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => setCreating(false)}
              className="h-10 rounded-lg border border-border bg-surface px-4 text-sm font-semibold hover:bg-surface-alt"
            >
              Cancel
            </button>
            <button
              disabled={!newName.trim()}
              onClick={() => {
                setDraft([
                  ...draft,
                  {
                    id: `role_${Date.now()}`,
                    name: newName.trim(),
                    description: "Custom role",
                    permissions: Object.fromEntries(PERMISSION_CATALOG.map((p) => [p.key, false])),
                  },
                ]);
                setNewName("");
                setCreating(false);
                toast.success("Role added — configure its permissions, then save");
              }}
              className="h-10 rounded-lg bg-accent px-4 text-sm font-semibold text-accent-foreground disabled:opacity-50"
            >
              Add role
            </button>
          </div>
        </Card>
      ) : (
        <button
          onClick={() => setCreating(true)}
          className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-dashed border-border bg-surface px-4 text-sm font-semibold text-foreground hover:bg-surface-alt"
        >
          <Plus className="h-4 w-4" /> Create custom role
        </button>
      )}

      <SaveBar
        label="Save Permission Matrix"
        onSave={() => {
          setRoles(draft);
          toast.success("Roles & permissions saved");
        }}
      />
    </div>
  );
}

/* ───────────── Tab 6 — Branding ───────────── */
// Selectable app fonts — single source of truth in @/lib/fonts (used by both
// these dropdowns and the runtime BrandingProvider that loads + applies them).
const FONT_OPTIONS = FONT_NAMES;

/** Map the backend (short-key) branding into the local form shape. */
function apiToBrandingForm(b: Branding): BrandingSettings {
  return {
    primaryColor: b.colorPrimary,
    accentColor: b.colorAccent,
    successColor: b.colorSuccess,
    warningColor: b.colorWarning,
    logoLight: b.logoLightUrl,
    logoDark: b.logoDarkUrl,
    favicon: b.faviconUrl,
    pwaIcon: b.pwaIconUrl,
    loginBackground: b.loginBackgroundUrl,
    headingFont: b.fontHeading,
    bodyFont: b.fontBody,
    emailHeaderLogo: b.emailLogoUrl,
    emailFooterText: b.emailFooterText,
    companyLegalName: b.legalName,
    social: {
      twitter: b.socialTwitter,
      facebook: b.socialFacebook,
      linkedin: b.socialLinkedin,
      instagram: b.socialInstagram,
    },
  };
}

/** Map the local form back to the backend short-key update payload. */
function brandingFormToApi(f: BrandingSettings): Partial<Branding> {
  return {
    colorPrimary: f.primaryColor,
    colorAccent: f.accentColor,
    colorSuccess: f.successColor,
    colorWarning: f.warningColor,
    logoLightUrl: f.logoLight,
    logoDarkUrl: f.logoDark,
    faviconUrl: f.favicon,
    pwaIconUrl: f.pwaIcon,
    loginBackgroundUrl: f.loginBackground,
    fontHeading: f.headingFont,
    fontBody: f.bodyFont,
    emailLogoUrl: f.emailHeaderLogo,
    emailFooterText: f.emailFooterText,
    legalName: f.companyLegalName,
    socialTwitter: f.social.twitter,
    socialFacebook: f.social.facebook,
    socialLinkedin: f.social.linkedin,
    socialInstagram: f.social.instagram,
  };
}

function BrandingTab() {
  const { data: apiBranding, isLoading } = useAdminBranding();
  const updateBranding = useUpdateBranding();
  // Keep the local store in sync so the Email-template preview tab uses the
  // same branding as the backend (renderBrandedEmail reads the local store).
  const branding = useSettingsStore((s) => s.settings.branding);
  const updateLocal = useSettingsStore((s) => s.update);
  const [form, setForm] = useState(branding);

  // Seed the form from the backend once it loads.
  useEffect(() => {
    if (apiBranding) setForm(apiToBrandingForm(apiBranding));
  }, [apiBranding]);

  // Live-apply palette colors as the admin tweaks them.
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--primary", form.primaryColor);
    root.style.setProperty("--primary-light", form.primaryColor);
    root.style.setProperty("--accent", form.accentColor);
    root.style.setProperty("--success", form.successColor);
    root.style.setProperty("--warning", form.warningColor);
  }, [form.primaryColor, form.accentColor, form.successColor, form.warningColor]);

  function setField<K extends keyof BrandingSettings>(key: K, value: BrandingSettings[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }
  function setSocial(key: keyof BrandingSettings["social"], value: string) {
    setForm((f) => ({ ...f, social: { ...f.social, [key]: value } }));
  }

  function handleSave() {
    updateBranding.mutate(brandingFormToApi(form), {
      onSuccess: () => {
        updateLocal("branding", form);
        toast.success("Branding saved");
      },
      onError: (err) =>
        toast.error(err instanceof ApiError ? err.message : "Could not save branding"),
    });
  }

  if (isLoading) return <SettingsSkeleton />;

  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-2">
        <Card
          title="Color Palette"
          desc="Primary, accent, success & warning apply live across the app."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Primary Color">
              <ColorInput value={form.primaryColor} onChange={(v) => setField("primaryColor", v)} />
            </Field>
            <Field label="Accent Color">
              <ColorInput value={form.accentColor} onChange={(v) => setField("accentColor", v)} />
            </Field>
            <Field label="Success Color">
              <ColorInput value={form.successColor} onChange={(v) => setField("successColor", v)} />
            </Field>
            <Field label="Warning Color">
              <ColorInput value={form.warningColor} onChange={(v) => setField("warningColor", v)} />
            </Field>
          </div>
        </Card>

        <Card title="Typography" desc="Fonts used for headings and body copy.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Heading Font">
              <Select
                value={form.headingFont}
                onChange={(v) => setField("headingFont", v)}
                options={FONT_OPTIONS}
              />
            </Field>
            <Field label="Body Font">
              <Select
                value={form.bodyFont}
                onChange={(v) => setField("bodyFont", v)}
                options={FONT_OPTIONS}
              />
            </Field>
          </div>
          <div className="mt-4 rounded-xl border border-border bg-surface-alt/40 p-4">
            <p
              style={{ fontFamily: fontStack(form.headingFont) }}
              className="text-lg font-bold text-foreground"
            >
              The quick brown fox — heading
            </p>
            <p
              style={{ fontFamily: fontStack(form.bodyFont) }}
              className="mt-1 text-sm text-muted-foreground"
            >
              Body copy renders in {form.bodyFont}. Master Medicine. Pass with Confidence.
            </p>
          </div>
        </Card>
      </div>

      <Card
        title="Logos & Assets"
        desc="Logos, favicon, PWA icon, email logo and the login page background."
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <Field label="Logo (light backgrounds)">
            <FileUpload
              value={form.logoLight}
              onChange={(v) => setField("logoLight", v)}
              label="Upload light logo"
            />
          </Field>
          <Field label="Logo (dark backgrounds)">
            <FileUpload
              value={form.logoDark}
              onChange={(v) => setField("logoDark", v)}
              label="Upload dark logo"
            />
          </Field>
          <Field label="Email header logo">
            <FileUpload
              value={form.emailHeaderLogo}
              onChange={(v) => setField("emailHeaderLogo", v)}
              label="Upload email logo"
            />
          </Field>
          <Field label="Favicon">
            <FileUpload
              value={form.favicon}
              onChange={(v) => setField("favicon", v)}
              label="Upload favicon"
            />
          </Field>
          <Field label="PWA icon">
            <FileUpload
              value={form.pwaIcon}
              onChange={(v) => setField("pwaIcon", v)}
              label="Upload PWA icon"
            />
          </Field>
          <Field label="Login background">
            <FileUpload
              value={form.loginBackground}
              onChange={(v) => setField("loginBackground", v)}
              label="Upload background"
            />
          </Field>
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card
          title="Company & Email Footer"
          desc="Legal name and the footer line shown on every email."
        >
          <Field label="Company Legal Name">
            <Input
              value={form.companyLegalName}
              onChange={(v) => setField("companyLegalName", v)}
            />
          </Field>
          <Field label="Email Footer Text">
            <textarea
              value={form.emailFooterText}
              onChange={(e) => setField("emailFooterText", e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </Field>
        </Card>

        <Card title="Social Links" desc="Shown in email footers and the public site.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Twitter / X">
              <Input value={form.social.twitter} onChange={(v) => setSocial("twitter", v)} />
            </Field>
            <Field label="Facebook">
              <Input value={form.social.facebook} onChange={(v) => setSocial("facebook", v)} />
            </Field>
            <Field label="LinkedIn">
              <Input value={form.social.linkedin} onChange={(v) => setSocial("linkedin", v)} />
            </Field>
            <Field label="Instagram">
              <Input value={form.social.instagram} onChange={(v) => setSocial("instagram", v)} />
            </Field>
          </div>
        </Card>
      </div>

      <Card title="Preview" desc="A sample UI card and email header using your current branding.">
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Sample UI card */}
          <div className="rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-bold text-success">
                Active
              </span>
              <span className="rounded-full bg-warning/10 px-2.5 py-0.5 text-xs font-bold text-warning">
                3 days left
              </span>
            </div>
            <p
              className="mt-3 text-base font-bold text-foreground"
              style={{ fontFamily: form.headingFont }}
            >
              Sample dashboard card
            </p>
            <p className="mt-1 text-sm text-muted-foreground" style={{ fontFamily: form.bodyFont }}>
              Buttons and chips below use your palette.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">
                Primary button
              </button>
              <button className="rounded-lg bg-accent px-4 py-2 text-sm font-bold text-accent-foreground">
                Accent button
              </button>
              <span className="rounded-full bg-gradient-to-r from-primary to-accent px-3 py-1 text-xs font-bold text-white">
                Gradient chip
              </span>
            </div>
          </div>

          {/* Sample email header */}
          <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-[var(--shadow-card)]">
            <div
              className="flex items-center px-6 py-5"
              style={{
                background: `linear-gradient(135deg, ${form.primaryColor}, ${form.accentColor})`,
              }}
            >
              {form.emailHeaderLogo || form.logoLight ? (
                <img
                  src={form.emailHeaderLogo || form.logoLight}
                  alt="email logo"
                  className="h-8 object-contain"
                />
              ) : (
                <span className="text-xl font-extrabold tracking-tight text-white">
                  Medinova<span className="text-emerald-200">qbank</span>
                </span>
              )}
            </div>
            <div className="px-6 py-5">
              <p
                className="text-sm font-bold text-slate-900"
                style={{ fontFamily: form.headingFont }}
              >
                Welcome aboard 🎉
              </p>
              <p className="mt-1 text-sm text-slate-600" style={{ fontFamily: form.bodyFont }}>
                This is how your branded email header looks to recipients.
              </p>
            </div>
            <div className="border-t border-slate-200 bg-slate-50 px-6 py-3">
              <p className="text-[11px] text-slate-500">
                © 2026 {form.companyLegalName || "Medinovaqbank"}
              </p>
            </div>
          </div>
        </div>
      </Card>

      <SaveBar label="Save Branding" saving={updateBranding.isPending} onSave={handleSave} />
    </div>
  );
}

/* ───────────── Tab 7 — CMS ───────────── */
type CmsSection = "faq" | "help" | "legal" | "about" | "contact";
const CMS_SECTIONS: { key: CmsSection; label: string }[] = [
  { key: "faq", label: "FAQ" },
  { key: "help", label: "Help Center" },
  { key: "legal", label: "Legal" },
  { key: "about", label: "About" },
  { key: "contact", label: "Contact" },
];

function CmsTab() {
  const [section, setSection] = useState<CmsSection>("faq");
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-1.5">
        {CMS_SECTIONS.map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => setSection(s.key)}
            className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition ${
              section === s.key
                ? "border-accent bg-accent/10 text-accent"
                : "border-border bg-surface text-muted-foreground hover:text-foreground"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {section === "faq" && <CmsFaq />}
      {section === "help" && <CmsHelp />}
      {section === "legal" && <CmsLegal />}
      {section === "about" && <CmsAbout />}
      {section === "contact" && <CmsContactSection />}
    </div>
  );
}

function CmsFaq() {
  const faqs = useCmsStore((s) => s.cms.faqs);
  const setFaqs = useCmsStore((s) => s.setFaqs);
  const [draft, setDraft] = useState<FaqEntry[]>(faqs);

  function update(id: string, patch: Partial<FaqEntry>) {
    setDraft(draft.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  }
  function move(index: number, dir: -1 | 1) {
    const next = [...draft];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setDraft(next);
  }

  return (
    <Card title="Frequently Asked Questions" desc="Questions shown on the public FAQ page.">
      <div className="space-y-4">
        {draft.map((f, i) => (
          <div key={f.id} className="rounded-xl border border-border bg-surface p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-muted-foreground">#{i + 1}</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-surface-alt hover:text-foreground disabled:opacity-30"
                  aria-label="Move up"
                >
                  <ChevronUp className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={i === draft.length - 1}
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-surface-alt hover:text-foreground disabled:opacity-30"
                  aria-label="Move down"
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setDraft(draft.filter((x) => x.id !== f.id))}
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-error/10 hover:text-error"
                  aria-label="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Question">
                <Input value={f.question} onChange={(v) => update(f.id, { question: v })} />
              </Field>
              <Field label="Category">
                <Input value={f.category} onChange={(v) => update(f.id, { category: v })} />
              </Field>
            </div>
            <Field label="Answer">
              <textarea
                value={f.answer}
                onChange={(e) => update(f.id, { answer: e.target.value })}
                rows={3}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </Field>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() =>
            setDraft([
              ...draft,
              { id: `f_${Date.now()}`, category: "General", question: "", answer: "" },
            ])
          }
          className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-dashed border-border bg-surface px-4 text-sm font-semibold text-foreground hover:bg-surface-alt"
        >
          <Plus className="h-4 w-4" /> Add question
        </button>
        <button
          type="button"
          onClick={() => {
            setFaqs(draft);
            toast.success("FAQ saved");
          }}
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-accent px-5 text-sm font-semibold text-accent-foreground hover:bg-accent/90"
        >
          <Save className="h-4 w-4" /> Save FAQ
        </button>
      </div>
    </Card>
  );
}

function CmsHelp() {
  const articles = useCmsStore((s) => s.cms.helpArticles);
  const setHelpArticles = useCmsStore((s) => s.setHelpArticles);
  const [draft, setDraft] = useState<HelpArticle[]>(articles);

  function update(id: string, patch: Partial<HelpArticle>) {
    setDraft(draft.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  }

  return (
    <Card title="Help Center" desc="In-depth articles with rich formatting.">
      <div className="space-y-5">
        {draft.map((a) => (
          <div key={a.id} className="rounded-xl border border-border bg-surface p-4">
            <div className="grid gap-3 sm:grid-cols-[1fr_220px]">
              <Field label="Title">
                <Input value={a.title} onChange={(v) => update(a.id, { title: v })} />
              </Field>
              <Field label="Category">
                <Input value={a.category} onChange={(v) => update(a.id, { category: v })} />
              </Field>
            </div>
            <Field label="Body">
              <RichTextEditor value={a.body} onChange={(html) => update(a.id, { body: html })} />
            </Field>
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={() => setDraft(draft.filter((x) => x.id !== a.id))}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-xs font-semibold text-muted-foreground hover:bg-error/10 hover:text-error"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete article
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() =>
            setDraft([
              ...draft,
              { id: `h_${Date.now()}`, category: "General", title: "", body: "" },
            ])
          }
          className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-dashed border-border bg-surface px-4 text-sm font-semibold text-foreground hover:bg-surface-alt"
        >
          <Plus className="h-4 w-4" /> Add article
        </button>
        <button
          type="button"
          onClick={() => {
            setHelpArticles(draft);
            toast.success("Help Center saved");
          }}
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-accent px-5 text-sm font-semibold text-accent-foreground hover:bg-accent/90"
        >
          <Save className="h-4 w-4" /> Save articles
        </button>
      </div>
    </Card>
  );
}

const LEGAL_KEYS: { key: keyof CmsContent["legal"]; label: string }[] = [
  { key: "terms", label: "Terms of Service" },
  { key: "privacy", label: "Privacy Policy" },
  { key: "refund", label: "Refund Policy" },
  { key: "cookie", label: "Cookie Policy" },
];

function CmsLegal() {
  const legal = useCmsStore((s) => s.cms.legal);
  const setLegal = useCmsStore((s) => s.setLegal);
  const [active, setActive] = useState<keyof CmsContent["legal"]>("terms");
  const [draft, setDraft] = useState(legal);

  const doc = draft[active];

  function update(patch: Partial<typeof doc>) {
    setDraft({ ...draft, [active]: { ...doc, ...patch } });
  }

  return (
    <Card title="Legal Documents" desc="Terms, privacy, refund and cookie policies.">
      <div className="mb-4 flex flex-wrap gap-1.5">
        {LEGAL_KEYS.map((l) => (
          <button
            key={l.key}
            type="button"
            onClick={() => setActive(l.key)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
              active === l.key
                ? "border-accent bg-accent/10 text-accent"
                : "border-border bg-surface text-muted-foreground hover:text-foreground"
            }`}
          >
            {l.label}
          </button>
        ))}
      </div>
      <Field label="Title">
        <Input value={doc.title} onChange={(v) => update({ title: v })} />
      </Field>
      <Field label="Document body">
        <RichTextEditor
          value={doc.body}
          onChange={(html) => update({ body: html })}
          minHeight={240}
        />
      </Field>
      <div className="mt-4 flex items-center justify-between gap-3">
        <span className="text-xs text-muted-foreground">Last updated {doc.updatedAt}</span>
        <button
          type="button"
          onClick={() => {
            setLegal(active, { title: doc.title, body: doc.body, updatedAt: "2026-06-26" });
            setDraft({ ...draft, [active]: { ...doc, updatedAt: "2026-06-26" } });
            toast.success(`${doc.title} saved`);
          }}
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-accent px-5 text-sm font-semibold text-accent-foreground hover:bg-accent/90"
        >
          <Save className="h-4 w-4" /> Save document
        </button>
      </div>
    </Card>
  );
}

function CmsAbout() {
  const about = useCmsStore((s) => s.cms.about);
  const setAbout = useCmsStore((s) => s.setAbout);
  const [draft, setDraft] = useState<AboutContent>(about);

  function updateFeature(id: string, patch: Partial<AboutContent["features"][number]>) {
    setDraft({
      ...draft,
      features: draft.features.map((f) => (f.id === id ? { ...f, ...patch } : f)),
    });
  }
  function updateTestimonial(id: string, patch: Partial<Testimonial>) {
    setDraft({
      ...draft,
      testimonials: draft.testimonials.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    });
  }

  return (
    <div className="space-y-5">
      <Card title="About — Hero" desc="The headline and intro on the About page.">
        <Field label="Hero Title">
          <Input value={draft.heroTitle} onChange={(v) => setDraft({ ...draft, heroTitle: v })} />
        </Field>
        <Field label="Hero Subtitle">
          <textarea
            value={draft.heroSubtitle}
            onChange={(e) => setDraft({ ...draft, heroSubtitle: e.target.value })}
            rows={3}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </Field>
      </Card>

      <Card title="Features" desc="Highlighted product features.">
        <div className="space-y-3">
          {draft.features.map((f) => (
            <div key={f.id} className="rounded-xl border border-border bg-surface p-4">
              <div className="mb-2 flex justify-end">
                <button
                  type="button"
                  onClick={() =>
                    setDraft({ ...draft, features: draft.features.filter((x) => x.id !== f.id) })
                  }
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-error/10 hover:text-error"
                  aria-label="Delete feature"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <Field label="Title">
                <Input value={f.title} onChange={(v) => updateFeature(f.id, { title: v })} />
              </Field>
              <Field label="Body">
                <textarea
                  value={f.body}
                  onChange={(e) => updateFeature(f.id, { body: e.target.value })}
                  rows={2}
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
              </Field>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() =>
            setDraft({
              ...draft,
              features: [...draft.features, { id: `a_${Date.now()}`, title: "", body: "" }],
            })
          }
          className="mt-4 inline-flex h-10 items-center gap-1.5 rounded-lg border border-dashed border-border bg-surface px-4 text-sm font-semibold text-foreground hover:bg-surface-alt"
        >
          <Plus className="h-4 w-4" /> Add feature
        </button>
      </Card>

      <Card title="Testimonials" desc="Social proof from users.">
        <div className="space-y-3">
          {draft.testimonials.map((t) => (
            <div key={t.id} className="rounded-xl border border-border bg-surface p-4">
              <div className="mb-2 flex justify-end">
                <button
                  type="button"
                  onClick={() =>
                    setDraft({
                      ...draft,
                      testimonials: draft.testimonials.filter((x) => x.id !== t.id),
                    })
                  }
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-error/10 hover:text-error"
                  aria-label="Delete testimonial"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Name">
                  <Input value={t.name} onChange={(v) => updateTestimonial(t.id, { name: v })} />
                </Field>
                <Field label="Role">
                  <Input value={t.role} onChange={(v) => updateTestimonial(t.id, { role: v })} />
                </Field>
              </div>
              <Field label="Quote">
                <textarea
                  value={t.quote}
                  onChange={(e) => updateTestimonial(t.id, { quote: e.target.value })}
                  rows={2}
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
              </Field>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() =>
            setDraft({
              ...draft,
              testimonials: [
                ...draft.testimonials,
                { id: `t_${Date.now()}`, name: "", role: "", quote: "" },
              ],
            })
          }
          className="mt-4 inline-flex h-10 items-center gap-1.5 rounded-lg border border-dashed border-border bg-surface px-4 text-sm font-semibold text-foreground hover:bg-surface-alt"
        >
          <Plus className="h-4 w-4" /> Add testimonial
        </button>
      </Card>

      <SaveBar
        label="Save About Page"
        onSave={() => {
          setAbout(draft);
          toast.success("About page saved");
        }}
      />
    </div>
  );
}

function CmsContactSection() {
  const contact = useCmsStore((s) => s.cms.contact);
  const setContact = useCmsStore((s) => s.setContact);
  const [draft, setDraft] = useState<ContactInfo>(contact);

  return (
    <Card
      title="Contact Details"
      desc="How users reach you — shown on the Contact page and in footers."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Email">
          <Input value={draft.email} onChange={(v) => setDraft({ ...draft, email: v })} />
        </Field>
        <Field label="Phone">
          <Input value={draft.phone} onChange={(v) => setDraft({ ...draft, phone: v })} />
        </Field>
      </div>
      <Field label="Address">
        <textarea
          value={draft.address}
          onChange={(e) => setDraft({ ...draft, address: e.target.value })}
          rows={2}
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
        />
      </Field>
      <SaveBar
        label="Save Contact"
        onSave={() => {
          setContact(draft);
          toast.success("Contact details saved");
        }}
      />
    </Card>
  );
}

/* ───────────── Shared primitives ───────────── */
function Card({
  title,
  desc,
  icon,
  children,
}: {
  title: string;
  desc?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)] sm:p-6">
      <div className="flex items-start gap-3">
        {icon}
        <div>
          <h3 className="text-base font-bold tracking-tight text-foreground">{title}</h3>
          {desc && <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p>}
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function IntegrationCard({
  icon,
  title,
  desc,
  status,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  desc?: string;
  status: IntegrationStatus;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)] sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          {icon}
          <div>
            <h3 className="text-base font-bold tracking-tight text-foreground">{title}</h3>
            {desc && <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p>}
          </div>
        </div>
        <StatusBadge status={status} />
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function StatusBadge({ status }: { status: IntegrationStatus }) {
  const map: Record<IntegrationStatus, { label: string; cls: string; dot: string }> = {
    connected: {
      label: "Connected",
      cls: "bg-success/10 text-success border-success/20",
      dot: "bg-success",
    },
    not_configured: {
      label: "Not Configured",
      cls: "bg-surface-alt text-muted-foreground border-border",
      dot: "bg-muted-foreground/50",
    },
    error: { label: "Error", cls: "bg-error/10 text-error border-error/20", dot: "bg-error" },
  };
  const s = map[status];
  return (
    <span
      className={`inline-flex flex-shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${s.cls}`}
    >
      <span className={`h-2 w-2 rounded-full ${s.dot}`} /> {s.label}
    </span>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="mt-4 block first:mt-0">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}

function Input({
  value,
  onChange,
  type = "text",
}: {
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
    />
  );
}

function NumberInput({
  value,
  onChange,
  step,
  placeholder,
}: {
  value: number;
  onChange: (v: number) => void;
  step?: string;
  placeholder?: string;
}) {
  return (
    <input
      type="number"
      step={step}
      // Show an empty field (with a hint) instead of a baked-in "0" the user
      // has to clear before typing. 0 is the "unset" sentinel here.
      value={value === 0 ? "" : value}
      placeholder={placeholder ?? "0"}
      onChange={(e) => onChange(e.target.value === "" ? 0 : Number(e.target.value))}
      className="h-10 w-full rounded-lg border border-border bg-surface px-3 font-mono text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
    />
  );
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
    >
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

function ColorInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-3">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-16 cursor-pointer rounded-lg border border-border bg-surface"
      />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 flex-1 rounded-lg border border-border bg-surface px-3 font-mono text-sm uppercase focus:border-accent focus:outline-none"
      />
    </div>
  );
}

function Radio({
  label,
  checked,
  onClick,
  readOnly,
}: {
  label: string;
  checked: boolean;
  onClick?: () => void;
  readOnly?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={readOnly ? undefined : onClick}
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
        checked
          ? "border-accent bg-accent/10 text-accent"
          : "border-border bg-surface text-muted-foreground hover:text-foreground"
      } ${readOnly ? "cursor-default" : ""}`}
    >
      <span
        className={`h-2 w-2 rounded-full ${checked ? "bg-accent" : "bg-muted-foreground/40"}`}
      />
      {label}
    </button>
  );
}

function SecretInput({
  value,
  onChange,
  placeholder,
  onReveal,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  /** When provided, reveal fetches the decrypted secret from the backend (audited). */
  onReveal?: () => Promise<string | null>;
}) {
  const [reveal, setReveal] = useState(false);
  const [editing, setEditing] = useState(!value);
  const [revealing, setRevealing] = useState(false);
  // When the backend supplies a decrypted secret, hold it here (component state only).
  const [revealed, setRevealed] = useState<string | null>(null);

  useEffect(() => {
    if (!reveal) return;
    const t = setTimeout(() => {
      setReveal(false);
      setRevealed(null);
    }, 5000);
    return () => clearTimeout(t);
  }, [reveal]);

  // Once the admin edits, the typed value is the new secret — drop any revealed copy.
  useEffect(() => {
    if (editing) {
      setReveal(false);
      setRevealed(null);
    }
  }, [editing]);

  const masked = value
    ? value.length > 4
      ? `${"•".repeat(Math.min(20, value.length - 4))}${value.slice(-4)}`
      : "••••"
    : "";

  async function toggleReveal() {
    if (reveal) {
      setReveal(false);
      setRevealed(null);
      return;
    }
    if (onReveal) {
      setRevealing(true);
      try {
        const secret = await onReveal();
        setRevealed(secret ?? "");
        setReveal(true);
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "Could not reveal secret");
      } finally {
        setRevealing(false);
      }
    } else {
      setReveal(true);
    }
  }

  const display = editing ? value : reveal ? (revealed ?? value) : masked;

  return (
    <div className="flex items-center gap-2">
      <input
        readOnly={!editing}
        value={display}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={`h-10 flex-1 rounded-lg border border-border px-3 font-mono text-sm ${editing ? "bg-surface" : "bg-surface-alt/60 text-muted-foreground"}`}
      />
      <button
        type="button"
        onClick={toggleReveal}
        disabled={revealing || editing}
        className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-surface text-muted-foreground hover:text-foreground disabled:opacity-50"
        aria-label={reveal ? "Hide" : "Reveal"}
      >
        {reveal ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
      <button
        type="button"
        onClick={() =>
          setEditing((e) => {
            const next = !e;
            // Entering edit mode: clear the field so the admin types a FRESH
            // secret. The form shows secrets masked (••••1234); never let that
            // mask (or a partial edit of it) get saved as the real value.
            if (next) onChange("");
            return next;
          })
        }
        className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-xs font-semibold hover:bg-surface-alt"
      >
        <Pencil className="h-3.5 w-3.5" /> {editing ? "Done" : "Edit"}
      </button>
    </div>
  );
}

function CopyField({ value }: { value: string }) {
  return (
    <div className="flex items-center gap-2">
      <input
        readOnly
        value={value}
        className="h-10 flex-1 rounded-lg border border-border bg-surface-alt/60 px-3 text-sm text-muted-foreground"
      />
      <button
        type="button"
        onClick={() => {
          navigator.clipboard.writeText(value);
          toast.success("Copied");
        }}
        className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-surface px-3 text-xs font-semibold hover:bg-surface-alt"
      >
        <Copy className="h-3.5 w-3.5" /> Copy
      </button>
    </div>
  );
}

function FileUpload({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  return (
    <div className="flex items-center gap-3">
      {value ? (
        <span className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg border border-border bg-surface">
          <img src={value} alt="upload preview" className="h-full w-full object-contain" />
        </span>
      ) : (
        <span className="flex h-12 w-12 items-center justify-center rounded-lg border border-dashed border-border bg-surface-alt/40 text-muted-foreground">
          <Upload className="h-4 w-4" />
        </span>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          // Upload to storage and keep the URL — never store base64 in settings.
          setUploading(true);
          try {
            const url = await brandingApi.uploadAsset(file);
            onChange(url);
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Upload failed");
          } finally {
            setUploading(false);
            if (inputRef.current) inputRef.current.value = "";
          }
        }}
      />
      <button
        type="button"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-xs font-semibold hover:bg-surface-alt disabled:opacity-60"
      >
        {uploading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Upload className="h-3.5 w-3.5" />
        )}{" "}
        {uploading ? "Uploading…" : label}
      </button>
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="rounded-lg p-2 text-muted-foreground hover:bg-error/10 hover:text-error"
          aria-label="Remove"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

function SaveBar({
  label = "Save Changes",
  onSave,
  saving = false,
}: {
  label?: string;
  onSave: () => void;
  saving?: boolean;
}) {
  return (
    <div className="mt-6 flex items-center justify-end">
      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        className="inline-flex h-10 items-center gap-2 rounded-lg bg-accent px-5 text-sm font-semibold text-accent-foreground hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Save className="h-4 w-4" /> {saving ? "Saving…" : label}
      </button>
    </div>
  );
}
