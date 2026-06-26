import type { SessionSummary } from "@/types";

export interface AggregateAnalytics {
  averagePct: number;
  totalAnswered: number;
  totalCorrect: number;
  bestSubject: { name: string; pct: number };
  bySubject: { name: string; pct: number }[];
  byDifficulty: { name: "Easy" | "Medium" | "Hard"; pct: number }[];
  trend: { date: string; pct: number }[];
  // Bell-curve: cohort mean/stddev for percentile calc
  cohort: { mean: number; stddev: number; size: number };
  yourPct: number;
  percentile: number;
}

const subjectAverages: { name: string; pct: number }[] = [
  { name: "Cardiology", pct: 88 },
  { name: "Pulmonology", pct: 76 },
  { name: "Endocrinology", pct: 72 },
  { name: "Pharmacology", pct: 81 },
  { name: "General Surgery", pct: 69 },
  { name: "Paediatrics", pct: 74 },
  { name: "Obstetrics & Gynae", pct: 65 },
  { name: "Psychiatry", pct: 79 },
  { name: "Pathology", pct: 58 },
];

export function buildAnalytics(sessions: SessionSummary[]): AggregateAnalytics {
  const finished = sessions.filter((s) => !s.inProgress);
  const totalAnswered = finished.reduce((acc, s) => acc + s.questionsAnswered, 0) || 1284;
  const averagePct = finished.length
    ? Math.round(finished.reduce((acc, s) => acc + s.scorePct, 0) / finished.length)
    : 74;
  const totalCorrect = Math.round((averagePct / 100) * totalAnswered);
  const best = subjectAverages.reduce((a, b) => (a.pct >= b.pct ? a : b), subjectAverages[0]);
  const trend = finished
    .slice()
    .sort((a, b) => a.completedAt.localeCompare(b.completedAt))
    .map((s) => ({ date: s.completedAt.slice(5, 10), pct: s.scorePct }));

  return {
    averagePct,
    totalAnswered,
    totalCorrect,
    bestSubject: { name: best.name, pct: best.pct },
    bySubject: subjectAverages,
    byDifficulty: [
      { name: "Easy", pct: 82 },
      { name: "Medium", pct: 71 },
      { name: "Hard", pct: 54 },
    ],
    trend,
    cohort: { mean: 65, stddev: 11, size: 1240 },
    yourPct: averagePct,
    percentile: percentileFor(averagePct, 65, 11),
  };
}

// Cumulative normal via erf approximation.
function percentileFor(x: number, mu: number, sd: number): number {
  const z = (x - mu) / sd;
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989422804014337 * Math.exp(-z * z * 0.5);
  let p =
    d *
    t *
    (0.31938153 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
  p = 1 - p;
  if (z < 0) p = 1 - p;
  return Math.round(p * 100);
}

export function bellCurvePoints(mean: number, sd: number, count = 80) {
  const min = mean - 4 * sd;
  const max = mean + 4 * sd;
  const step = (max - min) / count;
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i <= count; i++) {
    const x = min + i * step;
    const y = (1 / (sd * Math.sqrt(2 * Math.PI))) * Math.exp(-((x - mean) ** 2) / (2 * sd * sd));
    pts.push({ x: Math.round(x), y });
  }
  return pts;
}
