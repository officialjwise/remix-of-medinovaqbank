import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  Check,
  ChevronLeft,
  ChevronRight,
  Flag,
  Lightbulb,
  Sparkles,
  X,
} from "lucide-react";
import { useSessionStore } from "@/stores/sessionStore";
import type { Question } from "@/types";

export const Route = createFileRoute("/quiz/$sessionId/")({
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
  const finishSession = useSessionStore((s) => s.finishSession);

  const [index, setIndex] = useState(0);
  const [navOpen, setNavOpen] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const [flagged, setFlagged] = useState<Record<string, boolean>>({});

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
  const isLast = index === total - 1;

  function go(delta: number) {
    setIndex((i) => Math.min(total - 1, Math.max(0, i + delta)));
  }

  function handleSubmit() {
    if (!selected) return;
    submitAnswer(sessionId, qid);
  }

  function finish() {
    finishSession(sessionId);
    navigate({ to: "/quiz/$sessionId/results", params: { sessionId } });
  }

  function handleNextOrSubmit() {
    if (session.mode === "QUIZ") {
      if (selected && !isSubmitted) submitAnswer(sessionId, qid);
      if (isLast) {
        finish();
        return;
      }
      go(1);
    } else {
      if (!isSubmitted) {
        handleSubmit();
        return;
      }
      if (isLast) {
        finish();
        return;
      }
      go(1);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-border bg-surface">
        <div className="mx-auto flex h-14 max-w-[1400px] items-center gap-3 px-4 sm:px-6">
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
            <button
              type="button"
              onClick={finish}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary-light"
            >
              <Check className="h-3.5 w-3.5" /> Finish
            </button>
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

      <div className="mx-auto flex w-full max-w-[1400px]">
        {/* Sidebar nav */}
        <aside
          className={`hidden border-r border-border bg-surface md:block ${
            navOpen ? "w-64" : "w-16"
          } transition-all duration-300 min-h-[calc(100vh-3.5rem)]`}
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
          <div className="mx-auto max-w-4xl xl:max-w-5xl">
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
                  <button
                    type="button"
                    onClick={() => setFlagged((f) => ({ ...f, [qid]: !f[qid] }))}
                    className={`ml-2 inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                      flagged[qid]
                        ? "border-amber-300 bg-amber-50 text-amber-700"
                        : "border-border bg-surface text-muted-foreground hover:bg-surface-alt"
                    }`}
                    aria-pressed={!!flagged[qid]}
                  >
                    <Flag className="h-4 w-4" />
                    {flagged[qid] ? "Flagged" : "Flag"}
                  </button>
                </div>

                <article className="mt-3 rounded-2xl border border-white/5 bg-surface p-6 shadow-[0_10px_30px_-10px_rgb(0_0_0_/_0.3)] animate-slide-up">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#00D4C8]/5 to-transparent pointer-events-none rounded-2xl" />
                  <p className="relative whitespace-pre-line text-[16px] leading-relaxed text-foreground/90 font-medium drop-shadow-sm">
                    {question.stem}
                  </p>
                </article>

                <div className="mt-5 space-y-3 animate-slide-up" style={{ animationDelay: '100ms' }}>
                  {question.options.map((opt) => {
                    const chosen = selected === opt.key;
                    const correctKey = question.correctKey;
                    let cls =
                      "border-white/10 bg-surface/80 text-foreground hover:border-[#00D4C8]/40 hover:bg-[#00D4C8]/5 hover:shadow-[0_0_15px_rgba(0,212,200,0.1)]";
                    let iconCls = "border-white/20 bg-surface text-foreground";
                    
                    if (showExplanation) {
                      if (opt.key === correctKey) {
                        cls = "border-success bg-success/10 text-success shadow-[0_0_20px_rgba(31,169,104,0.2)] animate-glow-pulse";
                        iconCls = "border-success bg-success text-white shadow-[0_0_10px_rgba(31,169,104,0.5)]";
                      } else if (chosen) {
                        cls = "border-error bg-error/10 text-error";
                        iconCls = "border-error bg-error text-white";
                      } else {
                        cls = "border-white/5 bg-surface/40 text-muted-foreground opacity-60";
                      }
                    } else if (chosen) {
                      cls = "border-[#00D4C8] bg-[#00D4C8]/10 text-foreground shadow-[0_0_15px_rgba(0,212,200,0.2)]";
                      iconCls = "border-[#00D4C8] bg-[#00D4C8] text-white shadow-[0_0_10px_rgba(0,212,200,0.5)]";
                    } else if (isSubmitted && session.mode === "QUIZ") {
                      cls = "border-white/5 bg-surface/40 text-muted-foreground opacity-60";
                    }
                    return (
                      <button
                        key={opt.key}
                        type="button"
                        disabled={isSubmitted}
                        onClick={() => selectAnswer(sessionId, qid, opt.key)}
                        className={`group relative flex w-full items-start gap-4 rounded-xl border p-4 text-left transition-all duration-300 disabled:cursor-default ${cls}`}
                      >
                        <span
                          className={`mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg border text-xs font-bold transition-all duration-300 ${iconCls}`}
                        >
                          {showExplanation && opt.key === correctKey ? (
                            <Check className="h-4 w-4" />
                          ) : showExplanation && chosen ? (
                            <X className="h-4 w-4" />
                          ) : (
                            opt.key
                          )}
                        </span>
                        <span className="flex-1 text-[15px] leading-relaxed pt-0.5">{opt.text}</span>
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
                        {isLast ? "Finish Session" : "Next"}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => (isLast ? finish() : go(1))}
                      className="text-sm font-semibold text-muted-foreground hover:text-foreground"
                    >
                      {isLast ? "Skip & finish" : "Skip Question"}
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
    <section className="mt-6 overflow-hidden rounded-2xl border border-border bg-surface shadow-[var(--shadow-card)]">
      <header
        className={`relative flex items-center gap-3 px-6 py-4 overflow-hidden ${
          isCorrect
            ? "bg-success/10"
            : "bg-error/10"
        }`}
      >
        <div className={`absolute inset-0 opacity-20 pointer-events-none ${isCorrect ? "bg-gradient-to-r from-success to-transparent" : "bg-gradient-to-r from-error to-transparent"}`} />
        <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl shadow-lg relative z-10 ${isCorrect ? "bg-success animate-streak-pop" : "bg-error"}`}>
          {isCorrect ? <Sparkles className="h-5 w-5 text-white" /> : <X className="h-5 w-5 text-white" />}
        </div>
        <div className="relative z-10">
          <h3 className="text-[11px] font-bold uppercase tracking-widest text-white/70">
            {isCorrect ? "+15 XP Streak Maintained" : "Streak Reset"}
          </h3>
          <p className={`text-lg font-bold drop-shadow-sm ${isCorrect ? "text-success" : "text-error"}`}>
            {isCorrect ? "Correct!" : "Incorrect"}
          </p>
        </div>
        <span
          className="ml-auto relative z-10 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest bg-surface/50 backdrop-blur border border-white/10 text-white"
        >
          Clinical Breakdown
        </span>
      </header>

      <div className="space-y-5 p-5">
        {/* Correct answer banner */}
        <div className="flex items-start gap-3 rounded-xl border-l-4 border-success bg-success-light/50 p-4">
          <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-success" />
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-success">
              Correct answer · {question.correctKey}. {correctOpt?.text}
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-foreground">{question.whyCorrect}</p>
          </div>
        </div>

        {/* Why selected was wrong (only if user got it wrong and selected something) */}
        {!isCorrect && selected && (
          <div className="rounded-xl border border-error/20 bg-error-light/30 p-4">
            <p className="text-[11px] font-bold uppercase tracking-wide text-error">
              Why you chose {selected} · Incorrect
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-foreground">
              {question.whyWrong[selected] ?? "This option doesn't fit the clinical picture in this vignette."}
            </p>
          </div>
        )}

        {/* All distractors — "Why X is wrong" + scenario where correct */}
        <div>
          <div className="rounded-r-xl border-l-4 border-teal-500 bg-slate-50 dark:bg-slate-900/40 px-4 py-3">
            <h4 className="text-[11px] font-bold uppercase tracking-[0.16em] text-teal-700 dark:text-teal-300">
              When would each wrong choice be correct?
            </h4>
            <p className="mt-0.5 text-xs text-muted-foreground">
              The highest-yield insight — the exact clinical scenario that flips each distractor into the right answer.
            </p>
          </div>
          <ul className="mt-3 space-y-3">
            {question.options
              .filter((o) => o.key !== question.correctKey)
              .map((o) => {
                const wrongReason = question.whyWrong[o.key] ?? "Not the best answer in this scenario.";
                const wouldBeCorrect = generateWouldBeScenario(o, question);
                return (
                  <li
                    key={o.key}
                    className="rounded-r-xl border border-l-4 border-border border-l-teal-500 bg-slate-50 p-4 dark:bg-slate-900/30"
                  >
                    <div className="flex items-start gap-2.5">
                      <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-error/10 text-xs font-bold text-error">
                        {o.key}
                      </span>
                      <p className="text-sm font-semibold text-foreground">{o.text}</p>
                    </div>
                    <div className="mt-3 space-y-1.5 pl-9">
                      <p className="text-sm leading-relaxed text-foreground">
                        <span className="font-bold text-error">Why {o.key} is wrong — </span>
                        {wrongReason}
                      </p>
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        <span className="font-bold text-[var(--accent)]">Scenario where {o.key} would be correct — </span>
                        {wouldBeCorrect}
                      </p>
                    </div>
                  </li>
                );
              })}
          </ul>
        </div>


        {/* Key learning */}
        <div className="rounded-xl bg-gradient-to-br from-[#0E7C7B]/10 to-[#2BC97F]/15 p-4">
          <p className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-[#0E7C7B]">
            <Lightbulb className="h-3.5 w-3.5" /> Clinical pearl
          </p>
          <p className="mt-1.5 text-sm font-medium leading-relaxed text-foreground">
            {question.keyPoint}
          </p>
        </div>

        {question.related.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
            <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
              Related topics:
            </span>
            {question.related.map((r) => (
              <span
                key={r}
                className="rounded-full border border-border bg-surface px-2.5 py-1 text-xs font-medium text-foreground"
              >
                {r}
              </span>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function generateWouldBeScenario(
  opt: { key: string; text: string },
  question: Question,
): string {
  const rationale = question.whyWrong[opt.key as "A" | "B" | "C" | "D" | "E"] ?? "";
  if (/would|when|if|in which|patients with/i.test(rationale)) {
    const tail = rationale.split(/—|\.|;/).filter(Boolean).slice(-1)[0]?.trim();
    if (tail && tail.length > 20) return tail.replace(/^(?:would|when)\s*/i, "the patient ");
  }
  return `the clinical picture pointed instead to ${opt.text.toLowerCase()} as the underlying mechanism or required next step.`;
}

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const ss = s % 60;
  return `${String(m).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
}
