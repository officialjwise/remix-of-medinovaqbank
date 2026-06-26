import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, BookOpen, Check, X } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { useSessionStore } from "@/stores/sessionStore";

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
  const [index, setIndex] = useState(0);

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
  const total = session.questionIds.length;
  const ans = session.answers[qid];
  const correctKey = q?.correctKey;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-surface">
        <div className="mx-auto flex h-14 max-w-[1400px] items-center gap-3 px-4 sm:px-6">
          <Link
            to="/quiz/$sessionId/results"
            params={{ sessionId }}
            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-muted-foreground hover:bg-surface-alt hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Results
          </Link>
          <span className="hidden truncate text-sm font-semibold text-foreground sm:block">
            {session.bankName}
          </span>
          <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-accent-light px-3 py-1 text-xs font-bold text-accent">
            <BookOpen className="h-3.5 w-3.5" /> Review Mode — Answers Locked
          </span>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[1400px]">
        <aside className="hidden w-64 border-r border-border bg-surface md:block min-h-[calc(100vh-3.5rem)]">
          <div className="px-3 py-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">
            Questions
          </div>
          <div className="grid grid-cols-5 gap-1.5 px-3 pb-4">
            {session.questionIds.map((id, i) => {
              const a = session.answers[id];
              const qq = questions[id];
              const correct = qq && a === qq.correctKey;
              const cls =
                i === index
                  ? "bg-accent text-accent-foreground border-accent"
                  : correct
                    ? "bg-success-light text-success border-success/30"
                    : a
                      ? "bg-error-light text-error border-error/30"
                      : "bg-surface text-muted-foreground border-border";
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setIndex(i)}
                  className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs font-bold ${cls}`}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
        </aside>

        <main className="flex-1 px-4 py-6 sm:px-8 lg:px-12">
          {q ? (
            <div className="mx-auto max-w-4xl xl:max-w-5xl">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Question {index + 1} of {total}
              </p>
              <article className="mt-3 rounded-xl border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
                <p className="whitespace-pre-line text-[15px] leading-relaxed text-foreground">{q.stem}</p>
              </article>

              <div className="mt-5 space-y-2.5">
                {q.options.map((opt) => {
                  const isCorrect = opt.key === correctKey;
                  const chosen = ans === opt.key;
                  let cls = "border-border bg-surface text-muted-foreground";
                  if (isCorrect) cls = "border-success bg-success-light text-success";
                  else if (chosen) cls = "border-error bg-error-light text-error";
                  return (
                    <div
                      key={opt.key}
                      className={`flex items-start gap-3 rounded-xl border-2 p-4 text-left ${cls}`}
                    >
                      <span
                        className={`mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                          isCorrect
                            ? "bg-success text-white"
                            : chosen
                              ? "bg-error text-white"
                              : "bg-surface text-foreground border border-border"
                        }`}
                      >
                        {isCorrect ? <Check className="h-3.5 w-3.5" /> : chosen ? <X className="h-3.5 w-3.5" /> : opt.key}
                      </span>
                      <span className="flex-1 text-sm">{opt.text}</span>
                    </div>
                  );
                })}
              </div>

              {/* Always-on explanation */}
              <section className="mt-6 overflow-hidden rounded-2xl border border-white/5 bg-surface shadow-[0_10px_30px_-10px_rgb(0_0_0_/_0.3)] animate-slide-up">
                <header
                  className={`relative flex items-center gap-3 px-6 py-4 overflow-hidden ${
                    q.correctKey === ans
                      ? "bg-success/10"
                      : "bg-error/10"
                  }`}
                >
                  <div className={`absolute inset-0 opacity-20 pointer-events-none ${q.correctKey === ans ? "bg-gradient-to-r from-success to-transparent" : "bg-gradient-to-r from-error to-transparent"}`} />
                  <h3 className="relative z-10 text-[11px] font-bold uppercase tracking-[0.16em] text-foreground/80">
                    Clinical Breakdown
                  </h3>
                  <span
                    className={`ml-auto relative z-10 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-white shadow-sm ${
                      q.correctKey === ans ? "bg-success" : "bg-error"
                    }`}
                  >
                    {q.correctKey === ans ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                    {q.correctKey === ans ? "Correct" : "Incorrect"}
                  </span>
                </header>

                <div className="space-y-6 p-6">
                  {/* Correct answer banner */}
                  <div className="flex items-start gap-4 rounded-xl border border-success/20 bg-success/5 p-5 shadow-sm">
                    <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-success" />
                    <div>
                      <p className="text-[12px] font-bold uppercase tracking-widest text-success mb-2">
                        Correct answer · {q.correctKey}. {q.options.find((o) => o.key === q.correctKey)?.text}
                      </p>
                      <p className="text-[15px] leading-relaxed text-foreground/90 font-medium">{q.whyCorrect}</p>
                    </div>
                  </div>

                  {/* Why selected was wrong */}
                  {ans !== q.correctKey && ans && (
                    <div className="rounded-xl border border-error/20 bg-error/5 p-5 shadow-sm">
                      <p className="text-[12px] font-bold uppercase tracking-widest text-error mb-2">
                        Why you chose {ans} · Incorrect
                      </p>
                      <p className="text-[15px] leading-relaxed text-foreground/90 font-medium">
                        {q.whyWrong[ans] ?? "This option doesn't fit the clinical picture in this vignette."}
                      </p>
                    </div>
                  )}

                  {/* Distractors */}
                  <div>
                    <div className="rounded-r-xl border-l-4 border-[#00D4C8] bg-surface-alt/50 px-5 py-4 shadow-sm">
                      <h4 className="text-[12px] font-bold uppercase tracking-[0.16em] text-[#00D4C8]">
                        When would each wrong choice be correct?
                      </h4>
                      <p className="mt-1.5 text-[13px] text-muted-foreground font-medium">
                        The highest-yield insight — the exact clinical scenario that flips each distractor into the right answer.
                      </p>
                    </div>
                    <ul className="mt-4 space-y-4">
                      {q.options
                        .filter((o) => o.key !== q.correctKey)
                        .map((o) => {
                          const wrongReason = q.whyWrong[o.key] ?? "Not the best answer in this scenario.";
                          let wouldBeCorrect = `the clinical picture pointed instead to ${o.text.toLowerCase()} as the underlying mechanism or required next step.`;
                          if (/would|when|if|in which|patients with/i.test(wrongReason)) {
                            const tail = wrongReason.split(/—|\.|;/).filter(Boolean).slice(-1)[0]?.trim();
                            if (tail && tail.length > 20) wouldBeCorrect = tail.replace(/^(?:would|when)\s*/i, "the patient ");
                          }
                          return (
                            <li
                              key={o.key}
                              className="rounded-r-xl border border-white/5 border-l-4 border-l-[#00D4C8] bg-surface/50 p-5 shadow-sm transition-colors hover:bg-surface-alt/30"
                            >
                              <div className="flex items-start gap-3">
                                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-error/10 text-sm font-bold text-error shadow-inner">
                                  {o.key}
                                </span>
                                <p className="text-[15px] font-bold text-foreground pt-1">{o.text}</p>
                              </div>
                              <div className="mt-4 space-y-3 pl-11">
                                <p className="text-[14px] leading-relaxed text-foreground/90">
                                  <span className="font-bold text-error tracking-wide text-[12px] uppercase">Why {o.key} is wrong — </span>
                                  {wrongReason}
                                </p>
                                <p className="text-[14px] leading-relaxed text-muted-foreground/90">
                                  <span className="font-bold text-[#3B82F6] tracking-wide text-[12px] uppercase">Scenario where {o.key} would be correct — </span>
                                  {wouldBeCorrect}
                                </p>
                              </div>
                            </li>
                          );
                        })}
                    </ul>
                  </div>

                  {/* Key learning */}
                  <div className="rounded-xl bg-gradient-to-br from-[#0E7C7B]/20 to-[#2BC97F]/10 p-5 shadow-sm border border-[#00D4C8]/20">
                    <p className="inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.16em] text-[#00D4C8]">
                      💡 Clinical pearl
                    </p>
                    <p className="mt-2 text-[15px] font-semibold leading-relaxed text-foreground">
                      {q.keyPoint}
                    </p>
                  </div>
                </div>
              </section>

              <div className="mt-8 flex items-center justify-between border-t border-border pt-5">
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => setIndex((i) => Math.max(0, i - 1))}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3.5 py-2 text-sm font-semibold text-foreground hover:bg-surface-alt disabled:opacity-50"
                >
                  ← Previous
                </button>
                <button
                  type="button"
                  disabled={index === total - 1}
                  onClick={() => setIndex((i) => Math.min(total - 1, i + 1))}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3.5 py-2 text-sm font-semibold text-foreground hover:bg-surface-alt disabled:opacity-50"
                >
                  Next →
                </button>
              </div>
            </div>
          ) : null}
        </main>
      </div>
    </div>
  );
}
