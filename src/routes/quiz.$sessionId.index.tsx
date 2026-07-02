import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  Lock,
  SkipForward,
  Timer,
  X,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { useTrial } from "@/hooks/useTrial";
import {
  useCompleteSession,
  useSessionState,
  useSubmitAnswer,
  type AnswerResult,
  type QuizQuestion,
} from "@/api/quiz.api";
import { useFlagQuestion, useMyFlags, useRemoveFlag } from "@/api/questions.api";
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
  const setBookmark = useSessionStore((s) => s.setBookmark);
  const setFlag = useSessionStore((s) => s.setFlag);
  const hydrateFlags = useSessionStore((s) => s.hydrateFlags);

  // Real, persisted bookmarks/flags — the server is the source of truth.
  const { data: myFlags } = useMyFlags();
  const addFlag = useFlagQuestion();
  const removeFlag = useRemoveFlag();

  const [index, setIndex] = useState(0);
  const [navOpen, setNavOpen] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [qStart, setQStart] = useState(() => Date.now());
  // Per-question submit results held in-memory so tutor mode can render the
  // correct option + fetch the breakdown. Keyed by questionId.
  const [results, setResults] = useState<Record<string, AnswerResult>>({});
  // Elimination-strategy: option ids the learner has crossed out, per question.
  const [eliminated, setEliminated] = useState<Record<string, string[]>>({});
  const toggleEliminated = (questionId: string, optionId: string) =>
    setEliminated((prev) => {
      const current = prev[questionId] ?? [];
      const next = current.includes(optionId)
        ? current.filter((id) => id !== optionId)
        : [...current, optionId];
      return { ...prev, [questionId]: next };
    });

  const questions = state?.questions ?? [];
  const total = questions.length;

  // ── Free-trial question gate ──────────────────────────────────────────────
  // Any user WITHOUT an active paid subscription (trial, expired trial, or none)
  // may only view/answer up to their question allowance — keying on "is trial"
  // alone missed users whose trial is exhausted (status flips to EXPIRED). Freeze
  // the allowance for this session on first load (answered-so-far + remaining
  // quota) so it doesn't jitter as the quota refetches. Anything beyond
  // `accessibleCount` is locked: not viewable, not navigable.
  const { subscription } = useTrial();
  const isPaid = subscription?.status === "ACTIVE";
  const trialLimit = subscription?.trialQuestionsTotal ?? 10;
  const trialRemaining = Math.max(0, subscription?.trialQuestionsLeft ?? trialLimit);
  const trialFreeze = useRef<{ id: string; allowance: number } | null>(null);
  if (!isPaid && state) {
    if (trialFreeze.current?.id !== state.session.id) {
      trialFreeze.current = {
        id: state.session.id,
        allowance: state.answeredQuestionIds.length + trialRemaining,
      };
    }
  }
  const accessibleCount =
    !isPaid && trialFreeze.current
      ? Math.min(total, Math.max(0, trialFreeze.current.allowance))
      : total;
  const trialWall = !isPaid && accessibleCount < total;

  const notifyTrialLimit = useCallback(() => {
    toast.error(
      `You've reached your free trial limit of ${trialLimit} questions. Upgrade to unlock the rest.`,
      { id: "trial-limit" },
    );
  }, [trialLimit]);

  // Whole-session timer (counts up).
  useEffect(() => {
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, []);

  // Start the session at the first unanswered question (clamped to the trial gate).
  useEffect(() => {
    if (state) setIndex(Math.min(state.currentIndex, Math.max(0, accessibleCount - 1)));
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
  // "Last" for navigation = last *accessible* question (so trial users finish at
  // their gate instead of advancing into locked questions).
  const isLast = index >= accessibleCount - 1;
  const isTutor = state?.session.mode === "TUTOR";

  const answeredSet = useMemo(
    () => new Set(state?.answeredQuestionIds ?? []),
    [state?.answeredQuestionIds],
  );

  // Set of this session's question ids, used to scope server flags to this run.
  const questionIdSet = useMemo(() => new Set(questions.map((q) => q.id)), [questions]);

  // Hydrate the optimistic local mirror from the server's flags whenever either
  // the server list or the session's questions change. The server is canonical.
  useEffect(() => {
    if (!myFlags || total === 0) return;
    const bookmarked: Record<string, true> = {};
    const flagged: Record<string, true> = {};
    for (const f of myFlags) {
      if (!questionIdSet.has(f.questionId)) continue;
      if (f.type === "bookmark") bookmarked[f.questionId] = true;
      else flagged[f.questionId] = true;
    }
    hydrateFlags(sessionId, { bookmarked, flagged });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myFlags, questionIdSet, sessionId, total]);

  const bookmarkBusy = addFlag.isPending || removeFlag.isPending;

  // Optimistic toggle for bookmark/flag, reconciled against the server.
  const toggleServerFlag = useCallback(
    (type: "bookmark" | "flag", on: boolean) => {
      if (!qid) return;
      const apply = type === "bookmark" ? setBookmark : setFlag;
      const label = type === "bookmark" ? "Bookmark" : "Flag";
      apply(sessionId, qid, on); // optimistic
      const mutation = on ? addFlag : removeFlag;
      mutation.mutate(
        { questionId: qid, type },
        {
          onSuccess: () => toast.success(on ? `${label} added` : `${label} removed`),
          onError: (err) => {
            apply(sessionId, qid, !on); // revert
            toast.error(
              err instanceof Error ? err.message : `Could not update ${label.toLowerCase()}`,
            );
          },
        },
      );
    },
    [qid, sessionId, setBookmark, setFlag, addFlag, removeFlag],
  );

  const go = useCallback(
    // Forward movement is capped at the last accessible question for trial users.
    (delta: number) => setIndex((i) => Math.min(accessibleCount - 1, Math.max(0, i + delta))),
    [accessibleCount],
  );
  const jump = useCallback(
    (i: number) => {
      if (i >= accessibleCount) {
        notifyTrialLimit();
        return;
      }
      setIndex(i);
      setNavOpen(false);
    },
    [accessibleCount, notifyTrialLimit],
  );

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
        if (!bookmarkBusy) toggleServerFlag("bookmark", !(qid && ui?.bookmarked[qid]));
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    question,
    qid,
    isSubmitted,
    selectOption,
    sessionId,
    handlePrimary,
    go,
    toggleServerFlag,
    bookmarkBusy,
    ui?.bookmarked,
  ]);

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
  const eliminatedIds = new Set(qid ? (eliminated[qid] ?? []) : []);
  const answeredCount = state.answeredQuestionIds.length;
  const progressPct = total === 0 ? 0 : Math.round((answeredCount / total) * 100);
  const limitSec = state.session.timeLimitMinutes ? state.session.timeLimitMinutes * 60 : null;
  const remaining = limitSec !== null ? Math.max(0, limitSec - elapsed) : null;
  const lowTime = remaining !== null && remaining <= 60;
  const correctOptionId = result?.correctOptionId;

  return (
    <div className="bg-background pb-10">
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

      <div className="mx-auto flex w-full max-w-6xl gap-0 lg:gap-6 lg:px-6 lg:py-6">
        <main className="mx-auto min-w-0 max-w-3xl flex-1 px-4 py-6 sm:px-8 lg:px-0 lg:py-0">
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
                      onClick={() => toggleServerFlag("bookmark", !(qid && ui?.bookmarked[qid]))}
                      disabled={!qid || bookmarkBusy}
                      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                        qid && ui?.bookmarked[qid]
                          ? "border-accent/40 bg-accent/10 text-accent"
                          : "border-border bg-surface text-muted-foreground hover:bg-surface-alt"
                      }`}
                      aria-pressed={!!(qid && ui?.bookmarked[qid])}
                    >
                      {addFlag.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : qid && ui?.bookmarked[qid] ? (
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
                      onClick={() => toggleServerFlag("flag", !(qid && ui?.flagged[qid]))}
                      disabled={!qid || bookmarkBusy}
                      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
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
                    const isEliminated = !isSubmitted && eliminatedIds.has(opt.id);
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
                      <div
                        key={opt.id}
                        className="relative animate-in fade-in slide-in-from-bottom-1"
                        style={{ animationDelay: `${i * 40}ms` }}
                      >
                        <button
                          type="button"
                          disabled={isSubmitted}
                          onClick={() => {
                            if (!qid) return;
                            // Selecting a crossed-out option restores it.
                            if (isEliminated) toggleEliminated(qid, opt.id);
                            selectOption(sessionId, qid, opt.id);
                          }}
                          className={`group relative flex w-full items-start gap-4 rounded-xl border p-4 text-left transition-all duration-200 disabled:cursor-default ${cls} ${!isSubmitted ? "pr-12" : ""} ${isEliminated ? "opacity-60" : ""}`}
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
                            <span
                              className={`block text-[15px] leading-relaxed ${isEliminated ? "text-muted-foreground line-through decoration-2" : ""}`}
                            >
                              {opt.text}
                            </span>
                            {opt.imageUrl && (
                              <img
                                src={opt.imageUrl}
                                alt={`Option ${opt.label}`}
                                className={`mt-2 max-h-40 rounded-lg border border-border object-contain ${isEliminated ? "opacity-50 grayscale" : ""}`}
                              />
                            )}
                          </span>
                        </button>
                        {!isSubmitted && (
                          <button
                            type="button"
                            onClick={() => qid && toggleEliminated(qid, opt.id)}
                            aria-label={
                              isEliminated
                                ? `Restore option ${opt.label}`
                                : `Cross out option ${opt.label}`
                            }
                            aria-pressed={isEliminated}
                            title={isEliminated ? "Restore option" : "Cross out (eliminate)"}
                            className={`absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md border transition-colors ${
                              isEliminated
                                ? "border-error/50 bg-error/10 text-error"
                                : "border-border bg-surface text-muted-foreground/70 hover:border-error/50 hover:bg-error/10 hover:text-error"
                            }`}
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
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

                {trialWall && isLast && (
                  <div className="mt-5 flex flex-col gap-2 rounded-xl border border-warning/30 bg-warning/5 p-4 sm:flex-row sm:items-center">
                    <Lock className="h-5 w-5 flex-shrink-0 text-warning" />
                    <p className="text-sm text-foreground">
                      <span className="font-bold">Free trial limit reached.</span> You can answer{" "}
                      {accessibleCount} of {total} questions on the free trial. Finish to see your
                      results, or{" "}
                      <Link to="/subscription" className="font-semibold text-primary underline">
                        upgrade
                      </Link>{" "}
                      to unlock the remaining {total - accessibleCount}.
                    </p>
                  </div>
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
              lockedFromIndex={accessibleCount}
              onLocked={notifyTrialLimit}
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
              lockedFromIndex={accessibleCount}
              onLocked={notifyTrialLimit}
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
  lockedFromIndex = Number.POSITIVE_INFINITY,
  onLocked,
}: {
  questions: QuizQuestion[];
  answeredSet: Set<string>;
  results: Record<string, AnswerResult>;
  isTutor: boolean;
  bookmarked: Record<string, true>;
  currentIndex: number;
  onJump: (i: number) => void;
  /** First index that is locked behind the free-trial gate (read-only). */
  lockedFromIndex?: number;
  /** Called when a locked tile is clicked, to surface the trial-limit message. */
  onLocked?: () => void;
}) {
  const answered = questions.filter((q) => answeredSet.has(q.id)).length;
  const accessible = Math.min(questions.length, lockedFromIndex);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
          Navigator
        </span>
        <span className="text-[11px] font-semibold tabular-nums text-muted-foreground">
          {answered}/{accessible}
        </span>
      </div>
      <div className="grid grid-cols-5 gap-1.5">
        {questions.map((q, i) => {
          const locked = i >= lockedFromIndex;
          if (locked) {
            return (
              <button
                key={q.id}
                type="button"
                onClick={() => onLocked?.()}
                aria-label={`Question ${i + 1} — locked (free trial limit)`}
                title="Locked — free trial limit reached"
                className="relative flex h-9 w-full cursor-not-allowed items-center justify-center rounded-lg border border-dashed border-border bg-surface-alt/40 text-muted-foreground/50"
              >
                <Lock className="h-3.5 w-3.5" />
              </button>
            );
          }
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
