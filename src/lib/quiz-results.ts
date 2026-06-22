import type { ActiveSession, Question } from "@/types";

export interface SessionResults {
  total: number;
  answered: number;
  correct: number;
  incorrect: number;
  skipped: number;
  scorePct: number;
  bySubject: { name: string; pct: number; correct: number; total: number }[];
  byDifficulty: { name: "Beginner" | "Intermediate" | "Advanced"; pct: number; correct: number; total: number }[];
  timeline: { q: number; seconds: number }[];
  durationSec: number;
}

export function computeResults(
  session: ActiveSession,
  questions: Record<string, Question>,
): SessionResults {
  const total = session.questionIds.length;
  let correct = 0;
  let answered = 0;
  const subjectMap = new Map<string, { c: number; t: number }>();
  const diffMap = new Map<"Beginner" | "Intermediate" | "Advanced", { c: number; t: number }>();
  const timeline: { q: number; seconds: number }[] = [];

  session.questionIds.forEach((qid, i) => {
    const q = questions[qid];
    if (!q) return;
    const ans = session.answers[qid];
    const sub = !!session.submitted[qid];
    if (ans) answered++;
    const isCorrect = sub && ans === q.correctKey;
    if (isCorrect) correct++;

    const s = subjectMap.get(q.topic) ?? { c: 0, t: 0 };
    s.t++;
    if (isCorrect) s.c++;
    subjectMap.set(q.topic, s);

    const d = diffMap.get(q.difficulty) ?? { c: 0, t: 0 };
    d.t++;
    if (isCorrect) d.c++;
    diffMap.set(q.difficulty, d);

    // Synthetic per-question time (seed by index, 25–110s)
    const seconds = 30 + ((i * 17) % 80);
    timeline.push({ q: i + 1, seconds });
  });

  const skipped = total - answered;
  const incorrect = answered - correct;
  const scorePct = total === 0 ? 0 : Math.round((correct / total) * 100);
  const bySubject = Array.from(subjectMap.entries()).map(([name, v]) => ({
    name,
    pct: Math.round((v.c / v.t) * 100),
    correct: v.c,
    total: v.t,
  }));
  const byDifficulty: SessionResults["byDifficulty"] = (
    ["Beginner", "Intermediate", "Advanced"] as const
  )
    .map((name) => {
      const v = diffMap.get(name);
      return v
        ? { name, pct: Math.round((v.c / v.t) * 100), correct: v.c, total: v.t }
        : { name, pct: 0, correct: 0, total: 0 };
    })
    .filter((d) => d.total > 0);

  const durationSec = timeline.reduce((acc, t) => acc + t.seconds, 0);

  return {
    total,
    answered,
    correct,
    incorrect,
    skipped,
    scorePct,
    bySubject,
    byDifficulty,
    timeline,
    durationSec,
  };
}

export function scoreColor(pct: number): { bg: string; text: string; ring: string } {
  if (pct >= 70) return { bg: "bg-success-light", text: "text-success", ring: "stroke-success" };
  if (pct >= 50) return { bg: "bg-warning-light", text: "text-warning", ring: "stroke-warning" };
  return { bg: "bg-error-light", text: "text-error", ring: "stroke-error" };
}

export function formatDuration(s: number): string {
  const m = Math.floor(s / 60);
  const ss = s % 60;
  if (m === 0) return `${ss} sec`;
  return `${m} min ${ss} sec`;
}
