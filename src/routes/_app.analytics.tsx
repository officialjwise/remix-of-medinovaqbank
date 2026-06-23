import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Brain, Target, TrendingUp, Trophy } from "lucide-react";
import { recentSessions, questionBanks } from "@/data/banks";
import { bellCurvePoints, buildAnalytics } from "@/lib/analytics";
import { scoreColor } from "@/lib/quiz-results";

export const Route = createFileRoute("/_app/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — Medinovaqbank" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const [bank, setBank] = useState("All");
  const [range, setRange] = useState<"7" | "30" | "90" | "all">("30");
  const data = useMemo(() => buildAnalytics(recentSessions), []);
  const bell = useMemo(() => bellCurvePoints(data.cohort.mean, data.cohort.stddev), [data]);

  return (
    <div className="mx-auto max-w-7xl">
      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">My Performance Analytics</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track accuracy, percentile, and progress across your study history.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={bank}
            onChange={(e) => setBank(e.target.value)}
            className="h-9 rounded-lg border border-border bg-surface px-2.5 text-sm font-medium text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          >
            <option value="All">All Banks</option>
            {questionBanks.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
          <select
            value={range}
            onChange={(e) => setRange(e.target.value as typeof range)}
            className="h-9 rounded-lg border border-border bg-surface px-2.5 text-sm font-medium text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="all">All time</option>
          </select>
        </div>
      </header>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Average Score" value={`${data.averagePct}%`} icon={<Target className="h-4 w-4" />} accent="text-accent" />
        <StatCard label="Questions Answered" value={data.totalAnswered.toLocaleString()} icon={<Brain className="h-4 w-4" />} />
        <StatCard label="Correct" value={data.totalCorrect.toLocaleString()} icon={<TrendingUp className="h-4 w-4" />} accent="text-success" />
        <StatCard label="Best Subject" value={data.bestSubject.name} sub={`${data.bestSubject.pct}%`} icon={<Trophy className="h-4 w-4" />} accent="text-warning" />
      </div>

      {/* Bell curve */}
      <section className="mt-6 rounded-2xl border border-border bg-surface p-6">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-foreground">Your Percentile Ranking</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              You're in the <span className="font-bold text-accent">top {100 - data.percentile}%</span> of all test-takers.
            </p>
          </div>
          <div className="text-right text-xs text-muted-foreground">
            <span className="font-mono">You: <span className="font-bold text-foreground">{data.yourPct}%</span></span>
            <span className="mx-2">·</span>
            <span className="font-mono">Avg: <span className="font-bold text-foreground">{data.cohort.mean}%</span></span>
            <span className="mx-2">·</span>
            <span className="font-mono">σ ±{data.cohort.stddev}%</span>
          </div>
        </div>

        <div className="mt-4 h-[280px] w-full">
          <ResponsiveContainer>
            <AreaChart data={bell.map((p) => ({ ...p, left: p.x <= data.yourPct ? p.y : null, right: p.x >= data.yourPct ? p.y : null }))} margin={{ top: 24, right: 24, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="bellLeft" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0E7C7B" stopOpacity={0.55} />
                  <stop offset="95%" stopColor="#0E7C7B" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="bellRight" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.04} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="x" type="number" domain={[20, 110]} tickFormatter={(v) => `${v}%`} stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis hide />
              <Tooltip formatter={(v: number) => (v == null ? "" : v.toFixed(3))} labelFormatter={(l) => `${l}%`} />
              <Area type="monotone" dataKey="right" stroke="hsl(var(--muted-foreground))" fill="url(#bellRight)" strokeWidth={1.5} isAnimationActive={false} />
              <Area type="monotone" dataKey="left" stroke="#0E7C7B" fill="url(#bellLeft)" strokeWidth={2} isAnimationActive={false} />
              <ReferenceLine
                x={data.cohort.mean - data.cohort.stddev}
                stroke="hsl(var(--muted-foreground))"
                strokeDasharray="1 4"
                strokeOpacity={0.5}
              />
              <ReferenceLine
                x={data.cohort.mean + data.cohort.stddev}
                stroke="hsl(var(--muted-foreground))"
                strokeDasharray="1 4"
                strokeOpacity={0.5}
              />
              <ReferenceLine
                x={data.cohort.mean}
                stroke="hsl(var(--muted-foreground))"
                strokeDasharray="3 4"
                label={{ value: `Average ${data.cohort.mean}%`, position: "top", fill: "hsl(var(--muted-foreground))", fontSize: 10, fontWeight: 600 }}
              />
              <ReferenceLine
                x={data.yourPct}
                stroke="#0E7C7B"
                strokeWidth={2.5}
                label={{ value: `Your Score: ${data.yourPct}%`, position: "top", fill: "#0E7C7B", fontSize: 12, fontWeight: 800 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 space-y-1 text-center">
          <p className="text-sm font-semibold text-foreground">
            You scored better than <span className="text-accent">{data.percentile}%</span> of test-takers
          </p>
          <p className="text-xs text-muted-foreground">
            Based on {data.cohort.size.toLocaleString()} practitioners in this bank
          </p>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-[#0E7C7B]" /> Your score</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-px w-4 bg-muted-foreground" /> Average</span>
          <span>68% of test-takers fall between {data.cohort.mean - data.cohort.stddev}% – {data.cohort.mean + data.cohort.stddev}%</span>
        </div>
      </section>

      {/* Subject breakdown + Difficulty */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="rounded-2xl border border-border bg-surface p-6 lg:col-span-2">
          <h2 className="text-lg font-bold tracking-tight text-foreground">Subject Performance</h2>
          <div className="mt-4 h-80 w-full">
            <ResponsiveContainer>
              <BarChart data={data.bySubject} layout="vertical" margin={{ left: 20, right: 24 }}>
                <CartesianGrid horizontal={false} stroke="hsl(var(--border))" />
                <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" fontSize={12} width={140} />
                <Tooltip formatter={(v: number) => `${v}%`} />
                <Bar dataKey="pct" radius={[0, 6, 6, 0]} fill="hsl(var(--accent))" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-surface p-6">
          <h2 className="text-lg font-bold tracking-tight text-foreground">Difficulty Breakdown</h2>
          <div className="mt-4 space-y-3">
            {data.byDifficulty.map((d) => {
              const c = scoreColor(d.pct);
              return (
                <div key={d.name} className={`flex items-center gap-4 rounded-xl border border-border p-4 ${c.bg}`}>
                  <CircleProgress pct={d.pct} colorClass={c.text} ringClass={c.ring} />
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{d.name}</p>
                    <p className={`text-2xl font-bold tabular-nums ${c.text}`}>{d.pct}%</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Progress over time */}
      <section className="mt-6 rounded-2xl border border-border bg-surface p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-foreground">Progress Over Time</h2>
            <p className="mt-1 text-sm text-muted-foreground">Last {data.trend.length} sessions</p>
          </div>
        </div>
        <div className="mt-4 h-64 w-full">
          <ResponsiveContainer>
            <LineChart data={data.trend} margin={{ top: 10, right: 24, bottom: 0, left: 0 }}>
              <CartesianGrid stroke="hsl(var(--border))" />
              <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip formatter={(v: number) => `${v}%`} />
              <Line type="monotone" dataKey="pct" stroke="hsl(var(--accent))" strokeWidth={2} dot={{ r: 4 }} />
              <ReferenceLine y={data.averagePct} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" label={{ value: `Avg ${data.averagePct}%`, fontSize: 10, fill: "hsl(var(--muted-foreground))", position: "right" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  icon,
  accent = "text-foreground",
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  accent?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
        <span className={`flex h-7 w-7 items-center justify-center rounded-lg bg-surface-alt ${accent}`}>{icon}</span>
      </div>
      <p className={`mt-3 text-2xl font-bold tracking-tight ${accent}`}>{value}</p>
      {sub && <p className="mt-1 text-xs font-semibold text-muted-foreground">{sub}</p>}
    </div>
  );
}

function CircleProgress({ pct, colorClass, ringClass }: { pct: number; colorClass: string; ringClass: string }) {
  const r = 22;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  return (
    <div className="relative h-14 w-14 flex-shrink-0">
      <svg viewBox="0 0 56 56" className="h-full w-full -rotate-90">
        <circle cx="28" cy="28" r={r} fill="none" stroke="hsl(var(--border))" strokeWidth="5" />
        <circle
          cx="28"
          cy="28"
          r={r}
          fill="none"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className={ringClass}
        />
      </svg>
      <span className={`absolute inset-0 grid place-items-center text-xs font-bold tabular-nums ${colorClass}`}>{pct}</span>
    </div>
  );
}
