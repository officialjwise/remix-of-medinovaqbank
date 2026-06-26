import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { questionBanks, recentSessions } from "@/data/banks";
import type { QuizMode, SessionSummary } from "@/types";
import { Eye, FileSearch, Trash2 } from "lucide-react";

export const Route = createFileRoute("/admin/sessions")({
  head: () => ({
    meta: [
      { title: "Admin · Sessions — Medinovaqbank" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminSessionsPage,
});

// Generate some mock sessions for all users
const adminSessions = Array.from({ length: 50 }).map((_, i) => {
  const rs = recentSessions[i % recentSessions.length];
  return {
    ...rs,
    id: `admin-sess-${i}`,
    userId: `user-${Math.floor(Math.random() * 100)}`,
    userName: `Dr. User ${i}`,
  };
});

function AdminSessionsPage() {
  const [bank, setBank] = useState("All");
  const [mode, setMode] = useState<"All" | QuizMode>("All");

  const filtered = useMemo(() => {
    return adminSessions.filter((s) => {
      if (bank !== "All" && s.bankId !== bank) return false;
      if (mode !== "All" && s.mode !== mode) return false;
      return true;
    });
  }, [bank, mode]);

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Platform Sessions</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          View all practitioner sessions across the platform.
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface p-3 shadow-[var(--shadow-card)]">
        <FilterSelect label="Bank" value={bank} onChange={setBank} options={["All", ...questionBanks.map((b) => b.id)]} optionLabels={(v) => v === "All" ? "All" : questionBanks.find((b) => b.id === v)?.name ?? v} />
        <FilterSelect label="Mode" value={mode} onChange={(v) => setMode(v as "All" | QuizMode)} options={["All", "TUTOR", "QUIZ"]} />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-[var(--shadow-card)]">
        <div className="hidden grid-cols-[120px_140px_1fr_80px_100px_120px_100px] gap-4 border-b border-border bg-surface-alt/40 px-6 py-4 text-xs font-bold uppercase tracking-widest text-muted-foreground md:grid">
          <span>Date</span>
          <span>Practitioner</span>
          <span>Bank</span>
          <span>Mode</span>
          <span>Score</span>
          <span>Status</span>
          <span className="text-right">Actions</span>
        </div>
        {filtered.length === 0 && (
          <div className="px-6 py-16 text-center text-sm text-muted-foreground">No sessions match these filters.</div>
        )}
        {filtered.map((s) => (
          <div
            key={s.id}
            className="grid grid-cols-1 gap-3 border-b border-border px-6 py-4 last:border-b-0 md:grid-cols-[120px_140px_1fr_80px_100px_120px_100px] md:items-center hover:bg-surface-alt/30 transition-colors"
          >
            <span className="text-sm text-muted-foreground">{new Date(s.completedAt).toLocaleDateString()}</span>
            <span className="text-sm font-semibold text-foreground truncate">{s.userName}</span>
            <span className="text-sm font-semibold text-primary truncate">{s.bankName}</span>
            <span>
              <span
                className={`inline-flex rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest ${
                  s.mode === "TUTOR" ? "bg-primary/10 text-primary" : "bg-warning/10 text-warning"
                }`}
              >
                {s.mode}
              </span>
            </span>
            <span className={`font-mono text-sm font-bold tabular-nums ${s.scorePct >= 80 ? "text-success" : s.scorePct >= 60 ? "text-warning" : "text-error"}`}>{s.scorePct}%</span>
            <span>
              <span className="inline-flex rounded-md bg-success/10 px-2.5 py-1 text-xs font-semibold text-success border border-success/20">
                Complete
              </span>
            </span>
            <div className="flex items-center gap-2 md:justify-end">
              <button
                type="button"
                className="inline-flex h-8 items-center gap-1 rounded-lg border border-border bg-surface px-2.5 text-xs font-semibold text-error hover:bg-error/10 hover:border-error/30 transition-colors"
                aria-label="Delete session"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
  optionLabels,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  optionLabels?: (v: string) => string;
}) {
  return (
    <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 rounded-lg border border-border bg-surface px-3 text-sm font-medium normal-case tracking-normal text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {optionLabels ? optionLabels(o) : o}
          </option>
        ))}
      </select>
    </label>
  );
}
