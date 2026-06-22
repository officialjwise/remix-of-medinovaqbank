import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { questionBanks, recentSessions } from "@/data/banks";
import { useSessionStore } from "@/stores/sessionStore";
import type { QuizMode, SessionSummary } from "@/types";
import { Eye, FileSearch, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_app/sessions")({
  head: () => ({
    meta: [
      { title: "My Sessions — Medinovaqbank" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SessionsPage,
});

function SessionsPage() {
  const liveSessions = useSessionStore((s) => s.sessions);
  const liveQuestions = useSessionStore((s) => s.questions);

  // Merge live sessions (created locally) into the mock list
  const merged: SessionSummary[] = useMemo(() => {
    const live = Object.values(liveSessions).map((s) => {
      const total = s.questionIds.length;
      const answered = s.questionIds.filter((id) => s.answers[id]).length;
      const correct = s.questionIds.filter((id) => {
        const q = liveQuestions[id];
        return q && s.submitted[id] && s.answers[id] === q.correctKey;
      }).length;
      const submittedCount = s.questionIds.filter((id) => s.submitted[id]).length;
      const inProgress = submittedCount < total;
      return {
        id: s.id,
        bankId: s.bankId,
        bankName: s.bankName,
        mode: s.mode,
        scorePct: total ? Math.round((correct / total) * 100) : 0,
        questionsAnswered: answered,
        totalQuestions: total,
        completedAt: s.startedAt,
        inProgress,
      } satisfies SessionSummary;
    });
    return [...live, ...recentSessions].sort((a, b) => b.completedAt.localeCompare(a.completedAt));
  }, [liveSessions, liveQuestions]);

  const [bank, setBank] = useState("All");
  const [mode, setMode] = useState<"All" | QuizMode>("All");
  const [scoreMin, setScoreMin] = useState(0);

  const filtered = useMemo(() => {
    return merged.filter((s) => {
      if (bank !== "All" && s.bankId !== bank) return false;
      if (mode !== "All" && s.mode !== mode) return false;
      if (s.scorePct < scoreMin) return false;
      return true;
    });
  }, [merged, bank, mode, scoreMin]);

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">My Sessions</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {filtered.length} session{filtered.length !== 1 ? "s" : ""} · sortable by bank, mode, and score
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface p-3">
        <FilterSelect label="Bank" value={bank} onChange={setBank} options={["All", ...questionBanks.map((b) => b.id)]} optionLabels={(v) => v === "All" ? "All" : questionBanks.find((b) => b.id === v)?.name ?? v} />
        <FilterSelect label="Mode" value={mode} onChange={(v) => setMode(v as "All" | QuizMode)} options={["All", "TUTOR", "QUIZ"]} />
        <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Min Score
          <input
            type="range"
            min={0}
            max={100}
            value={scoreMin}
            onChange={(e) => setScoreMin(Number(e.target.value))}
            className="accent-accent"
          />
          <span className="w-10 text-right font-mono text-foreground">{scoreMin}%</span>
        </label>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <div className="hidden grid-cols-[120px_1fr_80px_100px_120px_140px] gap-4 border-b border-border bg-surface-alt/40 px-5 py-3 text-xs font-bold uppercase tracking-wide text-muted-foreground md:grid">
          <span>Date</span>
          <span>Bank</span>
          <span>Mode</span>
          <span>Score</span>
          <span>Status</span>
          <span className="text-right">Actions</span>
        </div>
        {filtered.length === 0 && (
          <div className="px-5 py-12 text-center text-sm text-muted-foreground">No sessions match these filters.</div>
        )}
        {filtered.map((s) => (
          <div
            key={s.id}
            className="grid grid-cols-1 gap-3 border-b border-border px-5 py-4 last:border-b-0 md:grid-cols-[120px_1fr_80px_100px_120px_140px] md:items-center"
          >
            <span className="text-sm text-muted-foreground">{new Date(s.completedAt).toLocaleDateString()}</span>
            <span className="text-sm font-semibold text-foreground">{s.bankName}</span>
            <span>
              <span
                className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                  s.mode === "TUTOR" ? "bg-accent-light text-accent" : "bg-warning-light text-warning"
                }`}
              >
                {s.mode}
              </span>
            </span>
            <span className="font-mono text-sm font-bold tabular-nums text-foreground">{s.scorePct}%</span>
            <span>
              {s.inProgress ? (
                <span className="inline-flex rounded-full bg-warning-light px-2 py-0.5 text-xs font-semibold text-warning">
                  In Progress
                </span>
              ) : (
                <span className="inline-flex rounded-full bg-success-light px-2 py-0.5 text-xs font-semibold text-success">
                  Complete
                </span>
              )}
            </span>
            <div className="flex items-center gap-2 md:justify-end">
              {!s.inProgress ? (
                <>
                  <Link
                    to="/quiz/$sessionId/results"
                    params={{ sessionId: s.id }}
                    className="inline-flex h-8 items-center gap-1 rounded-md border border-border bg-surface px-2 text-xs font-semibold text-foreground hover:bg-surface-alt"
                  >
                    <Eye className="h-3.5 w-3.5" /> Results
                  </Link>
                  <Link
                    to="/quiz/$sessionId/review"
                    params={{ sessionId: s.id }}
                    className="inline-flex h-8 items-center gap-1 rounded-md border border-border bg-surface px-2 text-xs font-semibold text-foreground hover:bg-surface-alt"
                  >
                    <FileSearch className="h-3.5 w-3.5" /> Review
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/quiz/$sessionId"
                    params={{ sessionId: s.id }}
                    className="inline-flex h-8 items-center gap-1 rounded-md bg-accent px-2.5 text-xs font-semibold text-accent-foreground hover:bg-accent/90"
                  >
                    Resume
                  </Link>
                  <button
                    type="button"
                    className="inline-flex h-8 items-center gap-1 rounded-md border border-border bg-surface px-2 text-xs font-semibold text-error hover:bg-error-light"
                    aria-label="Delete session"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </>
              )}
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
    <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 rounded-lg border border-border bg-surface px-2.5 text-sm font-medium normal-case tracking-normal text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
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
