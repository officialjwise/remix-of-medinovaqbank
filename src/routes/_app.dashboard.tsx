import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  BarChart3,
  Flame,
  GraduationCap,
  Library,
  Play,
  Timer,
  Trophy,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useAuthStore } from "@/stores/authStore";
import { useSessionStore } from "@/stores/sessionStore";
import { questionBanks, recentSessions } from "@/data/banks";
import type { QuizMode, SessionSummary } from "@/types";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Medinovaqbank" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DashboardPage,
});

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function formatDateStable(iso: string) {
  const d = new Date(iso);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
}


function DashboardPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const sessionsMap = useSessionStore((s) => s.sessions);
  const createSession = useSessionStore((s) => s.createSession);

  // Resume the most recently started in-store session, if any.
  const liveInProgress = Object.values(sessionsMap)
    .filter((s) => s.questionIds.some((id) => !s.submitted[id]))
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt))[0];
  const inProgress = liveInProgress
    ? null
    : recentSessions.find((s) => s.inProgress);
  const completed = recentSessions.filter((s) => !s.inProgress);

  function startBank(bankId: string, mode: QuizMode) {
    const id = createSession({
      bankId,
      mode,
      count: 10,
      topics: [],
      difficulty: "All",
      durationSec: mode === "QUIZ" ? 600 : undefined,
    });
    navigate({ to: "/quiz/$sessionId", params: { sessionId: id } });
  }

  function resumeLive() {
    if (!liveInProgress) return;
    navigate({ to: "/quiz/$sessionId", params: { sessionId: liveInProgress.id } });
  }

  const stats = [
    { icon: GraduationCap, label: "Sessions completed", value: completed.length },
    {
      icon: BarChart3,
      label: "Average score",
      value: `${Math.round(
        completed.reduce((a, s) => a + s.scorePct, 0) / Math.max(completed.length, 1),
      )}%`,
    },
    { icon: Trophy, label: "Global rank", value: "#284" },
    { icon: Flame, label: "Streak (days)", value: "7" },
  ];

  const chartData = [...completed]
    .slice(0, 7)
    .reverse()
    .map((s, i) => ({ name: `S${i + 1}`, score: s.scorePct }));

  const firstName = user?.name?.split(" ").slice(-1)[0] ?? "Doctor";

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* Welcome banner */}
      <section
        className="card-surface relative overflow-hidden p-8"
        style={{
          backgroundImage:
            "linear-gradient(135deg, color-mix(in oklab, var(--accent) 6%, var(--surface)), var(--surface))",
        }}
      >
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          {greeting()}, Dr. {firstName} 👋
        </h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {liveInProgress || inProgress
            ? "You have a session in progress. Pick up where you left off."
            : "You haven't started a session today. Keep your streak going!"}
        </p>
      </section>

      {/* Stats */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="card-surface flex items-center gap-4 p-5">
            <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-accent-light text-accent">
              <s.icon className="h-5 w-5" />
            </span>
            <div>
              <p className="text-2xl font-bold tracking-tight text-foreground">{s.value}</p>
              <p className="mt-0.5 text-xs uppercase tracking-wide text-muted-foreground">{s.label}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Continue learning */}
      {liveInProgress ? (
        <LiveContinueCard
          bankName={liveInProgress.bankName}
          answered={liveInProgress.questionIds.filter((id) => liveInProgress.submitted[id]).length}
          total={liveInProgress.questionIds.length}
          onResume={resumeLive}
        />
      ) : inProgress ? (
        <ContinueCard session={inProgress} onResume={() => startBank(inProgress.bankId ?? questionBanks[0].id, "QUIZ")} />
      ) : null}

      {/* Quick start */}
      <section>
        <header className="flex items-end justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Quick start</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Jump into a question bank and start practising right away.
            </p>
          </div>
          <Link
            to="/banks"
            className="text-sm font-semibold text-accent hover:underline"
          >
            See all →
          </Link>
        </header>

        <div className="mt-4 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {questionBanks.slice(0, 3).map((b) => (
            <article key={b.id} className="card-surface flex flex-col overflow-hidden">
              <div
                className={`relative h-28 bg-gradient-to-br ${b.subjectColor} p-5 text-white`}
              >
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold backdrop-blur">
                  <Library className="h-3 w-3" />
                  {b.subject}
                </span>
              </div>
              <div className="flex flex-1 flex-col p-5">
                <h3 className="font-semibold text-foreground">{b.name}</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  {b.questionCount.toLocaleString()} questions · {b.difficulty}
                </p>
                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                  {b.description}
                </p>
                <div className="mt-5 flex gap-2">
                  <button
                    type="button"
                    onClick={() => startBank(b.id, "QUIZ")}
                    className="flex-1 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary-light"
                  >
                    <Timer className="mr-1.5 inline h-3.5 w-3.5" />
                    Start Quiz
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate({ to: "/quiz/configure/$bankId", params: { bankId: b.id } })}
                    className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-surface-alt"
                  >
                    <GraduationCap className="mr-1.5 inline h-3.5 w-3.5" />
                    Tutor mode
                  </button>


                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Recent sessions + chart */}
      <section className="grid gap-6 lg:grid-cols-3">
        <div className="card-surface overflow-hidden lg:col-span-2">
          <header className="flex items-center justify-between border-b border-border px-6 py-4">
            <h2 className="text-base font-semibold text-foreground">Recent sessions</h2>
            <Link to="/sessions" className="text-xs font-semibold text-accent hover:underline">
              View all
            </Link>
          </header>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-alt text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-6 py-3 font-semibold">Date</th>
                  <th className="px-6 py-3 font-semibold">Bank</th>
                  <th className="px-6 py-3 font-semibold">Mode</th>
                  <th className="px-6 py-3 font-semibold">Score</th>
                  <th className="px-6 py-3 font-semibold">Questions</th>
                  <th className="px-6 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {completed.slice(0, 5).map((s) => (
                  <tr key={s.id} className="hover:bg-surface-alt/50">
                    <td className="px-6 py-3 text-muted-foreground">
                      {formatDateStable(s.completedAt)}
                    </td>

                    <td className="px-6 py-3 font-medium text-foreground">{s.bankName}</td>
                    <td className="px-6 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          s.mode === "TUTOR"
                            ? "bg-[oklch(0.95_0.04_295)] text-[var(--tutor-mode)]"
                            : "bg-[oklch(0.95_0.02_254)] text-[var(--quiz-mode)]"
                        }`}
                      >
                        {s.mode === "TUTOR" ? "Tutor" : "Quiz"}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <ScoreBadge value={s.scorePct} />
                    </td>
                    <td className="px-6 py-3 text-muted-foreground">
                      {s.questionsAnswered}/{s.totalQuestions}
                    </td>
                    <td className="px-6 py-3 text-right">
                      <Link
                        to="/quiz/$sessionId/results"
                        params={{ sessionId: s.id }}
                        className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-surface-alt"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card-surface flex flex-col p-6">
          <header>
            <h2 className="text-base font-semibold text-foreground">Performance snapshot</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">Last 7 sessions</p>
          </header>
          <div className="mt-4 flex-1">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis domain={[0, 100]} stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(v: number) => [`${v}%`, "Score"]}
                />
                <Bar dataKey="score" radius={[6, 6, 0, 0]} fill="var(--primary)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>
    </div>
  );
}

function ContinueCard({ session, onResume }: { session: SessionSummary; onResume: () => void }) {
  const pct = Math.round((session.questionsAnswered / session.totalQuestions) * 100);
  return (
    <ContinueCardShell bankName={session.bankName} answered={session.questionsAnswered} total={session.totalQuestions} pct={pct} onResume={onResume} />
  );
}

function LiveContinueCard({ bankName, answered, total, onResume }: { bankName: string; answered: number; total: number; onResume: () => void }) {
  const pct = total ? Math.round((answered / total) * 100) : 0;
  return <ContinueCardShell bankName={bankName} answered={answered} total={total} pct={pct} onResume={onResume} />;
}

function ContinueCardShell({ bankName, answered, total, pct, onResume }: { bankName: string; answered: number; total: number; pct: number; onResume: () => void }) {
  return (
    <section className="card-surface flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
      <div className="flex items-start gap-4">
        <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-accent-light text-accent">
          <Play className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-accent">
            Continue learning
          </p>
          <h3 className="mt-1 truncate text-base font-semibold text-foreground">{bankName}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{answered}/{total} answered</p>
          <div className="mt-3 h-1.5 w-full max-w-md overflow-hidden rounded-full bg-surface-alt">
            <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={onResume}
        className="self-start rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-light md:self-center"
      >
        Resume Quiz
      </button>
    </section>
  );
}

function ScoreBadge({ value }: { value: number }) {
  const tone =
    value >= 80
      ? "bg-success-light text-success"
      : value >= 60
        ? "bg-warning-light text-warning"
        : "bg-error-light text-error";
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${tone}`}>
      {value}%
    </span>
  );
}
