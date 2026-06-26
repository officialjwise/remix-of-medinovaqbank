import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Activity, Clock, GraduationCap, Target } from "lucide-react";
import { questionBanks } from "@/data/banks";
import { GradientKpiCard } from "@/components/shared/GradientKpiCard";

export const Route = createFileRoute("/admin/quiz-analytics")({
  head: () => ({ meta: [{ title: "Admin · Quiz Analytics — Medinovaqbank" }, { name: "robots", content: "noindex" }] }),
  component: QuizAnalytics,
});

const RANGES = ["7d", "30d", "90d"] as const;
type Range = (typeof RANGES)[number];

// Chart tokens — resolve correctly in light + dark
const axisStroke = "var(--color-muted-foreground)";
const gridStroke = "var(--color-border)";
const tooltipStyle = {
  backgroundColor: "var(--color-surface)",
  border: "1px solid var(--color-border)",
  borderRadius: "10px",
  color: "var(--color-foreground)",
  boxShadow: "var(--shadow-card-hover)",
};

// Deterministic mock score per bank (stable across renders)
function scoreFor(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 1000;
  return 58 + (h % 36); // 58–93
}

const difficultyScores = [
  { label: "Beginner", value: 81, color: "#1FA968" },
  { label: "Intermediate", value: 72, color: "#0E7C7B" },
  { label: "Advanced", value: 61, color: "#E89A1A" },
];

const modeSplit = [
  { name: "Tutor mode", value: 6420, fill: "#0E7C7B" },
  { name: "Quiz mode", value: 4180, fill: "#2BC97F" },
];

const hardest = [
  { id: "q-rca-stemi", stem: "Which artery is occluded given inferior ST elevation (II, III, aVF)?", bank: "Internal Medicine Shelf", rate: 31 },
  { id: "q-absence", stem: "Drug of choice for absence seizures in a school-age child…", bank: "Paediatrics", rate: 34 },
  { id: "q-anticoag", stem: "Preferred anticoagulant in a patient with mechanical valve…", bank: "Internal Medicine Shelf", rate: 38 },
  { id: "q-deltoid", stem: "Which nerve innervates the deltoid muscle?", bank: "Surgery Core", rate: 41 },
  { id: "q-meningitis", stem: "Most appropriate first investigation in suspected meningitis…", bank: "Internal Medicine Shelf", rate: 44 },
];

const easiest = [
  { id: "q-asthma", stem: "First-line immediate therapy in acute severe asthma…", bank: "Internal Medicine Shelf", rate: 94 },
  { id: "q-dm-dx", stem: "Which result meets the diagnostic threshold for diabetes?", bank: "Internal Medicine Shelf", rate: 92 },
  { id: "q-apgar", stem: "Component NOT part of the APGAR score…", bank: "Paediatrics", rate: 90 },
  { id: "q-preeclampsia", stem: "Defining feature of pre-eclampsia after 20 weeks…", bank: "Obstetrics & Gynaecology", rate: 89 },
  { id: "q-gcs", stem: "Best motor response scoring on the GCS…", bank: "Surgery Core", rate: 88 },
];

function QuizAnalytics() {
  const [range, setRange] = useState<Range>("30d");

  const byBank = useMemo(
    () =>
      questionBanks
        .map((b) => ({ name: b.name, short: b.subject, score: scoreFor(b.id + range), fill: b.accentHex }))
        .sort((a, b) => b.score - a.score),
    [range],
  );

  const platformAvg = Math.round(byBank.reduce((s, b) => s + b.score, 0) / byBank.length);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Quiz Analytics</h2>
          <p className="mt-1 text-sm text-muted-foreground">Performance, difficulty, and content insights across all sessions.</p>
        </div>
        <RangePicker value={range} onChange={setRange} />
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <GradientKpiCard icon={Activity} gradient="teal" label="Total sessions" value="10,604" trend={{ value: "+8.2%", up: true }} />
        <GradientKpiCard icon={GraduationCap} gradient="emerald" label="Questions answered" value="312,940" trend={{ value: "+12.4%", up: true }} />
        <GradientKpiCard icon={Target} gradient="blue" label="Platform avg score" value={`${platformAvg}%`} trend={{ value: "+1.1 pts", up: true }} />
        <GradientKpiCard icon={Clock} gradient="amber" label="Avg time / question" value="48s" trend={{ value: "-3s", up: true }} />
      </div>

      {/* Score by bank + difficulty */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Average score by bank" subtitle="Higher is easier for learners" className="lg:col-span-2">
          <div className="h-80">
            <ResponsiveContainer>
              <BarChart data={byBank} layout="vertical" margin={{ left: 8, right: 16 }}>
                <CartesianGrid horizontal={false} stroke={gridStroke} />
                <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} stroke={axisStroke} fontSize={11} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="short" stroke={axisStroke} fontSize={11} width={96} tickLine={false} axisLine={false} />
                <Tooltip formatter={(v: number) => [`${v}%`, "Avg score"]} contentStyle={tooltipStyle} cursor={{ fill: "var(--color-surface-alt)" }} />
                <Bar dataKey="score" radius={[0, 6, 6, 0]} barSize={20}>
                  {byBank.map((b) => (
                    <Cell key={b.name} fill={b.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Score by difficulty" subtitle="Across all banks">
          <div className="flex h-80 flex-col justify-center gap-6">
            {difficultyScores.map((d) => (
              <div key={d.label} className="flex items-center gap-4">
                <Ring value={d.value} color={d.color} />
                <div>
                  <p className="text-sm font-bold text-foreground">{d.label}</p>
                  <p className="text-xs text-muted-foreground">avg correct rate</p>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {/* Mode split + hardest/easiest */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Tutor vs Quiz usage" subtitle="Answered questions by mode">
          <div className="h-64">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={modeSplit} dataKey="value" nameKey="name" innerRadius={52} outerRadius={88} paddingAngle={3} stroke="var(--color-surface)" strokeWidth={2}>
                  {modeSplit.map((m) => (
                    <Cell key={m.name} fill={m.fill} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => v.toLocaleString()} contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="mt-1 space-y-1.5 text-xs">
            {modeSplit.map((m) => (
              <li key={m.name} className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ background: m.fill }} />
                <span className="flex-1 text-muted-foreground">{m.name}</span>
                <span className="font-bold text-foreground">{m.value.toLocaleString()}</span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Most difficult questions" subtitle="Lowest correct rate" className="lg:col-span-2">
          <QuestionRateTable rows={hardest} tone="error" />
        </Panel>
      </div>

      <Panel title="Easiest questions" subtitle="Highest correct rate — candidates for difficulty re-tagging">
        <QuestionRateTable rows={easiest} tone="success" />
      </Panel>
    </div>
  );
}

function RangePicker({ value, onChange }: { value: Range; onChange: (r: Range) => void }) {
  const labels: Record<Range, string> = { "7d": "7 days", "30d": "30 days", "90d": "90 days" };
  return (
    <div className="inline-flex rounded-lg border border-border bg-surface p-0.5 shadow-[var(--shadow-card)]">
      {RANGES.map((r) => (
        <button
          key={r}
          onClick={() => onChange(r)}
          className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
            value === r ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {labels[r]}
        </button>
      ))}
    </div>
  );
}

function Ring({ value, color }: { value: number; color: string }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  return (
    <div className="relative h-16 w-16 flex-shrink-0">
      <svg viewBox="0 0 64 64" className="h-16 w-16 -rotate-90">
        <circle cx="32" cy="32" r={r} fill="none" stroke="var(--color-border)" strokeWidth="6" />
        <circle cx="32" cy="32" r={r} fill="none" stroke={color} strokeWidth="6" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={offset} />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-foreground">{value}%</span>
    </div>
  );
}

function QuestionRateTable({ rows, tone }: { rows: { id: string; stem: string; bank: string; rate: number }[]; tone: "error" | "success" }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] text-left text-sm">
        <thead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          <tr className="border-b border-border">
            <th className="py-2 pr-3">Question</th>
            <th className="px-3 py-2">Bank</th>
            <th className="py-2 pl-3 text-right">Correct rate</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((q) => (
            <tr key={q.id} className="hover:bg-surface-alt/40">
              <td className="max-w-[360px] truncate py-2.5 pr-3 font-medium text-foreground" title={q.stem}>{q.stem}</td>
              <td className="px-3 py-2.5 text-xs text-muted-foreground">{q.bank}</td>
              <td className="py-2.5 pl-3 text-right">
                <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${tone === "error" ? "bg-error/10 text-error" : "bg-success/10 text-success"}`}>
                  {q.rate}%
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Panel({ title, subtitle, children, className = "" }: { title: string; subtitle?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)] ${className}`}>
      <header>
        <h3 className="text-sm font-bold tracking-tight text-foreground">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
      </header>
      <div className="mt-4">{children}</div>
    </section>
  );
}
