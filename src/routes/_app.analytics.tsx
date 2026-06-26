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
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Brain,
  Target,
  TrendingUp,
  Trophy,
  CheckCircle2,
  Timer,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { recentSessions, questionBanks } from "@/data/banks";
import { bellCurvePoints, buildAnalytics } from "@/lib/analytics";
import { scoreColor } from "@/lib/quiz-results";
import { FeatureLock } from "@/components/shared/FeatureLock";
import { GradientKpiCard } from "@/components/shared/GradientKpiCard";

export const Route = createFileRoute("/_app/analytics")({
  head: () => ({
    meta: [{ title: "Analytics — Medinovaqbank" }, { name: "robots", content: "noindex" }],
  }),
  component: AnalyticsPage,
});

const TOOLTIP_STYLE = {
  backgroundColor: "var(--color-surface)",
  border: "1px solid var(--color-border)",
  borderRadius: "10px",
  color: "var(--color-foreground)",
} as const;

const SUBJECT_HEX = [
  "#0E7C7B",
  "#2BC97F",
  "#3B82F6",
  "#E89A1A",
  "#7C3AED",
  "#E11D48",
  "#15A89C",
  "#6366F1",
  "#F472B6",
];

/** Deterministic 0..1 from a string seed — no Math.random in render. */
function seededHash(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 100000) / 100000;
}

const RANGE_DAYS: Record<string, number> = { "7": 7, "30": 30, "90": 90, all: 365 };

/**
 * Per-bank accuracy derived deterministically from each bank's id + difficulty,
 * so the table/bars stay stable. Real sessions nudge the value where present.
 */
function buildPerBank() {
  const sessionByBank = new Map<string, number>();
  recentSessions
    .filter((s) => !s.inProgress)
    .forEach((s) => sessionByBank.set(s.bankId, s.scorePct));
  return questionBanks.map((b) => {
    const base = 55 + Math.round(seededHash(`${b.id}|acc`) * 40); // 55..95
    const real = sessionByBank.get(b.id);
    const pct = real != null ? Math.round((real + base) / 2) : base;
    const answered = 40 + Math.round(seededHash(`${b.id}|n`) * 260);
    return { id: b.id, name: b.name, short: b.subject, pct, answered, hex: b.accentHex };
  });
}

/** Beginner/Intermediate/Advanced accuracy (deterministic, decays with difficulty). */
function buildDifficulty() {
  return (["Beginner", "Intermediate", "Advanced"] as const).map((name, i) => {
    const pct = [78, 68, 55][i] + Math.round((seededHash(`${name}|d`) - 0.5) * 8);
    return { name, pct: Math.max(35, Math.min(96, pct)) };
  });
}

/** Topic-level strengths & weaknesses across subjects. */
function buildTopics(bySubject: { name: string; pct: number }[]) {
  const sorted = bySubject.slice().sort((a, b) => b.pct - a.pct);
  return {
    strengths: sorted.slice(0, 3),
    weaknesses: sorted.slice(-3).reverse(),
  };
}

/**
 * Deterministic score-over-time + avg-time-per-question series for a window.
 * Seeded so the curve is stable per range; trends upward gently.
 */
function buildTimeSeries(rangeKey: string, baseAvg: number) {
  const days = RANGE_DAYS[rangeKey];
  const points = rangeKey === "7" ? 7 : rangeKey === "30" ? 10 : rangeKey === "90" ? 12 : 14;
  const out: { date: string; pct: number; seconds: number }[] = [];
  for (let i = 0; i < points; i++) {
    const dayOffset = Math.round((days / points) * (points - 1 - i));
    const d = new Date(Date.now() - dayOffset * 86_400_000);
    const date = `${d.getMonth() + 1}/${d.getDate()}`;
    const wobble = (seededHash(`${rangeKey}|pct|${i}`) - 0.5) * 14;
    const progress = (i / Math.max(1, points - 1)) * 8; // gentle upward trend
    const pct = Math.max(40, Math.min(98, Math.round(baseAvg - 6 + progress + wobble)));
    const seconds = Math.round(
      95 - progress * 1.5 + (seededHash(`${rangeKey}|sec|${i}`) - 0.5) * 18,
    );
    out.push({ date, pct, seconds: Math.max(45, seconds) });
  }
  return out;
}

function AnalyticsPage() {
  const [bank, setBank] = useState("All");
  const [range, setRange] = useState<"7" | "30" | "90" | "all">("30");

  const data = useMemo(() => buildAnalytics(recentSessions), []);
  const bell = useMemo(() => bellCurvePoints(data.cohort.mean, data.cohort.stddev), [data]);

  const perBankAll = useMemo(() => buildPerBank(), []);
  const difficulty = useMemo(() => buildDifficulty(), []);

  // Bank filter: narrow subject breakdown + headline avg to the chosen bank.
  const bySubject = useMemo(() => {
    if (bank === "All") return data.bySubject;
    // Deterministically re-weight subjects for the selected bank.
    return data.bySubject.map((s) => ({
      name: s.name,
      pct: Math.max(
        35,
        Math.min(98, s.pct + Math.round((seededHash(`${bank}|${s.name}`) - 0.5) * 18)),
      ),
    }));
  }, [bank, data.bySubject]);

  const topics = useMemo(() => buildTopics(bySubject), [bySubject]);

  const perBank = useMemo(
    () => (bank === "All" ? perBankAll : perBankAll.filter((b) => b.id === bank)),
    [bank, perBankAll],
  );

  // Range + bank aware headline average.
  const headlineAvg = useMemo(() => {
    if (bank === "All") return data.averagePct;
    const b = perBankAll.find((x) => x.id === bank);
    return b ? b.pct : data.averagePct;
  }, [bank, data.averagePct, perBankAll]);

  const timeSeries = useMemo(() => buildTimeSeries(range, headlineAvg), [range, headlineAvg]);
  const avgTime = useMemo(
    () => Math.round(timeSeries.reduce((a, p) => a + p.seconds, 0) / timeSeries.length),
    [timeSeries],
  );
  const timeDelta =
    timeSeries.length > 1 ? timeSeries[0].seconds - timeSeries[timeSeries.length - 1].seconds : 0;

  const bestSubject = useMemo(
    () => bySubject.reduce((a, b) => (a.pct >= b.pct ? a : b), bySubject[0]),
    [bySubject],
  );

  return (
    <div className="mx-auto max-w-7xl">
      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            My Performance Analytics
          </h1>
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

      {/* Gradient KPI cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <GradientKpiCard
          label="Average Score"
          value={`${headlineAvg}%`}
          icon={Target}
          gradient="teal"
          trend={{ value: "+4% vs. last period", up: true }}
        />
        <GradientKpiCard
          label="Questions Answered"
          value={data.totalAnswered.toLocaleString()}
          icon={Brain}
          gradient="blue"
          sub={range === "all" ? "all time" : `last ${range} days`}
        />
        <GradientKpiCard
          label="Correct"
          value={data.totalCorrect.toLocaleString()}
          icon={CheckCircle2}
          gradient="emerald"
          trend={{
            value: `${Math.round((data.totalCorrect / data.totalAnswered) * 100)}% accuracy`,
            up: true,
          }}
        />
        <GradientKpiCard
          label="Best Subject"
          value={bestSubject.name}
          icon={Trophy}
          gradient="amber"
          sub={`${bestSubject.pct}% accuracy`}
        />
      </div>

      {/* Bell curve — premium percentile analytics, gated during trial */}
      <div className="mt-6">
        <FeatureLock featureKey="performance_analytics">
          <section className="rounded-2xl border border-border bg-surface p-6">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-lg font-bold tracking-tight text-foreground">
                  Your Percentile Ranking
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  You're in the{" "}
                  <span className="font-bold text-accent">top {100 - data.percentile}%</span> of all
                  test-takers.
                </p>
              </div>
              <div className="text-right text-xs text-muted-foreground">
                <span className="font-mono">
                  You: <span className="font-bold text-foreground">{data.yourPct}%</span>
                </span>
                <span className="mx-2">·</span>
                <span className="font-mono">
                  Avg: <span className="font-bold text-foreground">{data.cohort.mean}%</span>
                </span>
                <span className="mx-2">·</span>
                <span className="font-mono">σ ±{data.cohort.stddev}%</span>
              </div>
            </div>

            <div className="mt-4 h-[280px] w-full">
              <ResponsiveContainer>
                <AreaChart
                  data={bell.map((p) => ({
                    ...p,
                    left: p.x <= data.yourPct ? p.y : null,
                    right: p.x >= data.yourPct ? p.y : null,
                  }))}
                  margin={{ top: 24, right: 24, bottom: 0, left: 0 }}
                >
                  <defs>
                    <linearGradient id="bellLeft" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0E7C7B" stopOpacity={0.55} />
                      <stop offset="95%" stopColor="#0E7C7B" stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="bellRight" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="0%"
                        stopColor="var(--color-muted-foreground)"
                        stopOpacity={0.35}
                      />
                      <stop
                        offset="95%"
                        stopColor="var(--color-muted-foreground)"
                        stopOpacity={0.04}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="var(--color-border)" vertical={false} />
                  <XAxis
                    dataKey="x"
                    type="number"
                    domain={[20, 110]}
                    tickFormatter={(v) => `${v}%`}
                    stroke="var(--color-muted-foreground)"
                    fontSize={12}
                  />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE}
                    formatter={(v: number) => (v == null ? "" : v.toFixed(3))}
                    labelFormatter={(l) => `${l}%`}
                  />
                  <Area
                    type="monotone"
                    dataKey="right"
                    stroke="var(--color-muted-foreground)"
                    fill="url(#bellRight)"
                    strokeWidth={1.5}
                    isAnimationActive={false}
                  />
                  <Area
                    type="monotone"
                    dataKey="left"
                    stroke="#0E7C7B"
                    fill="url(#bellLeft)"
                    strokeWidth={2}
                    isAnimationActive={false}
                  />
                  <ReferenceLine
                    x={data.cohort.mean - data.cohort.stddev}
                    stroke="var(--color-muted-foreground)"
                    strokeDasharray="1 4"
                    strokeOpacity={0.5}
                  />
                  <ReferenceLine
                    x={data.cohort.mean + data.cohort.stddev}
                    stroke="var(--color-muted-foreground)"
                    strokeDasharray="1 4"
                    strokeOpacity={0.5}
                  />
                  <ReferenceLine
                    x={data.cohort.mean}
                    stroke="var(--color-muted-foreground)"
                    strokeDasharray="3 4"
                    label={{
                      value: `Average ${data.cohort.mean}%`,
                      position: "top",
                      fill: "var(--color-muted-foreground)",
                      fontSize: 10,
                      fontWeight: 600,
                    }}
                  />
                  <ReferenceLine
                    x={data.yourPct}
                    stroke="#0E7C7B"
                    strokeWidth={2.5}
                    label={{
                      value: `Your Score: ${data.yourPct}%`,
                      position: "top",
                      fill: "#0E7C7B",
                      fontSize: 12,
                      fontWeight: 800,
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 space-y-1 text-center">
              <p className="text-sm font-semibold text-foreground">
                You scored better than <span className="text-accent">{data.percentile}%</span> of
                test-takers
              </p>
              <p className="text-xs text-muted-foreground">
                Based on {data.cohort.size.toLocaleString()} practitioners in this bank
              </p>
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-[11px] text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-[#0E7C7B]" /> Your score
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-px w-4 bg-muted-foreground" /> Average
              </span>
              <span>
                68% of test-takers fall between {data.cohort.mean - data.cohort.stddev}% –{" "}
                {data.cohort.mean + data.cohort.stddev}%
              </span>
            </div>
          </section>
        </FeatureLock>
      </div>

      {/* Subject breakdown + Difficulty */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="rounded-2xl border border-border bg-surface p-6 lg:col-span-2">
          <h2 className="text-lg font-bold tracking-tight text-foreground">Subject Performance</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Accuracy by subject{bank !== "All" ? " in this bank" : ""}.
          </p>
          <div className="mt-4 h-80 w-full">
            <ResponsiveContainer>
              <BarChart data={bySubject} layout="vertical" margin={{ left: 20, right: 24 }}>
                <CartesianGrid horizontal={false} stroke="var(--color-border)" />
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`}
                  stroke="var(--color-muted-foreground)"
                  fontSize={12}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  stroke="var(--color-muted-foreground)"
                  fontSize={12}
                  width={140}
                />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  formatter={(v: number) => `${v}%`}
                  cursor={{ fill: "var(--color-border)", opacity: 0.3 }}
                />
                <Bar dataKey="pct" radius={[0, 6, 6, 0]}>
                  {bySubject.map((s, i) => (
                    <Cell key={s.name} fill={SUBJECT_HEX[i % SUBJECT_HEX.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-surface p-6">
          <h2 className="text-lg font-bold tracking-tight text-foreground">Difficulty Breakdown</h2>
          <div className="mt-4 space-y-3">
            {difficulty.map((d) => {
              const c = scoreColor(d.pct);
              return (
                <div
                  key={d.name}
                  className={`flex items-center gap-4 rounded-xl border border-border p-4 ${c.bg}`}
                >
                  <CircleProgress pct={d.pct} colorClass={c.text} ringClass={c.ring} />
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                      {d.name}
                    </p>
                    <p className={`text-2xl font-bold tabular-nums ${c.text}`}>{d.pct}%</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Strengths & weaknesses */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-surface p-6">
          <h2 className="flex items-center gap-2 text-lg font-bold tracking-tight text-foreground">
            <ArrowUpRight className="h-5 w-5 text-success" /> Top Strengths
          </h2>
          <ul className="mt-4 space-y-3">
            {topics.strengths.map((t) => (
              <li key={t.name} className="flex items-center justify-between gap-3">
                <span className="truncate text-sm font-semibold text-foreground">{t.name}</span>
                <div className="flex flex-1 items-center gap-3">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-alt">
                    <div
                      className="h-full rounded-full bg-success"
                      style={{ width: `${t.pct}%` }}
                    />
                  </div>
                  <span className="w-10 text-right font-mono text-sm font-bold tabular-nums text-success">
                    {t.pct}%
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-border bg-surface p-6">
          <h2 className="flex items-center gap-2 text-lg font-bold tracking-tight text-foreground">
            <ArrowDownRight className="h-5 w-5 text-error" /> Needs Work
          </h2>
          <ul className="mt-4 space-y-3">
            {topics.weaknesses.map((t) => (
              <li key={t.name} className="flex items-center justify-between gap-3">
                <span className="truncate text-sm font-semibold text-foreground">{t.name}</span>
                <div className="flex flex-1 items-center gap-3">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-alt">
                    <div className="h-full rounded-full bg-error" style={{ width: `${t.pct}%` }} />
                  </div>
                  <span className="w-10 text-right font-mono text-sm font-bold tabular-nums text-error">
                    {t.pct}%
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* Progress over time */}
      <section className="mt-6 rounded-2xl border border-border bg-surface p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-foreground">Progress Over Time</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Score trend · {range === "all" ? "all time" : `last ${range} days`}
            </p>
          </div>
        </div>
        <div className="mt-4 h-64 w-full">
          <ResponsiveContainer>
            <AreaChart data={timeSeries} margin={{ top: 10, right: 24, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="scoreTrend" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0E7C7B" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#0E7C7B" stopOpacity={0.03} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--color-border)" />
              <XAxis dataKey="date" stroke="var(--color-muted-foreground)" fontSize={12} />
              <YAxis
                domain={[0, 100]}
                tickFormatter={(v) => `${v}%`}
                stroke="var(--color-muted-foreground)"
                fontSize={12}
              />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => `${v}%`} />
              <Area
                type="monotone"
                dataKey="pct"
                stroke="#0E7C7B"
                strokeWidth={2.5}
                fill="url(#scoreTrend)"
                dot={{ r: 3, fill: "#0E7C7B" }}
                isAnimationActive={false}
              />
              <ReferenceLine
                y={headlineAvg}
                stroke="var(--color-muted-foreground)"
                strokeDasharray="3 3"
                label={{
                  value: `Avg ${headlineAvg}%`,
                  fontSize: 10,
                  fill: "var(--color-muted-foreground)",
                  position: "right",
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Per-bank performance + Time analytics */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="rounded-2xl border border-border bg-surface p-6 lg:col-span-2">
          <h2 className="text-lg font-bold tracking-tight text-foreground">Performance by Bank</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Accuracy and volume across your question banks.
          </p>
          <div className="mt-4 h-72 w-full">
            <ResponsiveContainer>
              <BarChart data={perBank} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--color-border)" />
                <XAxis
                  dataKey="short"
                  stroke="var(--color-muted-foreground)"
                  fontSize={11}
                  interval={0}
                  angle={-20}
                  textAnchor="end"
                  height={60}
                />
                <YAxis
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`}
                  stroke="var(--color-muted-foreground)"
                  fontSize={12}
                />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  formatter={(v: number, _n, p) => [
                    `${v}%`,
                    (p?.payload as { name: string })?.name ?? "Accuracy",
                  ]}
                  cursor={{ fill: "var(--color-border)", opacity: 0.3 }}
                />
                <Bar dataKey="pct" radius={[6, 6, 0, 0]}>
                  {perBank.map((b) => (
                    <Cell key={b.id} fill={b.hex} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-surface p-6">
          <h2 className="flex items-center gap-2 text-lg font-bold tracking-tight text-foreground">
            <Timer className="h-5 w-5 text-accent" /> Time per Question
          </h2>
          <div className="mt-4 flex items-center justify-center">
            <div className="relative h-40 w-40">
              <ResponsiveContainer>
                <RadialBarChart
                  innerRadius="72%"
                  outerRadius="100%"
                  data={[
                    {
                      name: "avg",
                      value: Math.min(100, Math.round((avgTime / 120) * 100)),
                      fill: "#0E7C7B",
                    },
                  ]}
                  startAngle={90}
                  endAngle={-270}
                >
                  <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                  <RadialBar
                    dataKey="value"
                    cornerRadius={10}
                    background={{ fill: "var(--color-border)" }}
                    isAnimationActive={false}
                  />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-extrabold tabular-nums text-foreground">
                  {avgTime}s
                </span>
                <span className="text-xs text-muted-foreground">avg / question</span>
              </div>
            </div>
          </div>
          <p
            className={`mt-4 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${timeDelta >= 0 ? "bg-success-light text-success" : "bg-warning-light text-warning"}`}
          >
            {timeDelta >= 0 ? (
              <ArrowDownRight className="h-3.5 w-3.5" />
            ) : (
              <ArrowUpRight className="h-3.5 w-3.5" />
            )}
            {timeDelta >= 0 ? `${timeDelta}s faster` : `${Math.abs(timeDelta)}s slower`} than period
            start
          </p>
          <div className="mt-4 h-24 w-full">
            <ResponsiveContainer>
              <LineChart data={timeSeries} margin={{ top: 6, right: 8, bottom: 0, left: 0 }}>
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => `${v}s`} />
                <Line
                  type="monotone"
                  dataKey="seconds"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      {/* Per-bank detail table */}
      <section className="mt-6 overflow-hidden rounded-2xl border border-border bg-surface">
        <div className="grid grid-cols-[1fr_90px_110px] gap-4 border-b border-border bg-surface-alt/30 px-6 py-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
          <span>Bank</span>
          <span className="text-right">Accuracy</span>
          <span className="text-right">Answered</span>
        </div>
        {perBank.map((b) => {
          const c = scoreColor(b.pct);
          return (
            <div
              key={b.id}
              className="grid grid-cols-[1fr_90px_110px] items-center gap-4 border-b border-border px-6 py-3 last:border-b-0"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                  style={{ backgroundColor: b.hex }}
                />
                <span className="truncate text-sm font-semibold text-foreground">{b.name}</span>
              </div>
              <span className={`text-right font-mono text-sm font-bold tabular-nums ${c.text}`}>
                {b.pct}%
              </span>
              <span className="text-right font-mono text-sm tabular-nums text-foreground/80">
                {b.answered.toLocaleString()}
              </span>
            </div>
          );
        })}
      </section>
    </div>
  );
}

function CircleProgress({
  pct,
  colorClass,
  ringClass,
}: {
  pct: number;
  colorClass: string;
  ringClass: string;
}) {
  const r = 22;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  return (
    <div className="relative h-14 w-14 flex-shrink-0">
      <svg viewBox="0 0 56 56" className="h-full w-full -rotate-90">
        <circle cx="28" cy="28" r={r} fill="none" stroke="var(--color-border)" strokeWidth="5" />
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
      <span
        className={`absolute inset-0 grid place-items-center text-xs font-bold tabular-nums ${colorClass}`}
      >
        {pct}
      </span>
    </div>
  );
}
