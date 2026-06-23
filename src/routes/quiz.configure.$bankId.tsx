import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  Clock,
  GraduationCap,
  Shuffle,
  ListOrdered,
  Star,
  Trophy,
  Users,
  Timer,
} from "lucide-react";
import { questionBanks } from "@/data/banks";
import { useSessionStore } from "@/stores/sessionStore";
import { useAuthStore } from "@/stores/authStore";
import { subjectTheme } from "@/data/subjectColors";
import { Logo } from "@/components/brand/Logo";
import type { Difficulty, QuizMode } from "@/types";

export const Route = createFileRoute("/quiz/configure/$bankId")({
  beforeLoad: () => {
    if (typeof window === "undefined") return;
    if (!useAuthStore.getState().isAuthenticated) throw redirect({ to: "/login" });
  },
  loader: ({ params }) => {
    const bank = questionBanks.find((b) => b.id === params.bankId);
    if (!bank) throw redirect({ to: "/banks" });
    return { bank };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `Configure ${loaderData?.bank.name ?? "Quiz"} — Medinovaqbank` },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ConfigurePage,
});

function ConfigurePage() {
  const { bank } = Route.useLoaderData();
  const navigate = useNavigate();
  const createSession = useSessionStore((s) => s.createSession);
  const subscription = useAuthStore((s) => s.subscription);
  const theme = subjectTheme(bank.subject);

  const [mode, setMode] = useState<QuizMode>("TUTOR");
  const [count, setCount] = useState(10);
  const [difficulty, setDifficulty] = useState<"All" | Difficulty>("All");
  const [topics, setTopics] = useState<string[]>([]);
  const [timer, setTimer] = useState<number | null>(null);
  const [order, setOrder] = useState<"shuffled" | "sequential">("shuffled");

  function start() {
    const id = createSession({
      bankId: bank.id,
      mode,
      count,
      topics,
      difficulty,
      durationSec: timer ?? undefined,
    });
    navigate({ to: "/quiz/$sessionId", params: { sessionId: id } });
  }

  function toggleTopic(t: string) {
    setTopics((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-6 py-4">
          <Link
            to="/banks"
            className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-muted-foreground hover:bg-surface-alt hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Question Banks
          </Link>
          <Logo size={32} className="ml-auto" />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8 lg:py-10">
        <div className="mb-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${theme.badge}`}>
              {bank.subject}
            </span>
            <span className="rounded-full border border-border bg-surface px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {bank.questionCount.toLocaleString()} questions
            </span>
            <span className="rounded-full border border-border bg-surface px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {bank.difficulty}
            </span>
            {subscription?.status === "TRIAL" && (
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-amber-700">
                Trial · {subscription.trialQuestionsLeft} questions left
              </span>
            )}
          </div>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground">Configure your session</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">{bank.name} — choose how you want to study.</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* LEFT: config */}
          <div className="space-y-5 lg:col-span-2">
            <Section title="Mode" subtitle="Pick how you want feedback delivered.">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <ModeCard
                  icon={<GraduationCap className="h-5 w-5" />}
                  title="Tutor Mode"
                  body="Instant clinical breakdown after each answer. Best for learning."
                  selected={mode === "TUTOR"}
                  onSelect={() => setMode("TUTOR")}
                />
                <ModeCard
                  icon={<Timer className="h-5 w-5" />}
                  title="Quiz Mode"
                  body="Simulate the real exam. Full review after you finish."
                  selected={mode === "QUIZ"}
                  onSelect={() => setMode("QUIZ")}
                />
              </div>
            </Section>

            <Section title="Number of questions">
              <div className="flex flex-wrap items-center gap-2">
                {[10, 25, 50].map((n) => (
                  <PillButton key={n} active={count === n} onClick={() => setCount(n)}>
                    {n}
                  </PillButton>
                ))}
                <input
                  type="number"
                  min={5}
                  max={Math.min(bank.questionCount, 200)}
                  value={count}
                  onChange={(e) => setCount(Math.max(5, Math.min(200, Number(e.target.value) || 5)))}
                  className="h-9 w-24 rounded-lg border border-border bg-surface px-3 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                  aria-label="Custom question count"
                />
                <input
                  type="range"
                  min={5}
                  max={Math.min(bank.questionCount, 100)}
                  value={count}
                  onChange={(e) => setCount(Number(e.target.value))}
                  className="ml-2 flex-1 min-w-[120px] accent-[#0E7C7B]"
                />
              </div>
            </Section>

            <Section title="Difficulty">
              <div className="flex flex-wrap gap-2">
                {(["All", "Beginner", "Intermediate", "Advanced"] as const).map((d) => (
                  <PillButton key={d} active={difficulty === d} onClick={() => setDifficulty(d)}>
                    {d === "Beginner" && "🟢 "}
                    {d === "Intermediate" && "🟡 "}
                    {d === "Advanced" && "🔴 "}
                    {d}
                  </PillButton>
                ))}
              </div>
            </Section>

            <Section title="Topics" subtitle={topics.length === 0 ? "Leave empty to include all." : `${topics.length} selected`}>
              <div className="flex flex-wrap gap-2">
                {bank.topics.map((t: string) => (
                  <PillButton key={t} active={topics.includes(t)} onClick={() => toggleTopic(t)}>
                    {t}
                  </PillButton>
                ))}
              </div>
            </Section>

            <Section title="Timer">
              <div className="flex flex-wrap gap-2">
                {([
                  { l: "No timer", v: null },
                  { l: "30 min", v: 30 * 60 },
                  { l: "1 hour", v: 60 * 60 },
                  { l: "2 hours", v: 120 * 60 },
                ] as const).map((opt) => (
                  <PillButton key={opt.l} active={timer === opt.v} onClick={() => setTimer(opt.v)}>
                    <Clock className="h-3.5 w-3.5" /> {opt.l}
                  </PillButton>
                ))}
              </div>
            </Section>

            <Section title="Question order">
              <div className="flex flex-wrap gap-2">
                <PillButton active={order === "shuffled"} onClick={() => setOrder("shuffled")}>
                  <Shuffle className="h-3.5 w-3.5" /> Shuffled
                </PillButton>
                <PillButton active={order === "sequential"} onClick={() => setOrder("sequential")}>
                  <ListOrdered className="h-3.5 w-3.5" /> Sequential
                </PillButton>
              </div>
            </Section>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Link
                to="/banks"
                className="inline-flex h-11 items-center justify-center rounded-lg border border-border bg-surface px-5 text-sm font-semibold text-foreground hover:bg-surface-alt active:scale-[0.98]"
              >
                Cancel
              </Link>
              <button
                type="button"
                onClick={start}
                className="inline-flex h-11 items-center justify-center rounded-lg px-6 text-sm font-semibold text-white shadow-[0_10px_24px_-8px_rgb(14_124_123_/_0.5)] transition-all hover:-translate-y-0.5 active:scale-[0.98]"
                style={{ background: "linear-gradient(135deg, #0E7C7B 0%, #2BC97F 100%)" }}
              >
                Start session →
              </button>
            </div>
          </div>

          {/* RIGHT: bank preview */}
          <aside className="lg:col-span-1">
            <div className="sticky top-6 space-y-4">
              <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-[var(--shadow-card)]">
                <div className={`h-1.5 ${theme.solid}`} aria-hidden />
                <div className="p-5">
                  <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${theme.badge}`}>
                    {bank.subject}
                  </span>
                  <h2 className="mt-3 text-lg font-bold tracking-tight text-foreground">{bank.name}</h2>
                  <p className="mt-1.5 line-clamp-3 text-sm text-muted-foreground">{bank.description}</p>

                  <dl className="mt-4 space-y-2.5 text-sm">
                    <Stat icon={<BookOpen className="h-4 w-4" />} label="Questions" value={bank.questionCount.toLocaleString()} />
                    <Stat icon={<Star className="h-4 w-4" />} label="Difficulty" value={bank.difficulty} />
                    <Stat icon={<Users className="h-4 w-4" />} label="Sessions taken" value={bank.sessionsCount.toLocaleString()} />
                    <Stat icon={<Trophy className="h-4 w-4" />} label="Cohort avg" value="67%" />
                  </dl>

                  <div className="mt-4">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Topics</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {bank.topics.slice(0, 5).map((t) => (
                        <span key={t} className="rounded-full border border-border bg-surface-alt px-2 py-0.5 text-[11px] font-medium text-foreground">
                          {t}
                        </span>
                      ))}
                      {bank.topics.length > 5 && (
                        <span className="rounded-full bg-surface-alt px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                          +{bank.topics.length - 5} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-gradient-to-br from-[#0E7C7B]/5 to-[#2BC97F]/10 p-5">
                <p className="text-[11px] font-bold uppercase tracking-wide text-[#0E7C7B]">Your stats on this bank</p>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <MiniStat label="Best" value="78%" />
                  <MiniStat label="Sessions" value="4" />
                  <MiniStat label="Avg" value="71%" />
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-bold uppercase tracking-wide text-foreground">{title}</h2>
        {subtitle && <span className="text-xs text-muted-foreground">{subtitle}</span>}
      </div>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2 text-muted-foreground">
        <span className="text-[#0E7C7B]">{icon}</span>
        {label}
      </span>
      <span className="font-semibold text-foreground">{value}</span>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-surface p-2 shadow-sm">
      <p className="text-lg font-bold text-foreground">{value}</p>
      <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
    </div>
  );
}

function ModeCard({
  icon,
  title,
  body,
  selected,
  onSelect,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group flex flex-col items-start gap-2 rounded-xl border-2 p-5 text-left transition-all ${
        selected
          ? "border-accent bg-accent-light/40 shadow-[var(--shadow-card)]"
          : "border-border bg-surface hover:border-accent/40"
      }`}
    >
      <span
        className={`flex h-9 w-9 items-center justify-center rounded-lg ${
          selected ? "bg-accent text-accent-foreground" : "bg-surface-alt text-foreground"
        }`}
      >
        {icon}
      </span>
      <span className="text-base font-bold text-foreground">{title}</span>
      <span className="text-sm text-muted-foreground">{body}</span>
    </button>
  );
}

function PillButton({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium transition-colors ${
        active
          ? "border-accent bg-accent text-accent-foreground"
          : "border-border bg-surface text-foreground hover:bg-surface-alt"
      }`}
    >
      {children}
    </button>
  );
}
