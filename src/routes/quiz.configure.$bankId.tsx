import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, BookOpen, Clock, Stethoscope, Timer } from "lucide-react";
import { questionBanks } from "@/data/banks";
import { useSessionStore } from "@/stores/sessionStore";
import { useAuthStore } from "@/stores/authStore";
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

  const [mode, setMode] = useState<QuizMode>("TUTOR");
  const [count, setCount] = useState(10);
  const [difficulty, setDifficulty] = useState<"All" | Difficulty>("All");
  const [topics, setTopics] = useState<string[]>([]);
  const [timer, setTimer] = useState<number | null>(null);

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
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-6 py-4">
          <Link
            to="/banks"
            className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-muted-foreground hover:bg-surface-alt hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Stethoscope className="h-4 w-4" />
            </span>
            <span className="text-sm font-bold tracking-tight">
              Medinova<span className="text-accent">qbank</span>
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-10">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-wide text-accent">{bank.subject}</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-foreground">{bank.name}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{bank.description}</p>
        </div>

        {/* Mode */}
        <Section title="Quiz Mode">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <ModeCard
              icon={<BookOpen className="h-5 w-5" />}
              title="Tutor Mode"
              body="Get instant AI feedback after each answer. Best for learning."
              selected={mode === "TUTOR"}
              onSelect={() => setMode("TUTOR")}
            />
            <ModeCard
              icon={<Timer className="h-5 w-5" />}
              title="Quiz Mode"
              body="Answer all questions first. Full review after completion."
              selected={mode === "QUIZ"}
              onSelect={() => setMode("QUIZ")}
            />
          </div>
        </Section>

        {/* Count */}
        <Section title="Number of Questions">
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
            <span className="text-xs text-muted-foreground">min 5 · max {Math.min(bank.questionCount, 200)}</span>
          </div>
        </Section>

        {/* Difficulty */}
        <Section title="Difficulty Filter">
          <div className="flex flex-wrap gap-2">
            {(["All", "Beginner", "Intermediate", "Advanced"] as const).map((d) => (
              <PillButton key={d} active={difficulty === d} onClick={() => setDifficulty(d)}>
                {d}
              </PillButton>
            ))}
          </div>
        </Section>

        {/* Topic */}
        <Section title="Topic Filter (optional)">
          <div className="flex flex-wrap gap-2">
            {bank.topics.map((t) => (
              <PillButton key={t} active={topics.includes(t)} onClick={() => toggleTopic(t)}>
                {t}
              </PillButton>
            ))}
          </div>
        </Section>

        {/* Timer */}
        <Section title="Timer (optional)">
          <div className="flex flex-wrap gap-2">
            {([
              { l: "No Timer", v: null },
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

        <div className="mt-10 flex items-center justify-end gap-3">
          <Link
            to="/banks"
            className="inline-flex h-11 items-center justify-center rounded-lg border border-border bg-surface px-5 text-sm font-semibold text-foreground hover:bg-surface-alt"
          >
            Cancel
          </Link>
          <button
            type="button"
            onClick={start}
            className="inline-flex h-11 items-center justify-center rounded-lg bg-accent px-6 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent/90"
          >
            Start Session →
          </button>
        </div>
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6 rounded-xl border border-border bg-surface p-5">
      <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
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
