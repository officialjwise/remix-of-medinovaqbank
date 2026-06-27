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
import { useCreateSession } from "@/api/quiz.api";
import { useDashboardSummary } from "@/api/dashboard.api";
import { useMyPerformance } from "@/api/analytics.api";
import { useLeaderboard, useMyRank } from "@/api/leaderboard.api";
import { subjectTheme } from "@/data/subjectColors";
import { useTrial } from "@/hooks/useTrial";
import { GradientKpiCard } from "@/components/shared/GradientKpiCard";
import { UserDashboardSkeleton } from "@/components/shared/DashboardSkeletons";
import { useInitialLoad } from "@/hooks/useInitialLoad";
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

// Mon-first weekday labels for the weekly-activity strip.
const WEEK_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

/** Donut palette — cycled per subject so colors are stable for a given order. */
const DONUT_PALETTE = ["#0E7C7B", "#2BC97F", "#2563EB", "#7C3AED", "#D97706", "#EC4899", "#06B6D4"];

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

/** Color for a subject: prefer the shared theme, else cycle the donut palette. */
function subjectColor(subject: string, index: number): string {
  const theme = subjectTheme(subject);
  // FALLBACK theme uses the slate hex; cycle the palette for unmapped subjects.
  return theme.hex === "#64748B" ? DONUT_PALETTE[index % DONUT_PALETTE.length] : theme.hex;
}

/** Local midnight of the Monday that starts the week containing `ref`. */
function startOfWeekMonday(ref: Date): Date {
  const d = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate());
  const dow = (d.getDay() + 6) % 7; // 0 = Monday … 6 = Sunday
  d.setDate(d.getDate() - dow);
  return d;
}

/**
 * Derive a Mon→Sun "active day" mask for the current week from completed-session
 * timestamps. A day is active if at least one session completed on it. Returns
 * all-false when there is no completed session this week.
 */
function weekActivityFromDates(dates: Array<string | null>): boolean[] {
  const week = [false, false, false, false, false, false, false];
  const monday = startOfWeekMonday(new Date());
  const mondayMs = monday.getTime();
  const weekEndMs = mondayMs + 7 * 24 * 60 * 60 * 1000;
  for (const iso of dates) {
    if (!iso) continue;
    const t = new Date(iso);
    if (Number.isNaN(t.getTime())) continue;
    const ms = t.getTime();
    if (ms < mondayMs || ms >= weekEndMs) continue;
    const dayIndex = Math.floor((ms - mondayMs) / (24 * 60 * 60 * 1000));
    if (dayIndex >= 0 && dayIndex < 7) week[dayIndex] = true;
  }
  return week;
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
  const { data: summary, isLoading: summaryLoading } = useDashboardSummary();
  const { data: performance } = useMyPerformance();
  const { data: myRank } = useMyRank({ period: "all_time" });
  const { data: leaderboardRows } = useLeaderboard({ period: "all_time", limit: 5 });
  const createSession = useCreateSession();
  const { isTrial, daysLeft, questionsLeft, questionsTotal, expired } = useTrial();

  // Unread badge on the dashboard header bell (capped at 3 for display parity).
  const { data: unreadCount } = useUnreadCount();
  const userNotifsCount = Math.min(unreadCount ?? 0, 3);

  const { data: paidPlans = [] } = usePaidPlans();
  const activePlan = subscription?.status === "ACTIVE" ? paidPlans[0] : undefined;

  if (loading || summaryLoading) return <UserDashboardSkeleton />;

  /* Real aggregates from GET /dashboard/summary */
  const kpis = summary?.kpis;
  const streak = summary?.studyStreak;
  const recentSessions = summary?.recentSessions ?? [];
  const recommendedBanks = summary?.recommendedBanks ?? [];

  const streakDays = streak?.current ?? 0;
  const liveInProgress = recentSessions.find((s) => s.inProgress);
  const completed = recentSessions.filter((s) => !s.inProgress);

  const totalAnswered = kpis?.totalQuestionsAnswered ?? 0;
  const avgScore = Math.round(kpis?.averageScore ?? 0);
  const bestScore = completed.reduce((m, s) => Math.max(m, s.scorePct), 0);

  /* Real analytics + leaderboard (empty arrays / null rank for new users) */
  const subjectBreakdown = (performance?.subjectBreakdown ?? []).map((s, i) => ({
    subject: s.name,
    pct: s.pct,
    fill: subjectColor(s.name, i),
  }));

  // Oldest → newest so the line chart reads left-to-right; backend sends DESC.
  const perfTrend = [...(performance?.sessionTimeline ?? [])]
    .reverse()
    .map((s) => ({ day: s.date, score: s.pct }));

  // Real per-day activity for the current week, derived from completed sessions.
  const weekActivity = weekActivityFromDates(
    (performance?.sessionTimeline ?? []).map((s) => s.completedAt),
  );
  const hasWeekActivity = weekActivity.some(Boolean);

  // Leaderboard: a brand-new user has rank === null (no completed sessions).
  const hasRank = (myRank?.rank ?? null) !== null;
  const rankNumber = myRank?.rank ?? null;
  const topPct = myRank ? Math.max(1, Math.round(100 - myRank.percentile)) : null;
  const nearbyLeaders = (leaderboardRows ?? []).map((row) => ({
    rank: row.rank,
    name: row.userId === user?.id ? "You" : row.name,
    initials: row.initials,
    score: row.avgScore,
    isYou: row.userId === user?.id,
  }));

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
      label: `${streakDays}-day streak`,
      sub: "Study consistency",
      earned: streakDays >= 3,
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
      earned: rankNumber !== null && rankNumber <= 500,
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
              <span className="text-sm font-bold">{streakDays}-day streak</span>
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
          value={String(streakDays)}
          icon={Flame}
          sub={`days in a row${streak?.activeToday ? " · active today" : ""}`}
        />
        <GradientKpiCard
          gradient="violet"
          label="Global rank"
          value={hasRank ? `#${rankNumber}` : "—"}
          icon={Trophy}
          sub={hasRank ? `Top ${topPct}% of ${myRank?.totalRanked ?? 0}` : "Take a quiz to rank"}
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
          bankName={liveInProgress.bankName}
          answered={liveInProgress.answeredCount}
          total={liveInProgress.totalQuestions}
          onResume={() =>
            navigate({ to: "/quiz/$sessionId", params: { sessionId: liveInProgress.id } })
          }
        />
      ) : recommendedBanks[0] ? (
        <StartCard onStart={() => startBank(recommendedBanks[0].id, "QUIZ")} />
      ) : (
        <StartCard onStart={() => navigate({ to: "/banks" })} />
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
                {streakDays}-day streak
              </div>
            </div>
            <div className="mt-5 flex items-end justify-between gap-2">
              {weekActivity.map((active, i) => (
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
            {!hasWeekActivity && (
              <p className="mt-4 text-center text-xs text-muted-foreground">
                No activity yet this week — complete a quiz to light up your days.
              </p>
            )}
          </section>

          {/* Performance over time */}
          <section className="rounded-2xl border border-border bg-surface p-6 shadow-[var(--shadow-card)]">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-foreground">Performance over time</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Scores from your recent quizzes
                </p>
              </div>
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
            </div>
            {perfTrend.length === 0 ? (
              <p className="mt-8 mb-6 text-center text-sm text-muted-foreground">
                Complete a quiz to start tracking your performance over time.
              </p>
            ) : (
              <div className="mt-4">
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={perfTrend} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
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
                      domain={[0, 100]}
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
            )}
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
              {completed.length === 0 && (
                <p className="px-6 py-8 text-center text-sm text-muted-foreground">
                  No completed sessions yet — finish a quiz to see it here.
                </p>
              )}
              {completed.slice(0, 4).map((s) => (
                <div
                  key={s.id}
                  className="flex items-center gap-4 px-6 py-3.5 transition-colors hover:bg-surface-alt/50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{s.bankName}</p>
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
              {recommendedBanks.length === 0 && (
                <p className="col-span-full text-sm text-muted-foreground">
                  No recommendations yet — browse all banks to get started.
                </p>
              )}
              {recommendedBanks.slice(0, 3).map((b) => (
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
            {subjectBreakdown.length === 0 ? (
              <p className="mt-8 mb-6 text-center text-sm text-muted-foreground">
                Complete a quiz to see your subject breakdown.
              </p>
            ) : (
              <>
                <div className="mt-2 flex justify-center">
                  <ResponsiveContainer width={200} height={200}>
                    <PieChart>
                      <Pie
                        data={subjectBreakdown}
                        dataKey="pct"
                        nameKey="subject"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={90}
                        paddingAngle={3}
                        stroke="none"
                      >
                        {subjectBreakdown.map((entry) => (
                          <Cell key={entry.subject} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: "var(--color-surface)",
                          border: "1px solid var(--color-border)",
                          borderRadius: 8,
                          fontSize: 12,
                        }}
                        formatter={(v: number) => [`${v}%`, "Accuracy"]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-2 space-y-2">
                  {subjectBreakdown.map((s) => (
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
              </>
            )}
          </section>

          {/* Topic mastery progress bars */}
          <section className="rounded-2xl border border-border bg-surface p-6 shadow-[var(--shadow-card)]">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-foreground">Topic mastery</h2>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="mt-6 mb-4 text-center text-sm text-muted-foreground">
              Topic mastery unlocks after you complete quizzes.
            </p>
          </section>

          {/* Leaderboard preview */}
          <section className="rounded-2xl border border-border bg-surface p-6 shadow-[var(--shadow-card)]">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-foreground">Leaderboard</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {hasRank ? `You are in the top ${topPct}%` : "How you stack up"}
                </p>
              </div>
              <Link
                to="/leaderboard"
                className="flex items-center gap-1 rounded-lg border border-border bg-surface-alt px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-surface"
              >
                <Users className="h-3.5 w-3.5" /> Full board
              </Link>
            </div>

            {!hasRank ? (
              <p className="mt-6 mb-4 text-center text-sm text-muted-foreground">
                Take a quiz to join the leaderboard.
              </p>
            ) : (
              <>
                {/* Rank highlight */}
                <div
                  className="mt-4 flex items-center gap-3 rounded-xl p-3 text-white"
                  style={{
                    background:
                      "linear-gradient(135deg, var(--color-primary), var(--color-accent))",
                  }}
                >
                  <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-white/20 text-lg font-extrabold">
                    {rankNumber}
                  </span>
                  <div>
                    <p className="text-xs font-medium text-white/80">Your rank</p>
                    <p className="text-sm font-bold">Top {topPct}% globally</p>
                  </div>
                  <Trophy className="ml-auto h-5 w-5 text-white/60" />
                </div>

                <div className="mt-3 divide-y divide-border">
                  {nearbyLeaders.map((row) => (
                    <div
                      key={`${row.rank}-${row.name}`}
                      className={`flex items-center gap-3 py-2.5 ${row.isYou ? "rounded-xl px-2" : "px-1"}`}
                      style={
                        row.isYou
                          ? {
                              background:
                                "color-mix(in oklab, var(--color-accent) 8%, transparent)",
                            }
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
              </>
            )}
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
