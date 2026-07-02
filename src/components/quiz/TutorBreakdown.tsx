import {
  BookOpen,
  CheckCircle2,
  Lightbulb,
  Loader2,
  Sparkles,
  Stethoscope,
  Tag,
  XCircle,
} from "lucide-react";
import { useExplanation } from "@/api/explanations.api";
import type { QuizOption } from "@/api/quiz.api";

export interface TutorBreakdownProps {
  /** Answer id returned by the submit endpoint — used to fetch the breakdown. */
  answerId: string;
  isCorrect: boolean | null;
  selectedOptionId: string | null;
  /** The question's options (for labels) — already revealed in this view. */
  options: QuizOption[];
  /** Tutor mode reveals this on submit. */
  correctOptionId?: string;
  /** Review screen renders without the celebratory header. */
  variant?: "active" | "review";
}

/**
 * Renders the server-generated clinical breakdown for a submitted answer.
 *
 * Pulls the structured ClinicalBreakdown ({whyCorrect, whyStudentWasWrong,
 * whyOthersAreWrong, whenWouldBeCorrect, keyLearningPoint, relatedConcepts})
 * from GET /explanations/:answerId. Because generation is asynchronous, this
 * shows a graceful "preparing" state and the hook polls until it's ready.
 *
 * Critically, this renders the "when each wrong option WOULD be correct"
 * clinical scenarios alongside why each distractor is wrong.
 */
export function TutorBreakdown({
  answerId,
  isCorrect,
  selectedOptionId,
  options,
  correctOptionId,
  variant = "active",
}: TutorBreakdownProps) {
  const { data: breakdown, isLoading } = useExplanation(answerId);

  const correctOpt = options.find((o) => o.id === correctOptionId);
  const selectedLabel = options.find((o) => o.id === selectedOptionId)?.label ?? null;
  const answeredWrong = selectedOptionId !== null && isCorrect === false;

  // The AI's `label` for a distractor may be a bare letter ("B"), a prefixed
  // label ("B) …" / "B: …"), OR the option TEXT itself ("Swyer syndrome").
  // Resolve it to the REAL option so the badge shows the correct A–E letter —
  // not the first letter of the option text (which produced "M"/"S" badges).
  const resolveOption = (aiLabel: string): QuizOption | null => {
    const raw = (aiLabel ?? "").trim();
    if (!raw) return null;
    const prefix =
      /^\(?\s*([A-Ea-e])\s*[).:\-–]/.exec(raw) ?? /^\s*([A-Ea-e])\s*$/.exec(raw);
    if (prefix) {
      const byLetter = options.find(
        (o) => o.label.toUpperCase() === prefix[1].toUpperCase(),
      );
      if (byLetter) return byLetter;
    }
    const norm = raw.toLowerCase().replace(/\s+/g, " ");
    const exact = options.find(
      (o) => o.text.trim().toLowerCase().replace(/\s+/g, " ") === norm,
    );
    if (exact) return exact;
    return (
      options.find((o) => {
        const t = o.text.trim().toLowerCase().replace(/\s+/g, " ");
        return t.length > 3 && (t.includes(norm) || norm.includes(t));
      }) ?? null
    );
  };

  // "When it would be correct" scenario keyed by the resolved option id.
  const scenarioByOptId = new Map<string, string>();
  for (const w of breakdown?.whenWouldBeCorrect ?? []) {
    const opt = resolveOption(w.label);
    if (opt) scenarioByOptId.set(opt.id, w.scenario);
  }

  return (
    <section className="mt-6 overflow-hidden rounded-2xl border border-border bg-surface shadow-[var(--shadow-card)] animate-in fade-in slide-in-from-bottom-3 duration-500">
      <header
        className={`relative flex items-center gap-3 overflow-hidden px-5 py-4 sm:px-6 ${
          isCorrect ? "bg-success/10" : selectedOptionId ? "bg-error/10" : "bg-primary/10"
        }`}
      >
        <div
          aria-hidden
          className={`pointer-events-none absolute inset-0 opacity-25 ${
            isCorrect
              ? "bg-gradient-to-r from-success/60 to-transparent"
              : selectedOptionId
                ? "bg-gradient-to-r from-error/60 to-transparent"
                : "bg-gradient-to-r from-primary/60 to-transparent"
          }`}
        />
        <div
          className={`relative z-10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-white shadow-lg ${
            isCorrect ? "bg-success" : selectedOptionId ? "bg-error" : "bg-primary"
          }`}
        >
          {isCorrect ? (
            <Sparkles className="h-5 w-5" />
          ) : selectedOptionId ? (
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
              isCorrect ? "text-success" : selectedOptionId ? "text-error" : "text-primary"
            }`}
          >
            {variant === "review"
              ? isCorrect
                ? "Answered correctly"
                : selectedOptionId
                  ? "Answered incorrectly"
                  : "Skipped"
              : isCorrect
                ? "Correct!"
                : selectedOptionId
                  ? "Not quite"
                  : "Skipped"}
          </p>
        </div>
        {variant === "active" && (
          <span className="ml-auto relative z-10 hidden items-center gap-1.5 rounded-full border border-border bg-surface/70 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-foreground backdrop-blur sm:inline-flex">
            <Stethoscope className="h-3 w-3" /> Tutor insight
          </span>
        )}
      </header>

      {!breakdown ? (
        <div className="flex items-center gap-3 p-6 text-sm text-muted-foreground">
          {isLoading || breakdown === null ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Preparing your clinical breakdown…
            </>
          ) : (
            "The breakdown for this question isn't available yet."
          )}
        </div>
      ) : (
        <div className="space-y-5 p-5 sm:p-6">
          {/* Why the answer is correct */}
          <div className="rounded-xl border-l-4 border-success bg-success/5 p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-success" />
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-wide text-success">
                  Why the answer is correct
                </p>
                {correctOpt && (
                  <p className="mt-1 text-sm font-semibold text-foreground">
                    {correctOpt.label}. {correctOpt.text}
                  </p>
                )}
                <p className="mt-2 text-sm leading-relaxed text-foreground">
                  {breakdown.whyCorrect}
                </p>
              </div>
            </div>
          </div>

          {/* The learner's wrong choice, surfaced first */}
          {answeredWrong && breakdown.whyStudentWasWrong && (
            <div className="rounded-xl border border-error/30 bg-error/5 p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <XCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-error" />
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-error">
                    Your choice{selectedLabel ? ` · ${selectedLabel}` : ""} was incorrect
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-foreground">
                    {breakdown.whyStudentWasWrong}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Why each other option is wrong + when it WOULD be correct */}
          {breakdown.whyOthersAreWrong.length > 0 && (
            <div>
              <div className="rounded-r-xl border-l-4 border-primary bg-surface-alt px-4 py-3">
                <h4 className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-primary">
                  <BookOpen className="h-3.5 w-3.5" /> Why each other option is wrong
                </h4>
                <p className="mt-0.5 text-xs text-foreground/80">
                  And the exact clinical scenario that would flip each distractor into the right
                  answer.
                </p>
              </div>
              <ul className="mt-3 space-y-3">
                {breakdown.whyOthersAreWrong.map((o, i) => {
                  const opt = resolveOption(o.label);
                  const badge = opt?.label ?? "•";
                  const chosenWrong = opt != null && opt.id === selectedOptionId;
                  const scenario = opt ? scenarioByOptId.get(opt.id) : undefined;
                  return (
                    <li
                      key={opt?.id ?? `${o.label}-${i}`}
                      className={`rounded-xl border border-l-4 p-4 transition-colors ${
                        chosenWrong
                          ? "border-error/40 border-l-error bg-error/5"
                          : "border-border border-l-border-strong bg-surface-alt/50"
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-error/10 text-xs font-bold text-error">
                          {badge}
                        </span>
                        <div className="min-w-0 flex-1 space-y-1.5 pt-0.5">
                          {opt && (
                            <p className="text-sm font-semibold text-foreground">{opt.text}</p>
                          )}
                          <p className="text-sm leading-relaxed text-foreground">
                            <span className="font-bold text-error">Why it's wrong — </span>
                            {o.reason}
                          </p>
                          {scenario && (
                            <p className="text-sm leading-relaxed text-foreground/80">
                              <span className="font-bold text-primary">
                                When it would be correct —{" "}
                              </span>
                              {scenario}
                            </p>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* Key learning point */}
          <div className="rounded-xl bg-gradient-to-br from-primary/10 to-accent/15 p-4 sm:p-5">
            <p className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-primary">
              <Lightbulb className="h-3.5 w-3.5" /> Key learning point
            </p>
            <p className="mt-1.5 text-sm font-semibold leading-relaxed text-foreground">
              {breakdown.keyLearningPoint}
            </p>
          </div>

          {/* Related concepts */}
          {breakdown.relatedConcepts.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                <Tag className="h-3.5 w-3.5" /> Related topics
              </span>
              {breakdown.relatedConcepts.map((r) => (
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
      )}
    </section>
  );
}
