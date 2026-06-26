import { useEffect, useState } from "react";
import { BarChart3, Check, Crown, Trophy } from "lucide-react";

const slides = [
  { label: "Analytics", caption: "Bell-curve performance vs. peers" },
  { label: "Quiz Mode", caption: "Real exam-style vignettes" },
  { label: "Leaderboard", caption: "Compete with peers nationwide" },
] as const;

export function RotatingHero() {
  const [i, setI] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % slides.length), 4000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="relative">
      {/* Soft glow behind frame */}
      <div
        aria-hidden
        className="absolute -inset-10 -z-10 rounded-[2.5rem] opacity-60 blur-3xl"
        style={{ background: "radial-gradient(closest-side, #2BC97F40, transparent 70%)" }}
      />

      {/* Browser chrome frame */}
      <div className="relative overflow-hidden rounded-2xl bg-white shadow-[0_30px_80px_-20px_rgb(0_0_0_/_0.5)] ring-1 ring-white/10">
        {/* Chrome */}
        <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-100 px-4 py-2.5">
          <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
          <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
          <span className="h-3 w-3 rounded-full bg-[#28c840]" />
          <div className="ml-3 flex-1 truncate rounded-md bg-white px-3 py-1 text-[11px] font-medium text-slate-500 shadow-inner">
            medinovaqbank.com/dashboard
          </div>
        </div>

        {/* Stage */}
        <div className="relative aspect-[16/11] w-full bg-gradient-to-br from-slate-50 to-white">
          {slides.map((s, idx) => (
            <div
              key={s.label}
              aria-hidden={i !== idx}
              className={`absolute inset-0 transition-opacity duration-700 ${
                i === idx ? "opacity-100" : "pointer-events-none opacity-0"
              }`}
            >
              {idx === 0 && <MockAnalytics />}
              {idx === 1 && <MockQuiz />}
              {idx === 2 && <MockLeaderboard />}
            </div>
          ))}
        </div>
      </div>

      {/* Caption + dots */}
      <div className="mt-4 flex items-center justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/60">
            {slides[i].label}
          </p>
          <p className="mt-1 text-sm font-medium text-white/85">{slides[i].caption}</p>
        </div>
        <div className="flex items-center gap-1.5">
          {slides.map((s, idx) => (
            <button
              key={s.label}
              type="button"
              onClick={() => setI(idx)}
              aria-label={`Show ${s.label}`}
              className={`h-1.5 rounded-full transition-all ${
                i === idx ? "w-8 bg-[#2BC97F]" : "w-1.5 bg-white/30 hover:bg-white/50"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ───────── Mock dashboards (pure CSS/HTML) ───────── */

function MockAnalytics() {
  return (
    <div className="grid h-full grid-cols-3 gap-3 p-5">
      <div className="col-span-3 flex items-end gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
            Performance
          </p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            82% <span className="text-sm font-medium text-emerald-600">+6%</span>
          </p>
        </div>
        <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
          <BarChart3 className="h-3 w-3" /> Top 12%
        </span>
      </div>

      {/* Bell curve */}
      <div className="col-span-2 rounded-xl border border-slate-200 bg-white p-3">
        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
          Cohort distribution
        </p>
        <svg viewBox="0 0 200 80" className="mt-1 h-24 w-full">
          <defs>
            <linearGradient id="bellFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#0E7C7B" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#2BC97F" stopOpacity="0.05" />
            </linearGradient>
          </defs>
          <path
            d="M0,75 C40,75 70,10 100,10 C130,10 160,75 200,75 L200,80 L0,80 Z"
            fill="url(#bellFill)"
          />
          <path
            d="M0,75 C40,75 70,10 100,10 C130,10 160,75 200,75"
            fill="none"
            stroke="#0E7C7B"
            strokeWidth="1.5"
          />
          <line
            x1="150"
            y1="20"
            x2="150"
            y2="75"
            stroke="#2BC97F"
            strokeDasharray="3 3"
            strokeWidth="1.5"
          />
          <circle cx="150" cy="20" r="3" fill="#2BC97F" />
        </svg>
        <p className="mt-1 text-[10px] text-slate-500">
          You scored higher than <span className="font-bold text-emerald-700">88%</span> of peers
        </p>
      </div>

      <div className="space-y-2">
        <ScoreTile label="Cardiology" pct={88} tint="emerald" />
        <ScoreTile label="Pharm" pct={76} tint="teal" />
        <ScoreTile label="Surgery" pct={64} tint="amber" />
      </div>
    </div>
  );
}

function ScoreTile({
  label,
  pct,
  tint,
}: {
  label: string;
  pct: number;
  tint: "emerald" | "teal" | "amber";
}) {
  const bar =
    tint === "emerald" ? "bg-emerald-500" : tint === "teal" ? "bg-teal-500" : "bg-amber-500";
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-2">
      <div className="flex items-center justify-between text-[10px] font-semibold text-slate-700">
        <span>{label}</span>
        <span>{pct}%</span>
      </div>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full ${bar}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function MockQuiz() {
  const opts = [
    { k: "A", t: "Acute Myocardial Infarction", state: "idle" },
    { k: "B", t: "Aortic Dissection", state: "correct" },
    { k: "C", t: "Pulmonary Embolism", state: "idle" },
    { k: "D", t: "Hypertensive Crisis", state: "idle" },
  ] as const;
  return (
    <div className="flex h-full flex-col gap-3 p-5">
      <div className="flex items-center justify-between">
        <span className="rounded-full bg-teal-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-teal-700">
          Tutor mode
        </span>
        <span className="text-[10px] font-mono font-bold text-slate-500">14 / 30</span>
      </div>
      <div className="h-1 w-full rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-500"
          style={{ width: "46%" }}
        />
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-3">
        <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Question 14</p>
        <p className="mt-1 text-[12px] leading-snug text-slate-700">
          58-year-old hypertensive male, sudden tearing chest pain radiating to back. BP 180/110
          right arm, 140/90 left. Most likely diagnosis?
        </p>
      </div>
      <div className="space-y-1.5">
        {opts.map((o) => (
          <div
            key={o.k}
            className={`flex items-center gap-2 rounded-lg border p-2 text-[11px] font-medium ${
              o.state === "correct"
                ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                : "border-slate-200 bg-white text-slate-700"
            }`}
          >
            <span
              className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                o.state === "correct"
                  ? "bg-emerald-500 text-white"
                  : "border border-slate-300 text-slate-500"
              }`}
            >
              {o.state === "correct" ? <Check className="h-3 w-3" /> : o.k}
            </span>
            {o.t}
          </div>
        ))}
      </div>
    </div>
  );
}

function MockLeaderboard() {
  const rows = [
    { r: 1, n: "Dr. Akua M.", s: 96, you: false, badge: "gold" },
    { r: 2, n: "Dr. Kwame O.", s: 94, you: false, badge: "silver" },
    { r: 3, n: "Dr. Ama B.", s: 91, you: false, badge: "bronze" },
    { r: 4, n: "Dr. Yaw A.", s: 89, you: false },
    { r: 5, n: "You", s: 87, you: true },
  ];
  return (
    <div className="flex h-full flex-col gap-2 p-5">
      <div className="flex items-center gap-2">
        <Trophy className="h-4 w-4 text-amber-500" />
        <p className="text-[11px] font-bold uppercase tracking-wide text-slate-700">
          Top performers · This week
        </p>
      </div>
      <div className="flex-1 space-y-1.5">
        {rows.map((row) => (
          <div
            key={row.r}
            className={`flex items-center gap-3 rounded-lg border p-2 text-[11px] ${
              row.you
                ? "border-teal-300 bg-gradient-to-r from-teal-50 to-emerald-50"
                : "border-slate-200 bg-white"
            }`}
          >
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${
                row.badge === "gold"
                  ? "bg-amber-400 text-white"
                  : row.badge === "silver"
                    ? "bg-slate-300 text-white"
                    : row.badge === "bronze"
                      ? "bg-amber-700 text-white"
                      : row.you
                        ? "bg-teal-500 text-white"
                        : "bg-slate-100 text-slate-600"
              }`}
            >
              {row.badge ? <Crown className="h-3 w-3" /> : row.r}
            </span>
            <span
              className={`flex-1 font-semibold ${row.you ? "text-teal-800" : "text-slate-700"}`}
            >
              {row.n}
            </span>
            <span className="font-mono font-bold text-slate-700">{row.s}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
