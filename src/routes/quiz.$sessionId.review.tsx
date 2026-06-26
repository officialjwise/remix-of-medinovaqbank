import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  Lock,
  MinusCircle,
  X,
} from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { useSessionStore } from "@/stores/sessionStore";
import { ClinicalBreakdown } from "@/components/quiz/ClinicalBreakdown";
import { QuestionNavigator } from "@/components/quiz/QuestionNavigator";

export const Route = createFileRoute("/quiz/$sessionId/review")({
  beforeLoad: () => {
    if (typeof window === "undefined") return;
    if (!useAuthStore.getState().isAuthenticated) throw redirect({ to: "/login" });
  },
  head: () => ({
    meta: [
      { title: "Session Review — Medinovaqbank" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ReviewPage,
});

function ReviewPage() {
  const { sessionId } = Route.useParams();
  const session = useSessionStore((s) => s.sessions[sessionId]);
  const questions = useSessionStore((s) => s.questions);
  const ensureHistoricalSession = useSessionStore((s) => s.ensureHistoricalSession);
  const [index, setIndex] = useState(0);

  // Reconstruct a past session so its answers + explanations can be reviewed.
  useEffect(() => {
    if (!session) ensureHistoricalSession(sessionId);
  }, [session, sessionId, ensureHistoricalSession]);

  const total = session?.questionIds.length ?? 0;

  const go = useCallback(
    (delta: number) => setIndex((i) => Math.min(total - 1, Math.max(0, i + delta))),
    [total],
  );

  // Arrow-key navigation in review mode.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable)) return;
      if (e.key === "ArrowRight") {
        e.preventDefault();
        go(1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        go(-1);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  if (!session) {
    return (
      <div className="grid min-h-screen place-items-center bg-background p-6 text-center">
        <div>
          <h1 className="text-xl font-bold text-foreground">Session not found</h1>
          <Link
            to="/sessions"
            className="mt-4 inline-flex h-10 items-center justify-center rounded-lg bg-accent px-4 text-sm font-semibold text-accent-foreground"
          >
            My Sessions
          </Link>
        </div>
      </div>
    );
  }

  const qid = session.questionIds[index];
  const q = questions[qid];
  const ans = session.answers[qid];
  const correctKey = q?.correctKey;
  const isCorrect = !!q && ans === correctKey;
  const skipped = !ans;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/80">
        <div className="mx-auto flex h-14 max-w-[1400px] items-center gap-3 px-4 sm:px-6">
          <Link
            to="/quiz/$sessionId/results"
            params={{ sessionId }}
            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-surface-alt hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> <span className="hidden sm:inline">Results</span>
          </Link>
          <span className="hidden min-w-0 truncate text-sm font-semibold text-foreground sm:block">
            {session.bankName}
          </span>
          <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1 text-xs font-bold text-primary">
            <Lock className="h-3.5 w-3.5" /> Read-only review
          </span>
        </div>
      </header>

      {/* Read-only banner */}
      <div className="border-b border-border bg-surface-alt/60">
        <div className="mx-auto flex max-w-[1400px] items-center gap-2 px-4 py-2.5 text-xs text-muted-foreground sm:px-6">
          <Lock className="h-3.5 w-3.5 flex-shrink-0" />
          <span>
            You're reviewing a completed session. Answers are locked — explore each question and its
            full clinical breakdown.
          </span>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-[1400px] gap-0 lg:gap-6 lg:px-6 lg:py-6">
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-8 lg:px-0 lg:py-0">
          {q ? (
            <div className="mx-auto max-w-3xl xl:max-w-4xl">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-alt px-3 py-1 text-xs font-semibold text-foreground">
                    Question <span className="text-primary">{index + 1}</span> of {total}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full border border-border bg-surface px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                    {q.topic}
                  </span>
                </div>
                {skipped ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-warning/15 px-3 py-1 text-xs font-bold text-warning">
                    <MinusCircle className="h-3.5 w-3.5" /> Skipped
                  </span>
                ) : isCorrect ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-success/15 px-3 py-1 text-xs font-bold text-success">
                    <Check className="h-3.5 w-3.5" /> Correct
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-error/15 px-3 py-1 text-xs font-bold text-error">
                    <X className="h-3.5 w-3.5" /> Incorrect
                  </span>
                )}
              </div>

              <article className="relative mt-3 overflow-hidden rounded-2xl border border-border bg-surface p-6 shadow-[var(--shadow-card)]">
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent"
                />
                {(q as { imageUrl?: string }).imageUrl && (
                  <img
                    src={(q as { imageUrl?: string }).imageUrl}
                    alt="Clinical image for this question"
                    className="relative mx-auto mb-4 max-h-72 rounded-xl border border-border object-contain"
                  />
                )}
                <p className="relative whitespace-pre-line text-base font-medium leading-relaxed text-foreground">
                  {q.stem}
                </p>
              </article>

              {/* Chosen vs correct, at a glance */}
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-border bg-surface-alt/50 p-3">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                    Your answer
                  </p>
                  <p
                    className={`mt-1 text-sm font-semibold ${
                      skipped ? "text-warning" : isCorrect ? "text-success" : "text-error"
                    }`}
                  >
                    {ans ? `${ans}. ${q.options.find((o) => o.key === ans)?.text}` : "No answer — skipped"}
                  </p>
                </div>
                <div className="rounded-xl border border-success/30 bg-success/5 p-3">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-success">
                    Correct answer
                  </p>
                  <p className="mt-1 text-sm font-semibold text-foreground">
                    {q.correctKey}. {q.options.find((o) => o.key === q.correctKey)?.text}
                  </p>
                </div>
              </div>

              {/* Options */}
              <div className="mt-5 space-y-2.5">
                {q.options.map((opt) => {
                  const optIsCorrect = opt.key === correctKey;
                  const chosen = ans === opt.key;
                  let cls = "border-border bg-surface text-muted-foreground";
                  if (optIsCorrect) cls = "border-success bg-success/10 text-foreground";
                  else if (chosen) cls = "border-error bg-error/10 text-foreground";
                  const optImage =
                    (opt as { image?: string; imageUrl?: string }).image ??
                    (opt as { imageUrl?: string }).imageUrl;
                  return (
                    <div
                      key={opt.key}
                      className={`flex items-start gap-3 rounded-xl border-2 p-4 text-left ${cls}`}
                    >
                      <span
                        className={`mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                          optIsCorrect
                            ? "bg-success text-white"
                            : chosen
                              ? "bg-error text-white"
                              : "border border-border bg-surface text-foreground"
                        }`}
                      >
                        {optIsCorrect ? (
                          <Check className="h-3.5 w-3.5" />
                        ) : chosen ? (
                          <X className="h-3.5 w-3.5" />
                        ) : (
                          opt.key
                        )}
                      </span>
                      <span className="flex-1">
                        <span className="block text-sm">{opt.text}</span>
                        {optImage && (
                          <img
                            src={optImage}
                            alt={`Option ${opt.key}`}
                            className="mt-2 max-h-40 rounded-lg border border-border object-contain"
                          />
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Full clinical breakdown (reused) */}
              <ClinicalBreakdown question={q} selected={ans} variant="review" />

              <div className="mt-8 flex items-center justify-between border-t border-border pt-5">
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => go(-1)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3.5 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-surface-alt disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ChevronLeft className="h-4 w-4" /> Previous
                </button>
                {index === total - 1 ? (
                  <Link
                    to="/quiz/$sessionId/results"
                    params={{ sessionId }}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-primary to-accent px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
                  >
                    Back to Results <Check className="h-4 w-4" />
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => go(1)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3.5 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-surface-alt"
                  >
                    Next <ChevronRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ) : null}
        </main>

        {/* Desktop navigator */}
        <aside className="sticky top-[7rem] hidden h-fit w-72 flex-shrink-0 lg:block">
          <div className="rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-card)]">
            <QuestionNavigator
              session={session}
              questions={questions}
              currentIndex={index}
              onJump={setIndex}
              revealAll
            />
          </div>
        </aside>
      </div>
    </div>
  );
}
