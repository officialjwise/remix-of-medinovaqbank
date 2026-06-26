import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
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
import { Check, ChevronDown, Share2, X } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { useSessionStore } from "@/stores/sessionStore";
import { computeResults, formatDuration, scoreColor } from "@/lib/quiz-results";

export const Route = createFileRoute("/quiz/$sessionId/results")({
  beforeLoad: () => {
    if (typeof window === "undefined") return;
    if (!useAuthStore.getState().isAuthenticated) throw redirect({ to: "/login" });
  },
  head: () => ({
    meta: [
      { title: "Session Results — Medinovaqbank" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResultsPage,
});

type Tab = "subject" | "difficulty" | "timeline";

function ResultsPage() {
  const { sessionId } = Route.useParams();
  const navigate = useNavigate();
  const session = useSessionStore((s) => s.sessions[sessionId]);
  const questions = useSessionStore((s) => s.questions);
  const [tab, setTab] = useState<Tab>("subject");
  const [openId, setOpenId] = useState<string | null>(null);

  const results = useMemo(() => (session ? computeResults(session, questions) : null), [session, questions]);

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

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-8">
        {/* Hero — navy → teal gradient */}
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0F2B4C] via-[#0E7C7B] to-[#00B4A6] p-8 text-white shadow-[0_24px_60px_-20px_rgb(15_43_76_/_0.55)] sm:p-10">
          <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#7BE0B0] opacity-20 blur-3xl" />
          <div className="relative flex flex-col items-center gap-8 sm:flex-row sm:items-center sm:gap-10">
            <ScoreRing pct={results.scorePct} />
            <div className="flex-1 text-center sm:text-left">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#7BE0B0]">
                Session complete · {session.mode}
              </p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
                {session.bankName}
              </h1>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                <Chip>✅ {results.correct} Correct</Chip>
                <Chip>❌ {results.incorrect} Incorrect</Chip>
                <Chip>⏭ {results.skipped} Skipped</Chip>
                <Chip>⏱ {formatDuration(results.durationSec)}</Chip>
              </div>
              <p className="mt-4 text-sm text-white/85">
                <span className="font-semibold text-white">Percentile —</span> You scored better than {percentile}% of recent test-takers in this bank.
              </p>
              <div className="mt-5 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                <Link
                  to="/quiz/$sessionId/review"
                  params={{ sessionId }}
                  className="inline-flex h-11 items-center justify-center rounded-lg bg-white px-5 text-sm font-bold text-[#0F2B4C] shadow hover:bg-white/95"
                >
                  Review All Questions
                </Link>
                <button
                  type="button"
                  onClick={() => navigate({ to: "/banks" })}
                  className="inline-flex h-11 items-center justify-center rounded-lg border border-white/30 bg-white/10 px-5 text-sm font-semibold text-white backdrop-blur hover:bg-white/20"
                >
                  Start New Session
                </button>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(`I scored ${results.scorePct}% on ${session.bankName} — Medinovaqbank`);
                  }}
                  className="inline-flex h-11 items-center justify-center gap-1.5 rounded-lg border border-white/30 bg-white/10 px-4 text-sm font-semibold text-white backdrop-blur hover:bg-white/20"
                >
                  <Share2 className="h-4 w-4" /> Share
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Performance breakdown */}
        <section className="mt-6 rounded-2xl border border-border bg-surface p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold tracking-tight text-foreground">Performance Breakdown</h2>
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
                    tab === k ? "bg-surface text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
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
                  <BarChart data={results.bySubject} layout="vertical" margin={{ left: 20, right: 20 }}>
                    <CartesianGrid horizontal={false} stroke="var(--color-border)" />
                    <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} stroke="var(--color-muted-foreground)" fontSize={12} />
                    <YAxis dataKey="name" type="category" stroke="var(--color-muted-foreground)" fontSize={12} width={120} />
                    <Tooltip formatter={(v: number) => `${v}%`} />
                    <Bar dataKey="pct" fill="var(--color-accent)" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
            {tab === "difficulty" && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {results.byDifficulty.map((d) => {
                  const dc = scoreColor(d.pct);
                  return (
                    <div key={d.name} className={`rounded-xl border border-border p-5 ${dc.bg}`}>
                      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{d.name}</p>
                      <p className={`mt-1 text-3xl font-bold tabular-nums ${dc.text}`}>{d.pct}%</p>
                      <p className="mt-1 text-xs text-muted-foreground">
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
                  <LineChart data={results.timeline} margin={{ left: 0, right: 20, top: 10, bottom: 0 }}>
                    <CartesianGrid stroke="var(--color-border)" />
                    <XAxis dataKey="q" stroke="var(--color-muted-foreground)" fontSize={12} label={{ value: "Question #", position: "insideBottom", offset: -2, fontSize: 11 }} />
                    <YAxis stroke="var(--color-muted-foreground)" fontSize={12} tickFormatter={(v) => `${v}s`} />
                    <Tooltip formatter={(v: number) => `${v}s`} />
                    <Line type="monotone" dataKey="seconds" stroke="var(--color-accent)" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </section>

        {/* Answer summary */}
        <section className="mt-6 rounded-2xl border border-border bg-surface">
          <header className="border-b border-border px-5 py-4">
            <h2 className="text-lg font-bold tracking-tight text-foreground">Answer Summary</h2>
          </header>
          <div className="overflow-hidden">
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
                    className="grid w-full grid-cols-[40px_1fr_60px_60px_60px] items-center gap-3 px-5 py-3 text-left text-sm hover:bg-surface-alt"
                  >
                    <span className="font-bold text-muted-foreground">Q{i + 1}</span>
                    <span className="line-clamp-1 text-foreground">{q.stem}</span>
                    <span className="font-mono text-xs text-muted-foreground">{ans ?? "—"}</span>
                    <span>
                      {ans ? (
                        isCorrect ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-success-light px-2 py-0.5 text-xs font-semibold text-success">
                            <Check className="h-3 w-3" /> Correct
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-error-light px-2 py-0.5 text-xs font-semibold text-error">
                            <X className="h-3 w-3" /> Wrong
                          </span>
                        )
                      ) : (
                        <span className="text-xs text-muted-foreground">Skipped</span>
                      )}
                    </span>
                    <span className="flex items-center justify-end gap-1 font-mono text-xs text-muted-foreground">
                      {time}s <ChevronDown className={`h-3.5 w-3.5 transition ${open ? "rotate-180" : ""}`} />
                    </span>
                  </button>
                  {open && (
                    <div className="border-t border-border bg-surface-alt/40 px-5 py-4">
                      <p className="text-sm text-foreground">{q.stem}</p>
                      <p className="mt-3 text-xs font-bold uppercase tracking-wide text-success">
                        Correct: {q.correctKey}. {q.options.find((o) => o.key === q.correctKey)?.text}
                      </p>
                      <p className="mt-2 text-sm text-muted-foreground">{q.whyCorrect}</p>
                      <p className="mt-3 rounded-lg bg-accent-light/40 p-3 text-sm">
                        💡 <span className="font-bold">Key learning:</span> {q.keyPoint}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <div className="mt-8 flex items-center justify-center">
          <Link to="/leaderboard" className="text-sm font-semibold text-[#0E7C7B] hover:underline">
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
  const offset = c - (pct / 100) * c;
  return (
    <div className="relative h-40 w-40 flex-shrink-0">
      <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90">
        <circle cx="70" cy="70" r={r} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="10" />
        <circle
          cx="70"
          cy="70"
          r={r}
          fill="none"
          stroke="#7BE0B0"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold tabular-nums text-white">{pct}%</span>
        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#7BE0B0]">Score</span>
      </div>
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white backdrop-blur ring-1 ring-white/20">
      {children}
    </span>
  );
}
