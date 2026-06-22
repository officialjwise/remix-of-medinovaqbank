import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  Check,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  X,
} from "lucide-react";
import { useSessionStore } from "@/stores/sessionStore";
import { useAuthStore } from "@/stores/authStore";
import type { Question } from "@/types";

export const Route = createFileRoute("/quiz/$sessionId")({
  beforeLoad: () => {
    if (typeof window === "undefined") return;
    if (!useAuthStore.getState().isAuthenticated) throw redirect({ to: "/login" });
  },
  head: () => ({
    meta: [
      { title: "Quiz Session — Medinovaqbank" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: QuizPage,
});

function QuizPage() {
  const { sessionId } = Route.useParams();
  const navigate = useNavigate();
  const session = useSessionStore((s) => s.sessions[sessionId]);
  const questionMap = useSessionStore((s) => s.questions);
  const selectAnswer = useSessionStore((s) => s.selectAnswer);
  const submitAnswer = useSessionStore((s) => s.submitAnswer);
  const toggleBookmark = useSessionStore((s) => s.toggleBookmark);

  const [index, setIndex] = useState(0);
  const [navOpen, setNavOpen] = useState(true);
  const [elapsed, setElapsed] = useState(0);

  // Timer tick
  useEffect(() => {
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, []);

  if (!session) {
    return (
      <div className="grid min-h-screen place-items-center bg-background p-6 text-center">
        <div>
          <h1 className="text-xl font-bold text-foreground">Session not found</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This session may have been cleared. Start a new one from your question banks.
          </p>
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

  const qid = session.questionIds[index];
  const question: Question | undefined = questionMap[qid];
  const total = session.questionIds.length;
  const selected = session.answers[qid];
  const isSubmitted = !!session.submitted[qid];
  const showExplanation = session.mode === "TUTOR" && isSubmitted;
  const answeredCount = session.questionIds.filter((id) => session.submitted[id]).length;
  const progressPct = Math.round((answeredCount / total) * 100);
  const remaining = session.durationSec ? Math.max(0, session.durationSec - elapsed) : null;

  function go(delta: number) {
    setIndex((i) => Math.min(total - 1, Math.max(0, i + delta)));
  }

  function handleSubmit() {
    if (!selected) return;
    submitAnswer(sessionId, qid);
  }

  function handleNextOrSubmit() {
    if (session.mode === "QUIZ") {
      // Quiz mode: lock answer in and move on
      if (selected && !isSubmitted) submitAnswer(sessionId, qid);
      if (index < total - 1) go(1);
    } else {
      // Tutor mode: if not submitted, submit; else advance
      if (!isSubmitted) handleSubmit();
      else if (index < total - 1) go(1);
    }
  }

  function finish() {
    navigate({ to: "/sessions" });
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-border bg-surface">
        <div className="flex h-14 items-center gap-3 px-4 sm:px-6">
          <Link
            to="/banks"
            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-muted-foreground hover:bg-surface-alt hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Exit
          </Link>
          <div className="hidden flex-1 items-center justify-center sm:flex">
            <span className="truncate text-sm font-semibold text-foreground">
              {session.bankName}
            </span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${
                session.mode === "TUTOR"
                  ? "bg-accent-light text-accent"
                  : "bg-warning-light text-warning"
              }`}
            >
              {session.mode}
            </span>
            {remaining !== null && (
              <span className="rounded-full bg-surface-alt px-2.5 py-1 text-xs font-mono font-semibold tabular-nums text-foreground">
                {formatTime(remaining)}
              </span>
            )}
          </div>
        </div>
        {/* Progress bar */}
        <div className="h-1 w-full bg-surface-alt">
          <div
            className="h-full bg-accent transition-all"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </header>

      <div className="flex">
        {/* Sidebar nav */}
        <aside
          className={`hidden border-r border-border bg-surface md:block ${
            navOpen ? "w-56" : "w-14"
          } transition-all`}
        >
          <div className="flex h-12 items-center justify-between px-3">
            <span className={`text-xs font-bold uppercase tracking-wide text-muted-foreground ${navOpen ? "" : "sr-only"}`}>
              Questions
            </span>
            <button
              type="button"
              onClick={() => setNavOpen((v) => !v)}
              className="rounded-md p-1 text-muted-foreground hover:bg-surface-alt"
              aria-label="Toggle navigator"
            >
              <ChevronLeft className={`h-4 w-4 transition-transform ${navOpen ? "" : "rotate-180"}`} />
            </button>
          </div>
          <div className={`grid gap-1.5 p-3 ${navOpen ? "grid-cols-5" : "grid-cols-1"}`}>
            {session.questionIds.map((id, i) => {
              const a = session.answers[id];
              const sub = !!session.submitted[id];
              const q = questionMap[id];
              const correct = sub && q && a === q.correctKey;
              const wrong = sub && q && a && a !== q.correctKey;
              const isCurrent = i === index;
              const cls = isCurrent
                ? "bg-accent text-accent-foreground border-accent"
                : session.mode === "TUTOR"
                  ? correct
                    ? "bg-success-light text-success border-success/30"
                    : wrong
                      ? "bg-error-light text-error border-error/30"
                      : a
                        ? "bg-warning-light text-warning border-warning/30"
                        : "bg-surface text-muted-foreground border-border"
                  : sub
                    ? "bg-warning-light text-warning border-warning/30"
                    : "bg-surface text-muted-foreground border-border";
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setIndex(i)}
                  className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs font-bold ${cls}`}
                  aria-label={`Go to question ${i + 1}`}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 px-4 py-6 sm:px-8 lg:px-12">
          <div className="mx-auto max-w-3xl">
            {question ? (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Question {index + 1} of {total}
                  </p>
                  <button
                    type="button"
                    onClick={() => toggleBookmark(sessionId, qid)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-surface-alt"
                  >
                    {session.bookmarked[qid] ? (
                      <BookmarkCheck className="h-4 w-4 text-accent" />
                    ) : (
                      <Bookmark className="h-4 w-4" />
                    )}
                    {session.bookmarked[qid] ? "Bookmarked" : "Bookmark"}
                  </button>
                </div>

                <article className="mt-3 rounded-xl border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
                  <p className="whitespace-pre-line text-[15px] leading-relaxed text-foreground">
                    {question.stem}
                  </p>
                </article>

                <div className="mt-5 space-y-2.5">
                  {question.options.map((opt) => {
                    const chosen = selected === opt.key;
                    const correctKey = question.correctKey;
                    let cls =
                      "border-border bg-surface text-foreground hover:border-accent/40 hover:bg-accent-light/30";
                    if (showExplanation) {
                      if (opt.key === correctKey) {
                        cls = "border-success bg-success-light text-success";
                      } else if (chosen) {
                        cls = "border-error bg-error-light text-error";
                      } else {
                        cls = "border-border bg-surface text-muted-foreground";
                      }
                    } else if (chosen) {
                      cls = "border-accent bg-accent-light/40 text-foreground";
                    } else if (isSubmitted && session.mode === "QUIZ") {
                      cls = "border-border bg-surface text-muted-foreground";
                    }
                    return (
                      <button
                        key={opt.key}
                        type="button"
                        disabled={isSubmitted}
                        onClick={() => selectAnswer(sessionId, qid, opt.key)}
                        className={`flex w-full items-start gap-3 rounded-xl border-2 p-4 text-left transition-all disabled:cursor-default ${cls}`}
                      >
                        <span
                          className={`mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border text-xs font-bold ${
                            showExplanation && opt.key === correctKey
                              ? "border-success bg-success text-white"
                              : showExplanation && chosen
                                ? "border-error bg-error text-white"
                                : chosen
                                  ? "border-accent bg-accent text-accent-foreground"
                                  : "border-border bg-surface text-foreground"
                          }`}
                        >
                          {showExplanation && opt.key === correctKey ? (
                            <Check className="h-3.5 w-3.5" />
                          ) : showExplanation && chosen ? (
                            <X className="h-3.5 w-3.5" />
                          ) : (
                            opt.key
                          )}
                        </span>
                        <span className="flex-1 text-sm">{opt.text}</span>
                      </button>
                    );
                  })}
                </div>

                {!isSubmitted && (
                  <div className="mt-5 flex items-center gap-3">
                    {session.mode === "TUTOR" ? (
                      <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={!selected}
                        className="inline-flex h-10 items-center justify-center rounded-lg bg-accent px-5 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Submit Answer
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleNextOrSubmit}
                        disabled={!selected}
                        className="inline-flex h-10 items-center justify-center rounded-lg bg-accent px-5 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {index === total - 1 ? "Finish" : "Next"}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => go(1)}
                      disabled={index === total - 1}
                      className="text-sm font-semibold text-muted-foreground hover:text-foreground disabled:opacity-50"
                    >
                      Skip Question
                    </button>
                  </div>
                )}

                {showExplanation && (
                  <Explanation question={question} selected={selected} />
                )}

                {/* Bottom navigation */}
                <div className="mt-8 flex items-center justify-between border-t border-border pt-5">
                  <button
                    type="button"
                    onClick={() => go(-1)}
                    disabled={index === 0}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3.5 py-2 text-sm font-semibold text-foreground hover:bg-surface-alt disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ChevronLeft className="h-4 w-4" /> Previous
                  </button>

                  {index === total - 1 ? (
                    <button
                      type="button"
                      onClick={finish}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                    >
                      Finish Session <Check className="h-4 w-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => go(1)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3.5 py-2 text-sm font-semibold text-foreground hover:bg-surface-alt"
                    >
                      Next Question <ChevronRight className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Question not available.</p>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

function Explanation({
  question,
  selected,
}: {
  question: Question;
  selected: "A" | "B" | "C" | "D" | "E" | undefined;
}) {
  const correctOpt = useMemo(
    () => question.options.find((o) => o.key === question.correctKey),
    [question],
  );
  const isCorrect = selected === question.correctKey;

  return (
    <section className="mt-6 rounded-xl border border-border bg-surface-alt/40 p-5 shadow-[var(--shadow-card)]">
      <header className="flex items-center gap-2 border-l-4 border-accent pl-3">
        <Sparkles className="h-4 w-4 text-accent" />
        <h3 className="text-xs font-bold uppercase tracking-wide text-accent">
          Gemini AI Explanation
        </h3>
      </header>

      <div className="mt-4">
        <div
          className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${
            isCorrect ? "bg-success-light text-success" : "bg-error-light text-error"
          }`}
        >
          {isCorrect ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
          {isCorrect ? "Correct" : "Incorrect"} · Answer: {question.correctKey}.{" "}
          {correctOpt?.text}
        </div>
      </div>

      <div className="mt-4">
        <h4 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
          Why {question.correctKey} is correct
        </h4>
        <p className="mt-1.5 text-sm leading-relaxed text-foreground">{question.whyCorrect}</p>
      </div>

      <div className="mt-4">
        <h4 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
          Why other options are wrong
        </h4>
        <ul className="mt-2 space-y-1.5 text-sm text-foreground">
          {question.options
            .filter((o) => o.key !== question.correctKey)
            .map((o) => (
              <li key={o.key} className="flex gap-2">
                <span className="font-bold">{o.key}.</span>
                <span className="text-muted-foreground">
                  {question.whyWrong[o.key] ?? "Not the best answer in this scenario."}
                </span>
              </li>
            ))}
        </ul>
      </div>

      <div className="mt-4 rounded-lg bg-accent-light/40 p-3 text-sm text-foreground">
        <span className="font-bold">💡 Key Learning Point: </span>
        {question.keyPoint}
      </div>

      {question.related.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Related:
          </span>
          {question.related.map((r) => (
            <span
              key={r}
              className="rounded-full border border-border bg-surface px-2.5 py-0.5 text-xs font-medium text-foreground"
            >
              {r}
            </span>
          ))}
        </div>
      )}
    </section>
  );
}

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const ss = s % 60;
  return `${String(m).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
}
