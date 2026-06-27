import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Lock,
  MinusCircle,
  X,
} from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { useSessionReview, type ReviewItem } from "@/api/quiz.api";
import { TutorBreakdown } from "@/components/quiz/TutorBreakdown";

export const Route = createFileRoute("/quiz/$sessionId/review")({
  beforeLoad: () => {
    if (typeof window === "undefined") return;
    if (!useAuthStore.getState().isAuthenticated) throw redirect({ to: "/login" });
  },
  head: () => ({
    meta: [{ title: "Session Review — Medinovaqbank" }, { name: "robots", content: "noindex" }],
  }),
  component: ReviewPage,
});

function ReviewPage() {
  const { sessionId } = Route.useParams();
  const { data: review, isLoading, isError } = useSessionReview(sessionId);
  const [index, setIndex] = useState(0);

  const items = review?.items ?? [];
  const total = items.length;

  const go = useCallback(
    (delta: number) => setIndex((i) => Math.min(total - 1, Math.max(0, i + delta))),
    [total],
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable))
        return;
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

  if (isLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading review…
        </div>
      </div>
    );
  }

  if (isError || !review) {
    return (
      <div className="grid min-h-screen place-items-center bg-background p-6 text-center">
        <div>
          <h1 className="text-xl font-bold text-foreground">Review unavailable</h1>
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

  const item: ReviewItem | undefined = items[index];

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
            {review.session.totalQuestions} question session
          </span>
          <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1 text-xs font-bold text-primary">
            <Lock className="h-3.5 w-3.5" /> Read-only review
          </span>
        </div>
      </header>

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
          {item ? <ReviewBody item={item} index={index} total={total} /> : null}

          {item && (
            <div className="mx-auto mt-8 flex max-w-3xl items-center justify-between border-t border-border pt-5 xl:max-w-4xl">
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
          )}
        </main>

        <aside className="sticky top-[7rem] hidden h-fit w-72 flex-shrink-0 lg:block">
          <div className="rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-card)]">
            <ReviewNavigator items={items} currentIndex={index} onJump={setIndex} />
          </div>
        </aside>
      </div>
    </div>
  );
}

function ReviewBody({ item, index, total }: { item: ReviewItem; index: number; total: number }) {
  const q = item.question;
  const ans = item.answer;
  const selectedId = ans?.selectedOptionId ?? null;
  const isCorrect = ans?.isCorrect === true;
  const skipped = !ans || ans.selectedOptionId === null;
  const correctOpt = q.options.find((o) => o.isCorrect === true);
  const selectedOpt = q.options.find((o) => o.id === selectedId);
  const correctOptionId = correctOpt?.id;

  return (
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
        {q.imageUrl && (
          <img
            src={q.imageUrl}
            alt="Clinical image for this question"
            className="relative mx-auto mb-4 max-h-72 rounded-xl border border-border object-contain"
          />
        )}
        <p className="relative whitespace-pre-line text-base font-medium leading-relaxed text-foreground">
          {q.stem}
        </p>
      </article>

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
            {selectedOpt ? `${selectedOpt.label}. ${selectedOpt.text}` : "No answer — skipped"}
          </p>
        </div>
        <div className="rounded-xl border border-success/30 bg-success/5 p-3">
          <p className="text-[11px] font-bold uppercase tracking-wide text-success">
            Correct answer
          </p>
          <p className="mt-1 text-sm font-semibold text-foreground">
            {correctOpt ? `${correctOpt.label}. ${correctOpt.text}` : "—"}
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-2.5">
        {q.options.map((opt) => {
          const optIsCorrect = opt.isCorrect === true;
          const chosen = selectedId === opt.id;
          let cls = "border-border bg-surface text-muted-foreground";
          if (optIsCorrect) cls = "border-success bg-success/10 text-foreground";
          else if (chosen) cls = "border-error bg-error/10 text-foreground";
          return (
            <div
              key={opt.id}
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
                  opt.label
                )}
              </span>
              <span className="flex-1">
                <span className="block text-sm">{opt.text}</span>
                {opt.imageUrl && (
                  <img
                    src={opt.imageUrl}
                    alt={`Option ${opt.label}`}
                    className="mt-2 max-h-40 rounded-lg border border-border object-contain"
                  />
                )}
              </span>
            </div>
          );
        })}
      </div>

      {/* Full clinical breakdown — fetched from /explanations/:answerId */}
      {ans ? (
        <TutorBreakdown
          answerId={ans.answerId}
          isCorrect={ans.isCorrect}
          selectedOptionId={ans.selectedOptionId}
          options={q.options}
          correctOptionId={correctOptionId}
          variant="review"
        />
      ) : (
        <div className="mt-6 rounded-2xl border border-border bg-surface-alt/40 p-5 text-sm text-muted-foreground">
          This question was skipped — no breakdown was generated.
        </div>
      )}
    </div>
  );
}

function ReviewNavigator({
  items,
  currentIndex,
  onJump,
}: {
  items: ReviewItem[];
  currentIndex: number;
  onJump: (i: number) => void;
}) {
  const correct = items.filter((it) => it.answer?.isCorrect === true).length;
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
          Navigator
        </span>
        <span className="text-[11px] font-semibold tabular-nums text-muted-foreground">
          {correct}/{items.length} correct
        </span>
      </div>
      <div className="grid grid-cols-5 gap-1.5">
        {items.map((it, i) => {
          const isCurrent = i === currentIndex;
          const skipped = !it.answer || it.answer.selectedOptionId === null;
          let tone = "border-warning/40 bg-warning/15 text-warning";
          if (isCurrent) {
            tone =
              "border-primary bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-[0_0_0_2px_var(--color-ring)] ring-1 ring-primary";
          } else if (!skipped) {
            tone =
              it.answer?.isCorrect === true
                ? "border-success/40 bg-success/15 text-success"
                : "border-error/40 bg-error/15 text-error";
          }
          return (
            <button
              key={it.question.id}
              type="button"
              onClick={() => onJump(i)}
              aria-current={isCurrent ? "true" : undefined}
              className={`flex h-9 w-full items-center justify-center rounded-lg border text-xs font-bold tabular-nums transition-all duration-200 hover:scale-105 ${tone}`}
            >
              {i + 1}
            </button>
          );
        })}
      </div>
    </div>
  );
}
