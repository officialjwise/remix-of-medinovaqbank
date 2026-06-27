import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Flag,
  GraduationCap,
  Keyboard,
  LayoutGrid,
  Loader2,
  SkipForward,
  Timer,
  X,
  Zap,
} from "lucide-react";
import {
  useCompleteSession,
  useSessionState,
  useSubmitAnswer,
  type AnswerResult,
  type QuizQuestion,
} from "@/api/quiz.api";
import { useSessionStore } from "@/stores/sessionStore";
import { TutorBreakdown } from "@/components/quiz/TutorBreakdown";
import { ProtectedSurface } from "@/components/shared/ProtectedSurface";

export const Route = createFileRoute("/quiz/$sessionId/")({
  component: QuizPage,
});

function QuizPage() {
  const { sessionId } = Route.useParams();
  const navigate = useNavigate();

  const { data: state, isLoading, isError, error } = useSessionState(sessionId);
  const submit = useSubmitAnswer(sessionId);
  const complete = useCompleteSession(sessionId);

  const ui = useSessionStore((s) => s.ui[sessionId]);
  const selectOption = useSessionStore((s) => s.selectOption);
  const markSubmitted = useSessionStore((s) => s.markSubmitted);
  const toggleBookmark = useSessionStore((s) => s.toggleBookmark);
  const toggleFlag = useSessionStore((s) => s.toggleFlag);

  const [index, setIndex] = useState(0);
  const [navOpen, setNavOpen] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [qStart, setQStart] = useState(() => Date.now());
  // Per-question submit results held in-memory so tutor mode can render the
  // correct option + fetch the breakdown. Keyed by questionId.
  const [results, setResults] = useState<Record<string, AnswerResult>>({});

  const questions = state?.questions ?? [];
  const total = questions.length;

  // Whole-session timer (counts up).
  useEffect(() => {
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, []);

  // Start the session at the first unanswered question.
  useEffect(() => {
    if (state) setIndex(Math.min(state.currentIndex, Math.max(0, total - 1)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.session.id]);

  // Reset the per-question stopwatch whenever the visible question changes.
  useEffect(() => {
    setQStart(Date.now());
  }, [index]);

  const question: QuizQuestion | undefined = questions[index];
  const qid = question?.id;

  const selectedOptionId = qid ? ui?.selected[qid] : undefined;
  const result = qid ? results[qid] : undefined;
  const isSubmitted = qid ? !!ui?.submitted[qid] : false;
  const isLast = index === total - 1;
  const isTutor = state?.session.mode === "TUTOR";

  const answeredSet = useMemo(
    () => new Set(state?.answeredQuestionIds ?? []),
    [state?.answeredQuestionIds],
  );

  const go = useCallback(
    (delta: number) => setIndex((i) => Math.min(total - 1, Math.max(0, i + delta))),
    [total],
  );
  const jump = useCallback((i: number) => {
    setIndex(i);
    setNavOpen(false);
  }, []);

  const finish = useCallback(() => {
    complete.mutate(undefined, {
      onSuccess: () => navigate({ to: "/quiz/$sessionId/results", params: { sessionId } }),
      onError: () =>
        // Even if completion races, surface the results screen (which fetches).
        navigate({ to: "/quiz/$sessionId/results", params: { sessionId } }),
    });
  }, [complete, navigate, sessionId]);

  const doSubmit = useCallback(
    (skip = false) => {
      if (!qid || isSubmitted || submit.isPending) return;
      const optionId = skip ? undefined : selectedOptionId;
      if (!skip && !optionId) return;
      const timeSpentSeconds = Math.max(0, Math.round((Date.now() - qStart) / 1000));
      submit.mutate(
        { questionId: qid, selectedOptionId: optionId, timeSpentSeconds },
        {
          onSuccess: (res) => {
            markSubmitted(sessionId, qid, res.answerId);
            setResults((prev) => ({ ...prev, [qid]: res }));
          },
        },
      );
    },
    [qid, isSubmitted, submit, selectedOptionId, qStart, sessionId, markSubmitted],
  );

  // Quiz mode: submitting records the answer but reveals nothing; advance.
  const handlePrimary = useCallback(() => {
    if (!state) return;
    if (isTutor) {
      if (!isSubmitted) return doSubmit(false);
      if (isLast) return finish();
      return go(1);
    }
    // Quiz mode
    if (!isSubmitted && selectedOptionId) {
      doSubmit(false);
      if (isLast) return; // wait for record; user taps finish
      return go(1);
    }
    if (isLast) return finish();
    go(1);
  }, [state, isTutor, isSubmitted, isLast, selectedOptionId, doSubmit, finish, go]);

  // Keyboard: 1–5 / A–E select, Enter submits/advances, arrows move, b bookmarks.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable))
        return;
      if (!question || !qid) return;

      let optIndex = -1;
      if (/^[1-5]$/.test(e.key)) optIndex = Number(e.key) - 1;
      else if (/^[a-eA-E]$/.test(e.key)) optIndex = e.key.toUpperCase().charCodeAt(0) - 65;
      const opt = optIndex >= 0 ? question.options[optIndex] : undefined;
      if (opt) {
        if (!isSubmitted) {
          e.preventDefault();
          selectOption(sessionId, qid, opt.id);
        }
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        handlePrimary();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        go(1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        go(-1);
      } else if (e.key.toLowerCase() === "b") {
        e.preventDefault();
        toggleBookmark(sessionId, qid);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [question, qid, isSubmitted, selectOption, sessionId, handlePrimary, go, toggleBookmark]);

  if (isLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading session…
        </div>
      </div>
    );
  }

  if (isError || !state) {
    return (
      <div className="grid min-h-screen place-items-center bg-background p-6 text-center">
        <div>
          <h1 className="text-xl font-bold text-foreground">Session unavailable</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {error instanceof Error ? error.message : "This session could not be loaded."}
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

  const showTutorReveal = isTutor && isSubmitted && !!result;
  const answeredCount = state.answeredQuestionIds.length;
  const progressPct = total === 0 ? 0 : Math.round((answeredCount / total) * 100);
  const limitSec = state.session.timeLimitMinutes ? state.session.timeLimitMinutes * 60 : null;
  const remaining = limitSec !== null ? Math.max(0, limitSec - elapsed) : null;
  const lowTime = remaining !== null && remaining <= 60;
  const correctOptionId = result?.correctOptionId;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/80">
        <div className="flex h-14 items-center gap-3 px-4 sm:px-6">
          <Link
            to="/banks"
            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-surface-alt hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> <span className="hidden sm:inline">Exit</span>
          </Link>
          <div className="hidden min-w-0 flex-1 items-center justify-center sm:flex">
            <span className="truncate text-sm font-semibold text-foreground">
              {state.session.totalQuestions} question session
            </span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${
                isTutor ? "bg-primary/15 text-primary" : "bg-accent/15 text-accent"
              }`}
            >
              {isTutor ? (
                <GraduationCap className="h-3.5 w-3.5" />
              ) : (
                <Zap className="h-3.5 w-3.5" />
              )}
              {state.session.mode}
            </span>
            {remaining !== null && (
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-mono text-xs font-semibold tabular-nums transition-colors ${
                  lowTime
                    ? "bg-error/15 text-error animate-pulse"
                    : "bg-surface-alt text-foreground"
                }`}
              >
                <Timer className="h-3.5 w-3.5" /> {formatTime(remaining)}
              </span>
            )}
            <button
              type="button"
              onClick={() => setNavOpen(true)}
              className="inline-flex items-center justify-center rounded-lg border border-border bg-surface p-1.5 text-muted-foreground hover:bg-surface-alt lg:hidden"
              aria-label="Open question navigator"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={finish}
              disabled={complete.isPending}
              className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-primary to-accent px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 disabled:opacity-60"
            >
              <Check className="h-3.5 w-3.5" /> Finish
            </button>
          </div>
        </div>
        <div className="h-1 w-full bg-surface-alt">
          <div
            className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </header>

      <div className="flex w-full gap-0 lg:gap-6 lg:px-6 lg:py-6">
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-8 lg:px-0 lg:py-0">
          <ProtectedSurface context="quiz_session" contextId={sessionId} page={index + 1}>
            {question ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-alt px-3 py-1 text-xs font-semibold text-foreground">
                      Question <span className="text-primary">{index + 1}</span> of {total}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-surface px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                      {question.topic}
                    </span>
                    <span className="hidden items-center gap-1 rounded-full border border-border bg-surface px-2.5 py-1 text-[11px] font-medium text-muted-foreground sm:inline-flex">
                      {question.difficulty}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => qid && toggleBookmark(sessionId, qid)}
                      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                        qid && ui?.bookmarked[qid]
                          ? "border-accent/40 bg-accent/10 text-accent"
                          : "border-border bg-surface text-muted-foreground hover:bg-surface-alt"
                      }`}
                      aria-pressed={!!(qid && ui?.bookmarked[qid])}
                    >
                      {qid && ui?.bookmarked[qid] ? (
                        <BookmarkCheck className="h-4 w-4" />
                      ) : (
                        <Bookmark className="h-4 w-4" />
                      )}
                      <span className="hidden sm:inline">
                        {qid && ui?.bookmarked[qid] ? "Bookmarked" : "Bookmark"}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => qid && toggleFlag(sessionId, qid)}
                      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                        qid && ui?.flagged[qid]
                          ? "border-warning/40 bg-warning/10 text-warning"
                          : "border-border bg-surface text-muted-foreground hover:bg-surface-alt"
                      }`}
                      aria-pressed={!!(qid && ui?.flagged[qid])}
                    >
                      <Flag className="h-4 w-4" />
                      <span className="hidden sm:inline">
                        {qid && ui?.flagged[qid] ? "Flagged" : "Flag"}
                      </span>
                    </button>
                  </div>
                </div>

                <article
                  className={`relative mt-3 overflow-hidden rounded-2xl border bg-surface p-6 shadow-[var(--shadow-card)] transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 ${
                    showTutorReveal
                      ? result?.isCorrect
                        ? "border-success/50 ring-1 ring-success/30"
                        : "border-error/50 ring-1 ring-error/30"
                      : "border-border"
                  }`}
                >
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent"
                  />
                  {question.imageUrl && (
                    <img
                      src={question.imageUrl}
                      alt="Clinical image for this question"
                      className="relative mx-auto mb-4 max-h-72 rounded-xl border border-border object-contain"
                    />
                  )}
                  <p className="relative whitespace-pre-line text-base font-medium leading-relaxed text-foreground">
                    {question.stem}
                  </p>
                </article>

                <div className="mt-5 space-y-3">
                  {question.options.map((opt, i) => {
                    const chosen = selectedOptionId === opt.id;
                    let cls =
                      "border-border bg-surface text-foreground hover:border-primary/50 hover:bg-primary/5";
                    let badge = "border-border bg-surface-alt text-foreground";

                    if (showTutorReveal) {
                      if (opt.id === correctOptionId) {
                        cls =
                          "border-success bg-success/10 text-foreground shadow-[0_0_0_1px_var(--color-success)]";
                        badge = "border-success bg-success text-white";
                      } else if (chosen) {
                        cls = "border-error bg-error/10 text-foreground";
                        badge = "border-error bg-error text-white";
                      } else {
                        cls = "border-border bg-surface-alt/40 text-muted-foreground opacity-70";
                      }
                    } else if (chosen) {
                      cls =
                        "border-primary bg-primary/10 text-foreground shadow-[0_0_0_1px_var(--color-primary)]";
                      badge = "border-primary bg-primary text-primary-foreground";
                    } else if (isSubmitted) {
                      cls = "border-border bg-surface-alt/40 text-muted-foreground opacity-70";
                    }

                    return (
                      <button
                        key={opt.id}
                        type="button"
                        disabled={isSubmitted}
                        onClick={() => qid && selectOption(sessionId, qid, opt.id)}
                        className={`group relative flex w-full items-start gap-4 rounded-xl border p-4 text-left transition-all duration-200 animate-in fade-in slide-in-from-bottom-1 disabled:cursor-default ${cls}`}
                        style={{ animationDelay: `${i * 40}ms` }}
                      >
                        <span
                          className={`mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg border text-xs font-bold transition-all duration-200 ${badge}`}
                        >
                          {showTutorReveal && opt.id === correctOptionId ? (
                            <Check className="h-4 w-4" />
                          ) : showTutorReveal && chosen ? (
                            <X className="h-4 w-4" />
                          ) : (
                            opt.label
                          )}
                        </span>
                        <span className="flex-1 pt-0.5">
                          <span className="block text-[15px] leading-relaxed">{opt.text}</span>
                          {opt.imageUrl && (
                            <img
                              src={opt.imageUrl}
                              alt={`Option ${opt.label}`}
                              className="mt-2 max-h-40 rounded-lg border border-border object-contain"
                            />
                          )}
                        </span>
                        {!isSubmitted && (
                          <span className="mt-1 hidden flex-shrink-0 rounded border border-border px-1.5 text-[10px] font-bold text-muted-foreground/70 sm:block">
                            {opt.label}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {!isSubmitted && (
                  <div className="mt-5 flex flex-wrap items-center gap-3">
                    {isTutor ? (
                      <button
                        type="button"
                        onClick={() => doSubmit(false)}
                        disabled={!selectedOptionId || submit.isPending}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-primary to-accent px-6 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {submit.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4" />
                        )}
                        Submit Answer
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handlePrimary}
                        disabled={!selectedOptionId || submit.isPending}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-primary to-accent px-6 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isLast ? "Finish Session" : "Next"} <ChevronRight className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => doSubmit(true)}
                      disabled={submit.isPending}
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
                    >
                      <SkipForward className="h-4 w-4" />
                      Skip question
                    </button>
                    <span className="ml-auto hidden items-center gap-1.5 text-[11px] text-muted-foreground/70 md:inline-flex">
                      <Keyboard className="h-3.5 w-3.5" /> 1-5 select · Enter submit · ← → move
                    </span>
                  </div>
                )}

                {/* Quiz mode: answer recorded, no correctness shown */}
                {!isTutor && isSubmitted && (
                  <div className="mt-5 flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface-alt/40 px-4 py-3">
                    <span className="text-sm font-medium text-muted-foreground">
                      Answer recorded. Results are revealed when you finish.
                    </span>
                    <button
                      type="button"
                      onClick={() => (isLast ? finish() : go(1))}
                      className="ml-auto inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-primary to-accent px-5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
                    >
                      {isLast ? "Finish Session" : "Next Question"}{" "}
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                )}

                {/* Tutor reveal: server clinical breakdown */}
                {showTutorReveal && result && (
                  <>
                    <TutorBreakdown
                      answerId={result.answerId}
                      isCorrect={result.isCorrect}
                      selectedOptionId={result.selectedOptionId}
                      options={question.options}
                      correctOptionId={result.correctOptionId}
                    />
                    <div className="mt-5 flex justify-end">
                      <button
                        type="button"
                        onClick={() => (isLast ? finish() : go(1))}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-primary to-accent px-6 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
                      >
                        {isLast ? "Finish Session" : "Next Question"}{" "}
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </>
                )}

                <div className="mt-8 flex items-center justify-between border-t border-border pt-5">
                  <button
                    type="button"
                    onClick={() => go(-1)}
                    disabled={index === 0}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3.5 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-surface-alt disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ChevronLeft className="h-4 w-4" /> Previous
                  </button>
                  {isLast ? (
                    <button
                      type="button"
                      onClick={finish}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary-light"
                    >
                      Finish Session <Check className="h-4 w-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => go(1)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3.5 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-surface-alt"
                    >
                      Next Question <ChevronRight className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Question not available.</p>
            )}
          </ProtectedSurface>
        </main>

        <aside className="sticky top-[4.5rem] hidden h-fit w-72 flex-shrink-0 lg:block">
          <div className="rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-card)]">
            <RuntimeNavigator
              questions={questions}
              answeredSet={answeredSet}
              results={results}
              isTutor={!!isTutor}
              bookmarked={ui?.bookmarked ?? {}}
              currentIndex={index}
              onJump={jump}
            />
            <div className="mt-4 flex items-center justify-between rounded-xl border border-border bg-surface-alt px-3 py-2.5 text-sm">
              <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                {remaining !== null ? (
                  <>
                    <Timer className="h-4 w-4" /> Remaining
                  </>
                ) : (
                  <>
                    <Clock className="h-4 w-4" /> Elapsed
                  </>
                )}
              </span>
              <span
                className={`font-mono font-semibold tabular-nums ${
                  remaining !== null && lowTime ? "text-error" : "text-foreground"
                }`}
              >
                {formatTime(remaining ?? elapsed)}
              </span>
            </div>
          </div>
        </aside>
      </div>

      {navOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50 animate-in fade-in"
            onClick={() => setNavOpen(false)}
            aria-hidden
          />
          <div className="absolute inset-x-0 bottom-0 rounded-t-2xl border-t border-border bg-surface p-5 shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-border-strong" />
            <RuntimeNavigator
              questions={questions}
              answeredSet={answeredSet}
              results={results}
              isTutor={!!isTutor}
              bookmarked={ui?.bookmarked ?? {}}
              currentIndex={index}
              onJump={jump}
            />
            <button
              type="button"
              onClick={() => setNavOpen(false)}
              className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-lg bg-surface-alt text-sm font-semibold text-foreground"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Server-driven navigator. Reflects answered/current state without ever holding
 * unanswered question content or the correct answer. In tutor mode it can show
 * correct/incorrect for questions answered IN THIS client (from the in-memory
 * submit results); otherwise it shows a neutral "answered" state.
 */
function RuntimeNavigator({
  questions,
  answeredSet,
  results,
  isTutor,
  bookmarked,
  currentIndex,
  onJump,
}: {
  questions: QuizQuestion[];
  answeredSet: Set<string>;
  results: Record<string, AnswerResult>;
  isTutor: boolean;
  bookmarked: Record<string, true>;
  currentIndex: number;
  onJump: (i: number) => void;
}) {
  const answered = questions.filter((q) => answeredSet.has(q.id)).length;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
          Navigator
        </span>
        <span className="text-[11px] font-semibold tabular-nums text-muted-foreground">
          {answered}/{questions.length}
        </span>
      </div>
      <div className="grid grid-cols-5 gap-1.5">
        {questions.map((q, i) => {
          const isCurrent = i === currentIndex;
          const isAnswered = answeredSet.has(q.id);
          const res = results[q.id];
          let tone =
            "border-border bg-surface-alt text-muted-foreground hover:border-border-strong hover:text-foreground";
          if (isCurrent) {
            tone =
              "border-primary bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-[0_0_0_2px_var(--color-ring)] ring-1 ring-primary";
          } else if (isTutor && res) {
            tone = res.isCorrect
              ? "border-success/40 bg-success/15 text-success"
              : "border-error/40 bg-error/15 text-error";
          } else if (isAnswered) {
            tone = "border-accent/40 bg-accent/15 text-accent";
          }
          return (
            <button
              key={q.id}
              type="button"
              onClick={() => onJump(i)}
              aria-current={isCurrent ? "true" : undefined}
              className={`relative flex h-9 w-full items-center justify-center rounded-lg border text-xs font-bold tabular-nums transition-all duration-200 hover:scale-105 ${tone}`}
            >
              {i + 1}
              {bookmarked[q.id] && (
                <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-warning" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const ss = s % 60;
  return `${String(m).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
}
