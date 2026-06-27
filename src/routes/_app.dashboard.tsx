import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Award,
  BarChart3,
  Bell,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Crown,
  Flame,
  GraduationCap,
  Library,
  Medal,
  Play,
  Sparkles,
  Star,
  Target,
  Timer,
  TrendingUp,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useShallow } from "zustand/react/shallow";
import { useAuthStore } from "@/stores/authStore";
import { useSessions, useCreateSession } from "@/api/quiz.api";
import { useTrial } from "@/hooks/useTrial";
import { GradientKpiCard } from "@/components/shared/GradientKpiCard";
import { UserDashboardSkeleton } from "@/components/shared/DashboardSkeletons";
import { useInitialLoad } from "@/hooks/useInitialLoad";
import { questionBanks } from "@/data/banks";
import { useUnreadCount } from "@/api/notifications.api";
import { usePaidPlans } from "@/api/plans.api";
import type { QuizMode } from "@/types";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({
    meta: [{ title: "Dashboard — Medinovaqbank" }, { name: "robots", content: "noindex" }],
  }),
  component: DashboardPage,
});

/* ──────────────────────────────────────────────────────────────────────────
   Module-scope deterministic constants — no Math.random() in render
────────────────────────────────────────────────────────────────────────── */

const STREAK_DAYS = 7;
const GLOBAL_RANK = 284;
const WEEK_ACTIVITY = [true, true, true, false, true, true, true];
const WEEK_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

/** Daily accuracy over the past 7 days — stable, no Math.random() */
const PERF_TREND = [
  { day: "Mon", score: 72 },
  { day: "Tue", score: 68 },
  { day: "Wed", score: 75 },
  { day: "Thu", score: 80 },
  { day: "Fri", score: 74 },
  { day: "Sat", score: 82 },
  { day: "Sun", score: 78 },
];

const SUBJECT_BREAKDOWN = [
  { subject: "Cardiology", pct: 85, fill: "#0E7C7B" },
  { subject: "Neurology", pct: 72, fill: "#2BC97F" },
  { subject: "Surgery", pct: 68, fill: "#2563EB" },
  { subject: "Internal Medicine", pct: 77, fill: "#7C3AED" },
  { subject: "Paediatrics", pct: 80, fill: "#D97706" },
];

const TOPIC_MASTERY = [
  { topic: "Anatomy", pct: 72 },
  { topic: "Physiology", pct: 65 },
  { topic: "Pharmacology", pct: 80 },
  { topic: "Pathology", pct: 58 },
  { topic: "Microbiology", pct: 70 },
];

/** 3 nearby leaderboard rows (deterministic; user is #284) */
const NEARBY_LEADERS = [
  { rank: 282, name: "Dr. K. Frimpong", initials: "KF", score: 81 },
  { rank: 283, name: "Dr. S. Bonsu", initials: "SB", score: 80 },
  { rank: 284, name: "You", initials: "ME", score: 79, isYou: true },
  { rank: 285, name: "Dr. L. Ofori", initials: "LO", score: 78 },
  { rank: 286, name: "Dr. A. Ntim", initials: "AN", score: 77 },
];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatDateStable(iso: string) {
  const d = new Date(iso);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

/* ──────────────────────────────────────────────────────────────────────────
   Main page component
────────────────────────────────────────────────────────────────────────── */

function DashboardPage() {
  const loading = useInitialLoad();
  const { user, subscription } = useAuthStore(
    useShallow((s) => ({ user: s.user, subscription: s.subscription })),
  );
  const navigate = useNavigate();
  const { data: serverSessions } = useSessions();
  const createSession = useCreateSession();
  const { isTrial, daysLeft, questionsLeft, questionsTotal, expired } = useTrial();

  // Unread badge on the dashboard header bell (capped at 3 for display parity).
  const { data: unreadCount } = useUnreadCount();
  const userNotifsCount = Math.min(unreadCount ?? 0, 3);

  const { data: paidPlans = [] } = usePaidPlans();
  const activePlan = subscription?.status === "ACTIVE" ? paidPlans[0] : undefined;

  if (loading) return <UserDashboardSkeleton />;

  /* Derive session stats from the server session list */
  const sessions = serverSessions ?? [];
  const liveInProgress = sessions
    .filter((s) => s.inProgress)
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt))[0];

  const completed = sessions.filter((s) => !s.inProgress);
  const totalAnswered = sessions.reduce((a, s) => a + s.answeredCount, 0);
  const avgScore = Math.round(
    completed.reduce((a, s) => a + s.scorePct, 0) / Math.max(completed.length, 1),
  );
  const bestScore = completed.reduce((m, s) => Math.max(m, s.scorePct), 0);

  const firstName = user?.name?.split(" ")[0] ?? "Doctor";
  const initials = user?.name
    ? user.name
        .split(" ")
        .map((w) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "DR";
  const specialty = user?.specialty ?? "General Medicine";

  /* Motivational one-liner derived from avg score */
  const motiveLine =
    avgScore >= 80
      ? "Your accuracy is above average — outstanding work!"
      : avgScore >= 65
        ? "You're improving steadily — keep the momentum going."
        : "Focus on your weak topics today to push your score higher.";

  /* Achievements */
  const badges = [
    {
      icon: Flame,
      label: `${STREAK_DAYS}-day streak`,
      sub: "Study consistency",
      earned: STREAK_DAYS >= 3,
      tint: "from-[#D97706] to-[#F59E0B]",
    },
    {
      icon: Target,
      label: "Sharpshooter",
      sub: "Scored 90%+",
      earned: bestScore >= 90,
      tint: "from-[#7C3AED] to-[#A855F7]",
    },
    {
      icon: Medal,
      label: "Centurion",
      sub: "100+ answered",
      earned: totalAnswered >= 100,
      tint: "from-[#0E7C7B] to-[#15A89C]",
    },
    {
      icon: Crown,
      label: "Top 500",
      sub: "Global rank",
      earned: GLOBAL_RANK <= 500,
      tint: "from-[#2563EB] to-[#3B82F6]",
    },
  ];

  function startBank(bankId: string, mode: QuizMode) {
    createSession.mutate(
      {
        bankId,
        mode,
        questionCount: 10,
        timeLimitMinutes: mode === "QUIZ" ? 10 : undefined,
      },
      {
        onSuccess: (state) =>
          navigate({ to: "/quiz/$sessionId", params: { sessionId: state.session.id } }),
      },
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 animate-in fade-in">
      {/* ── Greeting banner ─────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden rounded-2xl p-7 shadow-[var(--shadow-card)]"
        style={{
          background:
            "linear-gradient(135deg, color-mix(in oklab, var(--color-primary) 8%, var(--color-surface)), var(--color-surface))",
        }}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full blur-3xl"
          style={{ background: "color-mix(in oklab, var(--color-accent) 12%, transparent)" }}
        />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div
              className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl text-lg font-extrabold text-white shadow-sm"
              style={{
                background: "linear-gradient(135deg, var(--color-primary), var(--color-accent))",
              }}
            >
              {initials}
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-foreground">
                {greeting()}, Dr. {firstName}!
              </h2>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full border border-border bg-surface-alt px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
                  <Star className="h-3 w-3" /> {specialty}
                </span>
                <span className="text-sm text-muted-foreground">{motiveLine}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 self-start sm:self-center">
            {userNotifsCount > 0 && (
              <Link
                to="/notifications"
                className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface text-muted-foreground transition-colors hover:bg-surface-alt"
              >
                <Bell className="h-5 w-5" />
                <span
                  className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold text-white"
                  style={{ background: "var(--color-primary)" }}
                >
                  {userNotifsCount}
                </span>
              </Link>
            )}
            <div
              className="flex items-center gap-2 rounded-full px-4 py-2 text-white"
              style={{ background: "linear-gradient(135deg, #D97706, #F59E0B)" }}
            >
              <Flame className="h-4 w-4" />
              <span className="text-sm font-bold">{STREAK_DAYS}-day streak</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4-column KPI row ─────────────────────────────────────────── */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <GradientKpiCard
          gradient="teal"
          label="Questions answered"
          value={totalAnswered.toLocaleString()}
          icon={GraduationCap}
          trend={{ value: "+12 this week", up: true }}
        />
        <GradientKpiCard
          gradient="emerald"
          label="Average score"
          value={`${avgScore}%`}
          icon={BarChart3}
          sub={`Best ${bestScore}%`}
        />
        <GradientKpiCard
          gradient="amber"
          label="Active streak"
          value={String(STREAK_DAYS)}
          icon={Flame}
          sub="days in a row"
        />
        <GradientKpiCard
          gradient="violet"
          label="Global rank"
          value={`#${GLOBAL_RANK}`}
          icon={Trophy}
          trend={{ value: "Up 16 places", up: true }}
        />
      </section>

      {/* ── Trial / subscription banner ──────────────────────────────── */}
      {isTrial ? (
        <TrialBanner
          daysLeft={daysLeft}
          questionsLeft={questionsLeft}
          questionsTotal={questionsTotal}
          expired={expired}
        />
      ) : activePlan ? (
        <SubscribedBanner planName={activePlan.name} />
      ) : null}

      {/* ── Continue / start session ─────────────────────────────────── */}
      {liveInProgress ? (
        <LiveContinueCard
          bankName={`${liveInProgress.totalQuestions}-question session`}
          answered={liveInProgress.answeredCount}
          total={liveInProgress.totalQuestions}
          onResume={() =>
            navigate({ to: "/quiz/$sessionId", params: { sessionId: liveInProgress.id } })
          }
        />
      ) : (
        <StartCard onStart={() => startBank(questionBanks[0].id, "QUIZ")} />
      )}

      {/* ── Two-column main layout ───────────────────────────────────── */}
      <div className="grid gap-8 xl:grid-cols-5">
        {/* LEFT column (3/5) */}
        <div className="space-y-8 xl:col-span-3">
          {/* Weekly activity heatmap */}
          <section className="rounded-2xl border border-border bg-surface p-6 shadow-[var(--shadow-card)]">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-foreground">Weekly activity</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">This week's study days</p>
              </div>
              <div className="flex items-center gap-1.5 rounded-full border border-border bg-surface-alt px-3 py-1 text-xs font-semibold text-foreground">
                <Flame className="h-3.5 w-3.5 text-[#F59E0B]" />
                {STREAK_DAYS}-day streak
              </div>
            </div>
            <div className="mt-5 flex items-end justify-between gap-2">
              {WEEK_ACTIVITY.map((active, i) => (
                <div key={i} className="flex flex-1 flex-col items-center gap-2">
                  <span
                    className={`flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold transition-transform hover:scale-105 ${
                      active ? "text-white shadow-sm" : "bg-surface-alt text-muted-foreground"
                    }`}
                    style={
                      active
                        ? { background: "linear-gradient(135deg, #D97706, #F59E0B)" }
                        : undefined
                    }
                  >
                    {active ? <Flame className="h-4 w-4" /> : WEEK_LABELS[i]}
                  </span>
                  <span className="text-[10px] font-medium text-muted-foreground">
                    {WEEK_LABELS[i]}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Performance over time */}
          <section className="rounded-2xl border border-border bg-surface p-6 shadow-[var(--shadow-card)]">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-foreground">Performance over time</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">Daily accuracy — last 7 days</p>
              </div>
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="mt-4">
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={PERF_TREND} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--color-border)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="day"
                    stroke="var(--color-muted-foreground)"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    domain={[50, 100]}
                    stroke="var(--color-muted-foreground)"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "var(--color-surface)",
                      border: "1px solid var(--color-border)",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    formatter={(v: number) => [`${v}%`, "Score"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="var(--color-primary)"
                    strokeWidth={2.5}
                    dot={{ fill: "var(--color-primary)", r: 4, strokeWidth: 0 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Recent sessions */}
          <section className="rounded-2xl border border-border bg-surface shadow-[var(--shadow-card)]">
            <header className="flex items-center justify-between border-b border-border px-6 py-4">
              <div>
                <h2 className="text-base font-semibold text-foreground">Recent sessions</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">Your last completed quizzes</p>
              </div>
              <Link
                to="/sessions"
                className="text-xs font-semibold hover:underline"
                style={{ color: "var(--color-accent)" }}
              >
                View all →
              </Link>
            </header>
            <div className="divide-y divide-border">
              {completed.slice(0, 4).map((s) => (
                <div
                  key={s.id}
                  className="flex items-center gap-4 px-6 py-3.5 transition-colors hover:bg-surface-alt/50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {s.totalQuestions}-question session
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {formatDateStable(s.completedAt ?? s.startedAt)}
                    </p>
                  </div>
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      s.mode === "TUTOR"
                        ? "bg-[oklch(0.95_0.04_295)] text-[var(--color-tutor-mode,#7C3AED)]"
                        : "bg-[oklch(0.95_0.02_254)] text-[var(--color-quiz-mode,#2563EB)]"
                    }`}
                  >
                    {s.mode}
                  </span>
                  <ScoreBadge value={s.scorePct} />
                  <span className="text-xs text-muted-foreground">
                    {s.answeredCount}/{s.totalQuestions}
                  </span>
                  <Link
                    to="/quiz/$sessionId/results"
                    params={{ sessionId: s.id }}
                    className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-surface-alt"
                  >
                    Review
                  </Link>
                </div>
              ))}
            </div>
          </section>

          {/* Recommended banks */}
          <section>
            <header className="flex items-end justify-between">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Recommended banks</h2>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Quick-start a 10-question quiz.
                </p>
              </div>
              <Link
                to="/banks"
                className="text-sm font-semibold hover:underline"
                style={{ color: "var(--color-accent)" }}
              >
                See all →
              </Link>
            </header>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              {questionBanks.slice(0, 3).map((b) => (
                <article
                  key={b.id}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-[var(--shadow-card)] transition-transform hover:-translate-y-0.5"
                >
                  <div
                    className={`relative h-24 bg-gradient-to-br ${b.subjectColor} p-4 text-white`}
                  >
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-semibold backdrop-blur">
                      <Library className="h-3 w-3" />
                      {b.subject}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <p className="font-semibold text-foreground">{b.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {b.questionCount.toLocaleString()} questions · {b.difficulty}
                    </p>
                    <button
                      type="button"
                      onClick={() => startBank(b.id, "QUIZ")}
                      className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold text-white transition-opacity hover:opacity-90"
                      style={{
                        background:
                          "linear-gradient(135deg, var(--color-primary), var(--color-accent))",
                      }}
                    >
                      <Play className="h-3.5 w-3.5" />
                      Start 10-Q Quiz
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>

        {/* RIGHT column (2/5) */}
        <div className="space-y-8 xl:col-span-2">
          {/* Subject breakdown donut */}
          <section className="rounded-2xl border border-border bg-surface p-6 shadow-[var(--shadow-card)]">
            <h2 className="text-base font-semibold text-foreground">Subject breakdown</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">Performance by discipline</p>
            <div className="mt-2 flex justify-center">
              <ResponsiveContainer width={200} height={200}>
                <PieChart>
                  <Pie
                    data={SUBJECT_BREAKDOWN}
                    dataKey="pct"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={3}
                    stroke="none"
                  >
                    {SUBJECT_BREAKDOWN.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "var(--color-surface)",
                      border: "1px solid var(--color-border)",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    formatter={(v: number) => [`${v}%`, "Score"]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 space-y-2">
              {SUBJECT_BREAKDOWN.map((s) => (
                <div key={s.subject} className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                    style={{ background: s.fill }}
                  />
                  <span className="min-w-0 flex-1 truncate text-xs text-foreground">
                    {s.subject}
                  </span>
                  <span className="text-xs font-semibold text-muted-foreground">{s.pct}%</span>
                </div>
              ))}
            </div>
          </section>

          {/* Topic mastery progress bars */}
          <section className="rounded-2xl border border-border bg-surface p-6 shadow-[var(--shadow-card)]">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-foreground">Topic mastery</h2>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="mt-4 space-y-3.5">
              {TOPIC_MASTERY.map((t) => (
                <div key={t.topic}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-foreground">{t.topic}</span>
                    <span className="font-semibold text-muted-foreground">{t.pct}%</span>
                  </div>
                  <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-surface-alt">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${t.pct}%`,
                        background:
                          "linear-gradient(90deg, var(--color-primary), var(--color-accent))",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Leaderboard preview */}
          <section className="rounded-2xl border border-border bg-surface p-6 shadow-[var(--shadow-card)]">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-foreground">Leaderboard</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">You are in the top 14%</p>
              </div>
              <Link
                to="/leaderboard"
                className="flex items-center gap-1 rounded-lg border border-border bg-surface-alt px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-surface"
              >
                <Users className="h-3.5 w-3.5" /> Full board
              </Link>
            </div>

            {/* Rank highlight */}
            <div
              className="mt-4 flex items-center gap-3 rounded-xl p-3 text-white"
              style={{
                background: "linear-gradient(135deg, var(--color-primary), var(--color-accent))",
              }}
            >
              <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-white/20 text-lg font-extrabold">
                {GLOBAL_RANK}
              </span>
              <div>
                <p className="text-xs font-medium text-white/80">Your rank</p>
                <p className="text-sm font-bold">Top 14% globally</p>
              </div>
              <Trophy className="ml-auto h-5 w-5 text-white/60" />
            </div>

            <div className="mt-3 divide-y divide-border">
              {NEARBY_LEADERS.map((row) => (
                <div
                  key={row.rank}
                  className={`flex items-center gap-3 py-2.5 ${row.isYou ? "rounded-xl px-2" : "px-1"}`}
                  style={
                    row.isYou
                      ? { background: "color-mix(in oklab, var(--color-accent) 8%, transparent)" }
                      : undefined
                  }
                >
                  <span className="w-7 text-center text-xs font-bold text-muted-foreground">
                    #{row.rank}
                  </span>
                  <span
                    className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                    style={{
                      background: row.isYou
                        ? "linear-gradient(135deg, var(--color-primary), var(--color-accent))"
                        : "var(--color-surface-alt)",
                    }}
                  >
                    <span className={row.isYou ? "text-white" : "text-muted-foreground"}>
                      {row.initials}
                    </span>
                  </span>
                  <span
                    className={`min-w-0 flex-1 truncate text-xs font-medium ${row.isYou ? "text-foreground" : "text-muted-foreground"}`}
                  >
                    {row.name}
                  </span>
                  <span
                    className="text-xs font-bold"
                    style={{ color: row.isYou ? "var(--color-primary)" : undefined }}
                  >
                    {row.score}%
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Streak + achievements */}
          <section className="rounded-2xl border border-border bg-surface p-6 shadow-[var(--shadow-card)]">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-foreground">Achievements</h2>
              <Award className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {badges.filter((b) => b.earned).length} of {badges.length} unlocked
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {badges.map((b) => (
                <div
                  key={b.label}
                  className={`flex flex-col items-start gap-2 rounded-xl border p-3 transition-opacity ${
                    b.earned
                      ? "border-border bg-surface-alt/50"
                      : "border-dashed border-border bg-surface opacity-50"
                  }`}
                >
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-xl text-white ${
                      b.earned ? `bg-gradient-to-br ${b.tint}` : "bg-muted"
                    }`}
                  >
                    <b.icon className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="flex items-center gap-1 text-xs font-semibold text-foreground">
                      {b.label}
                      {b.earned && <CheckCircle2 className="h-3 w-3 text-[var(--color-accent)]" />}
                    </p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">{b.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   Sub-components
────────────────────────────────────────────────────────────────────────── */

function TrialBanner({
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
    <section
      className="relative overflow-hidden rounded-2xl p-6 text-white shadow-[var(--shadow-card)]"
      style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-accent))" }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-3xl"
      />
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
          className="inline-flex h-11 flex-shrink-0 items-center justify-center gap-1.5 rounded-lg bg-white px-5 text-sm font-bold shadow-sm transition-transform hover:-translate-y-0.5"
          style={{ color: "var(--color-primary)" }}
        >
          <Zap className="h-4 w-4" /> Upgrade now
        </Link>
      </div>
    </section>
  );
}

function SubscribedBanner({ planName }: { planName: string }) {
  return (
    <section className="flex items-center gap-4 rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
      <span
        className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl text-white"
        style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-accent))" }}
      >
        <CheckCircle2 className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">Active subscription: {planName}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Full access unlocked — all banks and features available.
        </p>
      </div>
      <Link
        to="/subscription"
        className="flex-shrink-0 rounded-lg border border-border bg-surface-alt px-4 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-surface"
      >
        Manage
      </Link>
    </section>
  );
}

function StartCard({ onStart }: { onStart: () => void }) {
  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-6 shadow-[var(--shadow-card)] md:flex-row md:items-center md:justify-between">
      <div className="flex items-start gap-4">
        <span
          className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl text-white"
          style={{
            background: "linear-gradient(135deg, var(--color-primary), var(--color-accent))",
          }}
        >
          <Play className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p
            className="text-xs font-semibold uppercase tracking-wide"
            style={{ color: "var(--color-accent)" }}
          >
            Start a quiz
          </p>
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
          className="rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{
            background: "linear-gradient(135deg, var(--color-primary), var(--color-accent))",
          }}
        >
          Start a quiz
        </button>
        <Link
          to="/banks"
          className="rounded-xl border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-surface-alt"
        >
          Browse banks
        </Link>
      </div>
    </section>
  );
}

function LiveContinueCard({
  bankName,
  answered,
  total,
  onResume,
}: {
  bankName: string;
  answered: number;
  total: number;
  onResume: () => void;
}) {
  const pct = total ? Math.round((answered / total) * 100) : 0;
  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-6 shadow-[var(--shadow-card)] md:flex-row md:items-center md:justify-between">
      <div className="flex items-start gap-4">
        <span
          className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl text-white"
          style={{
            background: "linear-gradient(135deg, var(--color-primary), var(--color-accent))",
          }}
        >
          <Timer className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p
            className="text-xs font-semibold uppercase tracking-wide"
            style={{ color: "var(--color-accent)" }}
          >
            Continue learning
          </p>
          <h3 className="mt-1 truncate text-base font-semibold text-foreground">{bankName}</h3>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {answered}/{total} answered
          </p>
          <div className="mt-3 h-1.5 w-full max-w-md overflow-hidden rounded-full bg-surface-alt">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${pct}%`,
                background: "linear-gradient(90deg, var(--color-primary), var(--color-accent))",
              }}
            />
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={onResume}
        className="self-start rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 md:self-center"
        style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-accent))" }}
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
