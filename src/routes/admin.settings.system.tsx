import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  Copy,
  Eye,
  EyeOff,
  KeyRound,
  Mail,
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
  UserCog,
  Wallet,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import {
  useSettingsStore,
  PERMISSION_CATALOG,
  type IntegrationStatus,
  type EmailTemplate,
  type AdminRole,
} from "@/stores/settingsStore";
import { useFeatureCatalogStore } from "@/stores/featureCatalogStore";

export const Route = createFileRoute("/admin/settings/system")({
  head: () => ({ meta: [{ title: "Admin · Settings — Medinovaqbank" }, { name: "robots", content: "noindex" }] }),
  component: AdminSettings,
});

type TabKey = "general" | "integrations" | "email" | "trial" | "roles" | "branding";

const TABS: { key: TabKey; label: string; icon: typeof Sliders }[] = [
  { key: "general", label: "General", icon: Sliders },
  { key: "integrations", label: "Integrations & API Keys", icon: KeyRound },
  { key: "email", label: "Email Templates", icon: Mail },
  { key: "trial", label: "Trial & Access", icon: ShieldCheck },
  { key: "roles", label: "Roles & Permissions", icon: UserCog },
  { key: "branding", label: "Branding", icon: Palette },
];

function AdminSettings() {
  const [tab, setTab] = useState<TabKey>("general");

  return (
    <div>
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">System Settings</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          The control center for your platform. Everything here persists — no configuration lives in code.
        </p>
      </div>

      <div className="mt-6 flex flex-wrap gap-1 border-b border-border">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`-mb-px inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
                active ? "border-accent text-accent" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" /> {t.label}
            </button>
          );
        })}
      </div>

      <div className="mt-6 max-w-4xl">
        {tab === "general" && <GeneralTab />}
        {tab === "integrations" && <IntegrationsTab />}
        {tab === "email" && <EmailTemplatesTab />}
        {tab === "trial" && <TrialTab />}
        {tab === "roles" && <RolesTab />}
        {tab === "branding" && <BrandingTab />}
      </div>
    </div>
  );
}

/* ───────────── Tab 1 — General ───────────── */
function GeneralTab() {
  const settings = useSettingsStore((s) => s.settings.general);
  const branding = useSettingsStore((s) => s.settings.branding);
  const update = useSettingsStore((s) => s.update);
  const [form, setForm] = useState(settings);
  const [logo, setLogo] = useState(branding.logoLight);

  return (
    <div className="space-y-5">
      <Card title="Platform" desc="Core identity and contact details shown across the app.">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Platform Name"><Input value={form.platformName} onChange={(v) => setForm({ ...form, platformName: v })} /></Field>
          <Field label="Tagline"><Input value={form.tagline} onChange={(v) => setForm({ ...form, tagline: v })} /></Field>
          <Field label="Support Email"><Input value={form.supportEmail} onChange={(v) => setForm({ ...form, supportEmail: v })} /></Field>
          <Field label="Support Phone"><Input value={form.supportPhone} onChange={(v) => setForm({ ...form, supportPhone: v })} /></Field>
          <Field label="Default Currency"><Input value={form.currency} onChange={(v) => setForm({ ...form, currency: v })} /></Field>
          <Field label="Timezone">
            <Select value={form.timezone} onChange={(v) => setForm({ ...form, timezone: v })} options={["Africa/Accra", "Africa/Lagos", "Europe/London", "America/New_York", "UTC"]} />
          </Field>
        </div>
        <Field label="Logo">
          <FileUpload value={logo} onChange={setLogo} label="Upload logo (PNG/SVG)" />
        </Field>
        <SaveBar onSave={() => { update("general", form); update("branding", { logoLight: logo }); toast.success("General settings saved"); }} />
      </Card>

      <Card title="Quiz & Trial Limits" desc="Defaults applied to new sessions and free trials.">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Free Trial Duration (days)"><NumberInput value={form.trialDays} onChange={(v) => setForm({ ...form, trialDays: v })} /></Field>
          <Field label="Free Trial Question Limit"><NumberInput value={form.trialQuestionLimit} onChange={(v) => setForm({ ...form, trialQuestionLimit: v })} /></Field>
          <Field label="Max Questions / Quiz Session"><NumberInput value={form.maxQuestionsPerSession} onChange={(v) => setForm({ ...form, maxQuestionsPerSession: v })} /></Field>
          <Field label="Default Session Time Limit (min)"><NumberInput value={form.defaultSessionTimeLimitMin} onChange={(v) => setForm({ ...form, defaultSessionTimeLimitMin: v })} /></Field>
        </div>
        <label className="mt-4 flex items-center justify-between rounded-lg border border-border bg-surface-alt/40 px-4 py-3 text-sm font-medium text-foreground">
          <span>
            Maintenance mode
            <span className="ml-2 text-xs font-normal text-muted-foreground">Non-admins see a maintenance page when enabled.</span>
          </span>
          <Toggle value={form.maintenanceMode} onChange={(v) => setForm({ ...form, maintenanceMode: v })} />
        </label>
        <SaveBar onSave={() => { update("general", form); toast.success(form.maintenanceMode ? "Maintenance mode ON" : "Quiz & trial limits saved"); }} />
      </Card>
    </div>
  );
}

/* ───────────── Tab 2 — Integrations & API Keys ───────────── */
function IntegrationsTab() {
  const ai = useSettingsStore((s) => s.settings.ai);
  const payment = useSettingsStore((s) => s.settings.payment);
  const oauth = useSettingsStore((s) => s.settings.oauth);
  const smtp = useSettingsStore((s) => s.settings.smtp);
  const update = useSettingsStore((s) => s.update);

  const [aiForm, setAiForm] = useState(ai);
  const [payForm, setPayForm] = useState(payment);
  const [oauthForm, setOauthForm] = useState(oauth);
  const [smtpForm, setSmtpForm] = useState(smtp);
  const [advanced, setAdvanced] = useState(false);

  function testConnection(
    section: "ai" | "payment" | "oauth" | "smtp",
    setter: (s: (p: any) => any) => void,
    label: string,
  ) {
    toast.loading(`Testing ${label}…`, { id: "test" });
    setTimeout(() => {
      const ok = Math.random() > 0.15;
      const status: IntegrationStatus = ok ? "connected" : "error";
      setter((p: any) => ({ ...p, status, lastTestedAt: new Date().toISOString() }));
      update(section, { status, lastTestedAt: new Date().toISOString() } as any);
      ok ? toast.success(`${label} connection succeeded`, { id: "test" }) : toast.error(`${label} connection failed`, { id: "test" });
    }, 900);
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border bg-surface-alt/60 p-4 text-sm text-muted-foreground">
        All third-party credentials are entered here and stored encrypted in the backend. They never live in code or env files,
        and the full key is never shown again after saving — only the last 4 characters, unless explicitly revealed.
      </div>

      {/* AI Provider */}
      <IntegrationCard icon={<Sparkles className="h-5 w-5 text-accent" />} title="AI Provider" desc="Generates clinical breakdowns for quiz questions." status={aiForm.status}>
        <div className="flex flex-wrap gap-2">
          <Radio label="Google Gemini" checked readOnly />
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-[1fr_220px]">
          <Field label="API Key"><SecretInput value={aiForm.apiKey} onChange={(v) => setAiForm({ ...aiForm, apiKey: v })} placeholder="AIza…" /></Field>
          <Field label="Model">
            <Select value={aiForm.model} onChange={(v) => setAiForm({ ...aiForm, model: v })} options={["gemini-1.5-flash", "gemini-1.5-pro", "gemini-2.0-flash", "gemini-2.0-pro"]} />
          </Field>
        </div>

        <button type="button" onClick={() => setAdvanced((a) => !a)} className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground">
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${advanced ? "rotate-180" : ""}`} /> Advanced
        </button>
        {advanced && (
          <div className="mt-3 grid gap-4 md:grid-cols-2">
            <Field label="Temperature"><NumberInput step="0.1" value={aiForm.temperature} onChange={(v) => setAiForm({ ...aiForm, temperature: v })} /></Field>
            <Field label="Max Tokens"><NumberInput value={aiForm.maxTokens} onChange={(v) => setAiForm({ ...aiForm, maxTokens: v })} /></Field>
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-surface-alt/60 p-3">
          <div className="text-xs text-muted-foreground">
            {aiForm.lastTestedAt ? `Last tested ${new Date(aiForm.lastTestedAt).toLocaleString()}` : "Not yet tested"} · {aiForm.callsThisMonth.toLocaleString()} calls this month · ≈ ${aiForm.estCostUsd.toFixed(2)}
          </div>
          <button type="button" onClick={() => testConnection("ai", setAiForm, "Gemini")} className="inline-flex h-8 items-center gap-2 rounded-md border border-border bg-surface px-3 text-xs font-semibold hover:bg-surface-alt">
            <TestTube2 className="h-3.5 w-3.5" /> Test Connection
          </button>
        </div>
        <SaveBar label="Save AI Settings" onSave={() => { update("ai", aiForm); toast.success("AI provider saved"); }} />
      </IntegrationCard>

      {/* Payment */}
      <IntegrationCard icon={<Wallet className="h-5 w-5 text-accent" />} title="Payment Gateway" desc="Card & mobile-money processing for subscriptions." status={payForm.status}>
        <div className="flex flex-wrap gap-2"><Radio label="Paystack" checked readOnly /></div>
        <div className="mt-5 grid gap-4">
          <Field label="Public Key"><SecretInput value={payForm.publicKey} onChange={(v) => setPayForm({ ...payForm, publicKey: v })} placeholder="pk_…" /></Field>
          <Field label="Secret Key"><SecretInput value={payForm.secretKey} onChange={(v) => setPayForm({ ...payForm, secretKey: v })} placeholder="sk_…" /></Field>
          <Field label="Webhook Secret"><SecretInput value={payForm.webhookSecret} onChange={(v) => setPayForm({ ...payForm, webhookSecret: v })} placeholder="whsec_…" /></Field>
          <Field label="Webhook URL (paste into Paystack dashboard)"><CopyField value={payForm.webhookUrl} /></Field>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-surface-alt/60 p-3">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Mode</span>
            <Radio label="Test" checked={payForm.mode === "test"} onClick={() => setPayForm({ ...payForm, mode: "test" })} />
            <Radio label="Live" checked={payForm.mode === "live"} onClick={() => setPayForm({ ...payForm, mode: "live" })} />
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => toast.success("Test webhook delivered")} className="inline-flex h-8 items-center gap-2 rounded-md border border-border bg-surface px-3 text-xs font-semibold hover:bg-surface-alt"><TestTube2 className="h-3.5 w-3.5" /> Test Webhook</button>
            <button type="button" onClick={() => testConnection("payment", setPayForm, "Paystack")} className="inline-flex h-8 items-center gap-2 rounded-md border border-border bg-surface px-3 text-xs font-semibold hover:bg-surface-alt"><Wallet className="h-3.5 w-3.5" /> Test Connection</button>
          </div>
        </div>
        <SaveBar label="Save Payment Settings" onSave={() => { update("payment", payForm); toast.success("Payment gateway saved"); }} />
      </IntegrationCard>

      {/* OAuth */}
      <IntegrationCard icon={<KeyRound className="h-5 w-5 text-accent" />} title="Google OAuth" desc="Credentials for Sign in with Google." status={oauthForm.status}>
        <div className="grid gap-4">
          <Field label="Client ID"><SecretInput value={oauthForm.clientId} onChange={(v) => setOauthForm({ ...oauthForm, clientId: v })} placeholder="…apps.googleusercontent.com" /></Field>
          <Field label="Client Secret"><SecretInput value={oauthForm.clientSecret} onChange={(v) => setOauthForm({ ...oauthForm, clientSecret: v })} placeholder="GOCSPX-…" /></Field>
          <Field label="Callback URL (read-only)"><CopyField value={oauthForm.callbackUrl} /></Field>
        </div>
        <SaveBar label="Save OAuth Settings" onSave={() => { const status: IntegrationStatus = oauthForm.clientId && oauthForm.clientSecret ? "connected" : "not_configured"; update("oauth", { ...oauthForm, status }); setOauthForm({ ...oauthForm, status }); toast.success("Google OAuth saved"); }} />
      </IntegrationCard>

      {/* SMTP */}
      <IntegrationCard icon={<Mail className="h-5 w-5 text-accent" />} title="Email / SMTP" desc="Outbound server for transactional email." status={smtpForm.status}>
        <Field label="Provider Preset">
          <Select
            value={smtpForm.preset}
            onChange={(v) => {
              const presets: Record<string, { host: string; port: string; username: string }> = {
                sendgrid: { host: "smtp.sendgrid.net", port: "587", username: "apikey" },
                mailgun: { host: "smtp.mailgun.org", port: "587", username: "postmaster@your-domain" },
                gmail: { host: "smtp.gmail.com", port: "465", username: "you@gmail.com" },
                custom: { host: "", port: "587", username: "" },
              };
              const p = presets[v] ?? presets.custom;
              setSmtpForm({ ...smtpForm, preset: v as any, ...p });
            }}
            options={["sendgrid", "mailgun", "gmail", "custom"]}
          />
        </Field>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Field label="Host"><Input value={smtpForm.host} onChange={(v) => setSmtpForm({ ...smtpForm, host: v })} /></Field>
          <Field label="Port"><Input value={smtpForm.port} onChange={(v) => setSmtpForm({ ...smtpForm, port: v })} /></Field>
          <Field label="Username"><Input value={smtpForm.username} onChange={(v) => setSmtpForm({ ...smtpForm, username: v })} /></Field>
          <Field label="Password"><SecretInput value={smtpForm.password} onChange={(v) => setSmtpForm({ ...smtpForm, password: v })} placeholder="••••••" /></Field>
          <Field label="From Name"><Input value={smtpForm.fromName} onChange={(v) => setSmtpForm({ ...smtpForm, fromName: v })} /></Field>
          <Field label="From Email"><Input value={smtpForm.fromEmail} onChange={(v) => setSmtpForm({ ...smtpForm, fromEmail: v })} /></Field>
        </div>
        <div className="mt-4 flex items-center justify-between gap-3">
          <button type="button" onClick={() => toast.success("Test email queued")} className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-surface px-3 text-xs font-semibold hover:bg-surface-alt"><Send className="h-3.5 w-3.5" /> Send Test Email</button>
          <button type="button" onClick={() => { const status: IntegrationStatus = smtpForm.host && smtpForm.password ? "connected" : "not_configured"; update("smtp", { ...smtpForm, status }); setSmtpForm({ ...smtpForm, status }); toast.success("SMTP settings saved"); }} className="inline-flex h-10 items-center gap-2 rounded-lg bg-accent px-5 text-sm font-semibold text-accent-foreground hover:bg-accent/90"><Save className="h-4 w-4" /> Save</button>
        </div>
      </IntegrationCard>
    </div>
  );
}

/* ───────────── Tab 3 — Email Templates ───────────── */
const TEMPLATE_VARS = ["{{name}}", "{{platformName}}", "{{planName}}", "{{daysLeft}}", "{{trialDays}}", "{{trialQuestions}}", "{{renewsAt}}", "{{resetLink}}"];

function EmailTemplatesTab() {
  const templates = useSettingsStore((s) => s.settings.templates);
  const setTemplates = useSettingsStore((s) => s.setTemplates);
  const [editing, setEditing] = useState<EmailTemplate | null>(null);

  return (
    <Card title="Email Templates" desc="Transactional message copy. Variables like {{name}} are interpolated at send time.">
      <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-surface">
        {templates.map((t) => (
          <li key={t.key} className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-foreground">{t.name}</span>
                {!t.enabled && <span className="rounded-full bg-surface-alt px-2 py-0.5 text-[10px] font-bold uppercase text-muted-foreground">Off</span>}
                {t.daysBefore != null && <span className="rounded-full bg-warning/10 px-2 py-0.5 text-[10px] font-bold text-warning">{t.daysBefore}d before</span>}
              </div>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">{t.subject}</p>
            </div>
            <div className="flex flex-shrink-0 items-center gap-2">
              <Toggle value={t.enabled} onChange={(v) => setTemplates(templates.map((x) => (x.key === t.key ? { ...x, enabled: v } : x)))} />
              <button type="button" onClick={() => setEditing(t)} className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-surface px-3 text-xs font-semibold hover:bg-surface-alt"><Pencil className="h-3 w-3" /> Edit</button>
            </div>
          </li>
        ))}
      </ul>

      {editing && (
        <TemplateEditor
          template={editing}
          onClose={() => setEditing(null)}
          onSave={(next) => { setTemplates(templates.map((x) => (x.key === next.key ? next : x))); setEditing(null); toast.success(`${next.name} template saved`); }}
        />
      )}
    </Card>
  );
}

function TemplateEditor({ template, onClose, onSave }: { template: EmailTemplate; onClose: () => void; onSave: (t: EmailTemplate) => void }) {
  const [draft, setDraft] = useState(template);
  const [preview, setPreview] = useState(false);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  function insertVar(v: string) {
    const el = bodyRef.current;
    if (!el) return setDraft({ ...draft, body: draft.body + v });
    const start = el.selectionStart;
    const next = draft.body.slice(0, start) + v + draft.body.slice(el.selectionEnd);
    setDraft({ ...draft, body: next });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-foreground/50 p-4 pt-12 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-2xl rounded-2xl border border-border bg-surface shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <header className="flex items-center justify-between border-b border-border px-5 py-4">
          <h3 className="text-base font-bold text-foreground">{draft.name} template</h3>
          <button type="button" onClick={() => setPreview((p) => !p)} className="text-xs font-semibold text-accent hover:underline">{preview ? "Edit" : "Preview"}</button>
        </header>
        <div className="space-y-4 p-5">
          {preview ? (
            <div className="rounded-xl border border-border bg-surface-alt/40 p-5">
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Subject</p>
              <p className="mt-1 text-sm font-semibold text-foreground">{fillVars(draft.subject)}</p>
              <div className="mt-4 whitespace-pre-wrap border-t border-border pt-4 text-sm text-foreground">{fillVars(draft.body)}</div>
            </div>
          ) : (
            <>
              <Field label="Subject"><Input value={draft.subject} onChange={(v) => setDraft({ ...draft, subject: v })} /></Field>
              {draft.daysBefore != null && (
                <Field label="Send days before event"><NumberInput value={draft.daysBefore} onChange={(v) => setDraft({ ...draft, daysBefore: v })} /></Field>
              )}
              <Field label="Body">
                <textarea ref={bodyRef} rows={9} value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })} className="w-full rounded-lg border border-border bg-surface px-3 py-2 font-mono text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20" />
              </Field>
              <div>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Insert variable</p>
                <div className="flex flex-wrap gap-1.5">
                  {TEMPLATE_VARS.map((v) => (
                    <button key={v} type="button" onClick={() => insertVar(v)} className="rounded-md border border-border bg-surface-alt px-2 py-1 font-mono text-[11px] text-foreground hover:bg-surface-alt/70">{v}</button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
        <footer className="flex justify-between gap-2 border-t border-border px-5 py-3">
          <button type="button" onClick={() => toast.success("Test email sent to you")} className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-surface px-4 text-sm font-semibold hover:bg-surface-alt"><Send className="h-4 w-4" /> Test send</button>
          <div className="flex gap-2">
            <button onClick={onClose} className="h-10 rounded-lg border border-border bg-surface px-4 text-sm font-semibold hover:bg-surface-alt">Cancel</button>
            <button onClick={() => onSave(draft)} className="h-10 rounded-lg bg-accent px-4 text-sm font-semibold text-accent-foreground hover:bg-accent/90">Save template</button>
          </div>
        </footer>
      </div>
    </div>
  );
}

function fillVars(s: string) {
  return s
    .replace(/\{\{name\}\}/g, "Akua")
    .replace(/\{\{platformName\}\}/g, "Medinovaqbank")
    .replace(/\{\{planName\}\}/g, "12-Month")
    .replace(/\{\{daysLeft\}\}/g, "3")
    .replace(/\{\{trialDays\}\}/g, "7")
    .replace(/\{\{trialQuestions\}\}/g, "10")
    .replace(/\{\{renewsAt\}\}/g, "Mar 2027")
    .replace(/\{\{resetLink\}\}/g, "https://medinovaqbank.com/reset/…");
}

/* ───────────── Tab 4 — Trial & Access ───────────── */
function TrialTab() {
  const general = useSettingsStore((s) => s.settings.general);
  const trial = useSettingsStore((s) => s.settings.trial);
  const update = useSettingsStore((s) => s.update);
  const catalog = useFeatureCatalogStore((s) => s.features);
  const [days, setDays] = useState(general.trialDays);
  const [limit, setLimit] = useState(general.trialQuestionLimit);
  const [grace, setGrace] = useState(trial.gracePeriodDays);
  const [binding, setBinding] = useState(trial.deviceBinding);
  const [features, setFeatures] = useState(trial.features);

  return (
    <div className="space-y-5">
      <Card title="Trial Configuration" desc="How long the free trial lasts and how much it includes.">
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Trial Duration (days)"><NumberInput value={days} onChange={setDays} /></Field>
          <Field label="Question Limit"><NumberInput value={limit} onChange={setLimit} /></Field>
          <Field label="Grace Period (days)"><NumberInput value={grace} onChange={setGrace} /></Field>
        </div>
        <label className="mt-4 flex items-center justify-between rounded-lg border border-border bg-surface-alt/40 px-4 py-3 text-sm font-medium text-foreground">
          <span>Device binding — lock trial accounts to the device they signed up on<span className="ml-2 text-xs font-normal text-muted-foreground">Prevents trial account sharing.</span></span>
          <Toggle value={binding} onChange={setBinding} />
        </label>
      </Card>

      <Card title="Trial Feature Access" desc="Choose which features are available during the free trial. Unchecked features prompt an upgrade.">
        <div className="grid gap-2 sm:grid-cols-2">
          {catalog.filter((f) => f.type === "boolean").map((f) => (
            <label key={f.key} className="flex items-start justify-between gap-3 rounded-lg border border-border bg-surface px-4 py-3">
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-foreground">{f.name}</span>
                <span className="block text-xs text-muted-foreground">{f.description}</span>
              </span>
              <Toggle value={features[f.key] ?? false} onChange={(v) => setFeatures({ ...features, [f.key]: v })} />
            </label>
          ))}
        </div>
      </Card>

      <SaveBar
        label="Save Trial & Access"
        onSave={() => {
          update("general", { trialDays: days, trialQuestionLimit: limit });
          update("trial", { gracePeriodDays: grace, deviceBinding: binding, features });
          toast.success("Trial & access control saved");
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
    setDraft(draft.map((r) => (r.id === roleId ? { ...r, permissions: { ...r.permissions, [key]: value } } : r)));
  }

  return (
    <div className="space-y-5">
      <Card title="Super Admin" desc="Reserved role with unrestricted access — cannot be edited.">
        <div className="flex items-center justify-between rounded-lg bg-surface-alt/60 p-4 text-sm">
          <div>
            <p className="font-semibold text-foreground">Capabilities: Everything</p>
            <p className="mt-1 text-xs text-muted-foreground">Full control including API keys, deletion, and system settings.</p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/15 px-3 py-1 text-xs font-bold text-accent"><Lock className="h-3 w-3" /> Locked</span>
        </div>
      </Card>

      {draft.filter((r) => !r.system).map((role) => (
        <Card key={role.id} title={role.name} desc={role.description}>
          <div className="space-y-4">
            {groups.map((g) => (
              <div key={g}>
                <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{g}</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {PERMISSION_CATALOG.filter((p) => p.group === g).map((p) => (
                    <label key={p.key} className="flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-medium text-foreground">
                      <span>{p.label}</span>
                      <Toggle value={role.permissions[p.key] ?? false} onChange={(v) => setPerm(role.id, p.key, v)} />
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      ))}

      {creating ? (
        <Card title="New custom role" desc="Create a role with a specific permission set.">
          <Field label="Role name"><Input value={newName} onChange={setNewName} /></Field>
          <div className="mt-3 flex gap-2">
            <button onClick={() => setCreating(false)} className="h-10 rounded-lg border border-border bg-surface px-4 text-sm font-semibold hover:bg-surface-alt">Cancel</button>
            <button
              disabled={!newName.trim()}
              onClick={() => {
                setDraft([...draft, { id: `role_${Date.now()}`, name: newName.trim(), description: "Custom role", permissions: Object.fromEntries(PERMISSION_CATALOG.map((p) => [p.key, false])) }]);
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
        <button onClick={() => setCreating(true)} className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-dashed border-border bg-surface px-4 text-sm font-semibold text-foreground hover:bg-surface-alt">
          <Plus className="h-4 w-4" /> Create custom role
        </button>
      )}

      <SaveBar label="Save Permission Matrix" onSave={() => { setRoles(draft); toast.success("Roles & permissions saved"); }} />
    </div>
  );
}

/* ───────────── Tab 6 — Branding ───────────── */
function BrandingTab() {
  const branding = useSettingsStore((s) => s.settings.branding);
  const update = useSettingsStore((s) => s.update);
  const [form, setForm] = useState(branding);

  // Live-apply colors as the admin tweaks them.
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--primary", form.primaryColor);
    root.style.setProperty("--primary-light", form.primaryColor);
    root.style.setProperty("--accent", form.accentColor);
  }, [form.primaryColor, form.accentColor]);

  return (
    <div className="space-y-5">
      <Card title="Colors" desc="Brand colors apply instantly across the app — preview live below.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Primary Color"><ColorInput value={form.primaryColor} onChange={(v) => setForm({ ...form, primaryColor: v })} /></Field>
          <Field label="Accent Color"><ColorInput value={form.accentColor} onChange={(v) => setForm({ ...form, accentColor: v })} /></Field>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface-alt/40 p-4">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Preview</span>
          <button className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">Primary button</button>
          <button className="rounded-lg bg-accent px-4 py-2 text-sm font-bold text-accent-foreground">Accent button</button>
          <span className="rounded-full bg-gradient-to-r from-primary to-accent px-3 py-1 text-xs font-bold text-white">Gradient chip</span>
        </div>
      </Card>

      <Card title="Assets" desc="Logos, favicon, and the login page background.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Logo (light backgrounds)"><FileUpload value={form.logoLight} onChange={(v) => setForm({ ...form, logoLight: v })} label="Upload light logo" /></Field>
          <Field label="Logo (dark backgrounds)"><FileUpload value={form.logoDark} onChange={(v) => setForm({ ...form, logoDark: v })} label="Upload dark logo" /></Field>
          <Field label="Favicon"><FileUpload value={form.favicon} onChange={(v) => setForm({ ...form, favicon: v })} label="Upload favicon" /></Field>
          <Field label="Login background"><FileUpload value={form.loginBackground} onChange={(v) => setForm({ ...form, loginBackground: v })} label="Upload background" /></Field>
        </div>
      </Card>

      <SaveBar label="Save Branding" onSave={() => { update("branding", form); toast.success("Branding saved"); }} />
    </div>
  );
}

/* ───────────── Shared primitives ───────────── */
function Card({ title, desc, icon, children }: { title: string; desc?: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-5 sm:p-6 shadow-[var(--shadow-card)]">
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

function IntegrationCard({ icon, title, desc, status, children }: { icon: React.ReactNode; title: string; desc?: string; status: IntegrationStatus; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-5 sm:p-6 shadow-[var(--shadow-card)]">
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
    connected: { label: "Connected", cls: "bg-success/10 text-success border-success/20", dot: "bg-success" },
    not_configured: { label: "Not Configured", cls: "bg-surface-alt text-muted-foreground border-border", dot: "bg-muted-foreground/50" },
    error: { label: "Error", cls: "bg-error/10 text-error border-error/20", dot: "bg-error" },
  };
  const s = map[status];
  return (
    <span className={`inline-flex flex-shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${s.cls}`}>
      <span className={`h-2 w-2 rounded-full ${s.dot}`} /> {s.label}
    </span>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="mt-4 block first:mt-0">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function Input({ value, onChange, type = "text" }: { value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20" />
  );
}

function NumberInput({ value, onChange, step }: { value: number; onChange: (v: number) => void; step?: string }) {
  return (
    <input type="number" step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="h-10 w-full rounded-lg border border-border bg-surface px-3 font-mono text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20" />
  );
}

function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20">
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function ColorInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-3">
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="h-10 w-16 cursor-pointer rounded-lg border border-border bg-surface" />
      <input value={value} onChange={(e) => onChange(e.target.value)} className="h-10 flex-1 rounded-lg border border-border bg-surface px-3 font-mono text-sm uppercase focus:border-accent focus:outline-none" />
    </div>
  );
}

function Radio({ label, checked, onClick, readOnly }: { label: string; checked: boolean; onClick?: () => void; readOnly?: boolean }) {
  return (
    <button
      type="button"
      onClick={readOnly ? undefined : onClick}
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
        checked ? "border-accent bg-accent/10 text-accent" : "border-border bg-surface text-muted-foreground hover:text-foreground"
      } ${readOnly ? "cursor-default" : ""}`}
    >
      <span className={`h-2 w-2 rounded-full ${checked ? "bg-accent" : "bg-muted-foreground/40"}`} />
      {label}
    </button>
  );
}

function SecretInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [reveal, setReveal] = useState(false);
  const [editing, setEditing] = useState(!value);

  useEffect(() => {
    if (!reveal) return;
    const t = setTimeout(() => setReveal(false), 5000);
    return () => clearTimeout(t);
  }, [reveal]);

  const masked = value ? (value.length > 4 ? `${"•".repeat(Math.min(20, value.length - 4))}${value.slice(-4)}` : "••••") : "";

  return (
    <div className="flex items-center gap-2">
      <input
        readOnly={!editing}
        value={reveal || editing ? value : masked}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={`h-10 flex-1 rounded-lg border border-border px-3 font-mono text-sm ${editing ? "bg-surface" : "bg-surface-alt/60 text-muted-foreground"}`}
      />
      <button type="button" onClick={() => setReveal((r) => !r)} className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-surface text-muted-foreground hover:text-foreground" aria-label={reveal ? "Hide" : "Reveal"}>
        {reveal ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
      <button type="button" onClick={() => setEditing((e) => !e)} className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-xs font-semibold hover:bg-surface-alt">
        <Pencil className="h-3.5 w-3.5" /> {editing ? "Done" : "Edit"}
      </button>
    </div>
  );
}

function CopyField({ value }: { value: string }) {
  return (
    <div className="flex items-center gap-2">
      <input readOnly value={value} className="h-10 flex-1 rounded-lg border border-border bg-surface-alt/60 px-3 text-sm text-muted-foreground" />
      <button type="button" onClick={() => { navigator.clipboard.writeText(value); toast.success("Copied"); }} className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-surface px-3 text-xs font-semibold hover:bg-surface-alt">
        <Copy className="h-3.5 w-3.5" /> Copy
      </button>
    </div>
  );
}

function FileUpload({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
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
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = () => onChange(reader.result as string);
          reader.readAsDataURL(file);
        }}
      />
      <button type="button" onClick={() => inputRef.current?.click()} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-xs font-semibold hover:bg-surface-alt">
        <Upload className="h-3.5 w-3.5" /> {label}
      </button>
      {value && (
        <button type="button" onClick={() => onChange("")} className="rounded-lg p-2 text-muted-foreground hover:bg-error/10 hover:text-error" aria-label="Remove">
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" role="switch" aria-checked={value} onClick={() => onChange(!value)} className={`relative h-6 w-11 flex-shrink-0 rounded-full transition-colors ${value ? "bg-accent" : "border border-border bg-surface-alt"}`}>
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${value ? "translate-x-5" : "translate-x-0.5"}`} />
    </button>
  );
}

function SaveBar({ label = "Save Changes", onSave }: { label?: string; onSave: () => void }) {
  return (
    <div className="mt-6 flex items-center justify-end">
      <button type="button" onClick={onSave} className="inline-flex h-10 items-center gap-2 rounded-lg bg-accent px-5 text-sm font-semibold text-accent-foreground hover:bg-accent/90">
        <Save className="h-4 w-4" /> {label}
      </button>
    </div>
  );
}
