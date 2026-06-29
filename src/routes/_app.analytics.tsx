import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Brain,
  Target,
  Trophy,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  Lock,
  Sparkles,
  Loader2,
} from "lucide-react";
import {
  useMyAnalytics,
  useMyPercentile,
  type BreakdownItem,
  type LockedResponse,
  type PerformanceAnalytics,
} from "@/api/analytics.api";
import { scoreColor } from "@/lib/quiz-results";
import { GradientKpiCard } from "@/components/shared/GradientKpiCard";
import { useTrial } from "@/hooks/useTrial";

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

// Theme-aware (see --chart-c* in styles.css) so subject series read in dark mode.
const SUBJECT_HEX = [
  "var(--chart-c1)",
  "var(--chart-c2)",
  "var(--chart-c3)",
  "var(--chart-c4)",
  "var(--chart-c5)",
  "var(--chart-c6)",
  "var(--chart-c7)",
  "var(--chart-c8)",
  "var(--chart-c2)",
];

/** Upgrade teaser rendered in place of a gated section. */
function UpgradeTeaser({ teaser }: { teaser: LockedResponse }) {
  const { requireFeature } = useTrial();
  return (
    <section className="rounded-2xl border border-border bg-surface p-6">
      <button
        type="button"
        onClick={() => requireFeature("performance_analytics")}
        className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-accent/30 bg-accent/[0.04] p-10 text-center transition hover:bg-accent/[0.08]"
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/15 text-accent">
          <Lock className="h-6 w-6" />
        </span>
        <span className="text-base font-bold text-foreground">Your Percentile Ranking</span>
        <span className="max-w-sm text-sm text-muted-foreground">{teaser.message}</span>
        <span className="mt-1 inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-primary to-accent px-4 py-2 text-sm font-bold text-white">
          <Sparkles className="h-4 w-4" /> Upgrade to unlock
        </span>
      </button>
    </section>
  );
}

function CenterState({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-7xl">
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-muted-foreground">
        {children}
      </div>
    </div>
  );
}

function AnalyticsPage() {
  const perf = useMyAnalytics();
  const pct = useMyPercentile();

  if (perf.isLoading) {
    return (
      <CenterState>
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
        <p className="text-sm">Loading your analytics…</p>
      </CenterState>
    );
  }

  if (perf.isError || !perf.data) {
    return (
      <CenterState>
        <p className="text-sm">We couldn't load your analytics. Please try again.</p>
      </CenterState>
    );
  }

  // Performance analytics is itself feature-gated: render the upgrade teaser.
  if (perf.data.locked) {
    return (
      <div className="mx-auto max-w-7xl">
        <AnalyticsHeader />
        <div className="mt-6">
          <UpgradeTeaser teaser={perf.data.teaser} />
        </div>
      </div>
    );
  }

  return <AnalyticsContent data={perf.data.data} percentile={pct} />;
}

function AnalyticsHeader() {
  return (
    <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          My Performance Analytics
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track accuracy, percentile, and progress across your study history.
        </p>
      </div>
    </header>
  );
}

function AnalyticsContent({
  data,
  percentile,
}: {
  data: PerformanceAnalytics;
  percentile: ReturnType<typeof useMyPercentile>;
}) {
  const bestSubject = useMemo<BreakdownItem | null>(() => {
    if (data.subjectBreakdown.length === 0) return null;
    return data.subjectBreakdown.reduce((a, b) => (a.pct >= b.pct ? a : b));
  }, [data.subjectBreakdown]);

  const accuracy =
    data.totalQuestions > 0 ? Math.round((data.totalCorrect / data.totalQuestions) * 100) : 0;

  // Session timeline (oldest → newest) for the progress chart.
  const timeline = useMemo(
    () =>
      data.sessionTimeline
        .slice()
        .reverse()
        .map((s, i) => ({ ...s, label: s.date || `#${i + 1}` })),
    [data.sessionTimeline],
  );

  return (
    <div className="mx-auto max-w-7xl">
      <AnalyticsHeader />

      {/* Gradient KPI cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <GradientKpiCard
          label="Average Score"
          value={`${data.overallAccuracy}%`}
          icon={Target}
          gradient="teal"
          sub="overall accuracy"
        />
        <GradientKpiCard
          label="Questions Answered"
          value={data.totalQuestions.toLocaleString()}
          icon={Brain}
          gradient="blue"
          sub={`${data.totalSessions.toLocaleString()} sessions`}
        />
        <GradientKpiCard
          label="Correct"
          value={data.totalCorrect.toLocaleString()}
          icon={CheckCircle2}
          gradient="emerald"
          trend={{ value: `${accuracy}% accuracy`, up: accuracy >= 50 }}
        />
        <GradientKpiCard
          label="Best Subject"
          value={bestSubject?.name ?? "—"}
          icon={Trophy}
          gradient="amber"
          sub={bestSubject ? `${bestSubject.pct}% accuracy` : "no data yet"}
        />
      </div>

      {/* Percentile ranking — premium, feature-gated server-side */}
      <div className="mt-6">
        <PercentileSection percentile={percentile} />
      </div>

      {/* Subject breakdown + Difficulty */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="rounded-2xl border border-border bg-surface p-6 lg:col-span-2">
          <h2 className="text-lg font-bold tracking-tight text-foreground">Subject Performance</h2>
          <p className="mt-1 text-sm text-muted-foreground">Accuracy by subject.</p>
          {data.subjectBreakdown.length === 0 ? (
            <EmptyHint>Complete a session to see your subject accuracy.</EmptyHint>
          ) : (
            <div className="mt-4 h-80 w-full">
              <ResponsiveContainer>
                <BarChart
                  data={data.subjectBreakdown}
                  layout="vertical"
                  margin={{ left: 20, right: 24 }}
                >
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
                    {data.subjectBreakdown.map((s, i) => (
                      <Cell key={s.name} fill={SUBJECT_HEX[i % SUBJECT_HEX.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-border bg-surface p-6">
          <h2 className="text-lg font-bold tracking-tight text-foreground">Difficulty Breakdown</h2>
          {data.difficultyBreakdown.length === 0 ? (
            <EmptyHint>No difficulty data yet.</EmptyHint>
          ) : (
            <div className="mt-4 space-y-3">
              {data.difficultyBreakdown.map((d) => {
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
                      <p className="text-[11px] text-muted-foreground">
                        {d.correct}/{d.answered} correct
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Strengths & weaknesses */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-surface p-6">
          <h2 className="flex items-center gap-2 text-lg font-bold tracking-tight text-foreground">
            <ArrowUpRight className="h-5 w-5 text-success" /> Top Strengths
          </h2>
          {data.strongestAreas.length === 0 ? (
            <EmptyHint>Answer more questions to surface your strengths.</EmptyHint>
          ) : (
            <ul className="mt-4 space-y-3">
              {data.strongestAreas.map((t) => (
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
          )}
        </section>

        <section className="rounded-2xl border border-border bg-surface p-6">
          <h2 className="flex items-center gap-2 text-lg font-bold tracking-tight text-foreground">
            <ArrowDownRight className="h-5 w-5 text-error" /> Needs Work
          </h2>
          {data.weakestAreas.length === 0 ? (
            <EmptyHint>No weak areas detected yet.</EmptyHint>
          ) : (
            <ul className="mt-4 space-y-3">
              {data.weakestAreas.map((t) => (
                <li key={t.name} className="flex items-center justify-between gap-3">
                  <span className="truncate text-sm font-semibold text-foreground">{t.name}</span>
                  <div className="flex flex-1 items-center gap-3">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-alt">
                      <div
                        className="h-full rounded-full bg-error"
                        style={{ width: `${t.pct}%` }}
                      />
                    </div>
                    <span className="w-10 text-right font-mono text-sm font-bold tabular-nums text-error">
                      {t.pct}%
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Progress over time */}
      <section className="mt-6 rounded-2xl border border-border bg-surface p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-foreground">Progress Over Time</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Score trend across your recent sessions.
            </p>
          </div>
        </div>
        {timeline.length === 0 ? (
          <EmptyHint>Your session score trend will appear here.</EmptyHint>
        ) : (
          <div className="mt-4 h-64 w-full">
            <ResponsiveContainer>
              <AreaChart data={timeline} margin={{ top: 10, right: 24, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="scoreTrend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-c1)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="var(--chart-c1)" stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--color-border)" />
                <XAxis dataKey="label" stroke="var(--color-muted-foreground)" fontSize={12} />
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
                  stroke="var(--chart-c1)"
                  strokeWidth={2.5}
                  fill="url(#scoreTrend)"
                  dot={{ r: 3, fill: "var(--chart-c1)" }}
                  isAnimationActive={false}
                />
                <ReferenceLine
                  y={data.overallAccuracy}
                  stroke="var(--color-muted-foreground)"
                  strokeDasharray="3 3"
                  label={{
                    value: `Avg ${data.overallAccuracy}%`,
                    fontSize: 10,
                    fill: "var(--color-muted-foreground)",
                    position: "right",
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>
    </div>
  );
}

function PercentileSection({ percentile }: { percentile: ReturnType<typeof useMyPercentile> }) {
  if (percentile.isLoading) {
    return (
      <section className="flex h-[200px] items-center justify-center rounded-2xl border border-border bg-surface">
        <Loader2 className="h-5 w-5 animate-spin text-accent" />
      </section>
    );
  }
  if (percentile.isError || !percentile.data) {
    return null;
  }
  if (percentile.data.locked) {
    return <UpgradeTeaser teaser={percentile.data.teaser} />;
  }

  const p = percentile.data.data;
  const topPct = Math.max(1, Math.round(100 - p.percentile));
  const lower = Math.round(p.mean - p.stdDev);
  const upper = Math.round(p.mean + p.stdDev);

  // Split the Gaussian curve at the user's score for the two-tone fill.
  const curve = p.curve.map((pt) => ({
    ...pt,
    left: pt.x <= p.userScore ? pt.y : null,
    right: pt.x >= p.userScore ? pt.y : null,
  }));

  return (
    <section className="rounded-2xl border border-border bg-surface p-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-foreground">
            Your Percentile Ranking
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            You're in the <span className="font-bold text-accent">top {topPct}%</span> of all
            test-takers.
          </p>
        </div>
        <div className="text-right text-xs text-muted-foreground">
          <span className="font-mono">
            You: <span className="font-bold text-foreground">{Math.round(p.userScore)}%</span>
          </span>
          <span className="mx-2">·</span>
          <span className="font-mono">
            Avg: <span className="font-bold text-foreground">{Math.round(p.mean)}%</span>
          </span>
          <span className="mx-2">·</span>
          <span className="font-mono">σ ±{Math.round(p.stdDev)}%</span>
        </div>
      </div>

      {curve.length === 0 ? (
        <EmptyHint>Not enough peer data yet to plot the distribution.</EmptyHint>
      ) : (
        <div className="mt-4 h-[280px] w-full">
          <ResponsiveContainer>
            <AreaChart data={curve} margin={{ top: 24, right: 24, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="bellLeft" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-c1)" stopOpacity={0.55} />
                  <stop offset="95%" stopColor="var(--chart-c1)" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="bellRight" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-muted-foreground)" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="var(--color-muted-foreground)" stopOpacity={0.04} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--color-border)" vertical={false} />
              <XAxis
                dataKey="x"
                type="number"
                domain={[0, 100]}
                tickFormatter={(v) => `${v}%`}
                stroke="var(--color-muted-foreground)"
                fontSize={12}
              />
              <YAxis hide />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                formatter={(v: number) => (v == null ? "" : v.toFixed(4))}
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
                stroke="var(--chart-c1)"
                fill="url(#bellLeft)"
                strokeWidth={2}
                isAnimationActive={false}
              />
              <ReferenceLine
                x={p.mean}
                stroke="var(--color-muted-foreground)"
                strokeDasharray="3 4"
                label={{
                  value: `Average ${Math.round(p.mean)}%`,
                  position: "top",
                  fill: "var(--color-muted-foreground)",
                  fontSize: 10,
                  fontWeight: 600,
                }}
              />
              <ReferenceLine
                x={p.userScore}
                stroke="var(--chart-c1)"
                strokeWidth={2.5}
                label={{
                  value: `Your Score: ${Math.round(p.userScore)}%`,
                  position: "top",
                  fill: "var(--chart-c1)",
                  fontSize: 12,
                  fontWeight: 800,
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
      <div className="mt-3 space-y-1 text-center">
        <p className="text-sm font-semibold text-foreground">
          You scored better than <span className="text-accent">{Math.round(p.percentile)}%</span> of
          test-takers
        </p>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-[var(--chart-c1)]" /> Your score
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-px w-4 bg-muted-foreground" /> Average
        </span>
        <span>
          68% of test-takers fall between {lower}% – {upper}%
        </span>
      </div>
    </section>
  );
}

function EmptyHint({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-4 flex h-32 items-center justify-center rounded-xl border border-dashed border-border text-center text-sm text-muted-foreground">
      <span className="max-w-xs">{children}</span>
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
