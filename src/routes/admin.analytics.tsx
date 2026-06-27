import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  BookOpen,
  CalendarDays,
  Clock,
  CreditCard,
  Download,
  GraduationCap,
  Layers,
  Target,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { GradientKpiCard } from "@/components/shared/GradientKpiCard";
import { subjectTheme } from "@/data/subjectColors";
import {
  CHART_PALETTE,
  dayLabel,
  difficultyLabel,
  monthLabel,
  planLabel,
  statusLabel,
  useAnalyticsDashboard,
  useChurnAnalytics,
  useCompletionRateAnalytics,
  useContentAnalytics,
  useEngagementAnalytics,
  useNewUsersAnalytics,
  usePlanDistributionAnalytics,
  useQuizPerformanceAnalytics,
  useStatusCountsAnalytics,
  type BackendQuestionPerformance,
} from "@/api/admin-analytics.api";

export const Route = createFileRoute("/admin/analytics")({
  head: () => ({
    meta: [{ title: "Admin · Analytics — Medinovaqbank" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminAnalytics,
});

/* ------------------------------------------------------------------ */
/* Shared chart styling                                                */
/* ------------------------------------------------------------------ */

const axisStroke = "var(--color-muted-foreground)";
const gridStroke = "var(--color-border)";
const tooltipStyle = {
  backgroundColor: "var(--color-surface)",
  border: "1px solid var(--color-border)",
  borderRadius: "10px",
  color: "var(--color-foreground)",
  boxShadow: "var(--shadow-card-hover)",
};

const palette = {
  teal: "#0E7C7B",
  emerald: "#2BC97F",
  blue: "#3B82F6",
  amber: "#E89A1A",
  violet: "#7C3AED",
  rose: "#E11D48",
  success: "#1FA968",
} as const;

const cardClass = "rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)]";

const GHS = (n: number) => `GHS ${n.toLocaleString("en-GH", { maximumFractionDigits: 0 })}`;

/* ------------------------------------------------------------------ */
/* CSV export helper                                                   */
/* ------------------------------------------------------------------ */

function exportCsv(filename: string, rows: Record<string, unknown>[]) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(",")),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/* ------------------------------------------------------------------ */
/* Local helper components                                             */
/* ------------------------------------------------------------------ */

function Panel({
  title,
  subtitle,
  exportData,
  exportName,
  className,
  children,
}: {
  title: string;
  subtitle?: string;
  exportData?: Record<string, unknown>[];
  exportName?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={`${cardClass} ${className ?? ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold tracking-tight text-foreground">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        {exportData && exportData.length > 0 && (
          <button
            type="button"
            onClick={() => exportCsv(`${exportName ?? "export"}.csv`, exportData)}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border bg-surface-alt px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <Download className="h-3.5 w-3.5" />
            CSV
          </button>
        )}
      </div>
      {children}
    </section>
  );
}

function Metric({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className={cardClass}>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function Ring({ label, value, color }: { label: string; value: number; color: string }) {
  const r = 42;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  return (
    <div className={`${cardClass} flex flex-col items-center`}>
      <div className="relative h-32 w-32">
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
          <circle
            cx="50"
            cy="50"
            r={r}
            fill="none"
            stroke="var(--color-surface-alt)"
            strokeWidth="8"
          />
          <circle
            cx="50"
            cy="50"
            r={r}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-bold tabular-nums text-foreground">{value}%</span>
        </div>
      </div>
      <p className="mt-3 text-sm font-semibold text-foreground">{label}</p>
      <p className="text-xs text-muted-foreground">avg score</p>
    </div>
  );
}

function ChartState({
  loading,
  error,
  empty,
  emptyLabel,
}: {
  loading: boolean;
  error: boolean;
  empty: boolean;
  emptyLabel?: string;
}) {
  return (
    <div className="flex h-full items-center justify-center">
      <p className={`text-sm ${error ? "text-error" : "text-muted-foreground"}`}>
        {error
          ? "Failed to load."
          : loading
            ? "Loading…"
            : empty
              ? (emptyLabel ?? "No data yet.")
              : ""}
      </p>
    </div>
  );
}

const TABS = [
  "Overview",
  "User Engagement",
  "Revenue",
  "Quiz Performance",
  "Subject & Content",
] as const;
type Tab = (typeof TABS)[number];

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

function AdminAnalytics() {
  const [tab, setTab] = useState<Tab>("Overview");

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Platform Analytics</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Engagement, retention, revenue, and content performance across the cohort.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`relative px-3 py-2 text-sm font-medium transition-colors ${
              tab === t ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t}
            {tab === t && (
              <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-[#0E7C7B]" />
            )}
          </button>
        ))}
      </div>

      {tab === "Overview" && <OverviewTab />}
      {tab === "User Engagement" && <EngagementTab />}
      {tab === "Revenue" && <RevenueTab />}
      {tab === "Quiz Performance" && <QuizTab />}
      {tab === "Subject & Content" && <ContentTab />}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Overview                                                            */
/* ------------------------------------------------------------------ */

function OverviewTab() {
  const dashboard = useAnalyticsDashboard();
  const statusCounts = useStatusCountsAnalytics();
  const newUsers = useNewUsersAnalytics();
  const completion = useCompletionRateAnalytics();

  const d = dashboard.data;

  const newUsersDaily = useMemo(
    () => (newUsers.data?.series ?? []).map((p) => ({ day: dayLabel(p.day), users: p.count })),
    [newUsers.data],
  );

  const completionRate = useMemo(
    () =>
      (completion.data?.series ?? []).map((p) => ({
        day: dayLabel(p.day),
        rate: Math.round(p.rate),
      })),
    [completion.data],
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <GradientKpiCard
          label="Total Users"
          value={dashboard.isLoading ? "—" : (d?.totalUsers ?? 0).toLocaleString()}
          icon={Users}
          gradient="teal"
        />
        <GradientKpiCard
          label="Active Subscriptions"
          value={dashboard.isLoading ? "—" : (d?.activeSubscriptions ?? 0).toLocaleString()}
          icon={CreditCard}
          gradient="emerald"
        />
        <GradientKpiCard
          label="Trial Users"
          value={
            statusCounts.isLoading ? "—" : (statusCounts.data?.trialUsers ?? 0).toLocaleString()
          }
          icon={Activity}
          gradient="amber"
        />
        <GradientKpiCard
          label="Total Revenue"
          value={dashboard.isLoading ? "—" : GHS(d?.totalRevenue ?? 0)}
          icon={Wallet}
          gradient="blue"
        />
        <GradientKpiCard
          label="Total Questions"
          value={dashboard.isLoading ? "—" : (d?.totalQuestions ?? 0).toLocaleString()}
          icon={BookOpen}
          gradient="violet"
        />
        <GradientKpiCard
          label="Active Users"
          value={dashboard.isLoading ? "—" : (d?.activeUsers ?? 0).toLocaleString()}
          icon={GraduationCap}
          gradient="rose"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel
          title="New Users / Day"
          subtitle="Last 30 days"
          exportData={newUsersDaily}
          exportName="new-users-daily"
        >
          <div className="mt-4 h-72 w-full">
            {newUsers.isLoading || newUsers.isError || newUsersDaily.length === 0 ? (
              <ChartState
                loading={newUsers.isLoading}
                error={newUsers.isError}
                empty={newUsersDaily.length === 0}
              />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={newUsersDaily}>
                  <defs>
                    <linearGradient id="gNewUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={palette.teal} stopOpacity={0.4} />
                      <stop offset="100%" stopColor={palette.teal} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                  <XAxis
                    dataKey="day"
                    stroke={axisStroke}
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    interval={4}
                  />
                  <YAxis stroke={axisStroke} fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: gridStroke }} />
                  <Area
                    type="monotone"
                    dataKey="users"
                    stroke={palette.teal}
                    strokeWidth={2.5}
                    fill="url(#gNewUsers)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </Panel>

        <Panel
          title="Session Completion Rate"
          subtitle="% of started sessions completed"
          exportData={completionRate}
          exportName="completion-rate"
        >
          <div className="mt-4 h-72 w-full">
            {completion.isLoading || completion.isError || completionRate.length === 0 ? (
              <ChartState
                loading={completion.isLoading}
                error={completion.isError}
                empty={completionRate.length === 0}
              />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={completionRate}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                  <XAxis
                    dataKey="day"
                    stroke={axisStroke}
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    interval={4}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tickFormatter={(v) => `${v}%`}
                    stroke={axisStroke}
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    formatter={(v: number) => `${v}%`}
                    contentStyle={tooltipStyle}
                    cursor={{ stroke: gridStroke }}
                  />
                  <Line
                    type="monotone"
                    dataKey="rate"
                    stroke={palette.emerald}
                    strokeWidth={2.5}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* User Engagement                                                     */
/* ------------------------------------------------------------------ */

function EngagementTab() {
  const engagement = useEngagementAnalytics();
  const completion = useCompletionRateAnalytics();
  const e = engagement.data;

  const dailyActive = useMemo(
    () => (e?.dailyActiveSeries ?? []).map((p) => ({ day: dayLabel(p.day), active: p.count })),
    [e],
  );

  const cumulativeGrowth = useMemo(() => {
    let total = 0;
    return (e?.dailyActiveSeries ?? []).map((p) => {
      total += p.count;
      return { day: dayLabel(p.day), total };
    });
  }, [e]);

  const newVsReturning = useMemo(
    () => (e ? [{ segment: "Current period", new: e.newUsers, returning: e.returningUsers }] : []),
    [e],
  );

  const dropout = useMemo(() => {
    const c = completion.data;
    if (!c) return [];
    return [{ segment: "All sessions", completed: c.totalCompleted, abandoned: c.totalAbandoned }];
  }, [completion.data]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Metric
          label="Daily Active Users (DAU)"
          value={engagement.isLoading ? "—" : (e?.dau ?? 0).toLocaleString()}
          hint={e ? `Stickiness ${Math.round(e.stickiness)}%` : undefined}
        />
        <Metric
          label="Weekly Active Users (WAU)"
          value={engagement.isLoading ? "—" : (e?.wau ?? 0).toLocaleString()}
          hint={e ? `${e.returningUsers.toLocaleString()} returning` : undefined}
        />
        <Metric
          label="Monthly Active Users (MAU)"
          value={engagement.isLoading ? "—" : (e?.mau ?? 0).toLocaleString()}
          hint={e ? `${e.newUsers.toLocaleString()} new this period` : undefined}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel
          title="Daily Active Users"
          subtitle="Active users per day"
          exportData={dailyActive}
          exportName="daily-active"
        >
          <div className="mt-4 h-72 w-full">
            {engagement.isLoading || engagement.isError || dailyActive.length === 0 ? (
              <ChartState
                loading={engagement.isLoading}
                error={engagement.isError}
                empty={dailyActive.length === 0}
              />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyActive}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                  <XAxis
                    dataKey="day"
                    stroke={axisStroke}
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    interval={4}
                  />
                  <YAxis stroke={axisStroke} fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: gridStroke }} />
                  <Line
                    type="monotone"
                    dataKey="active"
                    stroke={palette.amber}
                    strokeWidth={2.5}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </Panel>

        <Panel
          title="Session Dropout"
          subtitle="Completed vs abandoned sessions"
          exportData={dropout}
          exportName="dropout"
        >
          <div className="mt-4 h-72 w-full">
            {completion.isLoading || completion.isError || dropout.length === 0 ? (
              <ChartState
                loading={completion.isLoading}
                error={completion.isError}
                empty={dropout.length === 0}
              />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dropout}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                  <XAxis
                    dataKey="segment"
                    stroke={axisStroke}
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis stroke={axisStroke} fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    cursor={{ fill: "var(--color-surface-alt)" }}
                  />
                  <Bar
                    dataKey="completed"
                    name="Completed"
                    fill={palette.success}
                    radius={[4, 4, 0, 0]}
                    barSize={60}
                  />
                  <Bar
                    dataKey="abandoned"
                    name="Abandoned"
                    fill={palette.rose}
                    radius={[4, 4, 0, 0]}
                    barSize={60}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel
          title="New vs Returning Users"
          subtitle="Current period"
          exportData={newVsReturning}
          exportName="new-vs-returning"
        >
          <div className="mt-4 h-72 w-full">
            {engagement.isLoading || engagement.isError || newVsReturning.length === 0 ? (
              <ChartState
                loading={engagement.isLoading}
                error={engagement.isError}
                empty={newVsReturning.length === 0}
              />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={newVsReturning}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                  <XAxis
                    dataKey="segment"
                    stroke={axisStroke}
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis stroke={axisStroke} fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    cursor={{ fill: "var(--color-surface-alt)" }}
                  />
                  <Bar
                    dataKey="new"
                    name="New"
                    fill={palette.blue}
                    radius={[3, 3, 0, 0]}
                    barSize={60}
                  />
                  <Bar
                    dataKey="returning"
                    name="Returning"
                    fill={palette.teal}
                    radius={[3, 3, 0, 0]}
                    barSize={60}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Panel>

        <Panel
          title="Cumulative Active Users"
          subtitle="Running sum of daily active counts"
          exportData={cumulativeGrowth}
          exportName="cumulative-growth"
        >
          <div className="mt-4 h-72 w-full">
            {engagement.isLoading || engagement.isError || cumulativeGrowth.length === 0 ? (
              <ChartState
                loading={engagement.isLoading}
                error={engagement.isError}
                empty={cumulativeGrowth.length === 0}
              />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={cumulativeGrowth}>
                  <defs>
                    <linearGradient id="gCumulative" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={palette.violet} stopOpacity={0.4} />
                      <stop offset="100%" stopColor={palette.violet} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                  <XAxis
                    dataKey="day"
                    stroke={axisStroke}
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    interval={4}
                  />
                  <YAxis stroke={axisStroke} fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: gridStroke }} />
                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke={palette.violet}
                    strokeWidth={2.5}
                    fill="url(#gCumulative)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Revenue                                                             */
/* ------------------------------------------------------------------ */

function RevenueTab() {
  const dashboard = useAnalyticsDashboard();
  const planDist = usePlanDistributionAnalytics();
  const churn = useChurnAnalytics();

  const d = dashboard.data;
  const totalRevenue = d?.totalRevenue ?? 0;
  const activeSubs = d?.activeSubscriptions ?? 0;
  const arpu = activeSubs > 0 ? Math.round(totalRevenue / activeSubs) : 0;

  const planDistribution = useMemo(
    () =>
      (planDist.data?.activeByPlan ?? []).map((p, i) => ({
        name: planLabel(p.key),
        value: p.count,
        fill: CHART_PALETTE[i % CHART_PALETTE.length],
      })),
    [planDist.data],
  );

  const churnSeries = useMemo(
    () =>
      (churn.data?.monthlyChurn ?? []).map((p) => ({
        month: monthLabel(p.month),
        cancelled: p.count,
      })),
    [churn.data],
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <GradientKpiCard
          label="Total Revenue"
          value={dashboard.isLoading ? "—" : GHS(totalRevenue)}
          sub="across all plans"
          icon={Wallet}
          gradient="teal"
        />
        <GradientKpiCard
          label="Active Subscriptions"
          value={dashboard.isLoading ? "—" : activeSubs.toLocaleString()}
          sub="currently paying"
          icon={CreditCard}
          gradient="emerald"
        />
        <GradientKpiCard
          label="ARPU"
          value={dashboard.isLoading ? "—" : GHS(arpu)}
          sub="revenue / active subscription"
          icon={Users}
          gradient="indigo"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Panel title="Plan Distribution" subtitle="Active subscriptions by plan">
          <div className="mt-4 h-64 w-full">
            {planDist.isLoading || planDist.isError || planDistribution.length === 0 ? (
              <ChartState
                loading={planDist.isLoading}
                error={planDist.isError}
                empty={planDistribution.length === 0}
              />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={planDistribution}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={3}
                    stroke="var(--color-surface)"
                    strokeWidth={2}
                  >
                    {planDistribution.map((p) => (
                      <Cell key={p.name} fill={p.fill} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          {!planDist.isLoading && planDistribution.length > 0 && (
            <div className="mt-2 grid grid-cols-2 gap-2">
              {planDistribution.map((p) => (
                <div key={p.name} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: p.fill }} />
                  {p.name}
                  <span className="ml-auto font-semibold tabular-nums text-foreground">
                    {p.value.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <div className="grid grid-cols-1 gap-6">
          <div className={cardClass}>
            <span className="text-xs font-medium text-muted-foreground">
              Subscriptions by Status
            </span>
            <div className="mt-3 space-y-2">
              {(planDist.data?.byStatus ?? []).map((s) => (
                <div
                  key={s.key}
                  className="flex items-center justify-between text-sm text-muted-foreground"
                >
                  <span>{statusLabel(s.key)}</span>
                  <span className="font-semibold tabular-nums text-foreground">
                    {s.count.toLocaleString()}
                  </span>
                </div>
              ))}
              {!planDist.isLoading && (planDist.data?.byStatus ?? []).length === 0 && (
                <p className="text-xs text-muted-foreground">No subscription data yet.</p>
              )}
            </div>
          </div>
          <div className={cardClass}>
            <span className="text-xs font-medium text-muted-foreground">Churn Rate (30d)</span>
            <p className="mt-2 text-3xl font-bold tracking-tight text-foreground">
              {churn.isLoading ? "—" : `${Math.round((churn.data?.churnRate ?? 0) * 10) / 10}%`}
            </p>
            <p className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
              <TrendingUp className="h-3.5 w-3.5" />
              {churn.data
                ? `${churn.data.cancelledLast30Days} cancelled · ${churn.data.expiredLast30Days} expired`
                : ""}
            </p>
          </div>
        </div>

        <Panel
          title="Monthly Churn"
          subtitle="Cancellations per month"
          exportData={churnSeries}
          exportName="churn"
        >
          <div className="mt-4 h-64 w-full">
            {churn.isLoading || churn.isError || churnSeries.length === 0 ? (
              <ChartState
                loading={churn.isLoading}
                error={churn.isError}
                empty={churnSeries.length === 0}
              />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={churnSeries}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                  <XAxis
                    dataKey="month"
                    stroke={axisStroke}
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis stroke={axisStroke} fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: gridStroke }} />
                  <Line
                    type="monotone"
                    dataKey="cancelled"
                    stroke={palette.rose}
                    strokeWidth={2.5}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Quiz Performance                                                    */
/* ------------------------------------------------------------------ */

function QuizTab() {
  const dashboard = useAnalyticsDashboard();
  const content = useContentAnalytics();
  const quiz = useQuizPerformanceAnalytics();

  const sortedBanks = useMemo(() => {
    const rows = content.data?.subjectPerformance ?? [];
    return rows
      .map((s) => ({
        subject: s.subject,
        avgScore: Math.round(s.accuracy),
        fill: subjectTheme(s.subject).hex,
      }))
      .sort((a, b) => b.avgScore - a.avgScore);
  }, [content.data]);

  const scoreByDifficulty = useMemo(
    () =>
      (quiz.data?.avgTimeByDifficulty ?? []).map((dd, i) => ({
        label: difficultyLabel(dd.key),
        // GAP: no per-difficulty accuracy; show relative time-spent as a proxy %.
        value: Math.min(100, Math.round((dd.avgTimeSeconds / 120) * 100)),
        color: CHART_PALETTE[i % CHART_PALETTE.length],
      })),
    [quiz.data],
  );

  const modeSplit = useMemo(
    () =>
      (quiz.data?.modeSplit ?? []).map((m, i) => ({
        name: statusLabel(m.key),
        value: m.count,
        fill: CHART_PALETTE[i % CHART_PALETTE.length],
      })),
    [quiz.data],
  );

  const totalSessions = dashboard.data?.totalSessions ?? 0;
  const questionsAnswered = useMemo(
    () => (quiz.data?.modeSplit ?? []).reduce((s, m) => s + m.count, 0),
    [quiz.data],
  );
  const platformAvgScore = Math.round(dashboard.data?.avgScore ?? 0);
  const avgTime = Math.round(quiz.data?.avgAnswerTimeSeconds ?? 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <GradientKpiCard
          label="Total Sessions"
          value={dashboard.isLoading ? "—" : totalSessions.toLocaleString()}
          sub="all banks"
          icon={Activity}
          gradient="teal"
        />
        <GradientKpiCard
          label="Questions Answered"
          value={quiz.isLoading ? "—" : questionsAnswered.toLocaleString()}
          sub="lifetime"
          icon={BookOpen}
          gradient="blue"
        />
        <GradientKpiCard
          label="Platform Avg Score"
          value={dashboard.isLoading ? "—" : `${platformAvgScore}%`}
          sub="across completed sessions"
          icon={Target}
          gradient="emerald"
        />
        <GradientKpiCard
          label="Avg Time / Question"
          value={quiz.isLoading ? "—" : `${avgTime}s`}
          sub="all sessions"
          icon={Clock}
          gradient="amber"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel
          title="Avg Score by Subject"
          subtitle="Correct-answer rate per subject"
          exportData={sortedBanks}
          exportName="score-by-subject"
        >
          <div className="mt-4 h-80 w-full">
            {content.isLoading || content.isError || sortedBanks.length === 0 ? (
              <ChartState
                loading={content.isLoading}
                error={content.isError}
                empty={sortedBanks.length === 0}
              />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sortedBanks} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke={gridStroke} />
                  <XAxis
                    type="number"
                    domain={[0, 100]}
                    tickFormatter={(v) => `${v}%`}
                    stroke={axisStroke}
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="subject"
                    stroke={axisStroke}
                    fontSize={11}
                    width={120}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    formatter={(v: number) => `${v}%`}
                    contentStyle={tooltipStyle}
                    cursor={{ fill: "var(--color-surface-alt)" }}
                  />
                  <Bar dataKey="avgScore" radius={[0, 4, 4, 0]} barSize={18}>
                    {sortedBanks.map((b) => (
                      <Cell key={b.subject} fill={b.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Panel>

        <Panel title="Avg Time by Difficulty" subtitle="Relative time spent per question">
          <div className="mt-4 grid grid-cols-3 gap-3">
            {quiz.isLoading || scoreByDifficulty.length === 0 ? (
              <div className="col-span-3">
                <ChartState
                  loading={quiz.isLoading}
                  error={quiz.isError}
                  empty={scoreByDifficulty.length === 0}
                />
              </div>
            ) : (
              scoreByDifficulty.map((dd) => (
                <Ring key={dd.label} label={dd.label} value={dd.value} color={dd.color} />
              ))
            )}
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Panel title="Tutor vs Quiz" subtitle="Sessions by mode" className="lg:col-span-1">
          <div className="mt-4 h-64 w-full">
            {quiz.isLoading || quiz.isError || modeSplit.length === 0 ? (
              <ChartState
                loading={quiz.isLoading}
                error={quiz.isError}
                empty={modeSplit.length === 0}
              />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={modeSplit}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={3}
                    stroke="var(--color-surface)"
                    strokeWidth={2}
                  >
                    {modeSplit.map((m) => (
                      <Cell key={m.name} fill={m.fill} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          {!quiz.isLoading && modeSplit.length > 0 && (
            <div className="mt-2 space-y-1.5">
              {modeSplit.map((m) => (
                <div key={m.name} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: m.fill }} />
                  {m.name}
                  <span className="ml-auto font-semibold tabular-nums text-foreground">
                    {m.value.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel
          title="Most Difficult Questions"
          subtitle="Lowest correct rate"
          className="lg:col-span-2"
        >
          {quiz.isLoading || quiz.isError || (quiz.data?.hardestQuestions ?? []).length === 0 ? (
            <div className="mt-4 h-40">
              <ChartState
                loading={quiz.isLoading}
                error={quiz.isError}
                empty={(quiz.data?.hardestQuestions ?? []).length === 0}
              />
            </div>
          ) : (
            <QuestionTable rows={quiz.data?.hardestQuestions ?? []} tone="error" />
          )}
        </Panel>
      </div>

      <Panel title="Easiest Questions" subtitle="Highest correct rate">
        {quiz.isLoading || quiz.isError || (quiz.data?.easiestQuestions ?? []).length === 0 ? (
          <div className="mt-4 h-40">
            <ChartState
              loading={quiz.isLoading}
              error={quiz.isError}
              empty={(quiz.data?.easiestQuestions ?? []).length === 0}
            />
          </div>
        ) : (
          <QuestionTable rows={quiz.data?.easiestQuestions ?? []} tone="success" />
        )}
      </Panel>
    </div>
  );
}

function QuestionTable({
  rows,
  tone,
}: {
  rows: BackendQuestionPerformance[];
  tone: "error" | "success";
}) {
  const chip =
    tone === "error" ? "bg-[#E11D48]/12 text-[#E11D48]" : "bg-[#1FA968]/12 text-[#1FA968]";
  return (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs font-medium text-muted-foreground">
            <th className="pb-2 pr-4 font-medium">Subject</th>
            <th className="pb-2 pr-4 font-medium">Topic</th>
            <th className="pb-2 pr-4 font-medium">Difficulty</th>
            <th className="pb-2 pr-4 text-right font-medium">Attempts</th>
            <th className="pb-2 text-right font-medium">Correct %</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((q) => (
            <tr key={q.id} className="border-b border-border/60 last:border-0">
              <td className="py-2.5 pr-4 font-medium text-foreground">{q.subject}</td>
              <td className="py-2.5 pr-4 text-muted-foreground">{q.topic ?? "—"}</td>
              <td className="py-2.5 pr-4 text-muted-foreground">{difficultyLabel(q.difficulty)}</td>
              <td className="py-2.5 pr-4 text-right tabular-nums text-foreground">
                {q.timesAnswered.toLocaleString()}
              </td>
              <td className="py-2.5 text-right">
                <span
                  className={`inline-flex rounded-md px-2 py-0.5 text-xs font-semibold tabular-nums ${chip}`}
                >
                  {Math.round(q.accuracy)}%
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Subject & Content                                                   */
/* ------------------------------------------------------------------ */

function ContentTab() {
  const dashboard = useAnalyticsDashboard();
  const content = useContentAnalytics();

  const subjectPerformance = useMemo(() => {
    const rows = content.data?.subjectPerformance ?? [];
    return rows
      .map((s) => ({
        subject: s.subject,
        avgScore: Math.round(s.accuracy),
        fill: subjectTheme(s.subject).hex,
      }))
      .sort((a, b) => b.avgScore - a.avgScore);
  }, [content.data]);

  const topAttemptedTopics = useMemo(
    () =>
      (content.data?.topTopics ?? []).map((t) => ({
        topic: t.topic,
        subject: t.subject,
        attempts: t.answered,
      })),
    [content.data],
  );

  const lowestScoreTopics = content.data?.lowestTopics ?? [];

  const totalQuestions = dashboard.data?.totalQuestions ?? 0;
  const subjectCount = subjectPerformance.length;
  const platformAvgScore =
    subjectPerformance.length > 0
      ? Math.round(
          subjectPerformance.reduce((acc, s) => acc + s.avgScore, 0) / subjectPerformance.length,
        )
      : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <GradientKpiCard
          label="Subjects"
          value={content.isLoading ? "—" : String(subjectCount)}
          icon={Layers}
          gradient="teal"
        />
        <GradientKpiCard
          label="Total Questions"
          value={dashboard.isLoading ? "—" : totalQuestions.toLocaleString()}
          icon={BookOpen}
          gradient="blue"
        />
        <GradientKpiCard
          label="Tracked Topics"
          value={content.isLoading ? "—" : String(topAttemptedTopics.length)}
          icon={GraduationCap}
          gradient="violet"
        />
        <GradientKpiCard
          label="Avg Score"
          value={content.isLoading ? "—" : `${platformAvgScore}%`}
          icon={CalendarDays}
          gradient="emerald"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel
          title="Performance by Subject"
          subtitle="Avg score per subject"
          exportData={subjectPerformance}
          exportName="subject-performance"
        >
          <div className="mt-4 h-80 w-full">
            {content.isLoading || content.isError || subjectPerformance.length === 0 ? (
              <ChartState
                loading={content.isLoading}
                error={content.isError}
                empty={subjectPerformance.length === 0}
              />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={subjectPerformance} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke={gridStroke} />
                  <XAxis
                    type="number"
                    domain={[0, 100]}
                    tickFormatter={(v) => `${v}%`}
                    stroke={axisStroke}
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="subject"
                    stroke={axisStroke}
                    fontSize={11}
                    width={120}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    formatter={(v: number) => `${v}%`}
                    contentStyle={tooltipStyle}
                    cursor={{ fill: "var(--color-surface-alt)" }}
                  />
                  <Bar dataKey="avgScore" radius={[0, 4, 4, 0]} barSize={18}>
                    {subjectPerformance.map((s) => (
                      <Cell key={s.subject} fill={s.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Panel>

        <Panel
          title="Most Attempted Topics"
          subtitle="By total answers"
          exportData={topAttemptedTopics}
          exportName="top-topics"
        >
          <div className="mt-4 h-80 w-full">
            {content.isLoading || content.isError || topAttemptedTopics.length === 0 ? (
              <ChartState
                loading={content.isLoading}
                error={content.isError}
                empty={topAttemptedTopics.length === 0}
              />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topAttemptedTopics} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke={gridStroke} />
                  <XAxis
                    type="number"
                    stroke={axisStroke}
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="topic"
                    stroke={axisStroke}
                    fontSize={11}
                    width={110}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    formatter={(v: number) => v.toLocaleString()}
                    contentStyle={tooltipStyle}
                    cursor={{ fill: "var(--color-surface-alt)" }}
                  />
                  <Bar dataKey="attempts" fill={palette.blue} radius={[0, 4, 4, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Panel>
      </div>

      <Panel
        title="Topics with Lowest Scores"
        subtitle="Need attention"
        exportData={lowestScoreTopics as unknown as Record<string, unknown>[]}
        exportName="lowest-score-topics"
      >
        <div className="mt-4 overflow-x-auto">
          {content.isLoading || content.isError || lowestScoreTopics.length === 0 ? (
            <div className="h-40">
              <ChartState
                loading={content.isLoading}
                error={content.isError}
                empty={lowestScoreTopics.length === 0}
              />
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs font-medium text-muted-foreground">
                  <th className="pb-2 pr-4 font-medium">Topic</th>
                  <th className="pb-2 pr-4 font-medium">Subject</th>
                  <th className="pb-2 pr-4 text-right font-medium">Answered</th>
                  <th className="pb-2 text-right font-medium">Accuracy</th>
                </tr>
              </thead>
              <tbody>
                {lowestScoreTopics.map((t) => (
                  <tr
                    key={`${t.subject}-${t.topic}`}
                    className="border-b border-border/60 last:border-0 bg-[#E11D48]/[0.04]"
                  >
                    <td className="py-2.5 pr-4 font-medium text-foreground">{t.topic}</td>
                    <td className="py-2.5 pr-4 text-muted-foreground">{t.subject}</td>
                    <td className="py-2.5 pr-4 text-right tabular-nums text-foreground">
                      {t.answered.toLocaleString()}
                    </td>
                    <td className="py-2.5 text-right">
                      <span className="inline-flex rounded-md bg-[#E11D48]/12 px-2 py-0.5 text-xs font-semibold tabular-nums text-[#E11D48]">
                        {Math.round(t.accuracy)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Panel>
    </div>
  );
}
