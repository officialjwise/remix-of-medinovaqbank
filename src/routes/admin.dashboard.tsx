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
import { useShallow } from "zustand/react/shallow";
import { GradientKpiCard } from "@/components/shared/GradientKpiCard";
import { adminUsers } from "@/data/adminData";
import { usePlansStore } from "@/stores/plansStore";
import { useNotesStore } from "@/stores/notesStore";
import { useProtectionStore } from "@/stores/protectionStore";
import { useAuthStore } from "@/stores/authStore";
import { AdminDashboardSkeleton } from "@/components/shared/DashboardSkeletons";
import { useInitialLoad } from "@/hooks/useInitialLoad";

export const Route = createFileRoute("/admin/dashboard")({
  head: () => ({
    meta: [{ title: "Admin · Dashboard — Medinovaqbank" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminDashboard,
});

// ─── Static / stable data ────────────────────────────────────────────────────

const CHART_COLORS = ["#0E7C7B", "#2BC97F", "#0EA5E9", "#7C3AED", "#F97316"];

const monthlyRevenue = [
  { month: "Jan", revenue: 3200 },
  { month: "Feb", revenue: 3800 },
  { month: "Mar", revenue: 4100 },
  { month: "Apr", revenue: 3900 },
  { month: "May", revenue: 4600 },
  { month: "Jun", revenue: 5200 },
  { month: "Jul", revenue: 4800 },
  { month: "Aug", revenue: 5600 },
  { month: "Sep", revenue: 6100 },
  { month: "Oct", revenue: 5800 },
  { month: "Nov", revenue: 6400 },
  { month: "Dec", revenue: 7200 },
];

const userGrowth = [
  { month: "Jan", users: 41 },
  { month: "Feb", users: 55 },
  { month: "Mar", users: 48 },
  { month: "Apr", users: 63 },
  { month: "May", users: 72 },
  { month: "Jun", users: 58 },
  { month: "Jul", users: 81 },
  { month: "Aug", users: 94 },
  { month: "Sep", users: 87 },
  { month: "Oct", users: 103 },
  { month: "Nov", users: 116 },
  { month: "Dec", users: 129 },
];

const planBreakdown = [
  { name: "Monthly", value: 312, pct: "24.8%" },
  { name: "3-Month", value: 248, pct: "19.7%" },
  { name: "6-Month", value: 421, pct: "33.5%" },
  { name: "12-Month", value: 273, pct: "21.7%" },
];

const activityFeed = [
  {
    icon: Users,
    tone: "success" as const,
    label: "New user registered",
    detail: "Akua Mensah",
    time: "2m ago",
  },
  {
    icon: CreditCard,
    tone: "success" as const,
    label: "Subscription activated",
    detail: "Kwame Boateng (12-Month)",
    time: "15m ago",
  },
  {
    icon: BookOpen,
    tone: "info" as const,
    label: "Bank published",
    detail: "Cardiology Essentials",
    time: "1h ago",
  },
  {
    icon: Shield,
    tone: "warn" as const,
    label: "Protection event",
    detail: "Screenshot attempt detected",
    time: "2h ago",
  },
  {
    icon: FileText,
    tone: "info" as const,
    label: "Note uploaded",
    detail: "Acute Respiratory Failure",
    time: "3h ago",
  },
  {
    icon: AlertTriangle,
    tone: "danger" as const,
    label: "User flagged",
    detail: "Repeated violation — account reviewed",
    time: "4h ago",
  },
];

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
  const loading = useInitialLoad();
  const user = useAuthStore((s) => s.user);
  const plans = usePlansStore(useShallow((s) => s.plans));
  const notes = useNotesStore(useShallow((s) => s.notes));
  const protectionEvents = useProtectionStore(useShallow((s) => s.events));

  if (loading) return <AdminDashboardSkeleton />;

  // Derived counts — adminUsers is a static import, not reactive
  const totalUsers = adminUsers.length;
  const activeCount = adminUsers.filter((u) => u.status === "active").length;
  const trialCount = adminUsers.filter((u) => u.status === "trial").length;
  const expiredCount = adminUsers.filter((u) => u.status === "expired").length;
  const suspendedCount = adminUsers.filter((u) => u.status === "suspended").length;
  const noneCount = adminUsers.filter((u) => u.status === "none").length;

  const suspendedUsers = adminUsers.filter((u) => u.status === "suspended").slice(0, 3);

  // Monthly revenue from plansStore (price × subscribers per plan)
  const monthlyRevTotal = plans.reduce((acc, p) => acc + p.price * p.subscribers, 0);
  const revDisplay =
    monthlyRevTotal >= 1000
      ? `GHS ${(monthlyRevTotal / 1000).toFixed(1)}k`
      : `GHS ${monthlyRevTotal}`;

  // Notes that are active and ready
  const notesPublished = notes.filter((n) => n.active && n.status === "ready").length;

  // Top 5 specialties by user count
  const specialtyCounts: Record<string, number> = {};
  for (const u of adminUsers) {
    if (u.specialty) specialtyCounts[u.specialty] = (specialtyCounts[u.specialty] ?? 0) + 1;
  }
  const topSpecialties = Object.entries(specialtyCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([specialty, count]) => ({ specialty, count }));

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
            {user?.name ?? "Administrator"} · 26 Jun 2026
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
          value={String(totalUsers)}
          icon={Users}
          trend={{ value: "+12% this month", up: true }}
        />
        <GradientKpiCard
          gradient="emerald"
          label="Active Subscribers"
          value={String(activeCount)}
          icon={CreditCard}
          trend={{ value: "+8% this week", up: true }}
        />
        <GradientKpiCard
          gradient="navy"
          label="Monthly Revenue"
          value={revDisplay}
          icon={TrendingUp}
          trend={{ value: "+18% vs last month", up: true }}
        />
        <GradientKpiCard
          gradient="indigo"
          label="Notes Published"
          value={String(notesPublished)}
          icon={FileText}
          trend={{ value: "+3 this week", up: true }}
        />
      </section>

      {/* ── Main 2/3 + 1/3 layout ── */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* ── Left column (2/3) ── */}
        <div className="space-y-6 lg:col-span-2">
          {/* Revenue area chart */}
          <Panel title="Revenue Overview" subtitle="Monthly revenue — Jan to Dec 2026">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={monthlyRevenue}
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
                  />
                  <YAxis
                    stroke={axisStroke}
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v: number) => `${v / 1000}k`}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(v: number) => [`GHS ${v.toLocaleString()}`, "Revenue"]}
                    cursor={{ stroke: gridStroke, strokeDasharray: "4 4" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
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

          {/* User growth bar chart */}
          <Panel title="New User Registrations" subtitle="Monthly new sign-ups — 2026">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={userGrowth} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid stroke={gridStroke} vertical={false} />
                  <XAxis
                    dataKey="month"
                    stroke={axisStroke}
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
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

          {/* Recent flagged users */}
          <Panel
            title="Flagged Users"
            subtitle="Accounts with suspended status"
            right={
              <Link
                to="/admin/users"
                className="text-xs font-semibold text-[var(--color-primary)] hover:underline"
              >
                View all →
              </Link>
            }
          >
            {suspendedUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No suspended users.</p>
            ) : (
              <ul className="divide-y divide-border">
                {suspendedUsers.map((u) => (
                  <li key={u.id} className="flex items-center justify-between gap-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-rose-500/10 text-xs font-bold text-rose-500">
                        {u.initials}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground">{u.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-rose-500/10 px-2.5 py-0.5 text-[11px] font-semibold capitalize text-rose-500">
                        {u.status}
                      </span>
                      <Link
                        to="/admin/users"
                        className="rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-[var(--color-primary)]/40 hover:text-foreground"
                      >
                        View
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
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
                label="Expired"
                count={expiredCount}
                color="bg-slate-500/10 text-slate-400"
              />
              <StatusPill
                label="Suspended"
                count={suspendedCount}
                color="bg-rose-500/10 text-rose-500"
              />
              <StatusPill
                label="None"
                count={noneCount}
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
                value={String(protectionEvents.length)}
              />
              <MetricRow
                icon={<AlertTriangle className="h-4 w-4 text-amber-500" />}
                label="Strike Threshold"
                value="3"
              />
              <MetricRow
                icon={<CheckCircle className="h-4 w-4 text-[var(--color-accent)]" />}
                label="Locked Users"
                value="0"
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
            <ul className="space-y-3">
              {activityFeed.map((a, i) => {
                const Icon = a.icon;
                return (
                  <li key={i} className="flex items-start gap-3">
                    <span
                      className={`mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full ${tonePill[a.tone]}`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-1">
                        <p className="text-xs font-semibold leading-snug text-foreground">
                          {a.label}
                        </p>
                        <span
                          className={`flex-shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${tonePill[a.tone]}`}
                        >
                          {toneLabel[a.tone]}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">{a.detail}</p>
                      <p className="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground/60">
                        <Clock className="h-2.5 w-2.5" />
                        {a.time}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
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
