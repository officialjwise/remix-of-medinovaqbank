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
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#080F1A] via-[#1E3A8A] to-[#0D9488] p-8 text-white shadow-[0_10px_30px_-10px_rgb(0_0_0_/_0.5)]">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none mix-blend-overlay"></div>
        <div className="relative z-10 flex flex-wrap items-center gap-6">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#3B82F6] to-[#00D4C8] text-3xl shadow-[0_0_20px_rgba(0,212,200,0.4)]">
            🏆
          </span>
          <div className="flex-1 min-w-[12rem]">
            <p className="text-xs font-bold uppercase tracking-widest text-[#00D4C8] mb-1">Your Current Rank</p>
            <p className="text-4xl font-extrabold tracking-tight drop-shadow-md">#{you.rank}</p>
            <p className="mt-2 text-sm text-white/80 font-medium">
              Score <span className="font-bold text-white text-[15px]">{you.avgScore}%</span> <span className="text-white/40 mx-1">•</span>{" "}
              {you.questions.toLocaleString()} questions answered
            </p>
          </div>
          <div className="rounded-full bg-white/10 px-5 py-2.5 text-xs font-bold uppercase tracking-widest border border-white/20 backdrop-blur-sm shadow-inner">
            Top {Math.round((you.rank / total) * 100)}% of all practitioners
          </div>
        </div>
      </section>

      {/* Filter bar and Bank tabs */}
      <div className="mt-8 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex rounded-lg bg-surface p-1 text-xs font-semibold border border-white/5 shadow-sm">
            {(["weekly", "monthly", "all"] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className={`rounded-md px-4 py-2 capitalize transition-all duration-300 ${
                  period === p ? "bg-[#00D4C8]/10 text-[#00D4C8] shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-surface-alt"
                }`}
              >
                {p === "all" ? "All Time" : p}
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex space-x-2 overflow-x-auto scrollbar-none pb-2 border-b border-border">
          <button
            onClick={() => setBank("All")}
            className={`flex-shrink-0 px-4 py-2 text-sm font-semibold transition-all duration-300 border-b-2 whitespace-nowrap ${
              bank === "All" ? "border-[#00D4C8] text-[#00D4C8]" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            All Banks
          </button>
          {questionBanks.map((b) => (
            <button
              key={b.id}
              onClick={() => setBank(b.id)}
              className={`flex-shrink-0 px-4 py-2 text-sm font-semibold transition-all duration-300 border-b-2 whitespace-nowrap ${
                bank === b.id ? "border-[#00D4C8] text-[#00D4C8]" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {b.name}
            </button>
          ))}
        </div>
      </div>

      {/* Leaderboard table */}
      <div className="mt-6 overflow-hidden rounded-2xl border border-white/5 bg-surface shadow-[0_10px_30px_-10px_rgb(0_0_0_/_0.3)]">
        <div className="hidden grid-cols-[80px_1fr_140px_110px_100px_90px] gap-4 border-b border-white/5 bg-surface-alt/30 px-6 py-4 text-xs font-bold uppercase tracking-widest text-muted-foreground md:grid">
          <span>Rank</span>
          <span>Practitioner</span>
          <span>Specialty</span>
          <span className="text-right">Avg Score</span>
          <span className="text-right">Questions</span>
          <span className="text-right">Sessions</span>
        </div>
        {slice.map((r) => (
          <div
            key={r.rank}
            className={`grid grid-cols-1 items-center gap-3 border-b border-white/5 px-6 py-4 last:border-b-0 md:grid-cols-[80px_1fr_140px_110px_100px_90px] md:gap-4 transition-colors ${
              r.isYou ? "bg-[#00D4C8]/5 relative before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-[#00D4C8]" : "hover:bg-surface-alt/30"
            }`}
          >
            <span className="flex items-center gap-2 font-extrabold text-foreground text-lg">
              {r.rank === 1 ? (
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-warning/20 text-warning shadow-[0_0_10px_rgba(245,158,11,0.3)]">
                  <Trophy className="h-4 w-4" />
                </span>
              ) : r.rank === 2 ? (
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-400/20 text-slate-400 shadow-[0_0_10px_rgba(148,163,184,0.3)]">
                  <Medal className="h-4 w-4" />
                </span>
              ) : r.rank === 3 ? (
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-700/20 text-amber-600 shadow-[0_0_10px_rgba(217,119,6,0.3)]">
                  <Medal className="h-4 w-4" />
                </span>
              ) : r.isYou ? (
                <span className="text-[#00D4C8] w-8 text-center text-sm">#{r.rank}</span>
              ) : (
                <span className="w-8 text-center text-sm text-muted-foreground">#{r.rank}</span>
              )}
            </span>
            <div className="flex items-center gap-3 min-w-0">
              <span className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-xs font-bold shadow-sm ${
                r.isYou ? "bg-gradient-to-br from-[#3B82F6] to-[#00D4C8] text-white" : "bg-surface-alt text-foreground border border-white/5"
              }`}>
                {r.initials}
              </span>
              <span className={`truncate text-[15px] ${r.isYou ? "font-bold text-[#00D4C8]" : "font-semibold text-foreground"}`}>
                {r.isYou ? "YOU" : r.name}
              </span>
            </div>
            <span className="text-xs font-medium text-muted-foreground">{r.specialty}</span>
            <span className={`text-right font-mono text-sm font-bold tabular-nums ${r.avgScore >= 80 ? "text-success" : r.avgScore >= 60 ? "text-warning" : "text-error"}`}>{r.avgScore}%</span>
            <span className="text-right font-mono text-sm font-medium tabular-nums text-foreground/80">{r.questions.toLocaleString()}</span>
            <span className="text-right font-mono text-sm font-medium tabular-nums text-foreground/80">{r.sessions}</span>
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
