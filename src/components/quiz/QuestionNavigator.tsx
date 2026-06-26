import { Star } from "lucide-react";
import type { ActiveSession, Question } from "@/types";

export interface QuestionNavigatorProps {
  session: ActiveSession;
  questions: Record<string, Question>;
  currentIndex: number;
  onJump: (index: number) => void;
  /** When true (results/review), reveal correct/incorrect regardless of mode. */
  revealAll?: boolean;
  className?: string;
}

type Status = "current" | "correct" | "incorrect" | "answered" | "unanswered";

/**
 * A grid of question numbers with status colours. Reused by the active quiz and
 * the review screen. Tutor mode (or revealAll) shows correct/incorrect after a
 * question has been submitted; otherwise answered questions are simply "answered".
 */
export function QuestionNavigator({
  session,
  questions,
  currentIndex,
  onJump,
  revealAll = false,
  className = "",
}: QuestionNavigatorProps) {
  const reveal = revealAll || session.mode === "TUTOR";

  function statusFor(id: string, i: number): Status {
    if (i === currentIndex) return "current";
    const ans = session.answers[id];
    const submitted = revealAll ? !!ans : !!session.submitted[id];
    const q = questions[id];
    if (reveal && submitted && q) {
      return ans === q.correctKey ? "correct" : "incorrect";
    }
    return ans ? "answered" : "unanswered";
  }

  const answered = session.questionIds.filter((id) =>
    revealAll ? !!session.answers[id] : !!session.submitted[id],
  ).length;
  const bookmarks = session.questionIds.filter((id) => session.bookmarked[id]).length;

  return (
    <div className={className}>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
          Navigator
        </span>
        <span className="text-[11px] font-semibold tabular-nums text-muted-foreground">
          {answered}/{session.questionIds.length}
        </span>
      </div>

      <div className="grid grid-cols-5 gap-1.5">
        {session.questionIds.map((id, i) => {
          const status = statusFor(id, i);
          const bookmarked = !!session.bookmarked[id];
          const base =
            "relative flex h-9 w-full items-center justify-center rounded-lg border text-xs font-bold tabular-nums transition-all duration-200 hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring";
          const tone: Record<Status, string> = {
            current:
              "border-primary bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-[0_0_0_2px_var(--color-ring)] ring-1 ring-primary",
            correct: "border-success/40 bg-success/15 text-success",
            incorrect: "border-error/40 bg-error/15 text-error",
            answered: "border-accent/40 bg-accent/15 text-accent",
            unanswered:
              "border-border bg-surface-alt text-muted-foreground hover:border-border-strong hover:text-foreground",
          };
          return (
            <button
              key={id}
              type="button"
              onClick={() => onJump(i)}
              aria-label={`Go to question ${i + 1}${bookmarked ? " (bookmarked)" : ""}`}
              aria-current={status === "current" ? "true" : undefined}
              className={`${base} ${tone[status]}`}
            >
              {i + 1}
              {bookmarked && (
                <Star
                  className="absolute -right-1 -top-1 h-3 w-3 fill-warning text-warning drop-shadow"
                  strokeWidth={2.5}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 space-y-1.5 border-t border-border pt-3 text-[11px] text-muted-foreground">
        <LegendRow swatch="bg-gradient-to-br from-primary to-accent" label="Current" />
        {reveal ? (
          <>
            <LegendRow swatch="bg-success/40" label="Correct" />
            <LegendRow swatch="bg-error/40" label="Incorrect" />
          </>
        ) : (
          <LegendRow swatch="bg-accent/40" label="Answered" />
        )}
        <LegendRow swatch="bg-surface-alt border border-border" label="Unanswered" />
        {bookmarks > 0 && (
          <div className="flex items-center gap-2 pt-0.5">
            <Star className="h-3 w-3 fill-warning text-warning" />
            <span>{bookmarks} bookmarked</span>
          </div>
        )}
      </div>
    </div>
  );
}

function LegendRow({ swatch, label }: { swatch: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`h-3 w-3 rounded ${swatch}`} />
      <span>{label}</span>
    </div>
  );
}
