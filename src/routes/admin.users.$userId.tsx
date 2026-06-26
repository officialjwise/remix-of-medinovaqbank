import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Activity,
  PlayCircle,
  BarChart3,
  CreditCard,
  Monitor,
  Clock,
  MapPin,
  Calendar,
  Pencil,
  ToggleLeft,
  Mail,
  Smartphone,
  Flag,
  Ban,
  UserCheck,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EditUserModal, ComposeEmailModal, FlagAccountModal } from "@/components/admin/UserActionModals";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  getUserById,
  quizSessionsByUser,
  loginSessionsByUser,
  type AdminUser,
  type AdminQuizSession,
  type LoginSession,
} from "@/data/adminData";

export const Route = createFileRoute("/admin/users/$userId")({
  head: () => ({ meta: [{ title: "Admin · User Detail — Medinovaqbank" }, { name: "robots", content: "noindex" }] }),
  component: UserDetail,
});

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const TOOLTIP_STYLE = {
  backgroundColor: "var(--color-surface)",
  border: "1px solid var(--color-border)",
  borderRadius: "10px",
  color: "var(--color-foreground)",
} as const;

function seeded(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

function hash(str: string) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function scoreColor(pct: number) {
  return pct >= 80 ? "text-success" : pct >= 60 ? "text-warning" : "text-error";
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const PLAN_PRICE: Record<string, number> = {
  Trial: 0,
  Monthly: 99,
  "3-Month": 249,
  "6-Month": 449,
  "12-Month": 799,
  "—": 0,
};

function StatusPill({ status }: { status: AdminUser["status"] }) {
  const tone =
    status === "active"
      ? "bg-success/10 text-success border border-success/20"
      : status === "trial"
        ? "bg-warning/10 text-warning border border-warning/20"
        : status === "expired" || status === "suspended"
          ? "bg-error/10 text-error border border-error/20"
          : "bg-surface-alt text-muted-foreground border border-border";
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${tone}`}>{status}</span>;
}

function RolePill({ role }: { role: AdminUser["role"] }) {
  const tone =
    role === "SUPER_ADMIN"
      ? "bg-primary/10 text-primary border border-primary/20"
      : role === "ADMIN"
        ? "bg-accent/10 text-accent border border-accent/20"
        : "bg-surface-alt text-muted-foreground border border-border";
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${tone}`}>{role.replace("_", " ")}</span>;
}

const TABS = [
  { id: "overview", label: "Overview", icon: Activity },
  { id: "sessions", label: "Quiz Sessions", icon: PlayCircle },
  { id: "performance", label: "Performance", icon: BarChart3 },
  { id: "billing", label: "Subscription", icon: CreditCard },
  { id: "devices", label: "Devices", icon: Monitor },
  { id: "activity", label: "Activity Log", icon: Clock },
] as const;

type TabId = (typeof TABS)[number]["id"];

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

function UserDetail() {
  const { userId } = Route.useParams();
  const navigate = useNavigate();
  const user = getUserById(userId);

  const [tab, setTab] = useState<TabId>("overview");
  const [showOverride, setShowOverride] = useState(false);
  const [confirmSuspend, setConfirmSuspend] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [actionModal, setActionModal] = useState<null | "edit" | "email" | "flag" | "clearLock">(null);
  const [flagged, setFlagged] = useState(false);

  const quizSessions = useMemo(() => (user ? quizSessionsByUser(user.id) : []), [user]);
  const loginSessions = useMemo(() => (user ? loginSessionsByUser(user.id) : []), [user]);

  if (!user) {
    return (
      <div className="space-y-6">
        <Link to="/admin/users" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> All users
        </Link>
        <div className="rounded-2xl border border-border bg-surface p-12 text-center shadow-[var(--shadow-card)]">
          <p className="text-base font-bold text-foreground">User not found</p>
          <p className="mt-1 text-sm text-muted-foreground">No account exists for id “{userId}”.</p>
          <Link
            to="/admin/users"
            className="mt-4 inline-flex h-10 items-center gap-2 rounded-lg bg-gradient-to-r from-primary to-accent px-4 text-sm font-semibold text-white shadow-md hover:opacity-90"
          >
            <ArrowLeft className="h-4 w-4" /> Back to users
          </Link>
        </div>
      </div>
    );
  }

  const suspended = user.status === "suspended";
  const daysMember = Math.max(1, Math.floor((Date.now() - new Date(user.registeredAt).getTime()) / 86_400_000));

  return (
    <div className="space-y-6">
      <Link to="/admin/users" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> All users
      </Link>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        {/* Side panel */}
        <aside className="flex-shrink-0 space-y-4 lg:w-80">
          <div className="rounded-2xl border border-border bg-surface p-6 text-center shadow-[var(--shadow-card)]">
            <span className="mx-auto flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent text-3xl font-bold text-white">
              {user.initials}
            </span>
            <h2 className="mt-4 text-xl font-bold text-foreground">{user.name}</h2>
            <p className="mt-1 truncate text-sm text-muted-foreground">{user.email}</p>

            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <RolePill role={user.role} />
              <StatusPill status={user.status} />
            </div>

            <div className="mt-4">
              {user.status === "trial" ? (
                <span className="inline-flex rounded-full border border-warning/20 bg-warning/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-warning">
                  Trial · {user.trialDaysLeft ?? 0}d left
                </span>
              ) : (
                <span className="inline-flex rounded-full border border-accent/20 bg-accent/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-accent">
                  {user.plan === "—" ? "No plan" : `${user.plan} plan`}
                </span>
              )}
            </div>

            <dl className="mt-6 space-y-3 border-t border-border pt-5 text-left text-sm">
              <InfoRow icon={Monitor} label="Bound device">
                <span className="block truncate text-sm font-medium text-foreground">{user.device}</span>
                <span className="block truncate font-mono text-[11px] text-muted-foreground">{user.deviceFingerprint}</span>
              </InfoRow>
              <InfoRow icon={MapPin} label="Location">
                <span className="text-sm font-medium text-foreground">
                  {user.city}, {user.region}, {user.country}
                </span>
              </InfoRow>
              <InfoRow icon={Calendar} label="Member since">
                <span className="text-sm font-medium text-foreground">{fmtDate(user.registeredAt)}</span>
              </InfoRow>
              <InfoRow icon={Clock} label="Last active">
                <span className="text-sm font-medium text-foreground">{fmtDateTime(user.lastActiveAt)}</span>
              </InfoRow>
            </dl>
          </div>

          {/* Quick actions */}
          <div className="space-y-2 rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-card)]">
            <ActionBtn icon={Pencil} onClick={() => setActionModal("edit")}>Edit profile</ActionBtn>
            <ActionBtn icon={ToggleLeft} onClick={() => setShowOverride(true)}>Override subscription</ActionBtn>
            <ActionBtn icon={Mail} onClick={() => setActionModal("email")}>Send email</ActionBtn>
            <ActionBtn icon={Smartphone} onClick={() => setActionModal("clearLock")}>Clear device lock</ActionBtn>
            <ActionBtn icon={Flag} onClick={() => setActionModal("flag")}>{flagged ? "Flagged ✓" : "Flag account"}</ActionBtn>
            <ActionBtn icon={suspended ? UserCheck : Ban} tone="warning" onClick={() => setConfirmSuspend(true)}>
              {suspended ? "Reactivate account" : "Suspend account"}
            </ActionBtn>
            <ActionBtn icon={Trash2} tone="error" onClick={() => setConfirmDelete(true)}>Delete account</ActionBtn>
          </div>
        </aside>

        {/* Main */}
        <div className="flex min-w-0 flex-1 flex-col space-y-6">
          <div className="flex gap-1 overflow-x-auto rounded-xl border border-border bg-surface p-1 shadow-[var(--shadow-card)] scrollbar-none">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${
                  tab === t.id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-surface-alt hover:text-foreground"
                }`}
              >
                <t.icon className="h-4 w-4" />
                {t.label}
              </button>
            ))}
          </div>

          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 fill-mode-both">
            {tab === "overview" && <OverviewTab user={user} quizSessions={quizSessions} daysMember={daysMember} />}
            {tab === "sessions" && <SessionsTab sessions={quizSessions} />}
            {tab === "performance" && <PerformanceTab user={user} />}
            {tab === "billing" && <BillingTab user={user} />}
            {tab === "devices" && <DevicesTab user={user} sessions={loginSessions} />}
            {tab === "activity" && <ActivityTab user={user} quizSessions={quizSessions} />}
          </div>
        </div>
      </div>

      {/* Override modal */}
      {showOverride && <OverrideModal user={user} onClose={() => setShowOverride(false)} />}

      {/* Quick-action modals */}
      {actionModal === "edit" && <EditUserModal user={user} onClose={() => setActionModal(null)} onSave={() => {}} />}
      {actionModal === "email" && <ComposeEmailModal user={user} onClose={() => setActionModal(null)} />}
      {actionModal === "flag" && <FlagAccountModal user={user} onClose={() => setActionModal(null)} onFlag={() => setFlagged(true)} />}
      <ConfirmDialog
        open={actionModal === "clearLock"}
        title="Clear device lock?"
        description={<span>This lets <strong>{user.name}</strong> sign in from a new device. Their bound device ({user.device}) will be released.</span>}
        confirmLabel="Clear device lock"
        onCancel={() => setActionModal(null)}
        onConfirm={() => { setActionModal(null); toast.success("Device lock cleared — user can re-bind on next login"); }}
      />

      <ConfirmDialog
        open={confirmSuspend}
        title={suspended ? "Reactivate this user?" : "Suspend this user?"}
        description={
          suspended
            ? "They will be able to sign in again immediately."
            : "They will be signed out and unable to start new quiz sessions until reactivated."
        }
        variant={suspended ? "default" : "destructive"}
        confirmLabel={suspended ? "Reactivate" : "Suspend"}
        onCancel={() => setConfirmSuspend(false)}
        onConfirm={() => {
          setConfirmSuspend(false);
          toast.success("Account status updated");
        }}
      />
      <ConfirmDialog
        open={confirmDelete}
        title="Permanently delete this user?"
        description={
          <span>
            This deletes <strong>{user.name}</strong>'s account, quiz sessions and subscription history. This cannot be
            undone.
          </span>
        }
        variant="destructive"
        typedConfirmation="DELETE"
        confirmLabel="Delete account"
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          setConfirmDelete(false);
          toast.success("User deleted");
          navigate({ to: "/admin/users" });
        }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Overview                                                            */
/* ------------------------------------------------------------------ */

function OverviewTab({
  user,
  quizSessions,
  daysMember,
}: {
  user: AdminUser;
  quizSessions: AdminQuizSession[];
  daysMember: number;
}) {
  const timeline = useMemo(() => {
    const items: { text: string; when: string; tone: "primary" | "accent" | "success" | "warning" }[] = [];
    const recent = [...quizSessions].sort((a, b) => +new Date(b.date) - +new Date(a.date)).slice(0, 4);
    recent.forEach((s) => {
      items.push({
        text:
          s.status === "completed"
            ? `Completed ${s.bankName} — ${s.scorePct}%`
            : s.status === "in-progress"
              ? `Started ${s.bankName} (${s.mode})`
              : `Abandoned ${s.bankName}`,
        when: fmtDateTime(s.date),
        tone: s.status === "completed" ? "success" : "primary",
      });
    });
    items.push({
      text: user.status === "trial" ? "Started free trial" : `Subscribed to ${user.plan === "—" ? "platform" : user.plan} plan`,
      when: fmtDate(user.registeredAt),
      tone: "accent",
    });
    items.push({ text: "Account created", when: fmtDate(user.registeredAt), tone: "warning" });
    return items.slice(0, 6);
  }, [quizSessions, user]);

  const trialQTotal = (user.trialQuestionsLeft ?? 0) + Math.min(user.lifetimeQuestions, 30);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Sessions" value={user.sessionsCount.toLocaleString()} />
        <StatCard label="Avg score" value={`${user.avgScore}%`} accent />
        <StatCard label="Questions answered" value={user.lifetimeQuestions.toLocaleString()} />
        <StatCard label="Days as member" value={daysMember.toLocaleString()} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Subscription / trial status */}
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-[var(--shadow-card)]">
          <h3 className="text-base font-bold text-foreground">{user.status === "trial" ? "Trial status" : "Subscription"}</h3>
          {user.status === "trial" ? (
            <div className="mt-4 space-y-4">
              <Meter label="Trial days remaining" value={user.trialDaysLeft ?? 0} max={7} suffix="days" />
              <Meter
                label="Trial questions remaining"
                value={user.trialQuestionsLeft ?? 0}
                max={Math.max(trialQTotal, 1)}
                suffix="left"
              />
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Plan</span>
                <span className="text-sm font-bold text-foreground">{user.plan === "—" ? "None" : user.plan}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <StatusPill status={user.status} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{user.status === "expired" ? "Expired" : "Renews"}</span>
                <span className="text-sm font-semibold text-foreground">{user.planEndsAt ? fmtDate(user.planEndsAt) : "—"}</span>
              </div>
            </div>
          )}
        </div>

        {/* Bound device & location */}
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-[var(--shadow-card)]">
          <h3 className="text-base font-bold text-foreground">Bound device & location</h3>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <Monitor className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
              <div className="min-w-0">
                <p className="font-medium text-foreground">{user.device}</p>
                <p className="truncate font-mono text-[11px] text-muted-foreground">{user.deviceFingerprint}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
              <p className="font-medium text-foreground">
                {user.city}, {user.region}, {user.country}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-[var(--shadow-card)]">
        <h3 className="mb-4 text-base font-bold text-foreground">Recent activity</h3>
        <div className="relative space-y-6 border-l-2 border-border pl-4">
          {timeline.map((row, i) => (
            <div key={i} className="relative">
              <span
                className={`absolute -left-[23px] top-1 h-3 w-3 rounded-full ring-4 ring-surface ${
                  row.tone === "success" ? "bg-success" : row.tone === "accent" ? "bg-accent" : row.tone === "warning" ? "bg-warning" : "bg-primary"
                }`}
              />
              <p className="text-sm font-medium text-foreground">{row.text}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{row.when}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Quiz sessions                                                       */
/* ------------------------------------------------------------------ */

function SessionsTab({ sessions }: { sessions: AdminQuizSession[] }) {
  if (sessions.length === 0) return <EmptyState label="No quiz sessions yet" hint="This user hasn't started any quizzes." />;
  const sorted = [...sessions].sort((a, b) => +new Date(b.date) - +new Date(a.date));
  return (
    <TableCard head={["Bank", "Mode", "Score", "Questions", "Status", "Duration", "Date"]}>
      {sorted.map((s) => (
        <tr key={s.id} className="hover:bg-surface-alt/40">
          <td className="px-5 py-4 font-semibold text-foreground">{s.bankName}</td>
          <td className="px-5 py-4">
            <span className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${s.mode === "TUTOR" ? "bg-primary/10 text-primary" : "bg-warning/10 text-warning"}`}>
              {s.mode}
            </span>
          </td>
          <td className={`px-5 py-4 font-mono text-sm font-bold tabular-nums ${s.status === "completed" ? scoreColor(s.scorePct) : "text-muted-foreground"}`}>
            {s.status === "completed" ? `${s.scorePct}%` : "—"}
          </td>
          <td className="px-5 py-4 text-sm tabular-nums text-muted-foreground">
            {s.questionsAnswered}/{s.totalQuestions}
          </td>
          <td className="px-5 py-4">
            <span
              className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                s.status === "completed"
                  ? "bg-success/10 text-success"
                  : s.status === "in-progress"
                    ? "bg-warning/10 text-warning"
                    : "bg-error/10 text-error"
              }`}
            >
              {s.status}
            </span>
          </td>
          <td className="px-5 py-4 text-sm text-muted-foreground">{s.durationMin} min</td>
          <td className="px-5 py-4 text-sm text-muted-foreground">{fmtDate(s.date)}</td>
        </tr>
      ))}
    </TableCard>
  );
}

/* ------------------------------------------------------------------ */
/* Performance                                                         */
/* ------------------------------------------------------------------ */

function PerformanceTab({ user }: { user: AdminUser }) {
  const rnd = useMemo(() => seeded(hash(user.id) + 7), [user.id]);

  const progression = useMemo(() => {
    const target = user.avgScore;
    return Array.from({ length: 6 }, (_, i) => {
      const m = (new Date().getMonth() - 5 + i + 12) % 12;
      const trend = target - 14 + (i / 5) * 14;
      const jitter = (rnd() - 0.5) * 6;
      return { month: MONTHS[m], score: Math.max(35, Math.min(99, Math.round(trend + jitter))) };
    });
  }, [user.avgScore, rnd]);

  const subjects = useMemo(() => {
    const names = ["Cardiology", "Pharmacology", "Neurology", "Anatomy", "Pathology"];
    return names.map((n) => ({ name: n, acc: Math.max(40, Math.min(98, Math.round(user.avgScore - 10 + rnd() * 24))) }));
  }, [user.avgScore, rnd]);

  const banks = useMemo(() => {
    const names = ["MRCP Part 1", "PLAB 1", "USMLE Step 1", "Ghana Licensing"];
    return names.map((n) => ({ name: n, pct: Math.round(40 + rnd() * 58) }));
  }, [rnd]);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-[var(--shadow-card)]">
        <h3 className="mb-6 text-base font-bold text-foreground">Score progression</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={progression}>
              <defs>
                <linearGradient id="uScore" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0E7C7B" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#0E7C7B" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="month" stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
              <Tooltip contentStyle={TOOLTIP_STYLE} itemStyle={{ color: "#0E7C7B", fontWeight: "bold" }} />
              <Area type="monotone" dataKey="score" stroke="#0E7C7B" strokeWidth={3} fill="url(#uScore)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-[var(--shadow-card)]">
          <h3 className="mb-4 text-base font-bold text-foreground">Subject accuracy</h3>
          <div className="space-y-3">
            {subjects.map((s) => (
              <div key={s.name}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="text-foreground">{s.name}</span>
                  <span className={`font-bold tabular-nums ${scoreColor(s.acc)}`}>{s.acc}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-surface-alt">
                  <div className="h-full rounded-full bg-gradient-to-r from-primary to-accent" style={{ width: `${s.acc}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-6 shadow-[var(--shadow-card)]">
          <h3 className="mb-4 text-base font-bold text-foreground">Percentile per bank</h3>
          <div className="space-y-3">
            {banks.map((b) => (
              <div key={b.name}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="text-foreground">{b.name}</span>
                  <span className="font-bold tabular-nums text-accent">{b.pct}th</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-surface-alt">
                  <div className="h-full rounded-full bg-accent" style={{ width: `${b.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Billing                                                             */
/* ------------------------------------------------------------------ */

function BillingTab({ user }: { user: AdminUser }) {
  const rnd = useMemo(() => seeded(hash(user.id) + 31), [user.id]);

  const history = useMemo(() => {
    const rows = [
      {
        id: "sh-1",
        plan: user.plan === "—" ? "Trial" : user.plan,
        start: fmtDate(user.registeredAt),
        end: user.planEndsAt ? fmtDate(user.planEndsAt) : "—",
        status: user.status === "expired" ? "Expired" : user.status === "active" ? "Active" : user.status === "trial" ? "Trial" : "Inactive",
      },
    ];
    if (user.status === "active" || user.status === "expired") {
      rows.push({ id: "sh-2", plan: "Trial", start: fmtDate(user.registeredAt), end: fmtDate(user.registeredAt), status: "Expired" });
    }
    return rows;
  }, [user]);

  const transactions = useMemo(() => {
    const count = user.plan === "—" || user.status === "trial" ? 0 : Math.min(history.length, user.status === "active" ? 2 : 1);
    const statuses = ["Paid", "Paid", "Refunded", "Failed"];
    return Array.from({ length: count }, (_, i) => {
      const plan = i === count - 1 && count > 1 ? "Monthly" : user.plan === "—" ? "Monthly" : user.plan;
      return {
        ref: `txn_${Math.floor(rnd() * 0xffffffff).toString(16).padStart(8, "0")}`,
        plan,
        amount: PLAN_PRICE[plan] ?? 99,
        status: i === 0 ? "Paid" : statuses[Math.floor(rnd() * statuses.length)],
        date: fmtDate(new Date(new Date(user.registeredAt).getTime() + i * 31 * 86_400_000).toISOString()),
      };
    });
  }, [user, history.length, rnd]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-accent/20 bg-accent/5 p-6 shadow-[var(--shadow-card)]">
          <p className="text-[10px] font-bold uppercase tracking-widest text-accent">Current plan</p>
          <p className="mt-2 text-2xl font-bold text-foreground">{user.plan === "—" ? "None" : user.plan}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {user.planEndsAt ? `Ends ${fmtDate(user.planEndsAt)}` : user.status === "trial" ? `${user.trialDaysLeft ?? 0} trial days left` : "No active subscription"}
          </p>
        </div>
        <div className="flex items-center justify-between rounded-2xl border border-border bg-surface p-6 shadow-[var(--shadow-card)]">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Status</p>
            <div className="mt-2">
              <StatusPill status={user.status} />
            </div>
          </div>
          <button
            onClick={() => toast.success("Subscription extended")}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-gradient-to-r from-primary to-accent px-4 text-sm font-semibold text-white shadow-md hover:opacity-90"
          >
            Override / Extend
          </button>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-bold text-foreground">Subscription history</h3>
        <TableCard head={["Plan", "Start", "End", "Status"]}>
          {history.map((h) => (
            <tr key={h.id} className="hover:bg-surface-alt/40">
              <td className="px-5 py-4 font-semibold text-foreground">{h.plan}</td>
              <td className="px-5 py-4 text-sm text-muted-foreground">{h.start}</td>
              <td className="px-5 py-4 text-sm text-muted-foreground">{h.end}</td>
              <td className="px-5 py-4">
                <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${h.status === "Active" ? "bg-success/10 text-success" : h.status === "Trial" ? "bg-warning/10 text-warning" : "bg-surface-alt text-muted-foreground"}`}>
                  {h.status}
                </span>
              </td>
            </tr>
          ))}
        </TableCard>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-bold text-foreground">Payment transactions</h3>
        {transactions.length === 0 ? (
          <EmptyState label="No transactions" hint="This user has not made any payments." />
        ) : (
          <TableCard head={["Reference", "Plan", "Amount", "Status", "Date"]}>
            {transactions.map((t) => (
              <tr key={t.ref} className="hover:bg-surface-alt/40">
                <td className="px-5 py-4 font-mono text-xs text-muted-foreground">{t.ref}</td>
                <td className="px-5 py-4 font-semibold text-foreground">{t.plan}</td>
                <td className="px-5 py-4 text-sm tabular-nums text-foreground">GHS {t.amount}</td>
                <td className="px-5 py-4">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      t.status === "Paid" ? "bg-success/10 text-success" : t.status === "Refunded" ? "bg-warning/10 text-warning" : "bg-error/10 text-error"
                    }`}
                  >
                    {t.status}
                  </span>
                </td>
                <td className="px-5 py-4 text-sm text-muted-foreground">{t.date}</td>
              </tr>
            ))}
          </TableCard>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Devices                                                             */
/* ------------------------------------------------------------------ */

function DevicesTab({ user, sessions }: { user: AdminUser; sessions: LoginSession[] }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-6 shadow-[var(--shadow-card)]">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Monitor className="h-5 w-5" />
          </span>
          <div>
            <p className="font-bold text-foreground">{user.device}</p>
            <p className="font-mono text-[11px] text-muted-foreground">{user.deviceFingerprint}</p>
            <p className="mt-1 text-xs text-muted-foreground">Bound device — used to prevent account sharing.</p>
          </div>
        </div>
        <button
          onClick={() => toast.success("Device lock cleared")}
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-warning/30 bg-warning/10 px-4 text-sm font-semibold text-warning hover:bg-warning/20"
        >
          <Smartphone className="h-4 w-4" /> Clear lock
        </button>
      </div>

      {sessions.length === 0 ? (
        <EmptyState label="No login sessions" hint="This user has no recorded login sessions." />
      ) : (
        <TableCard head={["Device", "Location", "Login", "Duration", "Status"]}>
          {[...sessions]
            .sort((a, b) => +new Date(b.loginAt) - +new Date(a.loginAt))
            .map((s) => (
              <tr key={s.id} className="hover:bg-surface-alt/40">
                <td className="px-5 py-4">
                  <p className="font-semibold text-foreground">{s.device}</p>
                  <p className="text-xs text-muted-foreground">{s.browser} · {s.os}</p>
                </td>
                <td className="px-5 py-4 text-sm text-muted-foreground">
                  {s.city}, {s.country}
                  <span className="block font-mono text-[11px]">{s.ip}</span>
                </td>
                <td className="px-5 py-4 text-sm text-muted-foreground">{fmtDateTime(s.loginAt)}</td>
                <td className="px-5 py-4 text-sm text-muted-foreground">{s.durationMin} min</td>
                <td className="px-5 py-4">
                  {s.status === "active" ? (
                    <button
                      onClick={() => toast.success("Session terminated")}
                      className="inline-flex items-center gap-1.5 rounded-full border border-error/30 bg-error/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-error hover:bg-error/20"
                    >
                      Force logout
                    </button>
                  ) : (
                    <span className="inline-flex rounded-full bg-surface-alt px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Ended
                    </span>
                  )}
                </td>
              </tr>
            ))}
        </TableCard>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Activity log                                                        */
/* ------------------------------------------------------------------ */

function ActivityTab({ user, quizSessions }: { user: AdminUser; quizSessions: AdminQuizSession[] }) {
  const entries = useMemo(() => {
    const rnd = seeded(hash(user.id) + 91);
    const ip = () => `${10 + Math.floor(rnd() * 240)}.${Math.floor(rnd() * 255)}.${Math.floor(rnd() * 255)}.${Math.floor(rnd() * 255)}`;
    const loc = `${user.city}, ${user.country}`;
    const out: { text: string; when: string; meta: string }[] = [];

    [...quizSessions]
      .sort((a, b) => +new Date(b.date) - +new Date(a.date))
      .slice(0, 4)
      .forEach((s) => {
        out.push({
          text: s.status === "completed" ? `Completed quiz “${s.bankName}” (${s.scorePct}%)` : `Started quiz “${s.bankName}”`,
          when: fmtDateTime(s.date),
          meta: `${ip()} · ${loc}`,
        });
      });

    const base = Date.now();
    const synth = [
      { text: "Signed in", off: 0 },
      { text: "Updated profile (specialty)", off: 2 },
      { text: user.status === "trial" ? "Trial started" : `Subscription ${user.status === "expired" ? "expired" : "renewed"}`, off: 5 },
      { text: "Password changed", off: 9 },
    ];
    synth.forEach((e) => {
      out.push({
        text: e.text,
        when: fmtDateTime(new Date(base - e.off * 86_400_000).toISOString()),
        meta: `${ip()} · ${loc}`,
      });
    });

    return out.slice(0, 8);
  }, [user, quizSessions]);

  return (
    <div className="rounded-2xl border border-border bg-surface p-6 shadow-[var(--shadow-card)]">
      <h3 className="mb-4 text-base font-bold text-foreground">Activity log</h3>
      <div className="relative space-y-5 border-l-2 border-border pl-4">
        {entries.map((e, i) => (
          <div key={i} className="relative">
            <span className="absolute -left-[23px] top-1 h-3 w-3 rounded-full bg-primary ring-4 ring-surface" />
            <p className="text-sm font-medium text-foreground">{e.text}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{e.when}</p>
            <p className="font-mono text-[11px] text-muted-foreground">{e.meta}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Override modal                                                      */
/* ------------------------------------------------------------------ */

function OverrideModal({ user, onClose }: { user: AdminUser; onClose: () => void }) {
  const [plan, setPlan] = useState<string>(user.plan === "—" ? "Monthly" : user.plan);
  const [endDate, setEndDate] = useState(user.planEndsAt ? user.planEndsAt.slice(0, 10) : "");
  const [reason, setReason] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-16" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-surface shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <header className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
          <h3 className="text-base font-bold text-foreground">Override subscription</h3>
          <button onClick={onClose} aria-label="Close" className="rounded-md p-1 text-muted-foreground hover:bg-surface-alt hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </header>
        <div className="space-y-4 px-5 py-4">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-foreground">Plan</span>
            <select
              value={plan}
              onChange={(e) => setPlan(e.target.value)}
              className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            >
              {["Monthly", "3-Month", "6-Month", "12-Month", "Trial"].map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-foreground">End date</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-foreground">Reason</span>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="Why are you overriding this subscription?"
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </label>
        </div>
        <footer className="flex justify-end gap-2 border-t border-border px-5 py-3">
          <button onClick={onClose} className="inline-flex h-10 items-center rounded-lg border border-border bg-surface px-4 text-sm font-semibold text-foreground hover:bg-surface-alt">
            Cancel
          </button>
          <button
            onClick={() => {
              toast.success(`Subscription overridden to ${plan} for ${user.name}`);
              onClose();
            }}
            className="inline-flex h-10 items-center rounded-lg bg-accent px-4 text-sm font-semibold text-accent-foreground hover:bg-accent/90"
          >
            Apply override
          </button>
        </footer>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Small UI bits                                                       */
/* ------------------------------------------------------------------ */

function InfoRow({ icon: Icon, label, children }: { icon: typeof Monitor; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <dt className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</dt>
        <dd className="mt-0.5">{children}</dd>
      </div>
    </div>
  );
}

function ActionBtn({
  icon: Icon,
  children,
  onClick,
  tone = "default",
}: {
  icon: typeof Pencil;
  children: React.ReactNode;
  onClick: () => void;
  tone?: "default" | "warning" | "error";
}) {
  const cls =
    tone === "warning"
      ? "border-warning/30 bg-warning/10 text-warning hover:bg-warning/20"
      : tone === "error"
        ? "border-error/30 bg-error/10 text-error hover:bg-error/20"
        : "border-border bg-surface text-foreground hover:bg-surface-alt";
  return (
    <button onClick={onClick} className={`flex w-full items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors ${cls}`}>
      <Icon className="h-4 w-4" /> {children}
    </button>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className={`mt-2 text-3xl font-extrabold tracking-tight tabular-nums ${accent ? "text-primary" : "text-foreground"}`}>{value}</p>
    </div>
  );
}

function Meter({ label, value, max, suffix }: { label: string; value: number; max: number; suffix: string }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-bold tabular-nums text-foreground">
          {value} {suffix}
        </span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-surface-alt">
        <div className="h-full rounded-full bg-gradient-to-r from-warning to-accent" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function TableCard({ head, children }: { head: string[]; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-surface shadow-[var(--shadow-card)]">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="border-b border-border bg-surface-alt/40 text-[10px] uppercase tracking-widest text-muted-foreground">
          <tr>
            {head.map((h) => (
              <th key={h} className="px-5 py-3 font-bold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">{children}</tbody>
      </table>
    </div>
  );
}

function EmptyState({ label, hint }: { label: string; hint: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-12 text-center shadow-[var(--shadow-card)]">
      <p className="text-sm font-semibold text-foreground">{label}</p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}
