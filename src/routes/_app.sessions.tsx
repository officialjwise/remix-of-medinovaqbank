import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useSessions, type SessionListItem } from "@/api/quiz.api";
import type { QuizMode } from "@/types";
import { Eye, FileSearch, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_app/sessions")({
  head: () => ({
    meta: [{ title: "My Sessions — Medinovaqbank" }, { name: "robots", content: "noindex" }],
  }),
  component: SessionsPage,
});

function SessionsPage() {
  const { data: sessions, isLoading, isError } = useSessions();

  const [mode, setMode] = useState<"All" | QuizMode>("All");
  const [scoreMin, setScoreMin] = useState(0);

  const filtered = useMemo(() => {
    const list = sessions ?? [];
    return list.filter((s) => {
      if (mode !== "All" && s.mode !== mode) return false;
      if (!s.inProgress && s.scorePct < scoreMin) return false;
      return true;
    });
  }, [sessions, mode, scoreMin]);

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground drop-shadow-sm">
          My Sessions
        </h1>
        <p className="mt-2 text-[15px] font-medium text-muted-foreground">
          {filtered.length} session{filtered.length !== 1 ? "s" : ""} · filter by mode and score
        </p>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-4 rounded-2xl border border-white/5 bg-surface/50 p-4 shadow-[0_4px_20px_-10px_rgb(0_0_0_/_0.3)] backdrop-blur">
        <FilterSelect
          label="Mode"
          value={mode}
          onChange={(v) => setMode(v as "All" | QuizMode)}
          options={["All", "TUTOR", "QUIZ"]}
        />
        <label className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-[#00D4C8] ml-auto">
          Min Score
          <input
            type="range"
            min={0}
            max={100}
            value={scoreMin}
            onChange={(e) => setScoreMin(Number(e.target.value))}
            className="w-32 accent-[#00D4C8]"
          />
          <span className="w-12 text-right font-mono text-[15px] text-foreground">{scoreMin}%</span>
        </label>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/5 bg-surface shadow-[0_10px_30px_-10px_rgb(0_0_0_/_0.3)]">
        <div className="hidden grid-cols-[110px_minmax(0,1fr)_84px_72px_112px_210px] gap-4 border-b border-white/5 bg-surface-alt/40 px-6 py-4 text-xs font-bold uppercase tracking-widest text-muted-foreground md:grid">
          <span>Date</span>
          <span>Session</span>
          <span>Mode</span>
          <span>Score</span>
          <span>Status</span>
          <span className="text-right">Actions</span>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center gap-2 px-6 py-16 text-[15px] font-medium text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" /> Loading sessions…
          </div>
        )}
        {isError && !isLoading && (
          <div className="px-6 py-16 text-center text-[15px] font-medium text-error">
            Could not load your sessions. Please try again.
          </div>
        )}
        {!isLoading && !isError && filtered.length === 0 && (
          <div className="px-6 py-16 text-center text-[15px] font-medium text-muted-foreground">
            No sessions match these filters.
          </div>
        )}

        {!isLoading && filtered.map((s) => <SessionRow key={s.id} s={s} />)}
      </div>
    </div>
  );
}

function SessionRow({ s }: { s: SessionListItem }) {
  const date = s.completedAt ?? s.startedAt;
  return (
    <div className="group grid grid-cols-1 gap-3 border-b border-white/5 px-6 py-4 last:border-b-0 md:grid-cols-[110px_minmax(0,1fr)_84px_72px_112px_210px] md:items-center hover:bg-surface-alt/30 transition-colors">
      <span className="text-[14px] font-medium text-muted-foreground">
        {new Date(date).toLocaleDateString()}
      </span>
      <span className="truncate text-[15px] font-semibold text-primary">
        {s.totalQuestions} questions
      </span>
      <span>
        <span
          className={`inline-flex rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest ${
            s.mode === "TUTOR" ? "bg-[#3B82F6]/10 text-[#3B82F6]" : "bg-warning/10 text-warning"
          }`}
        >
          {s.mode}
        </span>
      </span>
      <span
        className={`font-mono text-[15px] font-bold tabular-nums ${
          s.inProgress
            ? "text-muted-foreground"
            : s.scorePct >= 80
              ? "text-success"
              : s.scorePct >= 60
                ? "text-warning"
                : "text-error"
        }`}
      >
        {s.inProgress ? "—" : `${s.scorePct}%`}
      </span>
      <span>
        {s.inProgress ? (
          <span className="inline-flex rounded-md bg-warning/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-widest text-warning border border-warning/20">
            In Progress
          </span>
        ) : (
          <span className="inline-flex rounded-md bg-success/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-widest text-success border border-success/20">
            Complete
          </span>
        )}
      </span>
      <div className="flex items-center gap-2 md:justify-end opacity-80 group-hover:opacity-100 transition-opacity">
        {!s.inProgress ? (
          <>
            <Link
              to="/quiz/$sessionId/results"
              params={{ sessionId: s.id }}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/10 bg-surface px-3 text-[13px] font-semibold text-foreground hover:bg-[#00D4C8]/10 hover:text-[#00D4C8] hover:border-[#00D4C8]/30 transition-all"
            >
              <Eye className="h-4 w-4" /> Results
            </Link>
            <Link
              to="/quiz/$sessionId/review"
              params={{ sessionId: s.id }}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/10 bg-surface px-3 text-[13px] font-semibold text-foreground hover:bg-[#3B82F6]/10 hover:text-[#3B82F6] hover:border-[#3B82F6]/30 transition-all"
            >
              <FileSearch className="h-4 w-4" /> Review
            </Link>
          </>
        ) : (
          <Link
            to="/quiz/$sessionId"
            params={{ sessionId: s.id }}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#00D4C8] to-[#3B82F6] px-4 text-[13px] font-bold text-white shadow-[0_0_15px_rgba(0,212,200,0.3)] hover:opacity-90 transition-all"
          >
            Resume
          </Link>
        )}
      </div>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <label className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 rounded-lg border border-white/10 bg-surface px-3 text-[14px] font-medium normal-case tracking-normal text-foreground focus:border-[#00D4C8] focus:outline-none focus:ring-1 focus:ring-[#00D4C8] transition-colors hover:border-white/20"
      >
        {options.map((o) => (
          <option key={o} value={o} className="bg-surface">
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}
