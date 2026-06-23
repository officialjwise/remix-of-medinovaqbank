import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Copy,
  Eye,
  EyeOff,
  KeyRound,
  Mail,
  Pencil,
  Save,
  Send,
  ShieldCheck,
  Sliders,
  Sparkles,
  Tag,
  TestTube2,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/settings/system")({
  head: () => ({ meta: [{ title: "Admin · Settings — Medinovaqbank" }, { name: "robots", content: "noindex" }] }),
  component: AdminSettings,
});

type TabKey = "general" | "keys" | "email" | "plans" | "roles";

const TABS: { key: TabKey; label: string; icon: typeof Sliders }[] = [
  { key: "general", label: "General", icon: Sliders },
  { key: "keys", label: "API Keys", icon: KeyRound },
  { key: "email", label: "Email & Notifications", icon: Mail },
  { key: "plans", label: "Pricing Plans", icon: Tag },
  { key: "roles", label: "Roles & Permissions", icon: ShieldCheck },
];

function AdminSettings() {
  const [tab, setTab] = useState<TabKey>("general");

  return (
    <div>
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">System Settings</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Platform configuration, integration keys, email, pricing, and admin permissions.
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

      <div className="mt-6">
        {tab === "general" && <GeneralTab />}
        {tab === "keys" && <KeysTab />}
        {tab === "email" && <EmailTab />}
        {tab === "plans" && <PlansTab />}
        {tab === "roles" && <RolesTab />}
      </div>
    </div>
  );
}

/* ───────────── Tab 1 — General ───────────── */
function GeneralTab() {
  const [form, setForm] = useState({
    platformName: "Medinovaqbank",
    tagline: "Master Medicine. Pass with Confidence.",
    supportEmail: "support@medinovaqbank.com",
    trialLimit: 10,
    maxSession: 100,
    maintenance: false,
  });
  return (
    <Card title="General Settings" desc="Branding, support contact, and quiz session limits.">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Platform Name">
          <Input value={form.platformName} onChange={(v) => setForm({ ...form, platformName: v })} />
        </Field>
        <Field label="Tagline">
          <Input value={form.tagline} onChange={(v) => setForm({ ...form, tagline: v })} />
        </Field>
        <Field label="Support Email">
          <Input value={form.supportEmail} onChange={(v) => setForm({ ...form, supportEmail: v })} />
        </Field>
        <Field label="Free Trial Limit (questions)">
          <Input type="number" value={String(form.trialLimit)} onChange={(v) => setForm({ ...form, trialLimit: Number(v) })} />
        </Field>
        <Field label="Max Session Size (questions)">
          <Input type="number" value={String(form.maxSession)} onChange={(v) => setForm({ ...form, maxSession: Number(v) })} />
        </Field>
        <div className="flex items-end">
          <label className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Toggle value={form.maintenance} onChange={(v) => setForm({ ...form, maintenance: v })} /> Maintenance mode
          </label>
        </div>
      </div>
      <SaveBar onSave={() => toast.success("General settings saved")} />
    </Card>
  );
}

/* ───────────── Tab 2 — API Keys ───────────── */
function KeysTab() {
  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border bg-surface-alt p-4 text-sm text-muted-foreground">
        These keys power the explanation engine and payment processing. Keys are encrypted at rest and never exposed to end users.
      </div>

      {/* Explanation engine */}
      <Card
        icon={<Sparkles className="h-5 w-5 text-accent" />}
        title="Explanation Engine"
        desc="Provider used to generate clinical breakdowns for quiz questions."
      >
        <div className="flex flex-wrap gap-2">
          {(["Google AI", "OpenAI", "Anthropic"] as const).map((p, i) => (
            <Radio key={p} label={p} checked={i === 0} />
          ))}
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-[1fr_220px]">
          <Field label="API Key">
            <SecretInput initial="AIzaSyA0bC9d2eFgH1JkLmNoPqRsTu" suffix="api-key" />
          </Field>
          <Field label="Model">
            <Select value="gemini-1.5-flash" options={["gemini-1.5-flash", "gemini-1.5-pro", "gemini-2.0-pro"]} />
          </Field>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-surface-alt p-3">
          <div className="text-xs text-muted-foreground">
            <span className="font-semibold text-success">● Connected</span> · Last tested 2h ago · 12,841 calls this month · ≈ $8.50
          </div>
          <button
            type="button"
            onClick={() => toast.success("Connection test passed")}
            className="inline-flex h-8 items-center gap-2 rounded-md border border-border bg-surface px-3 text-xs font-semibold text-foreground hover:bg-surface-alt"
          >
            <TestTube2 className="h-3.5 w-3.5" /> Test Connection
          </button>
        </div>
      </Card>

      {/* Payments */}
      <Card icon={<Wallet className="h-5 w-5 text-accent" />} title="Payment Gateway" desc="Card processor for subscription billing.">
        <div className="flex flex-wrap gap-2">
          {(["Paystack", "Stripe"] as const).map((p, i) => (
            <Radio key={p} label={p} checked={i === 0} />
          ))}
        </div>
        <div className="mt-5 grid gap-4">
          <Field label="Public Key"><SecretInput initial="pk_test_4eC39HqLyjWDarjtT1zdp7dc" suffix="public" /></Field>
          <Field label="Secret Key"><SecretInput initial="sk_test_BQokikJOvBiI2HlWgH4olfQ2" suffix="secret" /></Field>
          <Field label="Webhook Secret"><SecretInput initial="whsec_8eGq6Z4n3R8u2vXc1tH7" suffix="webhook" /></Field>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-surface-alt p-3">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Mode</span>
            <Radio label="Test" checked={false} />
            <Radio label="Live" checked />
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => toast.success("Webhook test sent")} className="inline-flex h-8 items-center gap-2 rounded-md border border-border bg-surface px-3 text-xs font-semibold hover:bg-surface-alt">
              <TestTube2 className="h-3.5 w-3.5" /> Test Webhook
            </button>
            <button type="button" onClick={() => toast.success("Test charge succeeded")} className="inline-flex h-8 items-center gap-2 rounded-md border border-border bg-surface px-3 text-xs font-semibold hover:bg-surface-alt">
              <Wallet className="h-3.5 w-3.5" /> Test Payment
            </button>
          </div>
        </div>
      </Card>

      {/* Google OAuth */}
      <Card icon={<KeyRound className="h-5 w-5 text-accent" />} title="Google OAuth" desc="Credentials for Sign in with Google.">
        <div className="grid gap-4">
          <Field label="Client ID"><SecretInput initial="734221890123-abcdef.apps.googleusercontent.com" suffix="oauth-id" /></Field>
          <Field label="Client Secret"><SecretInput initial="GOCSPX-AbC1d2EfG3hI4jK5lM" suffix="oauth-secret" /></Field>
          <Field label="Callback URL">
            <div className="flex items-center gap-2">
              <input
                readOnly
                value="https://api.medinovaqbank.com/auth/google/callback"
                className="h-10 flex-1 rounded-lg border border-border bg-surface-alt px-3 text-sm text-muted-foreground"
              />
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText("https://api.medinovaqbank.com/auth/google/callback");
                  toast.success("Copied callback URL");
                }}
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-surface px-3 text-xs font-semibold hover:bg-surface-alt"
              >
                <Copy className="h-3.5 w-3.5" /> Copy
              </button>
            </div>
          </Field>
        </div>
      </Card>

      <SaveBar label="Save All Keys" onSave={() => toast.success("API keys saved")} />
    </div>
  );
}

/* ───────────── Tab 3 — Email ───────────── */
function EmailTab() {
  const [form, setForm] = useState({
    host: "smtp.sendgrid.net",
    port: "587",
    user: "apikey",
    pass: "SG.•••••••••••••••••",
    from: "noreply@medinovaqbank.com",
  });
  const templates = [
    "Welcome Email",
    "Subscription Confirmation",
    "Subscription Expiring (7 days)",
    "Payment Failed",
  ];
  return (
    <div className="space-y-5">
      <Card title="SMTP Configuration" desc="Outbound email server used for transactional notifications.">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Host"><Input value={form.host} onChange={(v) => setForm({ ...form, host: v })} /></Field>
          <Field label="Port"><Input value={form.port} onChange={(v) => setForm({ ...form, port: v })} /></Field>
          <Field label="Username"><Input value={form.user} onChange={(v) => setForm({ ...form, user: v })} /></Field>
          <Field label="Password"><Input value={form.pass} onChange={(v) => setForm({ ...form, pass: v })} type="password" /></Field>
          <Field label="From Email"><Input value={form.from} onChange={(v) => setForm({ ...form, from: v })} /></Field>
        </div>
        <div className="mt-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => toast.success("Test email queued")}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-surface px-3 text-xs font-semibold hover:bg-surface-alt"
          >
            <Send className="h-3.5 w-3.5" /> Send Test Email
          </button>
          <button
            type="button"
            onClick={() => toast.success("SMTP settings saved")}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-accent px-5 text-sm font-semibold text-accent-foreground hover:bg-accent/90"
          >
            <Save className="h-4 w-4" /> Save Changes
          </button>
        </div>
      </Card>

      <Card title="Email Templates" desc="Edit transactional message copy. Tokens like {{name}} are supported.">
        <ul className="divide-y divide-border rounded-lg border border-border bg-surface">
          {templates.map((t) => (
            <li key={t} className="flex items-center justify-between px-4 py-3">
              <span className="text-sm font-medium text-foreground">{t}</span>
              <button
                type="button"
                onClick={() => toast.message("Template editor coming online")}
                className="text-xs font-semibold text-accent hover:underline"
              >
                Edit →
              </button>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

/* ───────────── Tab 4 — Plans ───────────── */
type Plan = { id: string; label: string; days: number; price: number; badge: string | null; active: boolean };

function PlansTab() {
  const [plans, setPlans] = useState<Plan[]>([
    { id: "trial", label: "Free Trial", days: 7, price: 0, badge: null, active: true },
    { id: "monthly", label: "Monthly", days: 30, price: 129, badge: null, active: true },
    { id: "quarterly", label: "3-Month", days: 90, price: 299, badge: "Most Popular", active: true },
    { id: "annual", label: "Annual", days: 365, price: 999, badge: "Best Value", active: true },
  ]);
  const [editing, setEditing] = useState<Plan | null>(null);

  return (
    <Card title="Pricing Plans" desc="Subscription tiers displayed on the pricing page.">
      <div className="overflow-hidden rounded-xl border border-border">
        <table className="min-w-full divide-y divide-border text-sm">
          <thead className="bg-surface-alt text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left">Plan</th>
              <th className="px-4 py-3 text-left">Label</th>
              <th className="px-4 py-3 text-left">Duration</th>
              <th className="px-4 py-3 text-left">Price (GHS)</th>
              <th className="px-4 py-3 text-left">Badge</th>
              <th className="px-4 py-3 text-left">Active</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-surface">
            {plans.map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{p.id}</td>
                <td className="px-4 py-3 font-semibold text-foreground">{p.label}</td>
                <td className="px-4 py-3">{p.days} days</td>
                <td className="px-4 py-3 tabular-nums">{p.price.toLocaleString()}</td>
                <td className="px-4 py-3">
                  {p.badge ? (
                    <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs font-bold text-accent">{p.badge}</span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <Toggle
                    value={p.active}
                    onChange={(v) => setPlans(plans.map((q) => (q.id === p.id ? { ...q, active: v } : q)))}
                  />
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => setEditing(p)}
                    className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-surface px-3 text-xs font-semibold hover:bg-surface-alt"
                  >
                    <Pencil className="h-3 w-3" /> Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <EditPlanModal
          plan={editing}
          onClose={() => setEditing(null)}
          onSave={(next) => {
            setPlans(plans.map((p) => (p.id === next.id ? next : p)));
            setEditing(null);
            toast.success(`${next.label} updated`);
          }}
        />
      )}
    </Card>
  );
}

function EditPlanModal({ plan, onClose, onSave }: { plan: Plan; onClose: () => void; onSave: (p: Plan) => void }) {
  const [draft, setDraft] = useState(plan);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-surface p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold tracking-tight text-foreground">Edit {plan.label}</h3>
        <div className="mt-4 space-y-3">
          <Field label="Label"><Input value={draft.label} onChange={(v) => setDraft({ ...draft, label: v })} /></Field>
          <Field label="Duration (days)"><Input type="number" value={String(draft.days)} onChange={(v) => setDraft({ ...draft, days: Number(v) })} /></Field>
          <Field label="Price (GHS)"><Input type="number" value={String(draft.price)} onChange={(v) => setDraft({ ...draft, price: Number(v) })} /></Field>
          <Field label="Badge (optional)"><Input value={draft.badge ?? ""} onChange={(v) => setDraft({ ...draft, badge: v || null })} /></Field>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-semibold text-muted-foreground hover:bg-surface-alt">Cancel</button>
          <button onClick={() => onSave(draft)} className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent/90">Save Plan</button>
        </div>
      </div>
    </div>
  );
}

/* ───────────── Tab 5 — Roles ───────────── */
function RolesTab() {
  const [perms, setPerms] = useState({
    manageUsers: true,
    viewAnalytics: true,
    manageContent: true,
    manageSubscriptions: true,
    viewRevenue: true,
    changePricing: false,
    changeApiKeys: false,
    deleteUsers: false,
  });
  const permList: [keyof typeof perms, string][] = [
    ["manageUsers", "Manage Users"],
    ["viewAnalytics", "View Analytics"],
    ["manageContent", "Manage Content"],
    ["manageSubscriptions", "Manage Subscriptions"],
    ["viewRevenue", "View Revenue"],
    ["changePricing", "Change Pricing Plans"],
    ["changeApiKeys", "Change API Keys"],
    ["deleteUsers", "Delete Users"],
  ];
  return (
    <div className="space-y-5">
      <Card title="SUPER_ADMIN" desc="Reserved role with unrestricted access.">
        <div className="flex items-center justify-between rounded-lg bg-surface-alt p-4 text-sm">
          <div>
            <p className="font-semibold text-foreground">Capabilities: Everything</p>
            <p className="mt-1 text-xs text-muted-foreground">Cannot be edited here — contact your system provider.</p>
          </div>
          <span className="rounded-full bg-accent/15 px-3 py-1 text-xs font-bold text-accent">Locked</span>
        </div>
      </Card>

      <Card title="ADMIN" desc="Standard admin role. Toggle individual permissions below.">
        <div className="grid gap-2 sm:grid-cols-2">
          {permList.map(([k, label]) => (
            <label key={k} className="flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-3 text-sm font-medium text-foreground">
              <span>{label}</span>
              <Toggle value={perms[k]} onChange={(v) => setPerms({ ...perms, [k]: v })} />
            </label>
          ))}
        </div>
        <SaveBar label="Save Permission Config" onSave={() => toast.success("Permissions updated")} />
      </Card>
    </div>
  );
}

/* ───────────── Shared primitives ───────────── */
function Card({ title, desc, icon, children }: { title: string; desc?: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
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

function Select({ value, options }: { value: string; options: string[] }) {
  const [v, setV] = useState(value);
  return (
    <select
      value={v}
      onChange={(e) => setV(e.target.value)}
      className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
    >
      {options.map((o) => <option key={o}>{o}</option>)}
    </select>
  );
}

function Radio({ label, checked }: { label: string; checked: boolean }) {
  const [c, setC] = useState(checked);
  return (
    <button
      type="button"
      onClick={() => setC(!c)}
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
        c ? "border-accent bg-accent/10 text-accent" : "border-border bg-surface text-muted-foreground hover:text-foreground"
      }`}
    >
      <span className={`h-2 w-2 rounded-full ${c ? "bg-accent" : "bg-muted-foreground/40"}`} />
      {label}
    </button>
  );
}

function SecretInput({ initial, suffix }: { initial: string; suffix: string }) {
  const [value, setValue] = useState(initial);
  const [reveal, setReveal] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!reveal) return;
    const t = setTimeout(() => setReveal(false), 5000);
    return () => clearTimeout(t);
  }, [reveal]);

  const masked = value.length > 6 ? `${"•".repeat(Math.max(0, value.length - 6))}${value.slice(-6)}` : "••••••";

  return (
    <div className="flex items-center gap-2" data-secret={suffix}>
      <input
        readOnly={!editing}
        value={reveal || editing ? value : masked}
        onChange={(e) => setValue(e.target.value)}
        className={`h-10 flex-1 rounded-lg border border-border px-3 text-sm font-mono ${editing ? "bg-surface" : "bg-surface-alt text-muted-foreground"}`}
      />
      <button
        type="button"
        onClick={() => setReveal((r) => !r)}
        className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-surface text-muted-foreground hover:text-foreground"
        aria-label={reveal ? "Hide" : "Reveal"}
      >
        {reveal ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
      <button
        type="button"
        onClick={() => {
          if (editing) toast.success("Key updated");
          setEditing((e) => !e);
        }}
        className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-xs font-semibold hover:bg-surface-alt"
      >
        <Pencil className="h-3.5 w-3.5" /> {editing ? "Done" : "Edit"}
      </button>
    </div>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      className={`relative h-6 w-11 rounded-full transition-colors ${value ? "bg-accent" : "bg-surface-alt border border-border"}`}
    >
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${value ? "translate-x-5" : "translate-x-0.5"}`} />
    </button>
  );
}

function SaveBar({ label = "Save Changes", onSave }: { label?: string; onSave: () => void }) {
  return (
    <div className="mt-6 flex items-center justify-end">
      <button
        type="button"
        onClick={onSave}
        className="inline-flex h-10 items-center gap-2 rounded-lg bg-accent px-5 text-sm font-semibold text-accent-foreground hover:bg-accent/90"
      >
        <Save className="h-4 w-4" /> {label}
      </button>
    </div>
  );
}
