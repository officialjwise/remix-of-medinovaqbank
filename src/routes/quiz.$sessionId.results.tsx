import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  BookOpenCheck,
  Check,
  ChevronDown,
  Clock,
  LayoutDashboard,
  Share2,
  SkipForward,
  TrendingUp,
  X,
} from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { useSessionStore } from "@/stores/sessionStore";
import { computeResults, formatDuration, scoreColor } from "@/lib/quiz-results";

export const Route = createFileRoute("/quiz/$sessionId/results")({
  beforeLoad: () => {
    if (typeof window === "undefined") return;
    if (!useAuthStore.getState().isAuthenticated) throw redirect({ to: "/login" });
  },
  head: () => ({
    meta: [{ title: "Session Results — Medinovaqbank" }, { name: "robots", content: "noindex" }],
  }),
  component: ResultsPage,
});

type Tab = "subject" | "difficulty" | "timeline";

function ResultsPage() {
  const { sessionId } = Route.useParams();
  const navigate = useNavigate();
  const session = useSessionStore((s) => s.sessions[sessionId]);
  const questions = useSessionStore((s) => s.questions);
  const ensureHistoricalSession = useSessionStore((s) => s.ensureHistoricalSession);
  const [tab, setTab] = useState<Tab>("subject");
  const [openId, setOpenId] = useState<string | null>(null);
  const [shared, setShared] = useState(false);

  // Reconstruct a past session (from history) so results work after the fact.
  useEffect(() => {
    if (!session) ensureHistoricalSession(sessionId);
  }, [session, sessionId, ensureHistoricalSession]);

  const results = useMemo(
    () => (session ? computeResults(session, questions) : null),
    [session, questions],
  );

  if (!session || !results) {
    return (
      <div className="grid min-h-screen place-items-center bg-background p-6 text-center">
        <div>
          <h1 className="text-xl font-bold text-foreground">Session not found</h1>
          <Link
            to="/banks"
            className="mt-4 inline-flex h-10 items-center justify-center rounded-lg bg-accent px-4 text-sm font-semibold text-accent-foreground"
          >
            Browse Banks
          </Link>
        </div>
      </div>
    );
  }

  const percentile = Math.min(99, Math.max(5, Math.round(results.scorePct * 0.9 + 5)));
  const sc = scoreColor(results.scorePct);

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-8">
        {/* Hero */}
        <section className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary via-primary-light to-accent p-8 text-white shadow-[var(--shadow-card)] sm:p-10">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/20 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-20 -left-16 h-60 w-60 rounded-full bg-accent/40 blur-3xl"
          />
          <div className="relative flex flex-col items-center gap-8 sm:flex-row sm:gap-10">
            <ScoreRing pct={results.scorePct} />
            <div className="flex-1 text-center sm:text-left">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/80">
                Session complete · {session.mode}
              </p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
                {session.bankName}
              </h1>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                <Chip icon={<Check className="h-3.5 w-3.5" />}>{results.correct} Correct</Chip>
                <Chip icon={<X className="h-3.5 w-3.5" />}>{results.incorrect} Incorrect</Chip>
                <Chip icon={<SkipForward className="h-3.5 w-3.5" />}>
                  {results.skipped} Skipped
                </Chip>
                <Chip icon={<Clock className="h-3.5 w-3.5" />}>
                  {formatDuration(results.durationSec)}
                </Chip>
              </div>

              {/* Percentile line */}
              <div className="mt-5 max-w-md">
                <div className="flex items-center justify-between text-xs font-semibold text-white/85">
                  <span className="inline-flex items-center gap-1.5">
                    <TrendingUp className="h-3.5 w-3.5" /> Percentile
                  </span>
                  <span>Top {100 - percentile}%</span>
                </div>
                <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-white/20">
                  <div
                    className="h-full rounded-full bg-white transition-[width] duration-1000 ease-out"
                    style={{ width: `${percentile}%` }}
                  />
                </div>
                <p className="mt-1.5 text-xs text-white/80">
                  You scored better than {percentile}% of recent test-takers in this bank.
                </p>
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                <Link
                  to="/quiz/$sessionId/review"
                  params={{ sessionId }}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-white px-5 text-sm font-bold text-primary shadow transition hover:bg-white/95"
                >
                  <BookOpenCheck className="h-4 w-4" /> Review Answers
                </Link>
                <button
                  type="button"
                  onClick={() => navigate({ to: "/dashboard" })}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-white/30 bg-white/10 px-5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
                >
                  <LayoutDashboard className="h-4 w-4" /> Back to Dashboard
                </button>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(
                      `I scored ${results.scorePct}% on ${session.bankName} — Medinovaqbank`,
                    );
                    setShared(true);
                    setTimeout(() => setShared(false), 2000);
                  }}
                  className="inline-flex h-11 items-center justify-center gap-1.5 rounded-lg border border-white/30 bg-white/10 px-4 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
                >
                  {shared ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
                  {shared ? "Copied" : "Share"}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Quick stat cards */}
        <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Score" value={`${results.scorePct}%`} tone={sc.text} />
          <StatCard
            label="Correct"
            value={`${results.correct}/${results.total}`}
            tone="text-success"
          />
          <StatCard
            label="Accuracy"
            value={`${results.answered ? Math.round((results.correct / results.answered) * 100) : 0}%`}
            tone="text-primary"
          />
          <StatCard
            label="Time"
            value={formatDuration(results.durationSec)}
            tone="text-foreground"
          />
        </section>

        {/* Performance breakdown */}
        <section className="mt-6 rounded-2xl border border-border bg-surface p-6 shadow-[var(--shadow-card)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold tracking-tight text-foreground">
              Performance Breakdown
            </h2>
            <div className="flex rounded-lg bg-surface-alt p-1 text-xs font-semibold">
              {(
                [
                  ["subject", "By Subject"],
                  ["difficulty", "By Difficulty"],
                  ["timeline", "Timeline"],
                ] as const
              ).map(([k, l]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setTab(k)}
                  className={`rounded-md px-3 py-1.5 transition ${
                    tab === k
                      ? "bg-surface text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4">
            {tab === "subject" && (
              <div className="h-72 w-full">
                <ResponsiveContainer>
                  <BarChart
                    data={results.bySubject}
                    layout="vertical"
                    margin={{ left: 20, right: 20 }}
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
                      width={120}
                    />
                    <Tooltip
                      formatter={(v: number) => [`${v}%`, "Score"]}
                      contentStyle={{
                        background: "var(--color-surface)",
                        border: "1px solid var(--color-border)",
                        borderRadius: 12,
                        color: "var(--color-foreground)",
                      }}
                    />
                    <Bar dataKey="pct" fill="var(--color-accent)" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
            {tab === "difficulty" && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {results.byDifficulty.map((d) => {
                  const dc = scoreColor(d.pct);
                  const barBg =
                    d.pct >= 70 ? "bg-success" : d.pct >= 50 ? "bg-warning" : "bg-error";
                  return (
                    <div key={d.name} className={`rounded-xl border border-border p-5 ${dc.bg}`}>
                      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                        {d.name}
                      </p>
                      <p className={`mt-1 text-3xl font-bold tabular-nums ${dc.text}`}>{d.pct}%</p>
                      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface/60">
                        <div
                          className={`h-full rounded-full ${barBg} transition-[width] duration-700`}
                          style={{ width: `${d.pct}%` }}
                        />
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {d.correct} / {d.total} correct
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
            {tab === "timeline" && (
              <div className="h-72 w-full">
                <ResponsiveContainer>
                  <LineChart
                    data={results.timeline}
                    margin={{ left: 0, right: 20, top: 10, bottom: 0 }}
                  >
                    <CartesianGrid stroke="var(--color-border)" />
                    <XAxis
                      dataKey="q"
                      stroke="var(--color-muted-foreground)"
                      fontSize={12}
                      label={{
                        value: "Question #",
                        position: "insideBottom",
                        offset: -2,
                        fontSize: 11,
                      }}
                    />
                    <YAxis
                      stroke="var(--color-muted-foreground)"
                      fontSize={12}
                      tickFormatter={(v) => `${v}s`}
                    />
                    <Tooltip
                      formatter={(v: number) => [`${v}s`, "Time"]}
                      contentStyle={{
                        background: "var(--color-surface)",
                        border: "1px solid var(--color-border)",
                        borderRadius: 12,
                        color: "var(--color-foreground)",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="seconds"
                      stroke="var(--color-primary)"
                      strokeWidth={2}
                      dot={{ r: 3, fill: "var(--color-accent)" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </section>

        {/* Answer summary */}
        <section className="mt-6 overflow-hidden rounded-2xl border border-border bg-surface shadow-[var(--shadow-card)]">
          <header className="border-b border-border px-5 py-4">
            <h2 className="text-lg font-bold tracking-tight text-foreground">Answer Summary</h2>
          </header>
          <div>
            {session.questionIds.map((qid, i) => {
              const q = questions[qid];
              if (!q) return null;
              const ans = session.answers[qid];
              const isCorrect = ans === q.correctKey;
              const open = openId === qid;
              const time = results.timeline[i]?.seconds ?? 0;
              return (
                <div key={qid} className="border-b border-border last:border-b-0">
                  <button
                    type="button"
                    onClick={() => setOpenId(open ? null : qid)}
                    className="grid w-full grid-cols-[40px_1fr_56px_92px_56px] items-center gap-3 px-5 py-3 text-left text-sm transition-colors hover:bg-surface-alt"
                  >
                    <span className="font-bold text-muted-foreground">Q{i + 1}</span>
                    <span className="line-clamp-1 text-foreground">{q.stem}</span>
                    <span className="font-mono text-xs text-muted-foreground">{ans ?? "—"}</span>
                    <span>
                      {ans ? (
                        isCorrect ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-xs font-semibold text-success">
                            <Check className="h-3 w-3" /> Correct
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-error/15 px-2 py-0.5 text-xs font-semibold text-error">
                            <X className="h-3 w-3" /> Wrong
                          </span>
                        )
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-warning/15 px-2 py-0.5 text-xs font-semibold text-warning">
                          Skipped
                        </span>
                      )}
                    </span>
                    <span className="flex items-center justify-end gap-1 font-mono text-xs text-muted-foreground">
                      {time}s
                      <ChevronDown
                        className={`h-3.5 w-3.5 transition ${open ? "rotate-180" : ""}`}
                      />
                    </span>
                  </button>
                  {open && (
                    <div className="border-t border-border bg-surface-alt/40 px-5 py-4 animate-in fade-in slide-in-from-top-1">
                      <p className="text-sm text-foreground">{q.stem}</p>
                      <p className="mt-3 text-xs font-bold uppercase tracking-wide text-success">
                        Correct: {q.correctKey}.{" "}
                        {q.options.find((o) => o.key === q.correctKey)?.text}
                      </p>
                      <p className="mt-2 text-sm text-muted-foreground">{q.whyCorrect}</p>
                      <p className="mt-3 rounded-lg bg-gradient-to-br from-primary/10 to-accent/15 p-3 text-sm">
                        <span className="font-bold text-primary">Key learning:</span> {q.keyPoint}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <div className="mt-8 flex items-center justify-center">
          <Link to="/leaderboard" className="text-sm font-semibold text-primary hover:underline">
            View Leaderboard →
          </Link>
        </div>
      </main>
    </div>
  );
}

function ScoreRing({ pct }: { pct: number }) {
  const r = 56;
  const c = 2 * Math.PI * r;
  const [shown, setShown] = useState(0);

  // Animate the ring + number on mount.
  useEffect(() => {
    const start = performance.now();
    const duration = 1000;
    let raf = 0;
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setShown(Math.round(pct * eased));
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [pct]);

  const offset = c - (shown / 100) * c;

  return (
    <div className="relative h-40 w-40 flex-shrink-0">
      <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90">
        <circle
          cx="70"
          cy="70"
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.18)"
          strokeWidth="10"
        />
        <circle
          cx="70"
          cy="70"
          r={r}
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold tabular-nums text-white">{shown}%</span>
        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/80">
          Score
        </span>
      </div>
    </div>
  );
}

function StatCard({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-card)]">
      <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={`mt-1 text-2xl font-bold tabular-nums ${tone}`}>{value}</p>
    </div>
  );
}

function Chip({ icon, children }: { icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white ring-1 ring-white/20 backdrop-blur">
      {icon}
      {children}
    </span>
  );
}
