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
import { questionBanks } from "@/data/banks";
import { GradientKpiCard } from "@/components/shared/GradientKpiCard";

export const Route = createFileRoute("/admin/analytics")({
  head: () => ({ meta: [{ title: "Admin · Analytics — Medinovaqbank" }, { name: "robots", content: "noindex" }] }),
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

const GHS = (n: number) =>
  `GHS ${n.toLocaleString("en-GH", { maximumFractionDigits: 0 })}`;

/* ------------------------------------------------------------------ */
/* Deterministic mock data (module-level)                              */
/* ------------------------------------------------------------------ */

// pseudo-random but deterministic generator
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

const MONTHS = ["Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun"];

const newUsersDaily = (() => {
  const rnd = seeded(7);
  return Array.from({ length: 30 }, (_, i) => ({
    day: `${i + 1}`,
    users: 18 + Math.round(Math.sin(i / 3) * 10 + rnd() * 14 + i * 0.5),
  }));
})();

const completionRate = (() => {
  const rnd = seeded(13);
  return Array.from({ length: 30 }, (_, i) => ({
    day: `${i + 1}`,
    rate: Math.min(96, 62 + Math.round(Math.sin(i / 4) * 8 + rnd() * 6 + i * 0.4)),
  }));
})();

const revenueCompare = [
  { name: "Week 1", last: 4200, current: 5100 },
  { name: "Week 2", last: 5300, current: 6400 },
  { name: "Week 3", last: 4900, current: 7100 },
  { name: "Week 4", last: 6100, current: 7600 },
];

// Engagement
const sparkDau = Array.from({ length: 12 }, (_, i) => ({ v: 380 + Math.round(Math.sin(i / 2) * 40 + i * 6) }));
const sparkWau = Array.from({ length: 12 }, (_, i) => ({ v: 1240 + Math.round(Math.cos(i / 2) * 90 + i * 10) }));
const sparkMau = Array.from({ length: 12 }, (_, i) => ({ v: 3850 + Math.round(Math.sin(i / 3) * 120 + i * 24) }));

const sessionDuration = (() => {
  const rnd = seeded(21);
  return Array.from({ length: 30 }, (_, i) => ({
    day: `${i + 1}`,
    minutes: Math.round((22 + Math.sin(i / 5) * 5 + rnd() * 4) * 10) / 10,
  }));
})();

const dropout = (() => {
  const rnd = seeded(29);
  return Array.from({ length: 14 }, (_, i) => {
    const completed = 120 + Math.round(rnd() * 60 + i * 3);
    const abandoned = 24 + Math.round(rnd() * 22);
    return { day: `D${i + 1}`, completed, abandoned };
  });
})();

const newVsReturning = MONTHS.map((m, i) => {
  const rnd = seeded(100 + i);
  return { month: m, new: 140 + Math.round(rnd() * 120), returning: 220 + Math.round(rnd() * 160) };
});

const topActiveUsers = [
  { name: "Ama Owusu", email: "ama.o@example.com", sessions: 142, questions: 4120, avg: 84 },
  { name: "Kwame Mensah", email: "kwame.m@example.com", sessions: 131, questions: 3870, avg: 79 },
  { name: "Efua Asante", email: "efua.a@example.com", sessions: 128, questions: 3640, avg: 88 },
  { name: "Yaw Boateng", email: "yaw.b@example.com", sessions: 119, questions: 3410, avg: 76 },
  { name: "Akosua Darko", email: "akosua.d@example.com", sessions: 111, questions: 3120, avg: 91 },
  { name: "Kojo Adjei", email: "kojo.a@example.com", sessions: 104, questions: 2980, avg: 73 },
  { name: "Abena Frimpong", email: "abena.f@example.com", sessions: 98, questions: 2740, avg: 82 },
  { name: "Kofi Nyarko", email: "kofi.n@example.com", sessions: 91, questions: 2560, avg: 80 },
  { name: "Adwoa Sarpong", email: "adwoa.s@example.com", sessions: 87, questions: 2390, avg: 86 },
  { name: "Kwesi Appiah", email: "kwesi.a@example.com", sessions: 82, questions: 2210, avg: 77 },
];

const cumulativeGrowth = (() => {
  const rnd = seeded(41);
  let total = 1200;
  return Array.from({ length: 90 }, (_, i) => {
    total += 6 + Math.round(rnd() * 10 + Math.sin(i / 8) * 4);
    return { day: `${i + 1}`, total };
  });
})();

// Revenue
const revenuePerMonth = MONTHS.map((m, i) => {
  const rnd = seeded(200 + i);
  return { month: m, revenue: 14000 + Math.round(rnd() * 9000 + i * 700) };
});

const revenueByPlan = MONTHS.map((m, i) => {
  const rnd = seeded(300 + i);
  return {
    month: m,
    monthly: 4000 + Math.round(rnd() * 2200),
    threeMo: 3200 + Math.round(rnd() * 1800),
    sixMo: 2600 + Math.round(rnd() * 1600),
    twelveMo: 2200 + Math.round(rnd() * 1500),
  };
});

const planDistribution = [
  { name: "Monthly", value: 1840, fill: palette.teal },
  { name: "3-Month", value: 1120, fill: palette.emerald },
  { name: "6-Month", value: 760, fill: palette.amber },
  { name: "12-Month", value: 520, fill: palette.violet },
];

const churn = (() => {
  const rnd = seeded(51);
  return MONTHS.map((m, i) => ({ month: m, rate: Math.round((3.2 + Math.sin(i / 3) * 1.1 + rnd() * 0.8) * 10) / 10 }));
})();

const recentTransactions = [
  { id: "txn_9f21", user: "Ama Owusu", plan: "12-Month", amount: 480, status: "Paid", date: "2026-06-24" },
  { id: "txn_9e8c", user: "Kwame Mensah", plan: "Monthly", amount: 60, status: "Paid", date: "2026-06-24" },
  { id: "txn_9d04", user: "Efua Asante", plan: "6-Month", amount: 280, status: "Paid", date: "2026-06-23" },
  { id: "txn_9c77", user: "Yaw Boateng", plan: "3-Month", amount: 150, status: "Refunded", date: "2026-06-23" },
  { id: "txn_9bb1", user: "Akosua Darko", plan: "Monthly", amount: 60, status: "Paid", date: "2026-06-22" },
  { id: "txn_9a3e", user: "Kojo Adjei", plan: "12-Month", amount: 480, status: "Paid", date: "2026-06-22" },
  { id: "txn_98f0", user: "Abena Frimpong", plan: "6-Month", amount: 280, status: "Failed", date: "2026-06-21" },
  { id: "txn_9712", user: "Kofi Nyarko", plan: "Monthly", amount: 60, status: "Paid", date: "2026-06-21" },
];

// Quiz performance derived from banks
const bankPerformance = questionBanks.map((b, i) => {
  const rnd = seeded(400 + i);
  return {
    id: b.id,
    name: b.name,
    subject: b.subject,
    fill: b.accentHex,
    avgScore: 58 + Math.round(rnd() * 32),
    sessions: b.sessionsCount,
    questions: b.questionCount,
  };
});

const scoreByDifficulty = [
  { label: "Beginner", value: 82, color: palette.success },
  { label: "Intermediate", value: 71, color: palette.amber },
  { label: "Advanced", value: 58, color: palette.rose },
];

const hardestQuestions = (() => {
  const rnd = seeded(61);
  return questionBanks.slice(0, 8).map((b, i) => ({
    id: `Q-${1200 + i * 37}`,
    topic: b.topics[i % b.topics.length],
    bank: b.subject,
    correctPct: 18 + Math.round(rnd() * 22),
    attempts: 400 + Math.round(rnd() * 900),
  }));
})();

const easiestQuestions = (() => {
  const rnd = seeded(67);
  return questionBanks.slice(0, 8).map((b, i) => ({
    id: `Q-${5400 + i * 29}`,
    topic: b.topics[(i + 1) % b.topics.length],
    bank: b.subject,
    correctPct: 86 + Math.round(rnd() * 12),
    attempts: 500 + Math.round(rnd() * 1100),
  }));
})();

const modeSplit = [
  { name: "Tutor Mode", value: 6420, fill: palette.teal },
  { name: "Quiz Mode", value: 9180, fill: palette.blue },
];

// Subject & content
const subjectPerformance = questionBanks
  .map((b, i) => {
    const rnd = seeded(500 + i);
    return { subject: b.subject, fill: b.accentHex, avgScore: 56 + Math.round(rnd() * 34) };
  })
  .sort((a, b) => b.avgScore - a.avgScore);

const topAttemptedTopics = (() => {
  const rnd = seeded(71);
  const topics = questionBanks.flatMap((b) => b.topics);
  return topics
    .slice(0, 10)
    .map((t, i) => ({ topic: t, attempts: 2200 - i * 90 + Math.round(rnd() * 400) }))
    .sort((a, b) => b.attempts - a.attempts);
})();

const lowestScoreTopics = (() => {
  const rnd = seeded(73);
  const topics = questionBanks.flatMap((b) => b.topics.map((t) => ({ topic: t, subject: b.subject })));
  return topics
    .slice(0, 8)
    .map((t) => ({ ...t, avgScore: 38 + Math.round(rnd() * 18), attempts: 300 + Math.round(rnd() * 700) }))
    .sort((a, b) => a.avgScore - b.avgScore)
    .slice(0, 6);
})();

const contentGrowth = MONTHS.map((m, i) => {
  const rnd = seeded(600 + i);
  return { month: m, questions: 2400 + i * 280 + Math.round(rnd() * 120) };
});

const totalBankQuestions = questionBanks.reduce((acc, b) => acc + b.questionCount, 0);
const totalBankSessions = questionBanks.reduce((acc, b) => acc + b.sessionsCount, 0);
const totalCategories = new Set(questionBanks.flatMap((b) => b.topics)).size;
const platformAvgScore = Math.round(
  bankPerformance.reduce((acc, b) => acc + b.avgScore, 0) / bankPerformance.length,
);

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
  const csv = [headers.join(","), ...rows.map((r) => headers.map((h) => escape(r[h])).join(","))].join("\n");
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
        {exportData && (
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

function Metric({
  label,
  value,
  hint,
  spark,
  sparkColor,
}: {
  label: string;
  value: string;
  hint?: string;
  spark?: { v: number }[];
  sparkColor?: string;
}) {
  return (
    <div className={cardClass}>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
      {spark && (
        <div className="mt-3 h-10 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={spark}>
              <Line type="monotone" dataKey="v" stroke={sparkColor ?? palette.teal} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
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
          <circle cx="50" cy="50" r={r} fill="none" stroke="var(--color-surface-alt)" strokeWidth="8" />
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

const TABS = ["Overview", "User Engagement", "Revenue", "Quiz Performance", "Subject & Content"] as const;
type Tab = (typeof TABS)[number];

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

function AdminAnalytics() {
  const [tab, setTab] = useState<Tab>("Overview");
  const [range, setRange] = useState<"7d" | "30d" | "90d">("30d");

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Platform Analytics</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Engagement, retention, revenue, and content performance across the cohort.
          </p>
        </div>
        <div className="inline-flex items-center gap-1 self-start rounded-xl border border-border bg-surface-alt p-1">
          {(["7d", "30d", "90d"] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                range === r ? "bg-surface text-foreground shadow-[var(--shadow-card)]" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {r}
            </button>
          ))}
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
            {tab === t && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-[#0E7C7B]" />}
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
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <GradientKpiCard label="Total Users" value="6,184" trend={{ value: "+8.2% MoM", up: true }} icon={Users} gradient="teal" />
        <GradientKpiCard label="Active Subscriptions" value="4,240" trend={{ value: "+5.1% MoM", up: true }} icon={CreditCard} gradient="emerald" />
        <GradientKpiCard label="Trial Users" value="912" trend={{ value: "-2.4% MoM", up: false }} icon={Activity} gradient="amber" />
        <GradientKpiCard label="Monthly Revenue" value={GHS(186400)} trend={{ value: "+11.7% MoM", up: true }} icon={Wallet} gradient="blue" />
        <GradientKpiCard label="Questions Today" value="38,920" trend={{ value: "+3.9% DoD", up: true }} icon={BookOpen} gradient="violet" />
        <GradientKpiCard label="Active Sessions" value="147" trend={{ value: "live now", up: true }} icon={GraduationCap} gradient="rose" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel title="New Users / Day" subtitle="Last 30 days" exportData={newUsersDaily} exportName="new-users-daily">
          <div className="mt-4 h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={newUsersDaily}>
                <defs>
                  <linearGradient id="gNewUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={palette.teal} stopOpacity={0.4} />
                    <stop offset="100%" stopColor={palette.teal} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                <XAxis dataKey="day" stroke={axisStroke} fontSize={12} tickLine={false} axisLine={false} interval={4} />
                <YAxis stroke={axisStroke} fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: gridStroke }} />
                <Area type="monotone" dataKey="users" stroke={palette.teal} strokeWidth={2.5} fill="url(#gNewUsers)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Session Completion Rate" subtitle="% of started sessions completed" exportData={completionRate} exportName="completion-rate">
          <div className="mt-4 h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={completionRate}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                <XAxis dataKey="day" stroke={axisStroke} fontSize={12} tickLine={false} axisLine={false} interval={4} />
                <YAxis domain={[40, 100]} tickFormatter={(v) => `${v}%`} stroke={axisStroke} fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip formatter={(v: number) => `${v}%`} contentStyle={tooltipStyle} cursor={{ stroke: gridStroke }} />
                <Line type="monotone" dataKey="rate" stroke={palette.emerald} strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <Panel title="Revenue: This Month vs Last Month" subtitle="Weekly breakdown (GHS)" exportData={revenueCompare} exportName="revenue-compare">
        <div className="mt-4 h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={revenueCompare}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
              <XAxis dataKey="name" stroke={axisStroke} fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke={axisStroke} fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v / 1000}k`} />
              <Tooltip formatter={(v: number) => GHS(v)} contentStyle={tooltipStyle} cursor={{ fill: "var(--color-surface-alt)" }} />
              <Bar dataKey="last" name="Last Month" fill="var(--color-border-strong)" radius={[4, 4, 0, 0]} barSize={26} />
              <Bar dataKey="current" name="This Month" fill={palette.teal} radius={[4, 4, 0, 0]} barSize={26} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Panel>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* User Engagement                                                     */
/* ------------------------------------------------------------------ */

function EngagementTab() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Metric label="Daily Active Users (DAU)" value="442" hint="+6.1% vs yesterday" spark={sparkDau} sparkColor={palette.teal} />
        <Metric label="Weekly Active Users (WAU)" value="1,318" hint="+3.4% vs last week" spark={sparkWau} sparkColor={palette.blue} />
        <Metric label="Monthly Active Users (MAU)" value="4,072" hint="+9.0% vs last month" spark={sparkMau} sparkColor={palette.violet} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel title="Avg Session Duration" subtitle="Minutes per session, last 30 days" exportData={sessionDuration} exportName="session-duration">
          <div className="mt-4 h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sessionDuration}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                <XAxis dataKey="day" stroke={axisStroke} fontSize={12} tickLine={false} axisLine={false} interval={4} />
                <YAxis stroke={axisStroke} fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}m`} />
                <Tooltip formatter={(v: number) => `${v} min`} contentStyle={tooltipStyle} cursor={{ stroke: gridStroke }} />
                <Line type="monotone" dataKey="minutes" stroke={palette.amber} strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Session Dropout" subtitle="Completed vs abandoned sessions" exportData={dropout} exportName="dropout">
          <div className="mt-4 h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dropout}>
                <defs>
                  <linearGradient id="gCompleted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={palette.success} stopOpacity={0.5} />
                    <stop offset="100%" stopColor={palette.success} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gAbandoned" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={palette.rose} stopOpacity={0.5} />
                    <stop offset="100%" stopColor={palette.rose} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                <XAxis dataKey="day" stroke={axisStroke} fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke={axisStroke} fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: gridStroke }} />
                <Area type="monotone" dataKey="completed" stackId="1" stroke={palette.success} strokeWidth={2} fill="url(#gCompleted)" />
                <Area type="monotone" dataKey="abandoned" stackId="1" stroke={palette.rose} strokeWidth={2} fill="url(#gAbandoned)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel title="New vs Returning Users" subtitle="Monthly" exportData={newVsReturning} exportName="new-vs-returning">
          <div className="mt-4 h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={newVsReturning}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                <XAxis dataKey="month" stroke={axisStroke} fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke={axisStroke} fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--color-surface-alt)" }} />
                <Bar dataKey="new" name="New" fill={palette.blue} radius={[3, 3, 0, 0]} barSize={12} />
                <Bar dataKey="returning" name="Returning" fill={palette.teal} radius={[3, 3, 0, 0]} barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Cumulative User Growth" subtitle="Last 90 days" exportData={cumulativeGrowth} exportName="cumulative-growth">
          <div className="mt-4 h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cumulativeGrowth}>
                <defs>
                  <linearGradient id="gCumulative" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={palette.violet} stopOpacity={0.4} />
                    <stop offset="100%" stopColor={palette.violet} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                <XAxis dataKey="day" stroke={axisStroke} fontSize={12} tickLine={false} axisLine={false} interval={14} />
                <YAxis stroke={axisStroke} fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(1)}k`} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: gridStroke }} />
                <Area type="monotone" dataKey="total" stroke={palette.violet} strokeWidth={2.5} fill="url(#gCumulative)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <Panel title="Top 10 Active Users" exportData={topActiveUsers} exportName="top-active-users">
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs font-medium text-muted-foreground">
                <th className="pb-2 pr-4 font-medium">#</th>
                <th className="pb-2 pr-4 font-medium">User</th>
                <th className="pb-2 pr-4 text-right font-medium">Sessions</th>
                <th className="pb-2 pr-4 text-right font-medium">Questions</th>
                <th className="pb-2 text-right font-medium">Avg Score</th>
              </tr>
            </thead>
            <tbody>
              {topActiveUsers.map((u, i) => (
                <tr key={u.email} className="border-b border-border/60 last:border-0">
                  <td className="py-2.5 pr-4 text-muted-foreground tabular-nums">{i + 1}</td>
                  <td className="py-2.5 pr-4">
                    <div className="font-medium text-foreground">{u.name}</div>
                    <div className="text-xs text-muted-foreground">{u.email}</div>
                  </td>
                  <td className="py-2.5 pr-4 text-right tabular-nums text-foreground">{u.sessions}</td>
                  <td className="py-2.5 pr-4 text-right tabular-nums text-foreground">{u.questions.toLocaleString()}</td>
                  <td className="py-2.5 text-right">
                    <span className="inline-flex rounded-md bg-surface-alt px-2 py-0.5 text-xs font-semibold tabular-nums text-foreground">{u.avg}%</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Revenue                                                             */
/* ------------------------------------------------------------------ */

const statusTone: Record<string, string> = {
  Paid: "bg-[#1FA968]/12 text-[#1FA968]",
  Refunded: "bg-[#E89A1A]/12 text-[#E89A1A]",
  Failed: "bg-[#E11D48]/12 text-[#E11D48]",
};

function RevenueTab() {
  const totalRevenue = revenuePerMonth.reduce((acc, r) => acc + r.revenue, 0);
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <GradientKpiCard label="Total Revenue (12 mo)" value={GHS(totalRevenue)} sub="across all plans" icon={Wallet} gradient="teal" />
        <GradientKpiCard label="Monthly Recurring Revenue" value={GHS(186400)} sub="+11.7% MoM" icon={CreditCard} gradient="emerald" trend={{ value: "+11.7% MoM", up: true }} />
        <GradientKpiCard label="ARPU" value={GHS(44)} sub="avg revenue per user / mo" icon={Users} gradient="indigo" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel title="Revenue per Month" subtitle="Last 12 months (GHS)" exportData={revenuePerMonth} exportName="revenue-per-month">
          <div className="mt-4 h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenuePerMonth}>
                <defs>
                  <linearGradient id="gRevBar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={palette.teal} stopOpacity={1} />
                    <stop offset="100%" stopColor={palette.teal} stopOpacity={0.35} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                <XAxis dataKey="month" stroke={axisStroke} fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke={axisStroke} fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v / 1000}k`} />
                <Tooltip formatter={(v: number) => GHS(v)} contentStyle={tooltipStyle} cursor={{ fill: "var(--color-surface-alt)" }} />
                <Bar dataKey="revenue" fill="url(#gRevBar)" radius={[4, 4, 0, 0]} barSize={22} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Revenue by Plan" subtitle="Stacked, monthly (GHS)" exportData={revenueByPlan} exportName="revenue-by-plan">
          <div className="mt-4 h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueByPlan}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                <XAxis dataKey="month" stroke={axisStroke} fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke={axisStroke} fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v / 1000}k`} />
                <Tooltip formatter={(v: number) => GHS(v)} contentStyle={tooltipStyle} cursor={{ fill: "var(--color-surface-alt)" }} />
                <Bar dataKey="monthly" name="Monthly" stackId="p" fill={palette.teal} barSize={18} />
                <Bar dataKey="threeMo" name="3-Month" stackId="p" fill={palette.emerald} barSize={18} />
                <Bar dataKey="sixMo" name="6-Month" stackId="p" fill={palette.amber} barSize={18} />
                <Bar dataKey="twelveMo" name="12-Month" stackId="p" fill={palette.violet} radius={[4, 4, 0, 0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Panel title="Plan Distribution" subtitle="Active subscriptions by plan">
          <div className="mt-4 h-64 w-full">
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
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {planDistribution.map((p) => (
              <div key={p.name} className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: p.fill }} />
                {p.name}
                <span className="ml-auto font-semibold tabular-nums text-foreground">{p.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </Panel>

        <div className="grid grid-cols-1 gap-6">
          <div className={cardClass}>
            <span className="text-xs font-medium text-muted-foreground">Trial → Paid Conversion</span>
            <p className="mt-2 text-3xl font-bold tracking-tight text-foreground">24.6%</p>
            <p className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-[#1FA968]">
              <TrendingUp className="h-3.5 w-3.5" /> +2.1 pts vs last month
            </p>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-surface-alt">
              <div className="h-full rounded-full bg-gradient-to-r from-[#0E7C7B] to-[#2BC97F]" style={{ width: "24.6%" }} />
            </div>
          </div>
          <div className={cardClass}>
            <span className="text-xs font-medium text-muted-foreground">Revenue Forecast (next month)</span>
            <p className="mt-2 text-3xl font-bold tracking-tight text-foreground">{GHS(204800)}</p>
            <p className="mt-1 text-xs text-muted-foreground">Projected +9.9% based on trailing 3-mo trend</p>
          </div>
        </div>

        <Panel title="Churn Rate" subtitle="Monthly %" exportData={churn} exportName="churn">
          <div className="mt-4 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={churn}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                <XAxis dataKey="month" stroke={axisStroke} fontSize={11} tickLine={false} axisLine={false} interval={1} />
                <YAxis stroke={axisStroke} fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                <Tooltip formatter={(v: number) => `${v}%`} contentStyle={tooltipStyle} cursor={{ stroke: gridStroke }} />
                <Line type="monotone" dataKey="rate" stroke={palette.rose} strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <Panel title="Recent Transactions" exportData={recentTransactions} exportName="recent-transactions">
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs font-medium text-muted-foreground">
                <th className="pb-2 pr-4 font-medium">Transaction</th>
                <th className="pb-2 pr-4 font-medium">User</th>
                <th className="pb-2 pr-4 font-medium">Plan</th>
                <th className="pb-2 pr-4 text-right font-medium">Amount</th>
                <th className="pb-2 pr-4 font-medium">Status</th>
                <th className="pb-2 text-right font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {recentTransactions.map((t) => (
                <tr key={t.id} className="border-b border-border/60 last:border-0">
                  <td className="py-2.5 pr-4 font-mono text-xs text-muted-foreground">{t.id}</td>
                  <td className="py-2.5 pr-4 font-medium text-foreground">{t.user}</td>
                  <td className="py-2.5 pr-4 text-muted-foreground">{t.plan}</td>
                  <td className="py-2.5 pr-4 text-right tabular-nums text-foreground">{GHS(t.amount)}</td>
                  <td className="py-2.5 pr-4">
                    <span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-semibold ${statusTone[t.status] ?? "bg-surface-alt text-foreground"}`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="py-2.5 text-right text-muted-foreground tabular-nums">{t.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Quiz Performance                                                    */
/* ------------------------------------------------------------------ */

function QuizTab() {
  const sortedBanks = useMemo(() => [...bankPerformance].sort((a, b) => b.avgScore - a.avgScore), []);
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <GradientKpiCard label="Total Sessions" value={totalBankSessions.toLocaleString()} sub="all banks" icon={Activity} gradient="teal" />
        <GradientKpiCard label="Questions Answered" value="1.84M" sub="lifetime" icon={BookOpen} gradient="blue" />
        <GradientKpiCard label="Platform Avg Score" value={`${platformAvgScore}%`} sub="across all banks" icon={Target} gradient="emerald" />
        <GradientKpiCard label="Avg Time / Question" value="48s" sub="-3s vs last month" icon={Clock} gradient="amber" trend={{ value: "-3s vs last month", up: true }} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel title="Avg Score by Bank" subtitle="Color-coded per bank" exportData={sortedBanks} exportName="score-by-bank">
          <div className="mt-4 h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sortedBanks} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} stroke={axisStroke} fontSize={12} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="subject" stroke={axisStroke} fontSize={11} width={120} tickLine={false} axisLine={false} />
                <Tooltip formatter={(v: number) => `${v}%`} contentStyle={tooltipStyle} cursor={{ fill: "var(--color-surface-alt)" }} />
                <Bar dataKey="avgScore" radius={[0, 4, 4, 0]} barSize={18}>
                  {sortedBanks.map((b) => (
                    <Cell key={b.id} fill={b.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Avg Score by Difficulty" subtitle="Beginner · Intermediate · Advanced">
          <div className="mt-4 grid grid-cols-3 gap-3">
            {scoreByDifficulty.map((d) => (
              <Ring key={d.label} label={d.label} value={d.value} color={d.color} />
            ))}
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Panel title="Tutor vs Quiz" subtitle="Sessions by mode" className="lg:col-span-1">
          <div className="mt-4 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={modeSplit} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={3} stroke="var(--color-surface)" strokeWidth={2}>
                  {modeSplit.map((m) => (
                    <Cell key={m.name} fill={m.fill} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 space-y-1.5">
            {modeSplit.map((m) => (
              <div key={m.name} className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: m.fill }} />
                {m.name}
                <span className="ml-auto font-semibold tabular-nums text-foreground">{m.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Most Difficult Questions" subtitle="Lowest correct rate" exportData={hardestQuestions} exportName="hardest-questions" className="lg:col-span-2">
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs font-medium text-muted-foreground">
                  <th className="pb-2 pr-4 font-medium">Question</th>
                  <th className="pb-2 pr-4 font-medium">Topic</th>
                  <th className="pb-2 pr-4 font-medium">Bank</th>
                  <th className="pb-2 pr-4 text-right font-medium">Attempts</th>
                  <th className="pb-2 text-right font-medium">Correct %</th>
                </tr>
              </thead>
              <tbody>
                {hardestQuestions.map((q) => (
                  <tr key={q.id} className="border-b border-border/60 last:border-0">
                    <td className="py-2.5 pr-4 font-mono text-xs text-muted-foreground">{q.id}</td>
                    <td className="py-2.5 pr-4 font-medium text-foreground">{q.topic}</td>
                    <td className="py-2.5 pr-4 text-muted-foreground">{q.bank}</td>
                    <td className="py-2.5 pr-4 text-right tabular-nums text-foreground">{q.attempts.toLocaleString()}</td>
                    <td className="py-2.5 text-right">
                      <span className="inline-flex rounded-md bg-[#E11D48]/12 px-2 py-0.5 text-xs font-semibold tabular-nums text-[#E11D48]">{q.correctPct}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>

      <Panel title="Easiest Questions" subtitle="Highest correct rate" exportData={easiestQuestions} exportName="easiest-questions">
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs font-medium text-muted-foreground">
                <th className="pb-2 pr-4 font-medium">Question</th>
                <th className="pb-2 pr-4 font-medium">Topic</th>
                <th className="pb-2 pr-4 font-medium">Bank</th>
                <th className="pb-2 pr-4 text-right font-medium">Attempts</th>
                <th className="pb-2 text-right font-medium">Correct %</th>
              </tr>
            </thead>
            <tbody>
              {easiestQuestions.map((q) => (
                <tr key={q.id} className="border-b border-border/60 last:border-0">
                  <td className="py-2.5 pr-4 font-mono text-xs text-muted-foreground">{q.id}</td>
                  <td className="py-2.5 pr-4 font-medium text-foreground">{q.topic}</td>
                  <td className="py-2.5 pr-4 text-muted-foreground">{q.bank}</td>
                  <td className="py-2.5 pr-4 text-right tabular-nums text-foreground">{q.attempts.toLocaleString()}</td>
                  <td className="py-2.5 text-right">
                    <span className="inline-flex rounded-md bg-[#1FA968]/12 px-2 py-0.5 text-xs font-semibold tabular-nums text-[#1FA968]">{q.correctPct}%</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Subject & Content                                                   */
/* ------------------------------------------------------------------ */

function ContentTab() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <GradientKpiCard label="Question Banks" value={String(questionBanks.length)} icon={Layers} gradient="teal" />
        <GradientKpiCard label="Total Questions" value={totalBankQuestions.toLocaleString()} icon={BookOpen} gradient="blue" />
        <GradientKpiCard label="Topics / Categories" value={String(totalCategories)} icon={GraduationCap} gradient="violet" />
        <GradientKpiCard label="Avg Score" value={`${platformAvgScore}%`} icon={CalendarDays} gradient="emerald" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel title="Performance by Subject" subtitle="Avg score per subject" exportData={subjectPerformance} exportName="subject-performance">
          <div className="mt-4 h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subjectPerformance} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} stroke={axisStroke} fontSize={12} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="subject" stroke={axisStroke} fontSize={11} width={120} tickLine={false} axisLine={false} />
                <Tooltip formatter={(v: number) => `${v}%`} contentStyle={tooltipStyle} cursor={{ fill: "var(--color-surface-alt)" }} />
                <Bar dataKey="avgScore" radius={[0, 4, 4, 0]} barSize={18}>
                  {subjectPerformance.map((s) => (
                    <Cell key={s.subject} fill={s.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Most Attempted Topics" subtitle="By total attempts" exportData={topAttemptedTopics} exportName="top-topics">
          <div className="mt-4 h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topAttemptedTopics} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis type="number" stroke={axisStroke} fontSize={12} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="topic" stroke={axisStroke} fontSize={11} width={110} tickLine={false} axisLine={false} />
                <Tooltip formatter={(v: number) => v.toLocaleString()} contentStyle={tooltipStyle} cursor={{ fill: "var(--color-surface-alt)" }} />
                <Bar dataKey="attempts" fill={palette.blue} radius={[0, 4, 4, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel title="Topics with Lowest Scores" subtitle="Need attention" exportData={lowestScoreTopics} exportName="lowest-score-topics">
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs font-medium text-muted-foreground">
                  <th className="pb-2 pr-4 font-medium">Topic</th>
                  <th className="pb-2 pr-4 font-medium">Subject</th>
                  <th className="pb-2 pr-4 text-right font-medium">Attempts</th>
                  <th className="pb-2 text-right font-medium">Avg Score</th>
                </tr>
              </thead>
              <tbody>
                {lowestScoreTopics.map((t) => (
                  <tr key={`${t.subject}-${t.topic}`} className="border-b border-border/60 last:border-0 bg-[#E11D48]/[0.04]">
                    <td className="py-2.5 pr-4 font-medium text-foreground">{t.topic}</td>
                    <td className="py-2.5 pr-4 text-muted-foreground">{t.subject}</td>
                    <td className="py-2.5 pr-4 text-right tabular-nums text-foreground">{t.attempts.toLocaleString()}</td>
                    <td className="py-2.5 text-right">
                      <span className="inline-flex rounded-md bg-[#E11D48]/12 px-2 py-0.5 text-xs font-semibold tabular-nums text-[#E11D48]">{t.avgScore}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="Content Growth" subtitle="Total questions over time" exportData={contentGrowth} exportName="content-growth">
          <div className="mt-4 h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={contentGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                <XAxis dataKey="month" stroke={axisStroke} fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke={axisStroke} fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(1)}k`} />
                <Tooltip formatter={(v: number) => v.toLocaleString()} contentStyle={tooltipStyle} cursor={{ stroke: gridStroke }} />
                <Line type="monotone" dataKey="questions" stroke={palette.emerald} strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>
    </div>
  );
}
