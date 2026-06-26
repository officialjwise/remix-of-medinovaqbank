import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  BadgeCheck,
  CalendarDays,
  Database,
  KeyRound,
  Lock,
  Mail,
  Save,
  Settings2,
  Shield,
  ShieldCheck,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/authStore";
import { deviceLabel } from "@/lib/trial";
import { AvatarUploader } from "@/components/shared/AvatarUploader";
import { ToggleSwitch } from "@/components/ui/toggle-switch";

export const Route = createFileRoute("/admin/profile")({
  head: () => ({
    meta: [{ title: "Admin · Profile — Medinovaqbank" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminProfilePage,
});

const INPUT =
  "h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-foreground transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20";

const PERMISSIONS = [
  { icon: Users, label: "User management", desc: "Create, suspend and manage all accounts" },
  { icon: Database, label: "Question banks", desc: "Publish, edit and retire question banks" },
  { icon: Settings2, label: "System settings", desc: "Trial policy, pricing and platform config" },
  { icon: Shield, label: "Security & sessions", desc: "Audit logs, device bindings and access" },
];

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "A";
  return parts
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("");
}

function AdminProfilePage() {
  const { user, setUser } = useAuthStore();

  const [name, setName] = useState(user?.name ?? "Administrator");
  const email = user?.email ?? "admin@medinovaqbank.com";
  const role = user?.role ?? "SUPER_ADMIN";

  const [twoFA, setTwoFA] = useState(true);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");

  const initials = initialsOf(name);
  const device = deviceLabel();
  const joined = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-GB", { year: "numeric", month: "long" })
    : "—";

  function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      toast.success("Profile saved");
      return;
    }
    setUser({ ...user, name: name.trim() || user.name });
    toast.success("Profile saved");
  }

  function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!current || !next || !confirm) {
      toast.error("Fill in all password fields");
      return;
    }
    if (next.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }
    if (next === current) {
      toast.error("New password must differ from the current one");
      return;
    }
    if (next !== confirm) {
      toast.error("New password and confirmation don't match");
      return;
    }
    setCurrent("");
    setNext("");
    setConfirm("");
    toast.success("Password updated");
  }

  return (
    <div className="mx-auto max-w-5xl pb-4">
      {/* ---- Hero ---- */}
      <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-[var(--shadow-card)]">
        <div className="relative h-32 bg-gradient-to-r from-primary to-accent sm:h-36">
          <div
            aria-hidden
            className="absolute -right-10 -top-12 h-44 w-44 rounded-full bg-white/10 blur-2xl"
          />
          <div
            aria-hidden
            className="absolute -bottom-16 left-1/3 h-44 w-44 rounded-full bg-white/10 blur-2xl"
          />
        </div>
        <div className="px-6 pb-6">
          <div className="-mt-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-6">
            <div className="shrink-0">
              <div className="rounded-[1.25rem] bg-surface p-1 shadow-[var(--shadow-card)]">
                <AvatarUploader
                  value={user?.avatarUrl}
                  initials={initials}
                  size={104}
                  onSave={(dataUrl) => user && setUser({ ...user, avatarUrl: dataUrl })}
                  onRemove={() => user && setUser({ ...user, avatarUrl: undefined })}
                />
              </div>
            </div>
            <div className="min-w-0 flex-1 sm:pb-1">
              <h1 className="truncate text-2xl font-bold tracking-tight text-foreground">{name}</h1>
              <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                <Mail className="h-3.5 w-3.5" /> {email}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
                  <Shield className="h-3.5 w-3.5" /> {role}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-alt px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                  <CalendarDays className="h-3.5 w-3.5" /> Member since {joined}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-xs font-bold text-success">
                  <BadgeCheck className="h-3.5 w-3.5" /> Verified admin
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Personal info */}
          <Card title="Profile details" desc="Your administrator identity within the platform.">
            <form onSubmit={handleSaveProfile} className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Field label="Full name">
                <input value={name} onChange={(e) => setName(e.target.value)} className={INPUT} />
              </Field>
              <Field label="Email (read-only)">
                <input
                  value={email}
                  disabled
                  className="h-10 w-full cursor-not-allowed rounded-lg border border-border bg-surface-alt px-3 text-sm text-muted-foreground"
                />
              </Field>
              <div className="flex justify-end sm:col-span-2">
                <button
                  type="submit"
                  className="inline-flex h-10 items-center gap-2 rounded-lg bg-accent px-5 text-sm font-semibold text-accent-foreground transition hover:bg-accent/90"
                >
                  <Save className="h-4 w-4" /> Save changes
                </button>
              </div>
            </form>
          </Card>

          {/* Change password */}
          <Card
            title="Change password"
            desc="Update the password used to access the admin console."
          >
            <form onSubmit={handleChangePassword} className="space-y-5">
              <Field label="Current password">
                <input
                  type="password"
                  value={current}
                  onChange={(e) => setCurrent(e.target.value)}
                  autoComplete="current-password"
                  className={INPUT}
                  placeholder="••••••••"
                />
              </Field>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <Field label="New password">
                  <input
                    type="password"
                    value={next}
                    onChange={(e) => setNext(e.target.value)}
                    autoComplete="new-password"
                    className={INPUT}
                    placeholder="At least 8 characters"
                  />
                </Field>
                <Field label="Confirm new password">
                  <input
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    autoComplete="new-password"
                    className={INPUT}
                    placeholder="Re-enter new password"
                  />
                </Field>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="inline-flex h-10 items-center gap-2 rounded-lg bg-accent px-5 text-sm font-semibold text-accent-foreground transition hover:bg-accent/90"
                >
                  <KeyRound className="h-4 w-4" /> Update password
                </button>
              </div>
            </form>
          </Card>

          {/* Permissions */}
          <Card
            title="Role & permissions"
            desc="What this administrator account is authorised to do."
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {PERMISSIONS.map((p) => (
                <div
                  key={p.label}
                  className="flex items-start gap-3 rounded-xl border border-border bg-surface-alt/40 p-4"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <p.icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-foreground">{p.label}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{p.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Account */}
          <Card title="Account" desc="Read-only account summary.">
            <dl className="space-y-3">
              <Row label="Email">
                <span className="inline-flex items-center gap-1.5 text-foreground">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" /> {email}
                </span>
              </Row>
              <Row label="Role">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
                  <Shield className="h-3 w-3" /> {role}
                </span>
              </Row>
              <Row label="Access">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-bold text-success">
                  Full console
                </span>
              </Row>
              <Row label="Member since">
                <span className="text-foreground">{joined}</span>
              </Row>
            </dl>
          </Card>

          {/* Security */}
          <Card title="Security" desc="Protection on this session.">
            <div className="space-y-3">
              <div className="flex items-start gap-3 rounded-xl border border-border bg-surface-alt/40 p-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Lock className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-foreground">Device binding</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Signed in on <span className="font-semibold text-foreground">{device}</span>.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 rounded-xl border border-border p-4">
                <div className="min-w-0">
                  <p className="inline-flex items-center gap-1.5 text-sm font-bold text-foreground">
                    <ShieldCheck className="h-4 w-4 text-success" /> Two-factor authentication
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Required for all admin accounts.
                  </p>
                </div>
                <ToggleSwitch
                  checked={twoFA}
                  ariaLabel="Two-factor authentication"
                  onChange={(nextVal) => {
                    setTwoFA(nextVal);
                    toast.success(nextVal ? "Two-factor enabled" : "Two-factor disabled");
                  }}
                />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Card({
  title,
  desc,
  children,
}: {
  title: string;
  desc?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-6 shadow-[var(--shadow-card)]">
      <div className="mb-5">
        <h2 className="text-lg font-bold tracking-tight text-foreground">{title}</h2>
        {desc && <p className="mt-0.5 text-sm text-muted-foreground">{desc}</p>}
      </div>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{children}</dd>
    </div>
  );
}
