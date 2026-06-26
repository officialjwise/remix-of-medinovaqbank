import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Pie,
  PieChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  Bell,
  CreditCard,
  Library,
  Plus,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";

export const Route = createFileRoute("/admin/dashboard")({
  head: () => ({ meta: [{ title: "Admin · Dashboard — Medinovaqbank" }, { name: "robots", content: "noindex" }] }),
  component: AdminDashboard,
});

const growth = [
  { d: "Wk 1", users: 240, revenue: 8200 },
  { d: "Wk 2", users: 310, revenue: 9400 },
  { d: "Wk 3", users: 410, revenue: 11200 },
  { d: "Wk 4", users: 528, revenue: 12800 },
  { d: "Wk 5", users: 612, revenue: 14100 },
  { d: "Wk 6", users: 740, revenue: 16800 },
  { d: "Wk 7", users: 882, revenue: 19200 },
  { d: "Wk 8", users: 1024, revenue: 21900 },
];

const planSplit = [
  { name: "Monthly", value: 312, fill: "#0E7C7B" },
  { name: "3 Months", value: 248, fill: "#14A6A0" },
  { name: "6 Months", value: 421, fill: "#2BC97F" },
  { name: "12 Months", value: 273, fill: "#7BE0B0" },
];

const subjectScores = [
  { s: "Cardio", v: 82 },
  { s: "Pulmo", v: 78 },
  { s: "Endo", v: 71 },
  { s: "Renal", v: 76 },
  { s: "Surg", v: 69 },
  { s: "OB/GYN", v: 74 },
  { s: "Paeds", v: 80 },
  { s: "Pharm", v: 85 },
];

const recentActivity = [
  { tone: "success" as const, t: "2m ago", e: "New 12-month subscription", who: "Akua Mensah · GHS 799" },
  { tone: "info" as const, t: "8m ago", e: "Bank published", who: "Cardiology Essentials v2 · 120 questions" },
  { tone: "warn" as const, t: "21m ago", e: "Question flagged", who: "Q-RCA-STEMI by 3 users · review queued" },
  { tone: "success" as const, t: "1h ago", e: "Detailed explanations cached", who: "1,240 questions pre-warmed" },
  { tone: "info" as const, t: "3h ago", e: "Admin login", who: "kofi.admin · 41.66.x.x" },
];

const activityTone = {
  success: "bg-success/10 text-success",
  info: "bg-primary/10 text-primary",
  warn: "bg-warning/10 text-warning",
};

// Shared chart theme tokens (resolve correctly in both light and dark)
const axisStroke = "var(--color-muted-foreground)";
const gridStroke = "var(--color-border)";
const tooltipStyle = {
  backgroundColor: "var(--color-surface)",
  border: "1px solid var(--color-border)",
  borderRadius: "10px",
  color: "var(--color-foreground)",
  boxShadow: "var(--shadow-card-hover)",
};

function AdminDashboard() {
  return (
    <div>
      {/* Hero / greeting band */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#06302E] via-[#0E7C7B] to-[#1A9F7A] p-6 text-white shadow-[0_24px_60px_-20px_rgb(14_124_123_/_0.45)]">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-[#2BC97F] opacity-30 blur-3xl"
        />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#7BE0B0]">Platform overview</p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Welcome back, Administrator</h2>
            <p className="mt-2 max-w-xl text-sm text-white/80">
              Real-time metrics across users, content, and revenue. Last sync: just now.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/admin/banks"
              className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-white px-4 text-sm font-bold text-[#0E7C7B] shadow transition-transform hover:-translate-y-0.5"
            >
              <Plus className="h-4 w-4" /> New bank
            </Link>
            <Link
              to="/admin/reports"
              className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-white/30 bg-white/10 px-4 text-sm font-semibold backdrop-blur transition-colors hover:bg-white/20"
            >
              <Bell className="h-4 w-4" /> Reports
            </Link>
          </div>
        </div>
      </section>

      {/* KPI grid */}
      <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Kpi tone="teal"   label="Total users"              value="3,482"   delta="+124 this month"  icon={<Users className="h-5 w-5" />} trend="up" />
        <Kpi tone="emerald" label="Active subscriptions"     value="1,254"   delta="+43 this week"    icon={<CreditCard className="h-5 w-5" />} trend="up" />
        <Kpi tone="amber"  label="Trial users"               value="341"     delta="Convert rate 28%" icon={<Zap className="h-5 w-5" />} trend="up" />
        <Kpi tone="green"  label="Monthly Revenue (GHS)"     value="142,890" delta="+18% vs last"     icon={<TrendingUp className="h-5 w-5" />} trend="up" />
        <Kpi tone="blue"   label="Questions answered today"  value="12,841"  delta="+2,100 vs yest."  icon={<Activity className="h-5 w-5" />} trend="up" />
        <Kpi tone="rose"   label="Sessions active now"       value="12"      delta="Live tracking"    icon={<Bell className="h-5 w-5" />} trend="neutral" />
      </section>

      {/* Secondary metrics row */}
      <section className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MiniMetric label="DAU" value="486" sub="+6% vs yesterday" />
        <MiniMetric label="WAU" value="2,134" sub="61% of total users" />
        <MiniMetric label="Avg accuracy" value="74%" sub="↑ 1.2 pts MoM" />
        <MiniMetric label="Question banks" value="9" sub="2 published this month" />
      </section>

      {/* Charts grid */}
      <section className="mt-6 grid gap-4 lg:grid-cols-3">
        <Panel title="Growth · Users + Revenue" subtitle="Last 8 weeks" className="lg:col-span-2">
          <div className="h-72">
            <ResponsiveContainer>
              <AreaChart data={growth}>
                <defs>
                  <linearGradient id="gUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0E7C7B" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="#0E7C7B" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2BC97F" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="#2BC97F" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={gridStroke} vertical={false} />
                <XAxis dataKey="d" stroke={axisStroke} fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke={axisStroke} fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: gridStroke }} />
                <Area type="monotone" dataKey="users" stroke="#0E7C7B" strokeWidth={2} fill="url(#gUsers)" />
                <Area type="monotone" dataKey="revenue" stroke="#2BC97F" strokeWidth={2} fill="url(#gRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Plan distribution" subtitle="Active subscriptions">
          <div className="h-72">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={planSplit} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={3} stroke="var(--color-surface)" strokeWidth={2}>
                  {planSplit.map((p) => (
                    <Cell key={p.name} fill={p.fill} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="mt-2 space-y-1.5 text-xs">
            {planSplit.map((p) => (
              <li key={p.name} className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ background: p.fill }} />
                <span className="flex-1 text-muted-foreground">{p.name}</span>
                <span className="font-bold text-foreground">{p.value}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </section>

      <section className="mt-4 grid gap-4 lg:grid-cols-3">
        <Panel title="Average score by subject" subtitle="All learners, last 30 days" className="lg:col-span-2">
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={subjectScores}>
                <CartesianGrid stroke={gridStroke} vertical={false} />
                <XAxis dataKey="s" stroke={axisStroke} fontSize={11} tickLine={false} axisLine={false} />
                <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} stroke={axisStroke} fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip formatter={(v: number) => `${v}%`} contentStyle={tooltipStyle} cursor={{ fill: "var(--color-surface-alt)" }} />
                <Bar dataKey="v" fill="#2BC97F" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Recent activity" subtitle="Live feed" right={<Link to="/admin/audit-logs" className="text-xs font-semibold text-primary hover:underline">View all →</Link>}>
          <ul className="space-y-3">
            {recentActivity.map((a, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className={`mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full ${activityTone[a.tone]}`}>
                  <Activity className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">{a.e}</p>
                  <p className="truncate text-xs text-muted-foreground">{a.who}</p>
                  <p className="mt-0.5 text-[10px] uppercase tracking-wide text-muted-foreground/70">{a.t}</p>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      </section>

      {/* Quick actions */}
      <section className="mt-6 rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
        <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Quick actions</h3>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <QuickAction to="/admin/users" label="Manage users" icon={<Users className="h-4 w-4" />} />
          <QuickAction to="/admin/banks" label="Create new bank" icon={<Library className="h-4 w-4" />} />
          <QuickAction to="/admin/subscriptions" label="Review subscriptions" icon={<CreditCard className="h-4 w-4" />} />
          <QuickAction to="/admin/ai-settings" label="Configure AI" icon={<Zap className="h-4 w-4" />} />
        </div>
      </section>
    </div>
  );
}

const kpiTones = {
  teal:    "bg-[#0E7C7B]/10 text-[#0E7C7B]",
  emerald: "bg-[#2BC97F]/10 text-[#1FA968]",
  green:   "bg-[#047857]/10 text-[#047857]",
  amber:   "bg-[#E89A1A]/10 text-[#B45309]",
  blue:    "bg-[#3B82F6]/10 text-[#3B82F6]",
  rose:    "bg-[#E11D48]/10 text-[#E11D48]",
} as const;

function Kpi({
  tone,
  label,
  value,
  delta,
  icon,
  trend,
}: {
  tone: keyof typeof kpiTones;
  label: string;
  value: string;
  delta: string;
  icon: React.ReactNode;
  trend?: "up" | "down" | "neutral";
}) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-border bg-surface p-5 shadow-[var(--shadow-card)] transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-hover)]">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
        <span className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${kpiTones[tone]}`}>
          {icon}
        </span>
      </div>
      <p className="mt-3 text-3xl font-extrabold tracking-tight text-foreground">{value}</p>
      <div className="mt-3 flex items-center gap-1.5">
        {trend === "up" && <TrendingUp className="h-3.5 w-3.5 text-success" />}
        {trend === "down" && (
          <svg className="h-3.5 w-3.5 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" /></svg>
        )}
        <span className={`text-[11px] font-semibold ${trend === "up" ? "text-success" : trend === "down" ? "text-error" : "text-muted-foreground"}`}>
          {delta}
        </span>
      </div>
    </div>
  );
}

function MiniMetric({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4 shadow-[var(--shadow-card)]">
      <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-bold text-foreground">{value}</p>
      <p className="text-[11px] text-muted-foreground">{sub}</p>
    </div>
  );
}

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
    <section className={`rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)] ${className}`}>
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

function QuickAction({ to, label, icon }: { to: string; label: string; icon: React.ReactNode }) {
  return (
    <Link
      to={to}
      className="group flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 transition-all hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-md"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary/10 to-accent/15 text-primary transition-transform group-hover:scale-110">
        {icon}
      </span>
      <span className="text-sm font-semibold text-foreground">{label}</span>
    </Link>
  );
}
