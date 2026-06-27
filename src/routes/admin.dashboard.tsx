import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  Users,
  CreditCard,
  TrendingUp,
  FileText,
  Activity,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  UploadCloud,
  BookOpen,
  UserCog,
  ClipboardList,
} from "lucide-react";
import { GradientKpiCard } from "@/components/shared/GradientKpiCard";
import {
  useAdminDashboard,
  useNewUsersAnalytics,
  usePlanDistributionAnalytics,
  useSpecialtyAnalytics,
  useStatusCountsAnalytics,
  planLabel,
  dayLabel,
  CHART_PALETTE,
} from "@/api/admin-analytics.api";
import { useProtectionSummary } from "@/api/protection.api";
import { useAuthStore } from "@/stores/authStore";
import { AdminDashboardSkeleton } from "@/components/shared/DashboardSkeletons";

export const Route = createFileRoute("/admin/dashboard")({
  head: () => ({
    meta: [{ title: "Admin · Dashboard — Medinovaqbank" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminDashboard,
});

// ─── Static / stable data ────────────────────────────────────────────────────

const CHART_COLORS = CHART_PALETTE;

const tonePill: Record<string, string> = {
  success: "bg-[color-mix(in_srgb,var(--color-accent)_12%,transparent)] text-[var(--color-accent)]",
  info: "bg-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] text-[var(--color-primary)]",
  warn: "bg-amber-500/10 text-amber-500",
  danger: "bg-rose-500/10 text-rose-500",
};

const toneLabel: Record<string, string> = {
  success: "Success",
  info: "Info",
  warn: "Warning",
  danger: "Alert",
};

// ── Activity-feed derivation (from ActivityLog rows). ──

type ActivityTone = "success" | "info" | "warn" | "danger";

function activityTone(action: string): ActivityTone {
  const a = action.toLowerCase();
  if (/(delete|ban|suspend|flag|fail|revoke)/.test(a)) return "danger";
  if (/(warn|expire|cancel)/.test(a)) return "warn";
  if (/(create|register|activate|publish|subscribe|success|reactivate)/.test(a)) return "success";
  return "info";
}

function activityIcon(entityType: string) {
  const e = entityType.toLowerCase();
  if (e.includes("user")) return Users;
  if (e.includes("subscription") || e.includes("transaction") || e.includes("payment"))
    return CreditCard;
  if (e.includes("bank") || e.includes("question") || e.includes("note")) return BookOpen;
  if (e.includes("flag")) return AlertTriangle;
  return Activity;
}

/** `user.suspended` / `USER_CREATED` -> `User suspended` / `User created`. */
function humanizeAction(action: string): string {
  const words = action
    .replace(/[._-]+/g, " ")
    .trim()
    .toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** Compact relative-time label from an ISO timestamp. */
function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const diff = Math.max(0, Date.now() - then);
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  return `${days}d ago`;
}

const axisStroke = "var(--color-muted-foreground)";
const gridStroke = "var(--color-border)";
const tooltipStyle = {
  backgroundColor: "var(--color-surface)",
  border: "1px solid var(--color-border)",
  borderRadius: "12px",
  color: "var(--color-foreground)",
  boxShadow: "var(--shadow-card-hover)",
  fontSize: "12px",
};

// ─── Main component ───────────────────────────────────────────────────────────

function AdminDashboard() {
  const user = useAuthStore((s) => s.user);
  const protectionSummaryQ = useProtectionSummary();

  const dashboardQ = useAdminDashboard();
  const statusQ = useStatusCountsAnalytics();
  const planDistQ = usePlanDistributionAnalytics();
  const newUsersQ = useNewUsersAnalytics();
  const specialtyQ = useSpecialtyAnalytics();

  const isLoading = dashboardQ.isLoading;
  const error = dashboardQ.error;

  if (isLoading) return <AdminDashboardSkeleton />;

  if (error || !dashboardQ.data) {
    return (
      <div className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-8 text-center">
        <AlertTriangle className="mx-auto h-8 w-8 text-rose-500" />
        <p className="mt-3 text-sm font-semibold text-foreground">Failed to load dashboard</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {error instanceof Error ? error.message : "Please try again."}
        </p>
        <button
          type="button"
          onClick={() => dashboardQ.refetch()}
          className="mt-4 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface-alt"
        >
          Retry
        </button>
      </div>
    );
  }

  const d = dashboardQ.data;

  // KPI values from the platform dashboard.
  const totalUsers = d.totalUsers;
  const activeCount = d.activeUsers;
  const monthlyRevTotal = d.totalRevenue;
  const revDisplay =
    monthlyRevTotal >= 1000
      ? `GHS ${(monthlyRevTotal / 1000).toFixed(1)}k`
      : `GHS ${monthlyRevTotal}`;

  // Status counts (analytics/status-counts) with dashboard fallbacks.
  const sc = statusQ.data;
  const trialCount = sc?.trialUsers ?? 0;
  const subscribedCount = sc?.subscribedUsers ?? d.activeSubscriptions;
  const inactiveCount = sc?.inactiveUsers ?? Math.max(0, totalUsers - activeCount);
  const verifiedCount = sc?.emailVerifiedUsers ?? 0;

  // New-user daily series -> bar chart {month: day, users: count}.
  const newUsersSeries = (newUsersQ.data?.series ?? []).map((p) => ({
    month: dayLabel(p.day),
    users: p.count,
  }));

  // Plan distribution (active subscriptions by plan) -> pie {name, value, pct}.
  const totalActivePlans = planDistQ.data?.totalActive ?? 0;
  const planBreakdown = (planDistQ.data?.activeByPlan ?? []).map((p) => ({
    name: planLabel(p.key),
    value: p.count,
    pct: totalActivePlans > 0 ? `${((p.count / totalActivePlans) * 100).toFixed(1)}%` : "0%",
  }));

  // Top 5 specialties by user count -> horizontal bar.
  const topSpecialties = (specialtyQ.data?.distribution ?? [])
    .slice()
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
    .map((s) => ({ specialty: s.key, count: s.count }));

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* ── Header ── */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
              Admin Dashboard
            </h1>
            <span className="rounded-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white shadow-sm">
              Super Admin
            </span>
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {user?.name ?? "Administrator"} ·{" "}
            {new Date().toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 self-start rounded-full border border-[var(--color-accent)]/30 bg-[color-mix(in_srgb,var(--color-accent)_10%,transparent)] px-3 py-1.5 text-xs font-semibold text-[var(--color-accent)] sm:self-auto">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--color-accent)]" />
          System Status: All Operational
        </span>
      </header>

      {/* ── Top KPI row — 4 cards ── */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <GradientKpiCard
          gradient="teal"
          label="Total Users"
          value={totalUsers.toLocaleString()}
          icon={Users}
          sub={`+${d.newUsersThisMonth} this month`}
        />
        <GradientKpiCard
          gradient="emerald"
          label="Active Subscriptions"
          value={d.activeSubscriptions.toLocaleString()}
          icon={CreditCard}
          sub={`${activeCount.toLocaleString()} active users`}
        />
        <GradientKpiCard
          gradient="navy"
          label="Total Revenue"
          value={revDisplay}
          icon={TrendingUp}
          sub="all successful payments"
        />
        <GradientKpiCard
          gradient="indigo"
          label="Total Questions"
          value={d.totalQuestions.toLocaleString()}
          icon={FileText}
          sub={`${d.totalBanks} question banks`}
        />
      </section>

      {/* ── Main 2/3 + 1/3 layout ── */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* ── Left column (2/3) ── */}
        <div className="space-y-6 lg:col-span-2">
          {/* New users / day area chart */}
          <Panel title="New Users / Day" subtitle="Daily sign-ups — last 30 days">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={newUsersSeries}
                  margin={{ top: 4, right: 8, left: -16, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke={gridStroke} vertical={false} />
                  <XAxis
                    dataKey="month"
                    stroke={axisStroke}
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    interval={4}
                  />
                  <YAxis
                    stroke={axisStroke}
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(v: number) => [v, "New users"]}
                    cursor={{ stroke: gridStroke, strokeDasharray: "4 4" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="users"
                    stroke="var(--color-primary)"
                    strokeWidth={2.5}
                    fill="url(#revGrad)"
                    dot={false}
                    activeDot={{
                      r: 5,
                      fill: "var(--color-primary)",
                      stroke: "var(--color-surface)",
                      strokeWidth: 2,
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          {/* New users bar chart (same daily series, complementary view) */}
          <Panel title="New User Registrations" subtitle="Daily new sign-ups — last 30 days">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={newUsersSeries} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid stroke={gridStroke} vertical={false} />
                  <XAxis
                    dataKey="month"
                    stroke={axisStroke}
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    interval={4}
                  />
                  <YAxis stroke={axisStroke} fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(v: number) => [v, "New users"]}
                    cursor={{ fill: "var(--color-surface-alt)" }}
                  />
                  <Bar
                    dataKey="users"
                    fill="var(--color-accent)"
                    radius={[5, 5, 0, 0]}
                    maxBarSize={32}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          {/* Top specialties horizontal bar chart */}
          <Panel title="Top Specialties" subtitle="User distribution by specialty (top 5)">
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topSpecialties}
                  layout="vertical"
                  margin={{ top: 0, right: 16, left: 8, bottom: 0 }}
                >
                  <CartesianGrid stroke={gridStroke} horizontal={false} />
                  <XAxis
                    type="number"
                    stroke={axisStroke}
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="specialty"
                    stroke={axisStroke}
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    width={96}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(v: number) => [v, "Users"]}
                    cursor={{ fill: "var(--color-surface-alt)" }}
                  />
                  <Bar
                    dataKey="count"
                    fill="var(--color-primary)"
                    radius={[0, 5, 5, 0]}
                    maxBarSize={22}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          {/* Platform session stats */}
          <Panel
            title="Session Activity"
            subtitle="Quiz sessions across the platform"
            right={
              <Link
                to="/admin/users"
                className="text-xs font-semibold text-[var(--color-primary)] hover:underline"
              >
                Manage →
              </Link>
            }
          >
            <div className="grid grid-cols-3 gap-2">
              <StatusPill
                label="Total"
                count={d.totalSessions}
                color="bg-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] text-[var(--color-primary)]"
              />
              <StatusPill
                label="Completed"
                count={d.completedSessions}
                color="bg-[color-mix(in_srgb,var(--color-accent)_15%,transparent)] text-[var(--color-accent)]"
              />
              <StatusPill
                label="Pending Flags"
                count={d.pendingFlags}
                color="bg-rose-500/10 text-rose-500"
              />
            </div>
          </Panel>
        </div>

        {/* ── Right column (1/3) ── */}
        <div className="space-y-6">
          {/* Subscription breakdown pie */}
          <Panel title="Subscription Plans" subtitle="Distribution by plan type">
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={planBreakdown}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={52}
                    outerRadius={78}
                    paddingAngle={3}
                    stroke="var(--color-surface)"
                    strokeWidth={2}
                  >
                    {planBreakdown.map((entry, i) => (
                      <Cell key={entry.name} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(v: number, name: string) => [v, name]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="mt-1 space-y-2">
              {planBreakdown.map((p, i) => (
                <li key={p.name} className="flex items-center gap-2 text-xs">
                  <span
                    className="h-2.5 w-2.5 flex-shrink-0 rounded-sm"
                    style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}
                  />
                  <span className="flex-1 text-muted-foreground">{p.name}</span>
                  <span className="font-bold text-foreground">{p.value}</span>
                  <span className="text-muted-foreground">{p.pct}</span>
                </li>
              ))}
            </ul>
          </Panel>

          {/* User status breakdown */}
          <Panel title="User Status" subtitle="Account state breakdown">
            <div className="grid grid-cols-2 gap-2">
              <StatusPill
                label="Active"
                count={activeCount}
                color="bg-[color-mix(in_srgb,var(--color-accent)_15%,transparent)] text-[var(--color-accent)]"
              />
              <StatusPill label="Trial" count={trialCount} color="bg-amber-500/10 text-amber-500" />
              <StatusPill
                label="Subscribed"
                count={subscribedCount}
                color="bg-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] text-[var(--color-primary)]"
              />
              <StatusPill
                label="Inactive"
                count={inactiveCount}
                color="bg-slate-500/10 text-slate-400"
              />
              <StatusPill
                label="Verified"
                count={verifiedCount}
                color="bg-surface-alt text-muted-foreground"
              />
              <StatusPill
                label="Total"
                count={totalUsers}
                color="bg-[color-mix(in_srgb,var(--color-primary)_15%,transparent)] text-[var(--color-primary)]"
              />
            </div>
          </Panel>

          {/* Content protection summary */}
          <Panel title="Content Protection" subtitle="Security event summary">
            <div className="space-y-2">
              <MetricRow
                icon={<Shield className="h-4 w-4 text-[var(--color-primary)]" />}
                label="Total Events"
                value={String(protectionSummaryQ.data?.totalViolations ?? 0)}
              />
              <MetricRow
                icon={<AlertTriangle className="h-4 w-4 text-amber-500" />}
                label="Screenshot Attempts"
                value={String(protectionSummaryQ.data?.screenshotAttempts ?? 0)}
              />
              <MetricRow
                icon={<CheckCircle className="h-4 w-4 text-[var(--color-accent)]" />}
                label="Active Restrictions"
                value={String(protectionSummaryQ.data?.activeRestrictions ?? 0)}
              />
            </div>
            <Link
              to="/admin/restrictions"
              className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl border border-[var(--color-primary)]/30 py-2.5 text-sm font-semibold text-[var(--color-primary)] transition-colors hover:bg-[color-mix(in_srgb,var(--color-primary)_6%,transparent)]"
            >
              <Shield className="h-4 w-4" />
              Manage Restrictions
            </Link>
          </Panel>

          {/* Recent activity feed */}
          <Panel
            title="Recent Activity"
            subtitle="Live platform feed"
            right={
              <Link
                to="/admin/audit-logs"
                className="text-xs font-semibold text-[var(--color-primary)] hover:underline"
              >
                View all →
              </Link>
            }
          >
            {d.recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent activity.</p>
            ) : (
              <ul className="space-y-3">
                {d.recentActivity.slice(0, 6).map((a) => {
                  const tone = activityTone(a.action);
                  const Icon = activityIcon(a.entityType);
                  return (
                    <li key={a.id} className="flex items-start gap-3">
                      <span
                        className={`mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full ${tonePill[tone]}`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-1">
                          <p className="text-xs font-semibold leading-snug text-foreground">
                            {humanizeAction(a.action)}
                          </p>
                          <span
                            className={`flex-shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${tonePill[tone]}`}
                          >
                            {toneLabel[tone]}
                          </span>
                        </div>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {a.actorName ?? a.entityType}
                        </p>
                        <p className="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground/60">
                          <Clock className="h-2.5 w-2.5" />
                          {relativeTime(a.createdAt)}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>

          {/* Quick actions */}
          <div className="rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
            <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
              Quick Actions
            </h3>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <QuickAction
                to="/admin/notes"
                label="Upload Note"
                icon={<UploadCloud className="h-4 w-4" />}
              />
              <QuickAction
                to="/admin/banks"
                label="New Question Bank"
                icon={<BookOpen className="h-4 w-4" />}
              />
              <QuickAction
                to="/admin/users"
                label="Manage Users"
                icon={<UserCog className="h-4 w-4" />}
              />
              <QuickAction
                to="/admin/audit-logs"
                label="Audit Logs"
                icon={<ClipboardList className="h-4 w-4" />}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Helper components ────────────────────────────────────────────────────────

function Panel({
  title,
  subtitle,
  children,
  className = "",
  right,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  right?: React.ReactNode;
}) {
  return (
    <section
      className={`rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)] ${className}`}
    >
      <header className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-bold tracking-tight text-foreground">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        {right}
      </header>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function StatusPill({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div className={`flex flex-col items-center rounded-xl px-3 py-2.5 ${color}`}>
      <span className="text-lg font-extrabold leading-none">{count}</span>
      <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide opacity-80">
        {label}
      </span>
    </div>
  );
}

function MetricRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border bg-surface-alt px-4 py-3">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-sm font-medium text-foreground">{label}</span>
      </div>
      <span className="text-lg font-extrabold text-foreground">{value}</span>
    </div>
  );
}

function QuickAction({ to, label, icon }: { to: string; label: string; icon: React.ReactNode }) {
  return (
    <Link
      to={to}
      className="group flex flex-col items-center gap-2 rounded-xl border border-border bg-surface-alt px-3 py-3 text-center transition-all hover:-translate-y-0.5 hover:border-[var(--color-accent)]/40 hover:shadow-md"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--color-primary)]/10 to-[var(--color-accent)]/15 text-[var(--color-primary)] transition-transform group-hover:scale-110">
        {icon}
      </span>
      <span className="text-xs font-semibold leading-tight text-foreground">{label}</span>
    </Link>
  );
}
