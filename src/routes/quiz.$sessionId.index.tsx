import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
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
  SkipForward,
  Timer,
  X,
  Zap,
} from "lucide-react";
import { useSessionStore } from "@/stores/sessionStore";
import { ClinicalBreakdown } from "@/components/quiz/ClinicalBreakdown";
import { QuestionNavigator } from "@/components/quiz/QuestionNavigator";
import { ProtectedSurface } from "@/components/shared/ProtectedSurface";
import type { Question } from "@/types";

export const Route = createFileRoute("/quiz/$sessionId/")({
  component: QuizPage,
});

const OPTION_KEYS = ["A", "B", "C", "D", "E"] as const;
type OptionKey = (typeof OPTION_KEYS)[number];

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
  const [navOpen, setNavOpen] = useState(false); // mobile sheet
  const [elapsed, setElapsed] = useState(0);
  const [flagged, setFlagged] = useState<Record<string, boolean>>({});
  const [feedback, setFeedback] = useState<"correct" | "incorrect" | null>(null);

  // Timer tick (counts up; converted to remaining if the session has a duration)
  useEffect(() => {
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const total = session?.questionIds.length ?? 0;

  const go = useCallback(
    (delta: number) => {
      setFeedback(null);
      setIndex((i) => Math.min(total - 1, Math.max(0, i + delta)));
    },
    [total],
  );

  const jump = useCallback((i: number) => {
    setFeedback(null);
    setIndex(i);
    setNavOpen(false);
  }, []);

  const qid = session?.questionIds[index];
  const question: Question | undefined = qid ? questionMap[qid] : undefined;
  const selected = qid ? session?.answers[qid] : undefined;
  const isSubmitted = qid ? !!session?.submitted[qid] : false;
  const isLast = index === total - 1;

  const finish = useCallback(() => {
    finishSession(sessionId);
    navigate({ to: "/quiz/$sessionId/results", params: { sessionId } });
  }, [finishSession, navigate, sessionId]);

  const handleSubmit = useCallback(() => {
    if (!qid || !question || !selected || isSubmitted) return;
    submitAnswer(sessionId, qid);
    setFeedback(selected === question.correctKey ? "correct" : "incorrect");
  }, [qid, question, selected, isSubmitted, submitAnswer, sessionId]);

  const handleNextOrSubmit = useCallback(() => {
    if (!session) return;
    if (session.mode === "QUIZ") {
      if (selected && !isSubmitted && qid) submitAnswer(sessionId, qid);
      if (isLast) return finish();
      go(1);
    } else {
      if (!isSubmitted) return handleSubmit();
      if (isLast) return finish();
      go(1);
    }
  }, [session, selected, isSubmitted, qid, submitAnswer, sessionId, isLast, finish, go, handleSubmit]);

  // Keyboard navigation — number/letter keys select, Enter submits, arrows move.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable)) return;
      if (!session || !qid || !question) return;

      // Number 1-5 or letter A-E selects the matching option (if it exists).
      let key: OptionKey | null = null;
      if (/^[1-5]$/.test(e.key)) key = OPTION_KEYS[Number(e.key) - 1] ?? null;
      else if (/^[a-eA-E]$/.test(e.key)) key = e.key.toUpperCase() as OptionKey;
      if (key && question.options.some((o) => o.key === key)) {
        if (!isSubmitted) {
          e.preventDefault();
          selectAnswer(sessionId, qid, key);
        }
        return;
      }

      if (e.key === "Enter") {
        e.preventDefault();
        handleNextOrSubmit();
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
  }, [
    session, qid, question, isSubmitted, selectAnswer, sessionId, handleNextOrSubmit, go, toggleBookmark,
  ]);

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

  const showExplanation = session.mode === "TUTOR" && isSubmitted;
  const answeredCount = session.questionIds.filter((id) => session.submitted[id]).length;
  const progressPct = total === 0 ? 0 : Math.round((answeredCount / total) * 100);
  const remaining = session.durationSec ? Math.max(0, session.durationSec - elapsed) : null;
  const isTutor = session.mode === "TUTOR";
  const lowTime = remaining !== null && remaining <= 60;

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-border bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/80">
        <div className="mx-auto flex h-14 max-w-[1400px] items-center gap-3 px-4 sm:px-6">
          <Link
            to="/banks"
            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-surface-alt hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> <span className="hidden sm:inline">Exit</span>
          </Link>
          <div className="hidden min-w-0 flex-1 items-center justify-center sm:flex">
            <span className="truncate text-sm font-semibold text-foreground">{session.bankName}</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${
                isTutor ? "bg-primary/15 text-primary" : "bg-accent/15 text-accent"
              }`}
            >
              {isTutor ? <GraduationCap className="h-3.5 w-3.5" /> : <Zap className="h-3.5 w-3.5" />}
              {session.mode}
            </span>
            {remaining !== null && (
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-mono text-xs font-semibold tabular-nums transition-colors ${
                  lowTime ? "bg-error/15 text-error animate-pulse" : "bg-surface-alt text-foreground"
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
              className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-primary to-accent px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
            >
              <Check className="h-3.5 w-3.5" /> Finish
            </button>
          </div>
        </div>
        {/* Progress bar */}
        <div className="h-1 w-full bg-surface-alt">
          <div
            className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[1400px] gap-0 lg:gap-6 lg:px-6 lg:py-6">
        {/* Main content */}
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-8 lg:px-0 lg:py-0">
          <ProtectedSurface context="quiz_session" contextId={sessionId} page={index + 1} className="mx-auto max-w-3xl xl:max-w-4xl">
            {question ? (
              <>
                {/* Counter + actions */}
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
                        qid && session.bookmarked[qid]
                          ? "border-accent/40 bg-accent/10 text-accent"
                          : "border-border bg-surface text-muted-foreground hover:bg-surface-alt"
                      }`}
                      aria-pressed={!!(qid && session.bookmarked[qid])}
                    >
                      {qid && session.bookmarked[qid] ? (
                        <BookmarkCheck className="h-4 w-4" />
                      ) : (
                        <Bookmark className="h-4 w-4" />
                      )}
                      <span className="hidden sm:inline">
                        {qid && session.bookmarked[qid] ? "Bookmarked" : "Bookmark"}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => qid && setFlagged((f) => ({ ...f, [qid]: !f[qid] }))}
                      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                        qid && flagged[qid]
                          ? "border-warning/40 bg-warning/10 text-warning"
                          : "border-border bg-surface text-muted-foreground hover:bg-surface-alt"
                      }`}
                      aria-pressed={!!(qid && flagged[qid])}
                    >
                      <Flag className="h-4 w-4" />
                      <span className="hidden sm:inline">{qid && flagged[qid] ? "Flagged" : "Flag"}</span>
                    </button>
                  </div>
                </div>

                {/* Question card */}
                <article
                  className={`relative mt-3 overflow-hidden rounded-2xl border bg-surface p-6 shadow-[var(--shadow-card)] transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 ${
                    feedback === "correct"
                      ? "border-success/50 ring-1 ring-success/30"
                      : feedback === "incorrect"
                        ? "border-error/50 ring-1 ring-error/30"
                        : "border-border"
                  }`}
                >
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent"
                  />
                  {/* Optional question image (guarded — may not exist yet) */}
                  {(question as { imageUrl?: string }).imageUrl && (
                    <img
                      src={(question as { imageUrl?: string }).imageUrl}
                      alt="Clinical image for this question"
                      className="relative mx-auto mb-4 max-h-72 rounded-xl border border-border object-contain"
                    />
                  )}
                  <p className="relative whitespace-pre-line text-base font-medium leading-relaxed text-foreground">
                    {question.stem}
                  </p>
                </article>

                {/* Options */}
                <div className="mt-5 space-y-3">
                  {question.options.map((opt, i) => {
                    const chosen = selected === opt.key;
                    const correctKey = question.correctKey;
                    const optImage =
                      (opt as { image?: string; imageUrl?: string }).image ??
                      (opt as { imageUrl?: string }).imageUrl;

                    let cls =
                      "border-border bg-surface text-foreground hover:border-primary/50 hover:bg-primary/5";
                    let badge = "border-border bg-surface-alt text-foreground";

                    if (showExplanation) {
                      if (opt.key === correctKey) {
                        cls = "border-success bg-success/10 text-foreground shadow-[0_0_0_1px_var(--color-success)]";
                        badge = "border-success bg-success text-white";
                      } else if (chosen) {
                        cls = "border-error bg-error/10 text-foreground";
                        badge = "border-error bg-error text-white";
                      } else {
                        cls = "border-border bg-surface-alt/40 text-muted-foreground opacity-70";
                      }
                    } else if (chosen) {
                      cls = "border-primary bg-primary/10 text-foreground shadow-[0_0_0_1px_var(--color-primary)]";
                      badge = "border-primary bg-primary text-primary-foreground";
                    } else if (isSubmitted && !isTutor) {
                      cls = "border-border bg-surface-alt/40 text-muted-foreground opacity-70";
                    }

                    return (
                      <button
                        key={opt.key}
                        type="button"
                        disabled={isSubmitted}
                        onClick={() => qid && selectAnswer(sessionId, qid, opt.key)}
                        className={`group relative flex w-full items-start gap-4 rounded-xl border p-4 text-left transition-all duration-200 animate-in fade-in slide-in-from-bottom-1 disabled:cursor-default ${cls}`}
                        style={{ animationDelay: `${i * 40}ms` }}
                      >
                        <span
                          className={`mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg border text-xs font-bold transition-all duration-200 ${badge}`}
                        >
                          {showExplanation && opt.key === correctKey ? (
                            <Check className="h-4 w-4" />
                          ) : showExplanation && chosen ? (
                            <X className="h-4 w-4" />
                          ) : (
                            opt.key
                          )}
                        </span>
                        <span className="flex-1 pt-0.5">
                          <span className="block text-[15px] leading-relaxed">{opt.text}</span>
                          {optImage && (
                            <img
                              src={optImage}
                              alt={`Option ${opt.key}`}
                              className="mt-2 max-h-40 rounded-lg border border-border object-contain"
                            />
                          )}
                        </span>
                        {!isSubmitted && (
                          <span className="mt-1 hidden flex-shrink-0 rounded border border-border px-1.5 text-[10px] font-bold text-muted-foreground/70 sm:block">
                            {opt.key}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Submit / Skip */}
                {!isSubmitted && (
                  <div className="mt-5 flex flex-wrap items-center gap-3">
                    {isTutor ? (
                      <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={!selected}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-primary to-accent px-6 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Check className="h-4 w-4" /> Submit Answer
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleNextOrSubmit}
                        disabled={!selected}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-primary to-accent px-6 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isLast ? "Finish Session" : "Next"} <ChevronRight className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => (isLast ? finish() : go(1))}
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <SkipForward className="h-4 w-4" />
                      {isLast ? "Skip & finish" : "Skip question"}
                    </button>
                    <span className="ml-auto hidden items-center gap-1.5 text-[11px] text-muted-foreground/70 md:inline-flex">
                      <Keyboard className="h-3.5 w-3.5" /> 1-5 select · Enter submit · ← → move
                    </span>
                  </div>
                )}

                {/* Tutor reveal: rich clinical breakdown */}
                {showExplanation && (
                  <>
                    <ClinicalBreakdown question={question} selected={selected} />
                    <div className="mt-5 flex justify-end">
                      <button
                        type="button"
                        onClick={() => (isLast ? finish() : go(1))}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-primary to-accent px-6 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
                      >
                        {isLast ? "Finish Session" : "Next Question"} <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </>
                )}

                {/* Bottom navigation */}
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

        {/* Desktop navigator */}
        <aside className="sticky top-[4.5rem] hidden h-fit w-72 flex-shrink-0 lg:block">
          <div className="rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-card)]">
            <QuestionNavigator
              session={session}
              questions={questionMap}
              currentIndex={index}
              onJump={jump}
            />
            {remaining !== null ? (
              <div className="mt-4 flex items-center justify-between rounded-xl border border-border bg-surface-alt px-3 py-2.5 text-sm">
                <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                  <Timer className="h-4 w-4" /> Remaining
                </span>
                <span className={`font-mono font-semibold tabular-nums ${lowTime ? "text-error" : "text-foreground"}`}>
                  {formatTime(remaining)}
                </span>
              </div>
            ) : (
              <div className="mt-4 flex items-center justify-between rounded-xl border border-border bg-surface-alt px-3 py-2.5 text-sm">
                <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                  <Clock className="h-4 w-4" /> Elapsed
                </span>
                <span className="font-mono font-semibold tabular-nums text-foreground">
                  {formatTime(elapsed)}
                </span>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Mobile navigator sheet */}
      {navOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50 animate-in fade-in"
            onClick={() => setNavOpen(false)}
            aria-hidden
          />
          <div className="absolute inset-x-0 bottom-0 rounded-t-2xl border-t border-border bg-surface p-5 shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-border-strong" />
            <QuestionNavigator
              session={session}
              questions={questionMap}
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

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const ss = s % 60;
  return `${String(m).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
}
