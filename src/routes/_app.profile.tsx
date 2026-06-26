import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowUpRight,
  Award,
  BadgeCheck,
  Brain,
  Briefcase,
  Building2,
  CalendarDays,
  CreditCard,
  GraduationCap,
  LineChart,
  Mail,
  MapPin,
  Monitor,
  Save,
  ShieldCheck,
  Target,
  Trophy,
  User as UserIcon,
} from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/authStore";
import { useTrial } from "@/hooks/useTrial";
import { recentSessions } from "@/data/banks";
import { deviceLabel } from "@/lib/trial";
import { AvatarUploader } from "@/components/shared/AvatarUploader";
import { GradientKpiCard } from "@/components/shared/GradientKpiCard";

export const Route = createFileRoute("/_app/profile")({
  head: () => ({
    meta: [{ title: "Profile — Medinovaqbank" }, { name: "robots", content: "noindex" }],
  }),
  component: ProfilePage,
});

const SPECIALTIES = [
  "General Practice",
  "Surgery",
  "Cardiology",
  "Neurology",
  "Pharmacology",
  "Pathology",
  "Radiology",
  "Obstetrics & Gynaecology",
  "Paediatrics",
  "Psychiatry",
  "Internal Medicine",
  "Other",
] as const;

const COUNTRIES = [
  "Ghana",
  "Nigeria",
  "Kenya",
  "South Africa",
  "United Kingdom",
  "United States",
  "Other",
] as const;

const INPUT =
  "h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-foreground transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20";

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  return parts
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("");
}

function ProfilePage() {
  const { user, subscription, setUser } = useAuthStore();
  const trial = useTrial();

  const [name, setName] = useState(user?.name ?? "");
  const [specialty, setSpecialty] = useState(user?.specialty ?? "General Practice");
  const [institution, setInstitution] = useState("Korle-Bu Teaching Hospital");
  const [country, setCountry] = useState("Ghana");

  // Derived stats from mock sessions
  const totalSessions = recentSessions.length;
  const totalQuestions = recentSessions.reduce((acc, s) => acc + s.questionsAnswered, 0);
  const finished = recentSessions.filter((s) => !s.inProgress);
  const avgScore = Math.round(
    finished.reduce((acc, s) => acc + s.scorePct, 0) / Math.max(1, finished.length),
  );

  const initials = initialsOf(name || user?.name || "U");
  const joined = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-GB", { year: "numeric", month: "long" })
    : "—";
  const device = subscription?.boundDevice ?? deviceLabel();

  const statusLabel =
    subscription?.status === "ACTIVE"
      ? "Active subscription"
      : subscription?.status === "TRIAL"
        ? "Free trial"
        : subscription?.status === "EXPIRED"
          ? "Expired"
          : "No subscription";

  function handlePersonalSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setUser({ ...user, name: name.trim() || user.name });
    toast.success("Personal information updated");
  }

  function handleProfessionalSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setUser({ ...user, specialty });
    toast.success("Professional details saved");
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-5xl">
        <div className="rounded-2xl border border-border bg-surface p-10 text-center shadow-[var(--shadow-card)]">
          <p className="text-sm text-muted-foreground">Sign in to view your profile.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl pb-4">
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
                  value={user.avatarUrl}
                  initials={initials}
                  size={104}
                  onSave={(dataUrl) => setUser({ ...user, avatarUrl: dataUrl })}
                  onRemove={() => setUser({ ...user, avatarUrl: undefined })}
                />
              </div>
            </div>
            <div className="min-w-0 flex-1 sm:pb-1">
              <h1 className="truncate text-2xl font-bold tracking-tight text-foreground">
                {user.name}
              </h1>
              <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                <Mail className="h-3.5 w-3.5" /> {user.email}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {user.specialty && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                    <GraduationCap className="h-3.5 w-3.5" /> {user.specialty}
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-alt px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                  <CalendarDays className="h-3.5 w-3.5" /> Member since {joined}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-alt px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" /> {country}
                </span>
                {subscription?.status === "ACTIVE" ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-xs font-bold text-success">
                    <BadgeCheck className="h-3.5 w-3.5" /> Active
                  </span>
                ) : subscription?.status === "TRIAL" ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-warning/10 px-2.5 py-1 text-xs font-bold text-warning">
                    <ShieldCheck className="h-3.5 w-3.5" /> Free Trial
                  </span>
                ) : null}
              </div>
            </div>
            <div className="flex flex-wrap gap-2 sm:pb-1">
              <Link
                to="/analytics"
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-surface px-4 text-sm font-semibold text-foreground transition hover:bg-surface-alt"
              >
                <LineChart className="h-4 w-4 text-accent" /> Analytics
              </Link>
              <Link
                to="/subscription"
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-accent px-4 text-sm font-semibold text-accent-foreground transition hover:bg-accent/90"
              >
                <CreditCard className="h-4 w-4" /> Subscription
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ---- Stats strip ---- */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <GradientKpiCard
          label="Sessions"
          value={totalSessions.toString()}
          icon={Trophy}
          gradient="navy"
          sub="practice sessions"
        />
        <GradientKpiCard
          label="Avg Score"
          value={`${avgScore}%`}
          icon={Target}
          gradient="teal"
          sub="across completed quizzes"
        />
        <GradientKpiCard
          label="National Rank"
          value="#128"
          icon={Award}
          gradient="emerald"
          sub="top 12% of practitioners"
        />
        <GradientKpiCard
          label="Questions Answered"
          value={totalQuestions.toLocaleString()}
          icon={Brain}
          gradient="violet"
          sub="lifetime total"
        />
      </div>

      {/* ---- Two-column body ---- */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left column (forms) */}
        <div className="space-y-6 lg:col-span-2">
          {/* Personal info */}
          <Card
            title="Personal Information"
            desc="Your name and how you appear across Medinovaqbank."
          >
            <form onSubmit={handlePersonalSave} className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Field label="Full Name" icon={<UserIcon className="h-4 w-4" />}>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={INPUT}
                  placeholder="Your full name"
                />
              </Field>
              <Field label="Country" icon={<MapPin className="h-4 w-4" />}>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className={INPUT}
                >
                  {COUNTRIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
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

          {/* Professional info */}
          <Card
            title="Professional Information"
            desc="Help us tailor question banks to your training and region."
          >
            <form
              onSubmit={handleProfessionalSave}
              className="grid grid-cols-1 gap-5 sm:grid-cols-2"
            >
              <Field label="Specialty" icon={<GraduationCap className="h-4 w-4" />}>
                <select
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  className={INPUT}
                >
                  {SPECIALTIES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Institution / Hospital" icon={<Building2 className="h-4 w-4" />}>
                <input
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  className={INPUT}
                  placeholder="Where you train or practise"
                />
              </Field>
              <div className="flex justify-end sm:col-span-2">
                <button
                  type="submit"
                  className="inline-flex h-10 items-center gap-2 rounded-lg bg-accent px-5 text-sm font-semibold text-accent-foreground transition hover:bg-accent/90"
                >
                  <Save className="h-4 w-4" /> Save details
                </button>
              </div>
            </form>
          </Card>

          {/* Security */}
          <Card title="Security" desc="How your account stays protected on this device.">
            <div className="flex flex-wrap items-start justify-between gap-4 rounded-xl border border-border bg-surface-alt/40 p-4">
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Monitor className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-bold text-foreground">Device binding</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    Bound to <span className="font-semibold text-foreground">{device}</span>.
                  </p>
                </div>
              </div>
              {subscription?.status === "TRIAL" ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-warning/30 bg-warning/10 px-3 py-1.5 text-xs font-bold text-warning">
                  <ShieldCheck className="h-3.5 w-3.5" /> Trial — single device
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-3 py-1.5 text-xs font-bold text-success">
                  <ShieldCheck className="h-3.5 w-3.5" /> Multi-device enabled
                </span>
              )}
            </div>
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              For your security, sign-ins are tied to a device fingerprint. During the free trial
              your account is locked to a single device; subscribing unlocks access everywhere.
            </p>
          </Card>
        </div>

        {/* Right column (read-only account) */}
        <div className="space-y-6">
          {/* Account */}
          <Card title="Account" desc="Read-only account identity and plan.">
            <dl className="space-y-3">
              <Row label="Email">
                <span className="inline-flex items-center gap-1.5 text-foreground">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" /> {user.email}
                </span>
              </Row>
              <Row label="Role">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
                  <Briefcase className="h-3 w-3" /> {user.role}
                </span>
              </Row>
              <Row label="Plan status">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                    subscription?.status === "ACTIVE"
                      ? "bg-success/10 text-success"
                      : subscription?.status === "TRIAL"
                        ? "bg-warning/10 text-warning"
                        : "bg-surface-alt text-muted-foreground"
                  }`}
                >
                  {statusLabel}
                </span>
              </Row>
              <Row label="Member since">
                <span className="text-foreground">{joined}</span>
              </Row>
            </dl>

            {trial.isTrial && (
              <div className="mt-4 rounded-xl border border-warning/30 bg-warning/5 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-warning">
                  Trial usage
                </p>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-border bg-surface p-3 text-center">
                    <p className="text-xl font-bold tabular-nums text-foreground">
                      {trial.daysLeft}
                    </p>
                    <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Days left
                    </p>
                  </div>
                  <div className="rounded-lg border border-border bg-surface p-3 text-center">
                    <p className="text-xl font-bold tabular-nums text-foreground">
                      {trial.questionsLeft}
                      <span className="text-sm text-muted-foreground">/{trial.questionsTotal}</span>
                    </p>
                    <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Questions
                    </p>
                  </div>
                </div>
                <Link
                  to="/subscription"
                  className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition hover:bg-accent/90"
                >
                  Upgrade <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
            )}
          </Card>

          {/* Quick links */}
          <Card title="Quick links" desc="Jump back into your training.">
            <div className="space-y-2">
              <QuickLink
                to="/analytics"
                icon={<LineChart className="h-4 w-4" />}
                label="Performance analytics"
              />
              <QuickLink
                to="/subscription"
                icon={<CreditCard className="h-4 w-4" />}
                label="Manage subscription"
              />
              <QuickLink
                to="/leaderboard"
                icon={<Trophy className="h-4 w-4" />}
                label="National leaderboard"
              />
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

function Field({
  label,
  icon,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {icon} {label}
      </span>
      <div className="mt-1.5">{children}</div>
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

function QuickLink({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      to={to}
      className="group flex items-center justify-between gap-3 rounded-xl border border-border bg-surface-alt/40 px-4 py-3 text-sm font-semibold text-foreground transition hover:border-accent/40 hover:bg-surface-alt"
    >
      <span className="flex items-center gap-2.5">
        <span className="text-accent">{icon}</span>
        {label}
      </span>
      <ArrowUpRight className="h-4 w-4 text-muted-foreground transition group-hover:text-accent" />
    </Link>
  );
}
