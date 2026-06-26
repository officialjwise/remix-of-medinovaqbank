import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Award,
  BarChart3,
  CheckCircle2,
  Crown,
  Flame,
  GraduationCap,
  Library,
  Medal,
  Play,
  Sparkles,
  Target,
  Timer,
  Trophy,
  Zap,
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
import { useTrial } from "@/hooks/useTrial";
import { GradientKpiCard } from "@/components/shared/GradientKpiCard";
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

// Deterministic gamification values (module scope — never random in render)
const STREAK_DAYS = 7;
const GLOBAL_RANK = 284;
// 7-day activity ring (1 = active). Stable, mirrors the streak.
const WEEK_ACTIVITY = [true, true, true, false, true, true, true];
const WEEK_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

function DashboardPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const sessionsMap = useSessionStore((s) => s.sessions);
  const createSession = useSessionStore((s) => s.createSession);
  const { isTrial, daysLeft, questionsLeft, questionsTotal, expired } = useTrial();

  // Resume the most recently started in-store session, if any.
  const liveInProgress = Object.values(sessionsMap)
    .filter((s) => s.questionIds.some((id) => !s.submitted[id]))
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt))[0];
  const inProgress = liveInProgress
    ? null
    : recentSessions.find((s) => s.inProgress);
  const completed = recentSessions.filter((s) => !s.inProgress);

  const totalAnswered = recentSessions.reduce((a, s) => a + s.questionsAnswered, 0);
  const avgScore = Math.round(
    completed.reduce((a, s) => a + s.scorePct, 0) / Math.max(completed.length, 1),
  );
  const bestScore = completed.reduce((m, s) => Math.max(m, s.scorePct), 0);

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

  const chartData = [...completed]
    .slice(0, 7)
    .reverse()
    .map((s, i) => ({ name: `S${i + 1}`, score: s.scorePct }));

  // Deterministic achievement badges derived from real session data.
  const badges = [
    { icon: Flame, label: `${STREAK_DAYS}-day streak`, earned: STREAK_DAYS >= 3, tint: "from-[#D97706] to-[#F59E0B]" },
    { icon: Target, label: "Sharpshooter", sub: "Scored 90%+", earned: bestScore >= 90, tint: "from-[#7C3AED] to-[#A855F7]" },
    { icon: Medal, label: "Centurion", sub: "100+ answered", earned: totalAnswered >= 100, tint: "from-[#0E7C7B] to-[#15A89C]" },
    { icon: Crown, label: "Top 500", sub: "Global rank", earned: GLOBAL_RANK <= 500, tint: "from-[#2563EB] to-[#3B82F6]" },
  ];

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
        <span
          aria-hidden
          className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-accent/10 blur-3xl"
        />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              {greeting()}, Dr. {firstName} 👋
            </h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {liveInProgress || inProgress
                ? "You have a session in progress. Pick up where you left off."
                : "You haven't started a session today. Keep your streak going!"}
            </p>
          </div>
          <div className="flex items-center gap-2 self-start rounded-full bg-accent-light px-4 py-2 text-accent">
            <Flame className="h-5 w-5" />
            <span className="text-sm font-bold">{STREAK_DAYS}-day streak</span>
          </div>
        </div>
      </section>

      {/* Gradient KPI strip */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <GradientKpiCard
          gradient="teal"
          label="Questions answered"
          value={totalAnswered.toLocaleString()}
          icon={GraduationCap}
          trend={{ value: "+12 this week", up: true }}
        />
        <GradientKpiCard
          gradient="blue"
          label="Average score"
          value={`${avgScore}%`}
          icon={BarChart3}
          sub={`Best ${bestScore}%`}
        />
        <GradientKpiCard
          gradient="violet"
          label="Global rank"
          value={`#${GLOBAL_RANK}`}
          icon={Trophy}
          trend={{ value: "Up 16 places", up: true }}
        />
        <GradientKpiCard
          gradient="amber"
          label="Day streak"
          value={String(STREAK_DAYS)}
          icon={Flame}
          sub="Keep it alive today"
        />
      </section>

      {/* Inline trial widget (only on trial) */}
      {isTrial && (
        <TrialWidget
          daysLeft={daysLeft}
          questionsLeft={questionsLeft}
          questionsTotal={questionsTotal}
          expired={expired}
        />
      )}

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
      ) : (
        <StartCard onStart={() => startBank(questionBanks[0].id, "QUIZ")} />
      )}

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

      {/* Achievements + streak */}
      <section className="grid gap-6 lg:grid-cols-3">
        <div className="card-surface flex flex-col p-6 lg:col-span-1">
          <header className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-foreground">Your streak</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">This week</p>
            </div>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#D97706] to-[#F59E0B] text-white">
              <Flame className="h-5 w-5" />
            </span>
          </header>
          <div className="mt-5 flex items-end gap-2">
            <p className="text-4xl font-extrabold tracking-tight text-foreground">{STREAK_DAYS}</p>
            <p className="pb-1 text-sm text-muted-foreground">days in a row</p>
          </div>
          <div className="mt-5 flex items-center justify-between">
            {WEEK_ACTIVITY.map((active, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold ${
                    active
                      ? "bg-gradient-to-br from-[#D97706] to-[#F59E0B] text-white shadow-sm"
                      : "bg-surface-alt text-muted-foreground"
                  }`}
                >
                  {active ? <Flame className="h-4 w-4" /> : WEEK_LABELS[i]}
                </span>
                <span className="text-[10px] text-muted-foreground">{WEEK_LABELS[i]}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card-surface flex flex-col p-6 lg:col-span-2">
          <header className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-foreground">Achievements</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {badges.filter((b) => b.earned).length} of {badges.length} unlocked
              </p>
            </div>
            <Award className="h-5 w-5 text-accent" />
          </header>
          <div className="mt-4 grid flex-1 gap-3 sm:grid-cols-2">
            {badges.map((b) => (
              <div
                key={b.label}
                className={`flex items-center gap-3 rounded-xl border p-3 transition-colors ${
                  b.earned ? "border-border bg-surface-alt/50" : "border-dashed border-border bg-surface opacity-60"
                }`}
              >
                <span
                  className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white ${
                    b.earned ? b.tint : "from-muted to-muted grayscale"
                  }`}
                >
                  <b.icon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                    {b.label}
                    {b.earned && <CheckCircle2 className="h-3.5 w-3.5 text-success" />}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {b.earned ? b.sub ?? "Unlocked" : `${b.sub ?? "Locked"} · locked`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function TrialWidget({
  daysLeft,
  questionsLeft,
  questionsTotal,
  expired,
}: {
  daysLeft: number;
  questionsLeft: number;
  questionsTotal: number;
  expired: boolean;
}) {
  const usedPct = questionsTotal
    ? Math.min(100, Math.round(((questionsTotal - questionsLeft) / questionsTotal) * 100))
    : 0;
  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#7C3AED] to-[#2563EB] p-6 text-white shadow-[var(--shadow-card)]">
      <span aria-hidden className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
      <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" /> Free trial
          </span>
          <h3 className="mt-2 text-lg font-bold">
            {expired ? "Your trial has ended" : "You're on the free trial"}
          </h3>
          <div className="mt-3 flex flex-wrap items-center gap-4">
            <div>
              <p className="text-2xl font-extrabold leading-none">{daysLeft}</p>
              <p className="text-xs text-white/80">{daysLeft === 1 ? "day" : "days"} left</p>
            </div>
            <div className="h-8 w-px bg-white/20" />
            <div>
              <p className="text-2xl font-extrabold leading-none">{questionsLeft}</p>
              <p className="text-xs text-white/80">questions left</p>
            </div>
            <div className="hidden h-8 w-px bg-white/20 sm:block" />
            <div className="hidden min-w-[140px] flex-1 sm:block">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/20">
                <div className="h-full rounded-full bg-white" style={{ width: `${usedPct}%` }} />
              </div>
              <p className="mt-1 text-[11px] text-white/80">{usedPct}% of sampler used</p>
            </div>
          </div>
        </div>
        <Link
          to="/subscription"
          className="inline-flex h-11 flex-shrink-0 items-center justify-center gap-1.5 rounded-lg bg-white px-5 text-sm font-bold text-[#5B21B6] shadow-sm transition-transform hover:-translate-y-0.5"
        >
          <Zap className="h-4 w-4" /> Upgrade now
        </Link>
      </div>
    </section>
  );
}

function StartCard({ onStart }: { onStart: () => void }) {
  return (
    <section className="card-surface flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
      <div className="flex items-start gap-4">
        <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-accent-light text-accent">
          <Play className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-accent">Start a quiz</p>
          <h3 className="mt-1 text-base font-semibold text-foreground">Ready when you are</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            No session in progress — pick a bank and put your streak to work.
          </p>
        </div>
      </div>
      <div className="flex gap-2 self-start md:self-center">
        <button
          type="button"
          onClick={onStart}
          className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-light"
        >
          Start a quiz
        </button>
        <Link
          to="/banks"
          className="rounded-lg border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-surface-alt"
        >
          Browse banks
        </Link>
      </div>
    </section>
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
