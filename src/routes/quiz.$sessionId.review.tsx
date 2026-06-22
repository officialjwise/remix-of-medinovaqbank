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
        <div className="flex h-14 items-center gap-3 px-4 sm:px-6">
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

      <div className="flex">
        <aside className="hidden w-56 border-r border-border bg-surface md:block">
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
            <div className="mx-auto max-w-3xl">
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
              <section className="mt-6 rounded-xl border border-border bg-surface-alt/40 p-5">
                <h3 className="border-l-4 border-accent pl-3 text-xs font-bold uppercase tracking-wide text-accent">
                  AI Explanation
                </h3>
                <p className="mt-3 text-sm font-bold text-success">
                  Correct: {q.correctKey}. {q.options.find((o) => o.key === q.correctKey)?.text}
                </p>
                <p className="mt-2 text-sm text-foreground">{q.whyCorrect}</p>
                <h4 className="mt-4 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Why other options are wrong
                </h4>
                <ul className="mt-2 space-y-1.5 text-sm">
                  {q.options
                    .filter((o) => o.key !== q.correctKey)
                    .map((o) => (
                      <li key={o.key} className="flex gap-2">
                        <span className="font-bold">{o.key}.</span>
                        <span className="text-muted-foreground">
                          {q.whyWrong[o.key] ?? "Not the best answer in this scenario."}
                        </span>
                      </li>
                    ))}
                </ul>
                <div className="mt-4 rounded-lg bg-accent-light/40 p-3 text-sm text-foreground">
                  <span className="font-bold">💡 Key Learning Point: </span>
                  {q.keyPoint}
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
