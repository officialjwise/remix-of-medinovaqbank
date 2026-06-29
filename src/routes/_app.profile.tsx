import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
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
  KeyRound,
  LineChart,
  Lock,
  Loader2,
  Mail,
  MapPin,
  Monitor,
  Save,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Tablet,
  Target,
  Trash2,
  Trophy,
  User as UserIcon,
} from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/authStore";
import { useTrial } from "@/hooks/useTrial";
import { deviceLabel } from "@/lib/trial";
import { AvatarUploader } from "@/components/shared/AvatarUploader";
import { GradientKpiCard } from "@/components/shared/GradientKpiCard";
import { ApiError } from "@/api/client";
import {
  useProfile,
  useUserStats,
  useUpdateProfile,
  useUploadAvatar,
  useRemoveAvatar,
  useChangePassword,
} from "@/api/profile.api";
import { useSpecialties } from "@/api/specialties.api";
import { useActiveSessions, useTerminateSession, type DeviceSession } from "@/api/sessions.api";
import { TwoFactorCard } from "@/components/shared/TwoFactorCard";

export const Route = createFileRoute("/_app/profile")({
  head: () => ({
    meta: [{ title: "Profile — Medinovaqbank" }, { name: "robots", content: "noindex" }],
  }),
  component: ProfilePage,
});

/** Tiny inline fallback for first paint / offline, before useSpecialties() loads. */
const FALLBACK_SPECIALTIES = [
  "General Practice",
  "Surgery",
  "Internal Medicine",
  "Paediatrics",
  "Other",
];

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

/** Turn a cropped data URL from the AvatarUploader into a Blob for FormData. */
function dataUrlToBlob(dataUrl: string): Blob {
  const [header, b64] = dataUrl.split(",");
  const mimeMatch = /data:(.*?);base64/.exec(header);
  const mime = mimeMatch?.[1] ?? "image/jpeg";
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

function errMsg(e: unknown, fallback: string): string {
  return e instanceof ApiError ? e.message : fallback;
}

function ProfilePage() {
  const { user, subscription, setUser } = useAuthStore();
  const trial = useTrial();

  const { data: profile } = useProfile();
  const { data: stats } = useUserStats();
  const { data: specialtiesData } = useSpecialties();
  const updateProfile = useUpdateProfile();
  const uploadAvatar = useUploadAvatar();
  const removeAvatar = useRemoveAvatar();
  const changePassword = useChangePassword();

  const [name, setName] = useState("");
  const [specialty, setSpecialty] = useState("General Practice");
  const [institution, setInstitution] = useState("");
  const [country, setCountry] = useState("Ghana");

  // Active specialties from the backend (fallback for first paint), with the
  // user's current value merged in so a deactivated/legacy choice is never lost.
  const specialtyOptions = useMemo(() => {
    const base = specialtiesData?.map((s) => s.name) ?? FALLBACK_SPECIALTIES;
    return specialty && !base.includes(specialty) ? [specialty, ...base] : base;
  }, [specialtiesData, specialty]);

  // Hydrate form fields from the live profile once it loads.
  useEffect(() => {
    if (!profile) return;
    setName(profile.name);
    setSpecialty(profile.specialty ?? "General Practice");
    setInstitution(profile.institution ?? "");
    setCountry(profile.country || "Ghana");
  }, [profile]);

  // KPIs from the real /users/me/stats endpoint.
  const totalSessions = stats?.totalSessions ?? 0;
  const totalQuestions = stats?.totalQuestionsAnswered ?? 0;
  const avgScore = Math.round(stats?.averageScore ?? 0);

  const displayName = profile?.name ?? user?.name ?? "";
  const email = profile?.email ?? user?.email ?? "";
  const avatarUrl = profile?.avatarUrl ?? user?.avatarUrl;
  const initials = initialsOf(name || displayName || "U");
  const joinedSource = profile?.createdAt ?? user?.createdAt;
  const joined = joinedSource
    ? new Date(joinedSource).toLocaleDateString("en-GB", { year: "numeric", month: "long" })
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

  /** Persist profile fields and sync name/specialty into the auth store. */
  function syncStore(patch: { name?: string; specialty?: string; avatarUrl?: string }) {
    if (!user) return;
    setUser({ ...user, ...patch });
  }

  function handlePersonalSave(e: React.FormEvent) {
    e.preventDefault();
    updateProfile.mutate(
      { name: name.trim() || displayName, country },
      {
        onSuccess: (p) => {
          syncStore({ name: p.name });
          toast.success("Personal information updated");
        },
        onError: (err) => toast.error(errMsg(err, "Couldn't update your profile")),
      },
    );
  }

  function handleProfessionalSave(e: React.FormEvent) {
    e.preventDefault();
    updateProfile.mutate(
      { specialty, institution: institution.trim() },
      {
        onSuccess: (p) => {
          syncStore({ specialty: p.specialty ?? undefined });
          toast.success("Professional details saved");
        },
        onError: (err) => toast.error(errMsg(err, "Couldn't save your details")),
      },
    );
  }

  function handleAvatarSave(dataUrl: string) {
    const blob = dataUrlToBlob(dataUrl);
    uploadAvatar.mutate(blob, {
      onSuccess: (p) => {
        syncStore({ avatarUrl: p.avatarUrl });
        toast.success("Profile photo updated");
      },
      onError: (err) => toast.error(errMsg(err, "Couldn't upload your photo")),
    });
  }

  function handleAvatarRemove() {
    removeAvatar.mutate(undefined, {
      onSuccess: (p) => {
        syncStore({ avatarUrl: p.avatarUrl });
        toast.success("Profile photo removed");
      },
      onError: (err) => toast.error(errMsg(err, "Couldn't remove your photo")),
    });
  }

  if (!user && !profile) {
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
                  value={avatarUrl}
                  initials={initials}
                  size={104}
                  onSave={handleAvatarSave}
                  onRemove={handleAvatarRemove}
                />
              </div>
            </div>
            <div className="min-w-0 flex-1 sm:pb-1">
              <h1 className="truncate text-2xl font-bold tracking-tight text-foreground">
                {displayName}
              </h1>
              <p className="mt-1 flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground">
                <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="truncate">{email}</span>
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {(profile?.specialty ?? user?.specialty) && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                    <GraduationCap className="h-3.5 w-3.5" />{" "}
                    {profile?.specialty ?? user?.specialty}
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
          label="Accuracy"
          value={`${Math.round(stats?.accuracy ?? 0)}%`}
          icon={Award}
          gradient="emerald"
          sub="correct / answered"
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
                  disabled={updateProfile.isPending}
                  className="inline-flex h-10 items-center gap-2 rounded-lg bg-accent px-5 text-sm font-semibold text-accent-foreground transition hover:bg-accent/90 disabled:opacity-60"
                >
                  <Save className="h-4 w-4" />{" "}
                  {updateProfile.isPending ? "Saving…" : "Save changes"}
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
                  {specialtyOptions.map((s) => (
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
                  disabled={updateProfile.isPending}
                  className="inline-flex h-10 items-center gap-2 rounded-lg bg-accent px-5 text-sm font-semibold text-accent-foreground transition hover:bg-accent/90 disabled:opacity-60"
                >
                  <Save className="h-4 w-4" />{" "}
                  {updateProfile.isPending ? "Saving…" : "Save details"}
                </button>
              </div>
            </form>
          </Card>

          {/* Change password */}
          <ChangePasswordCard
            disabled={profile?.provider === "google"}
            isPending={changePassword.isPending}
            onSubmit={(currentPassword, newPassword) =>
              changePassword.mutate(
                { currentPassword, newPassword },
                {
                  onSuccess: () => toast.success("Password changed"),
                  onError: (err) => toast.error(errMsg(err, "Couldn't change your password")),
                },
              )
            }
          />

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

          {/* Two-factor authentication */}
          <TwoFactorCard />

          {/* Active devices (device/login sessions) */}
          <ActiveDevicesCard />
        </div>

        {/* Right column (read-only account) */}
        <div className="space-y-6">
          {/* Account */}
          <Card title="Account" desc="Read-only account identity and plan.">
            <dl className="space-y-3">
              <Row label="Email">
                <span className="flex min-w-0 items-center gap-1.5 text-foreground">
                  <Mail className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
                  <span className="truncate">{email}</span>
                </span>
              </Row>
              <Row label="Role">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
                  <Briefcase className="h-3 w-3" /> {profile?.role ?? user?.role}
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

function DeviceIcon({ type }: { type: string | null }) {
  if (type === "mobile") return <Smartphone className="h-4 w-4" />;
  if (type === "tablet") return <Tablet className="h-4 w-4" />;
  return <Monitor className="h-4 w-4" />;
}

function ActiveDevicesCard() {
  const { data, isLoading } = useActiveSessions();
  const terminate = useTerminateSession();
  const sessions = data?.sessions ?? [];

  return (
    <Card title="Active devices" desc="Devices currently signed in to your account.">
      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading devices…
        </div>
      ) : sessions.length === 0 ? (
        <p className="text-sm text-muted-foreground">No active devices found.</p>
      ) : (
        <ul className="space-y-2.5">
          {sessions.map((s) => (
            <DeviceLine
              key={s.id}
              session={s}
              canSignOut={sessions.length > 1}
              onSignOut={() => terminate.mutate(s.id)}
              signingOut={terminate.isPending}
            />
          ))}
        </ul>
      )}
    </Card>
  );
}

function DeviceLine({
  session,
  canSignOut,
  onSignOut,
  signingOut,
}: {
  session: DeviceSession;
  canSignOut: boolean;
  onSignOut: () => void;
  signingOut: boolean;
}) {
  return (
    <li className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface-alt/40 px-4 py-3">
      <div className="flex min-w-0 items-start gap-3">
        <span
          className={`mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${
            session.isSuspicious ? "bg-error/10 text-error" : "bg-primary/10 text-primary"
          }`}
        >
          <DeviceIcon type={session.deviceType} />
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-sm font-semibold text-foreground">{session.deviceLabel}</span>
            {session.isSuspicious && (
              <span className="inline-flex items-center gap-1 rounded-md border border-error/20 bg-error/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-error">
                <ShieldAlert className="h-3 w-3" /> Suspicious
              </span>
            )}
          </div>
          <p className="truncate text-[12px] text-muted-foreground">
            {[session.location, session.ipAddress].filter(Boolean).join(" · ") ||
              "Unknown location"}
          </p>
          <p className="text-[12px] text-muted-foreground">
            Last active {new Date(session.lastPingAt).toLocaleString()}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onSignOut}
        disabled={!canSignOut || signingOut}
        title={canSignOut ? "Sign out this device" : "Can't sign out your only active device"}
        className="inline-flex h-8 flex-shrink-0 items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 text-[12px] font-semibold text-foreground transition hover:border-error/30 hover:bg-error/10 hover:text-error disabled:cursor-not-allowed disabled:opacity-40"
      >
        {signingOut ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Trash2 className="h-3.5 w-3.5" />
        )}
        Sign out
      </button>
    </li>
  );
}

function ChangePasswordCard({
  disabled,
  isPending,
  onSubmit,
}: {
  disabled: boolean;
  isPending: boolean;
  onSubmit: (currentPassword: string, newPassword: string) => void;
}) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (next !== confirm) {
      toast.error("New passwords don't match");
      return;
    }
    onSubmit(current, next);
    setCurrent("");
    setNext("");
    setConfirm("");
  }

  if (disabled) {
    return (
      <Card title="Password" desc="Manage how you sign in.">
        <div className="flex items-center gap-3 rounded-xl border border-border bg-surface-alt/40 p-4">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Lock className="h-5 w-5" />
          </span>
          <p className="text-sm text-muted-foreground">
            You signed in with Google — password changes are managed by your Google account.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card title="Change password" desc="Use a strong password you don't use elsewhere.">
      <form onSubmit={submit} className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field label="Current password" icon={<Lock className="h-4 w-4" />}>
          <input
            required
            type="password"
            autoComplete="current-password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            className={INPUT}
            placeholder="••••••••"
          />
        </Field>
        <div className="hidden sm:block" />
        <Field label="New password" icon={<KeyRound className="h-4 w-4" />}>
          <input
            required
            type="password"
            autoComplete="new-password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
            className={INPUT}
            placeholder="At least 8 characters"
          />
        </Field>
        <Field label="Confirm new password" icon={<KeyRound className="h-4 w-4" />}>
          <input
            required
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className={INPUT}
            placeholder="Re-enter new password"
          />
        </Field>
        <div className="flex justify-end sm:col-span-2">
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-accent px-5 text-sm font-semibold text-accent-foreground transition hover:bg-accent/90 disabled:opacity-60"
          >
            <KeyRound className="h-4 w-4" /> {isPending ? "Updating…" : "Update password"}
          </button>
        </div>
      </form>
    </Card>
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
