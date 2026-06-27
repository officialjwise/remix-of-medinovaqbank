import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Activity, Clock, GraduationCap, Target } from "lucide-react";
import { GradientKpiCard } from "@/components/shared/GradientKpiCard";
import { subjectTheme } from "@/data/subjectColors";
import {
  CHART_PALETTE,
  difficultyLabel,
  statusLabel,
  useAnalyticsDashboard,
  useContentAnalytics,
  useQuizPerformanceAnalytics,
  type BackendQuestionPerformance,
} from "@/api/admin-analytics.api";

export const Route = createFileRoute("/admin/quiz-analytics")({
  head: () => ({
    meta: [
      { title: "Admin · Quiz Analytics — Medinovaqbank" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: QuizAnalytics,
});

// Chart tokens — resolve correctly in light + dark
const axisStroke = "var(--color-muted-foreground)";
const gridStroke = "var(--color-border)";
const tooltipStyle = {
  backgroundColor: "var(--color-surface)",
  border: "1px solid var(--color-border)",
  borderRadius: "10px",
  color: "var(--color-foreground)",
  boxShadow: "var(--shadow-card-hover)",
};

function QuizAnalytics() {
  const dashboard = useAnalyticsDashboard();
  const content = useContentAnalytics();
  const quiz = useQuizPerformanceAnalytics();

  const isLoading = dashboard.isLoading || content.isLoading || quiz.isLoading;
  const isError = dashboard.isError || content.isError || quiz.isError;
  const error = dashboard.error ?? content.error ?? quiz.error;

  // Avg score per subject (accuracy), color-coded, descending.
  const byBank = useMemo(() => {
    const rows = content.data?.subjectPerformance ?? [];
    return rows
      .map((s) => ({
        name: s.subject,
        short: s.subject,
        score: Math.round(s.accuracy),
        answered: s.answered,
        fill: subjectTheme(s.subject).hex,
      }))
      .sort((a, b) => b.score - a.score);
  }, [content.data]);

  const modeSplit = useMemo(() => {
    const rows = quiz.data?.modeSplit ?? [];
    return rows.map((m, i) => ({
      name: statusLabel(m.key),
      value: m.count,
      fill: CHART_PALETTE[i % CHART_PALETTE.length],
    }));
  }, [quiz.data]);

  const hardest = quiz.data?.hardestQuestions ?? [];
  const easiest = quiz.data?.easiestQuestions ?? [];

  const totalSessions = dashboard.data?.totalSessions ?? 0;
  const questionsAnswered = useMemo(
    () => (quiz.data?.modeSplit ?? []).reduce((s, m) => s + m.count, 0),
    [quiz.data],
  );
  const platformAvg = Math.round(dashboard.data?.avgScore ?? 0);
  const avgTime = Math.round(quiz.data?.avgAnswerTimeSeconds ?? 0);

  if (isError) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-12 text-center">
        <p className="text-sm text-error">
          {error instanceof Error ? error.message : "Failed to load quiz analytics."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Quiz Analytics</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Performance, difficulty, and content insights across all sessions.
          </p>
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <GradientKpiCard
          icon={Activity}
          gradient="teal"
          label="Total sessions"
          value={isLoading ? "—" : totalSessions.toLocaleString()}
        />
        <GradientKpiCard
          icon={GraduationCap}
          gradient="emerald"
          label="Questions answered"
          value={isLoading ? "—" : questionsAnswered.toLocaleString()}
        />
        <GradientKpiCard
          icon={Target}
          gradient="blue"
          label="Platform avg score"
          value={isLoading ? "—" : `${platformAvg}%`}
        />
        <GradientKpiCard
          icon={Clock}
          gradient="amber"
          label="Avg time / question"
          value={isLoading ? "—" : `${avgTime}s`}
        />
      </div>

      {/* Score by subject + avg time by difficulty */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel
          title="Average score by subject"
          subtitle="Correct-answer rate per subject"
          className="lg:col-span-2"
        >
          <div className="h-80">
            {isLoading ? (
              <Loading />
            ) : byBank.length === 0 ? (
              <Empty label="No subject performance recorded yet." />
            ) : (
              <ResponsiveContainer>
                <BarChart data={byBank} layout="vertical" margin={{ left: 8, right: 16 }}>
                  <CartesianGrid horizontal={false} stroke={gridStroke} />
                  <XAxis
                    type="number"
                    domain={[0, 100]}
                    tickFormatter={(v) => `${v}%`}
                    stroke={axisStroke}
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="short"
                    stroke={axisStroke}
                    fontSize={11}
                    width={96}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    formatter={(v: number) => [`${v}%`, "Avg score"]}
                    contentStyle={tooltipStyle}
                    cursor={{ fill: "var(--color-surface-alt)" }}
                  />
                  <Bar dataKey="score" radius={[0, 6, 6, 0]} barSize={20}>
                    {byBank.map((b) => (
                      <Cell key={b.name} fill={b.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Panel>

        <Panel title="Avg time by difficulty" subtitle="Seconds per question">
          <div className="flex h-80 flex-col justify-center gap-6">
            {isLoading ? (
              <Loading />
            ) : (quiz.data?.avgTimeByDifficulty ?? []).length === 0 ? (
              <Empty label="No timing data yet." />
            ) : (
              (quiz.data?.avgTimeByDifficulty ?? []).map((d, i) => (
                <div key={d.key} className="flex items-center gap-4">
                  <TimeRing
                    seconds={Math.round(d.avgTimeSeconds)}
                    color={CHART_PALETTE[i % CHART_PALETTE.length]}
                  />
                  <div>
                    <p className="text-sm font-bold text-foreground">{difficultyLabel(d.key)}</p>
                    <p className="text-xs text-muted-foreground">
                      {d.answered.toLocaleString()} answered
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Panel>
      </div>

      {/* Mode split + hardest/easiest */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Tutor vs Quiz usage" subtitle="Answered questions by mode">
          <div className="h-64">
            {isLoading ? (
              <Loading />
            ) : modeSplit.length === 0 ? (
              <Empty label="No session data yet." />
            ) : (
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={modeSplit}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={52}
                    outerRadius={88}
                    paddingAngle={3}
                    stroke="var(--color-surface)"
                    strokeWidth={2}
                  >
                    {modeSplit.map((m) => (
                      <Cell key={m.name} fill={m.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v: number) => v.toLocaleString()}
                    contentStyle={tooltipStyle}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          {!isLoading && modeSplit.length > 0 && (
            <ul className="mt-1 space-y-1.5 text-xs">
              {modeSplit.map((m) => (
                <li key={m.name} className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-sm" style={{ background: m.fill }} />
                  <span className="flex-1 text-muted-foreground">{m.name}</span>
                  <span className="font-bold text-foreground">{m.value.toLocaleString()}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel
          title="Most difficult questions"
          subtitle="Lowest correct rate"
          className="lg:col-span-2"
        >
          {isLoading ? (
            <Loading />
          ) : hardest.length === 0 ? (
            <Empty label="No question data yet." />
          ) : (
            <QuestionRateTable rows={hardest} tone="error" />
          )}
        </Panel>
      </div>

      <Panel
        title="Easiest questions"
        subtitle="Highest correct rate — candidates for difficulty re-tagging"
      >
        {isLoading ? (
          <Loading />
        ) : easiest.length === 0 ? (
          <Empty label="No question data yet." />
        ) : (
          <QuestionRateTable rows={easiest} tone="success" />
        )}
      </Panel>
    </div>
  );
}

function Loading() {
  return (
    <div className="flex h-full items-center justify-center">
      <p className="text-sm text-muted-foreground">Loading…</p>
    </div>
  );
}

function Empty({ label }: { label: string }) {
  return (
    <div className="flex h-full items-center justify-center">
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

function TimeRing({ seconds, color }: { seconds: number; color: string }) {
  // Normalise against a 120s ceiling purely for the ring fill proportion.
  const pct = Math.min(100, Math.round((seconds / 120) * 100));
  const r = 26;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  return (
    <div className="relative h-16 w-16 flex-shrink-0">
      <svg viewBox="0 0 64 64" className="h-16 w-16 -rotate-90">
        <circle cx="32" cy="32" r={r} fill="none" stroke="var(--color-border)" strokeWidth="6" />
        <circle
          cx="32"
          cy="32"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-foreground">
        {seconds}s
      </span>
    </div>
  );
}

function QuestionRateTable({
  rows,
  tone,
}: {
  rows: BackendQuestionPerformance[];
  tone: "error" | "success";
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] text-left text-sm">
        <thead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          <tr className="border-b border-border">
            <th className="py-2 pr-3">Subject / Topic</th>
            <th className="px-3 py-2">Attempts</th>
            <th className="py-2 pl-3 text-right">Correct rate</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((q) => (
            <tr key={q.id} className="hover:bg-surface-alt/40">
              <td className="max-w-[360px] truncate py-2.5 pr-3 font-medium text-foreground">
                {q.topic ? `${q.subject} · ${q.topic}` : q.subject}
              </td>
              <td className="px-3 py-2.5 text-xs text-muted-foreground tabular-nums">
                {q.timesAnswered.toLocaleString()}
              </td>
              <td className="py-2.5 pl-3 text-right">
                <span
                  className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${tone === "error" ? "bg-error/10 text-error" : "bg-success/10 text-success"}`}
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

function Panel({
  title,
  subtitle,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)] ${className}`}
    >
      <header>
        <h3 className="text-sm font-bold tracking-tight text-foreground">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
      </header>
      <div className="mt-4">{children}</div>
    </section>
  );
}
