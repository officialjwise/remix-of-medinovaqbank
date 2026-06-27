import {
  BookOpen,
  CheckCircle2,
  Lightbulb,
  Sparkles,
  Stethoscope,
  Tag,
  XCircle,
} from "lucide-react";
import type { Question } from "@/types";

type OptionKey = "A" | "B" | "C" | "D" | "E";

export interface ClinicalBreakdownProps {
  question: Question;
  selected?: OptionKey;
  /** Visual-only: review screen renders without the celebratory header. */
  variant?: "active" | "review";
}

/**
 * Rich, structured clinical explanation panel shown in tutor mode after submit
 * and on the review screen. Sections: correct rationale, why each distractor is
 * wrong (with the scenario that would flip it), key learning pearl, related
 * topics. All colours come from semantic tokens so it is dark-mode safe.
 */
export function ClinicalBreakdown({
  question,
  selected,
  variant = "active",
}: ClinicalBreakdownProps) {
  const correctOpt = question.options.find((o) => o.key === question.correctKey);
  const isCorrect = selected === question.correctKey;
  const distractors = question.options.filter((o) => o.key !== question.correctKey);

  return (
    <section className="mt-6 overflow-hidden rounded-2xl border border-border bg-surface shadow-[var(--shadow-card)] animate-in fade-in slide-in-from-bottom-3 duration-500">
      {/* Header */}
      <header
        className={`relative flex items-center gap-3 overflow-hidden px-5 py-4 sm:px-6 ${
          isCorrect ? "bg-success/10" : selected ? "bg-error/10" : "bg-primary/10"
        }`}
      >
        <div
          aria-hidden
          className={`pointer-events-none absolute inset-0 opacity-25 ${
            isCorrect
              ? "bg-gradient-to-r from-success/60 to-transparent"
              : selected
                ? "bg-gradient-to-r from-error/60 to-transparent"
                : "bg-gradient-to-r from-primary/60 to-transparent"
          }`}
        />
        <div
          className={`relative z-10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-white shadow-lg ${
            isCorrect ? "bg-success animate-streak-pop" : selected ? "bg-error" : "bg-primary"
          }`}
        >
          {isCorrect ? (
            <Sparkles className="h-5 w-5" />
          ) : selected ? (
            <XCircle className="h-5 w-5" />
          ) : (
            <Stethoscope className="h-5 w-5" />
          )}
        </div>
        <div className="relative z-10">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
            Clinical Breakdown
          </p>
          <p
            className={`text-lg font-bold tracking-tight ${
              isCorrect ? "text-success" : selected ? "text-error" : "text-primary"
            }`}
          >
            {variant === "review"
              ? isCorrect
                ? "Answered correctly"
                : selected
                  ? "Answered incorrectly"
                  : "Skipped"
              : isCorrect
                ? "Correct!"
                : "Not quite"}
          </p>
        </div>
        {variant === "active" && (
          <span className="ml-auto relative z-10 hidden items-center gap-1.5 rounded-full border border-border bg-surface/70 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-foreground backdrop-blur sm:inline-flex">
            <Stethoscope className="h-3 w-3" /> Tutor insight
          </span>
        )}
      </header>

      <div className="space-y-5 p-5 sm:p-6">
        {/* Why the answer is correct */}
        <div className="rounded-xl border-l-4 border-success bg-success/5 p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-success" />
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-wide text-success">
                Why the answer is correct
              </p>
              <p className="mt-1 text-sm font-semibold text-foreground">
                {question.correctKey}. {correctOpt?.text}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-foreground">{question.whyCorrect}</p>
            </div>
          </div>
        </div>

        {/* If the learner picked a wrong option, surface it first */}
        {selected && !isCorrect && (
          <div className="rounded-xl border border-error/30 bg-error/5 p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <XCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-error" />
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-wide text-error">
                  Your choice · {selected} was incorrect
                </p>
                <p className="mt-2 text-sm leading-relaxed text-foreground">
                  {question.whyWrong[selected] ??
                    "This option doesn't fit the clinical picture in this vignette."}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Why each other option is wrong */}
        <div>
          <div className="rounded-r-xl border-l-4 border-primary bg-surface-alt px-4 py-3">
            <h4 className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-primary">
              <BookOpen className="h-3.5 w-3.5" /> Why each other option is wrong
            </h4>
            <p className="mt-0.5 text-xs text-foreground/80">
              The highest-yield insight — and the exact scenario that flips each distractor into the
              right answer.
            </p>
          </div>
          <ul className="mt-3 space-y-3">
            {distractors.map((o) => {
              const chosenWrong = selected === o.key;
              const wrongReason =
                question.whyWrong[o.key] ?? "Not the best answer in this scenario.";
              const wouldBeCorrect = wouldBeScenario(o, question);
              return (
                <li
                  key={o.key}
                  className={`rounded-xl border border-l-4 p-4 transition-colors ${
                    chosenWrong
                      ? "border-error/40 border-l-error bg-error/5"
                      : "border-border border-l-border-strong bg-surface-alt/50"
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-error/10 text-xs font-bold text-error">
                      <XCircle className="h-4 w-4" />
                    </span>
                    <p className="pt-0.5 text-sm font-semibold text-foreground">
                      <span className="text-muted-foreground">{o.key}.</span> {o.text}
                    </p>
                  </div>
                  <div className="mt-2.5 space-y-1.5 pl-[2.375rem]">
                    <p className="text-sm leading-relaxed text-foreground">
                      <span className="font-bold text-error">Why it's wrong — </span>
                      {wrongReason}
                    </p>
                    <p className="text-sm leading-relaxed text-foreground/80">
                      <span className="font-bold text-primary">When it would be correct — </span>
                      {wouldBeCorrect}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Key learning point */}
        <div className="rounded-xl bg-gradient-to-br from-primary/10 to-accent/15 p-4 sm:p-5">
          <p className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-primary">
            <Lightbulb className="h-3.5 w-3.5" /> Key learning point
          </p>
          <p className="mt-1.5 text-sm font-semibold leading-relaxed text-foreground">
            {question.keyPoint}
          </p>
        </div>

        {/* Related topics */}
        {question.related.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
              <Tag className="h-3.5 w-3.5" /> Related topics
            </span>
            {question.related.map((r) => (
              <span
                key={r}
                className="rounded-full border border-border bg-surface-alt px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:border-primary/40 hover:text-primary"
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

/** Derive a plausible "scenario where this distractor would be correct" string. */
function wouldBeScenario(opt: { key: string; text: string }, question: Question): string {
  const rationale = question.whyWrong[opt.key as OptionKey] ?? "";
  if (/would|when|if|in which|patients with/i.test(rationale)) {
    const tail = rationale
      .split(/—|\.|;/)
      .filter(Boolean)
      .slice(-1)[0]
      ?.trim();
    if (tail && tail.length > 20) return tail.replace(/^(?:would|when)\s*/i, "the patient ");
  }
  return `the clinical picture pointed instead to ${opt.text.toLowerCase()} as the underlying mechanism or required next step.`;
}
