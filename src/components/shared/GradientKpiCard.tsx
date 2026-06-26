import type { LucideIcon } from "lucide-react";
import { TrendingDown, TrendingUp } from "lucide-react";

export type KpiGradient =
  | "navy"
  | "teal"
  | "blue"
  | "emerald"
  | "amber"
  | "rose"
  | "violet"
  | "indigo";

const GRADIENTS: Record<KpiGradient, string> = {
  navy: "from-[#0F2B4C] to-[#0E7C7B]",
  teal: "from-[#0E7C7B] to-[#15A89C]",
  blue: "from-[#2563EB] to-[#3B82F6]",
  emerald: "from-[#1FA968] to-[#2BC97F]",
  amber: "from-[#D97706] to-[#F59E0B]",
  rose: "from-[#E11D48] to-[#F472B6]",
  violet: "from-[#7C3AED] to-[#A855F7]",
  indigo: "from-[#4338CA] to-[#6366F1]",
};

/**
 * The standard gradient KPI card used across every dashboard and analytics
 * page. Distinct gradient, icon in a translucent circle, large value, label,
 * and an optional trend chip. Dark-mode safe (gradients are fixed hex).
 */
export function GradientKpiCard({
  label,
  value,
  icon: Icon,
  gradient,
  trend,
  sub,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  gradient: KpiGradient;
  trend?: { value: string; up: boolean };
  sub?: string;
}) {
  return (
    <div
      className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${GRADIENTS[gradient]} p-5 text-white shadow-[var(--shadow-card)] transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-hover)]`}
    >
      <div
        aria-hidden
        className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/10 blur-xl"
      />
      <div className="relative flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-white/75">{label}</p>
          <p className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">{value}</p>
          {sub && <p className="mt-0.5 truncate text-xs text-white/70">{sub}</p>}
        </div>
        <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm">
          <Icon className="h-5 w-5" />
        </span>
      </div>
      {trend && (
        <p
          className={`relative mt-3 inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-xs font-semibold ${trend.up ? "text-white" : "text-white"}`}
        >
          {trend.up ? (
            <TrendingUp className="h-3.5 w-3.5" />
          ) : (
            <TrendingDown className="h-3.5 w-3.5" />
          )}
          {trend.value}
        </p>
      )}
    </div>
  );
}
