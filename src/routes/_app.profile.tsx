import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Briefcase, Building2, GraduationCap, Mail, MapPin, Monitor, Save, ShieldCheck, User as UserIcon } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { recentSessions } from "@/data/banks";
import { deviceLabel } from "@/lib/trial";

export const Route = createFileRoute("/_app/profile")({
  head: () => ({
    meta: [
      { title: "Profile — Medinovaqbank" },
      { name: "robots", content: "noindex" },
    ],
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

function ProfilePage() {
  const { user, subscription, setUser } = useAuthStore();
  const [name, setName] = useState(user?.name ?? "");
  const [specialty, setSpecialty] = useState(user?.specialty ?? "General Practice");
  const [institution, setInstitution] = useState("Korle-Bu Teaching Hospital");
  const [country, setCountry] = useState("Ghana");
  const [saved, setSaved] = useState(false);

  // Quick stats from mock sessions
  const totalSessions = recentSessions.length;
  const totalQuestions = recentSessions.reduce((acc, s) => acc + s.questionsAnswered, 0);
  const finishedSessions = recentSessions.filter((s) => !s.inProgress);
  const accuracy = Math.round(
    finishedSessions.reduce((acc, s) => acc + s.scorePct, 0) / Math.max(1, finishedSessions.length),
  );

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (user) {
      setUser({ ...user, name, specialty });
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  }

  const initials = (user?.name ?? "U").split(" ").map((s) => s[0]).slice(0, 2).join("");
  const joined = user?.createdAt ? new Date(user.createdAt).toLocaleDateString("en-GB", { year: "numeric", month: "long" }) : "—";

  return (
    <div className="mx-auto max-w-5xl">
      {/* Header */}
      <section className="rounded-2xl bg-gradient-to-r from-primary to-[#0A1F38] p-6 text-white shadow-[var(--shadow-card)]">
        <div className="flex flex-wrap items-center gap-5">
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="h-20 w-20 rounded-full object-cover ring-4 ring-white/20"
            />
          ) : (
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-accent text-2xl font-bold ring-4 ring-white/20">
              {initials}
            </span>
          )}
          <div className="flex-1 min-w-[14rem]">
            <h1 className="text-2xl font-bold tracking-tight">{user?.name ?? "Practitioner"}</h1>
            <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-white/75">
              <Mail className="h-3.5 w-3.5" /> {user?.email ?? "—"}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {user?.specialty && (
                <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide">
                  {user.specialty}
                </span>
              )}
              <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold">
                Joined {joined}
              </span>
              {subscription?.status === "ACTIVE" ? (
                <span className="rounded-full bg-success px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-white">
                  Active
                </span>
              ) : subscription?.status === "TRIAL" ? (
                <span className="rounded-full bg-warning px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-white">
                  Free Trial
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MiniStat label="Total Sessions" value={totalSessions.toString()} />
        <MiniStat label="Total Questions" value={totalQuestions.toLocaleString()} />
        <MiniStat label="Accuracy" value={`${accuracy}%`} accent="text-success" />
        <MiniStat label="Best Subject" value="Cardiology" sub="88%" accent="text-accent" />
      </div>

      {/* Device binding (transparency) */}
      <section className="mt-6 rounded-2xl border border-border bg-surface p-6 shadow-[var(--shadow-card)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Monitor className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-base font-bold tracking-tight text-foreground">Bound device</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                This account is currently bound to{" "}
                <span className="font-semibold text-foreground">{subscription?.boundDevice ?? deviceLabel()}</span>.
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
        {subscription?.status === "TRIAL" && (
          <p className="mt-3 rounded-lg border border-border bg-surface-alt/40 px-3 py-2 text-xs text-muted-foreground">
            During your free trial, Medinovaqbank is locked to this device to keep your account secure. Subscribe to use it anywhere.
          </p>
        )}
      </section>

      {/* Edit form */}
      <section className="mt-6 rounded-2xl border border-border bg-surface p-6 shadow-[var(--shadow-card)]">
        <h2 className="text-lg font-bold tracking-tight text-foreground">Edit Profile</h2>
        <form onSubmit={handleSave} className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="Full Name" icon={<UserIcon className="h-4 w-4" />}>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input"
            />
          </Field>
          <Field label="Email (read-only)" icon={<Mail className="h-4 w-4" />}>
            <input
              readOnly
              value={user?.email ?? ""}
              className="input cursor-not-allowed bg-surface-alt text-muted-foreground"
            />
          </Field>
          <Field label="Specialty" icon={<GraduationCap className="h-4 w-4" />}>
            <select
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              className="input"
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
              className="input"
            />
          </Field>
          <Field label="Country" icon={<MapPin className="h-4 w-4" />}>
            <select value={country} onChange={(e) => setCountry(e.target.value)} className="input">
              {[
                "Ghana",
                "Nigeria",
                "Kenya",
                "South Africa",
                "United Kingdom",
                "United States",
                "Other",
              ].map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Role" icon={<Briefcase className="h-4 w-4" />}>
            <input readOnly value={user?.role ?? "USER"} className="input cursor-not-allowed bg-surface-alt text-muted-foreground" />
          </Field>

          <div className="sm:col-span-2 flex items-center justify-end gap-3">
            {saved && (
              <span className="rounded-full bg-success-light px-3 py-1 text-xs font-semibold text-success">
                ✓ Saved
              </span>
            )}
            <button
              type="submit"
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-accent px-5 text-sm font-semibold text-accent-foreground hover:bg-accent/90"
            >
              <Save className="h-4 w-4" /> Save Changes
            </button>
          </div>
        </form>
      </section>

      <style>{`
        .input { display: block; width: 100%; height: 2.5rem; padding: 0 0.875rem; font-size: 0.875rem; color: var(--color-foreground); background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 0.5rem; outline: none; }
        .input:focus { border-color: var(--color-accent); box-shadow: 0 0 0 3px color-mix(in oklch, var(--color-accent) 20%, transparent); }
      `}</style>
    </div>
  );
}

function MiniStat({ label, value, sub, accent = "text-foreground" }: { label: string; value: string; sub?: string; accent?: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={`mt-1.5 text-xl font-bold tabular-nums ${accent}`}>{value}</p>
      {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

function Field({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {icon} {label}
      </span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}
