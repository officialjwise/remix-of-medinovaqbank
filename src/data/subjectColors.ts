/**
 * Centralized subject color system. Every question bank card, badge, and
 * topic chip should pull from here so coloring is consistent everywhere.
 */
export interface SubjectTheme {
  /** Tailwind classes for soft badge surface */
  badge: string;
  /** Tailwind border for top accent strip */
  border: string;
  /** Tailwind background for solid pill */
  solid: string;
  /** Tailwind ring/text accent */
  text: string;
  /** Raw hex used in inline gradients */
  hex: string;
}

const FALLBACK: SubjectTheme = {
  badge: "bg-slate-100 text-slate-700 border-slate-200",
  border: "border-t-slate-500",
  solid: "bg-slate-500",
  text: "text-slate-700",
  hex: "#64748B",
};

const map: Record<string, SubjectTheme> = {
  Anatomy: { badge: "bg-blue-100 text-blue-700 border-blue-200", border: "border-t-blue-500", solid: "bg-blue-500", text: "text-blue-700", hex: "#3B82F6" },
  Pharmacology: { badge: "bg-emerald-100 text-emerald-700 border-emerald-200", border: "border-t-emerald-500", solid: "bg-emerald-500", text: "text-emerald-700", hex: "#10B981" },
  Pathology: { badge: "bg-rose-100 text-rose-700 border-rose-200", border: "border-t-rose-500", solid: "bg-rose-500", text: "text-rose-700", hex: "#F43F5E" },
  Physiology: { badge: "bg-violet-100 text-violet-700 border-violet-200", border: "border-t-violet-500", solid: "bg-violet-500", text: "text-violet-700", hex: "#8B5CF6" },
  Biochemistry: { badge: "bg-amber-100 text-amber-700 border-amber-200", border: "border-t-amber-500", solid: "bg-amber-500", text: "text-amber-700", hex: "#F59E0B" },
  Microbiology: { badge: "bg-teal-100 text-teal-700 border-teal-200", border: "border-t-teal-500", solid: "bg-teal-500", text: "text-teal-700", hex: "#14B8A6" },
  Surgery: { badge: "bg-orange-100 text-orange-700 border-orange-200", border: "border-t-orange-500", solid: "bg-orange-500", text: "text-orange-700", hex: "#F97316" },
  "Internal Medicine": { badge: "bg-indigo-100 text-indigo-700 border-indigo-200", border: "border-t-indigo-500", solid: "bg-indigo-500", text: "text-indigo-700", hex: "#6366F1" },
  "OB/GYN": { badge: "bg-pink-100 text-pink-700 border-pink-200", border: "border-t-pink-500", solid: "bg-pink-500", text: "text-pink-700", hex: "#EC4899" },
  Paediatrics: { badge: "bg-sky-100 text-sky-700 border-sky-200", border: "border-t-sky-500", solid: "bg-sky-500", text: "text-sky-700", hex: "#0EA5E9" },
  Psychiatry: { badge: "bg-purple-100 text-purple-700 border-purple-200", border: "border-t-purple-500", solid: "bg-purple-500", text: "text-purple-700", hex: "#A855F7" },
  Radiology: { badge: "bg-cyan-100 text-cyan-700 border-cyan-200", border: "border-t-cyan-500", solid: "bg-cyan-500", text: "text-cyan-700", hex: "#06B6D4" },
  "Community Health": { badge: "bg-lime-100 text-lime-700 border-lime-200", border: "border-t-lime-500", solid: "bg-lime-500", text: "text-lime-700", hex: "#84CC16" },
  "Emergency Medicine": { badge: "bg-orange-100 text-orange-700 border-orange-200", border: "border-t-orange-500", solid: "bg-orange-500", text: "text-orange-700", hex: "#F97316" },
};

export function subjectTheme(subject: string): SubjectTheme {
  return map[subject] ?? FALLBACK;
}