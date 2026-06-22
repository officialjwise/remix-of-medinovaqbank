import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Medal, Trophy } from "lucide-react";
import { buildLeaderboard } from "@/data/leaderboard";
import { questionBanks } from "@/data/banks";

export const Route = createFileRoute("/_app/leaderboard")({
  head: () => ({
    meta: [
      { title: "Leaderboard — Medinovaqbank" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: LeaderboardPage,
});

const PAGE_SIZE = 50;

function LeaderboardPage() {
  const [period, setPeriod] = useState<"weekly" | "monthly" | "all">("all");
  const [bank, setBank] = useState("All");
  const [page, setPage] = useState(1);
  const rows = useMemo(() => buildLeaderboard(), []);
  const you = rows.find((r) => r.isYou)!;

  const total = rows.length;
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const slice = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Leaderboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Rank against {total.toLocaleString()} active medical practitioners.
        </p>
      </header>

      {/* Your rank banner */}
      <section className="rounded-2xl bg-gradient-to-r from-primary to-[#0A1F38] p-6 text-white shadow-[var(--shadow-card-hover)]">
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-2xl">
            🏅
          </span>
          <div className="flex-1 min-w-[12rem]">
            <p className="text-xs font-bold uppercase tracking-wide text-white/70">Your Current Rank</p>
            <p className="text-3xl font-bold tracking-tight">#{you.rank}</p>
            <p className="mt-1 text-sm text-white/80">
              Score <span className="font-bold text-white">{you.avgScore}%</span> ·{" "}
              {you.questions.toLocaleString()} questions answered
            </p>
          </div>
          <div className="rounded-full bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-wide">
            Top {Math.round((you.rank / total) * 100)}% of all practitioners
          </div>
        </div>
      </section>

      {/* Filter bar */}
      <div className="mt-6 flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface p-3">
        <div className="flex rounded-lg bg-surface-alt p-1 text-xs font-semibold">
          {(["weekly", "monthly", "all"] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={`rounded-md px-3 py-1.5 capitalize transition ${
                period === p ? "bg-surface text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {p === "all" ? "All Time" : p}
            </button>
          ))}
        </div>
        <select
          value={bank}
          onChange={(e) => setBank(e.target.value)}
          className="h-9 rounded-lg border border-border bg-surface px-2.5 text-sm font-medium text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
        >
          <option value="All">All Banks</option>
          {questionBanks.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </div>

      {/* Leaderboard table */}
      <div className="mt-4 overflow-hidden rounded-xl border border-border bg-surface">
        <div className="hidden grid-cols-[60px_1fr_140px_90px_90px_90px] gap-4 border-b border-border bg-surface-alt/40 px-5 py-3 text-xs font-bold uppercase tracking-wide text-muted-foreground md:grid">
          <span>Rank</span>
          <span>User</span>
          <span>Specialty</span>
          <span className="text-right">Avg Score</span>
          <span className="text-right">Questions</span>
          <span className="text-right">Sessions</span>
        </div>
        {slice.map((r) => (
          <div
            key={r.rank}
            className={`grid grid-cols-1 items-center gap-2 border-b border-border px-5 py-3 last:border-b-0 md:grid-cols-[60px_1fr_140px_90px_90px_90px] md:gap-4 ${
              r.isYou ? "bg-accent-light/40 ring-1 ring-inset ring-accent/30" : ""
            }`}
          >
            <span className="flex items-center gap-1.5 font-bold text-foreground">
              {r.rank === 1 ? (
                <span className="inline-flex items-center gap-1 text-warning">
                  <Trophy className="h-4 w-4" /> #1
                </span>
              ) : r.rank === 2 ? (
                <span className="inline-flex items-center gap-1 text-muted-foreground">
                  <Medal className="h-4 w-4" /> #2
                </span>
              ) : r.rank === 3 ? (
                <span className="inline-flex items-center gap-1 text-error">
                  <Medal className="h-4 w-4" /> #3
                </span>
              ) : r.isYou ? (
                <span className="text-accent">→ #{r.rank}</span>
              ) : (
                <span>#{r.rank}</span>
              )}
            </span>
            <div className="flex items-center gap-3 min-w-0">
              <span className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                r.isYou ? "bg-accent text-accent-foreground" : "bg-primary text-primary-foreground"
              }`}>
                {r.initials}
              </span>
              <span className={`truncate text-sm ${r.isYou ? "font-bold text-foreground" : "font-semibold text-foreground"}`}>
                {r.isYou ? "YOU" : r.name}
              </span>
            </div>
            <span className="text-xs text-muted-foreground">{r.specialty}</span>
            <span className="text-right font-mono text-sm font-bold tabular-nums text-foreground">{r.avgScore}%</span>
            <span className="text-right font-mono text-sm tabular-nums text-muted-foreground">{r.questions.toLocaleString()}</span>
            <span className="text-right font-mono text-sm tabular-nums text-muted-foreground">{r.sessions}</span>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
        <span>Page {page} of {totalPages}</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="h-8 rounded-md border border-border bg-surface px-3 font-semibold text-foreground hover:bg-surface-alt disabled:opacity-40"
          >
            Previous
          </button>
          <button
            type="button"
            disabled={page === totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="h-8 rounded-md border border-border bg-surface px-3 font-semibold text-foreground hover:bg-surface-alt disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
