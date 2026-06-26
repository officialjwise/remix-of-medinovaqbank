import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import {
  Medal,
  Trophy,
  Lock,
  Sparkles,
  Search,
  ArrowUp,
  ArrowDown,
  Minus,
  Crown,
  TrendingUp,
  Percent,
  Target,
  Brain,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { buildLeaderboard, type LeaderboardRow } from "@/data/leaderboard";
import { questionBanks } from "@/data/banks";
import { scoreColor } from "@/lib/quiz-results";
import { useTrial } from "@/hooks/useTrial";
import { GradientKpiCard } from "@/components/shared/GradientKpiCard";

export const Route = createFileRoute("/_app/leaderboard")({
  head: () => ({
    meta: [
      { title: "Leaderboard — Medinovaqbank" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: LeaderboardPage,
});

const PAGE_SIZE = 25;

type Period = "weekly" | "monthly" | "all";

/** Deterministic 32-bit string hash → stable pseudo-random for a given seed. */
function seededHash(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  // Map to [0, 1)
  return ((h >>> 0) % 100000) / 100000;
}

/** Stable signed integer in [-span, span] from a seed. */
function seededDelta(seed: string, span: number): number {
  return Math.round((seededHash(seed) - 0.5) * 2 * span);
}

interface DerivedRow extends LeaderboardRow {
  movement: number; // ±rank change vs. previous period snapshot
  bankId: string; // the bank this practitioner is strongest in
}

// Base cohort built once at module scope.
const BASE_ROWS = buildLeaderboard();

/**
 * Derive a stable, non-empty ranking for a given (period, bank) tab. Because
 * the underlying mock data has no per-bank/period series, we apply a seeded
 * per-row score offset keyed by the tab so each tab shows a *different but
 * reproducible* ordering — never an empty list.
 */
function deriveBoard(period: Period, bankId: string): DerivedRow[] {
  const periodWeight = period === "weekly" ? 1.8 : period === "monthly" ? 1.2 : 1;

  const enriched = BASE_ROWS.map((r, idx) => {
    // Assign every practitioner a "home" bank deterministically.
    const homeBank = questionBanks[Math.floor(seededHash(`${r.name}|home`) * questionBanks.length)].id;
    // Seeded score offset per (name + period + bank) so tabs reshuffle stably.
    const offset = seededDelta(`${r.name}|${period}|${bankId}`, 9);
    // Practitioners stronger in the selected bank get a positive nudge.
    const bankBoost = bankId !== "All" && homeBank === bankId ? 7 : 0;
    const periodVolume = Math.round(r.questions / (period === "weekly" ? 14 : period === "monthly" ? 4 : 1));

    const rawScore = r.isYou
      ? r.avgScore // keep the user's headline score stable across tabs
      : Math.max(20, Math.min(99, r.avgScore + offset + bankBoost));

    return {
      ...r,
      avgScore: rawScore,
      questions: periodVolume,
      sessions: Math.max(1, Math.round(r.sessions / (period === "weekly" ? 12 : period === "monthly" ? 3 : 1))),
      bankId: homeBank,
      _sortScore: rawScore * periodWeight + (r.isYou ? 0 : seededHash(`${r.name}|tiebreak`) ),
    };
  });

  // When a specific bank is selected, keep practitioners whose home bank matches
  // plus the current user (so "you" always appears) — fall back to all if a bank
  // would be too sparse, guaranteeing a populated tab.
  let pool = enriched;
  if (bankId !== "All") {
    const matched = enriched.filter((r) => r.bankId === bankId || r.isYou);
    pool = matched.length >= 8 ? matched : enriched;
  }

  const ranked = pool
    .slice()
    .sort((a, b) => b._sortScore - a._sortScore)
    .map((r, i) => {
      const newRank = i + 1;
      // Stable movement: compare this rank to a seeded "last period" rank.
      const movement = r.isYou
        ? seededDelta(`${r.name}|move|${period}|${bankId}`, 5)
        : seededDelta(`${r.name}|move|${period}|${bankId}`, 8);
      return { ...r, rank: newRank, movement } as DerivedRow;
    });

  return ranked;
}

/** Horizontally scrollable tab strip with arrow controls + edge fades so all
 *  per-bank tabs are reachable on any device. */
function ScrollableTabs({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (dir: number) => ref.current?.scrollBy({ left: dir * 240, behavior: "smooth" });
  return (
    <div className="relative border-b border-border">
      <button
        type="button"
        onClick={() => scroll(-1)}
        aria-label="Scroll tabs left"
        className="absolute left-0 top-0 z-10 flex h-full items-center bg-gradient-to-r from-background via-background/85 to-transparent pr-6 text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <div
        ref={ref}
        onWheel={(e) => {
          const el = e.currentTarget;
          if (el.scrollWidth > el.clientWidth && Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
            el.scrollLeft += e.deltaY;
          }
        }}
        className="flex space-x-2 overflow-x-auto scrollbar-none scroll-smooth px-8 pb-2"
      >
        {children}
      </div>
      <button
        type="button"
        onClick={() => scroll(1)}
        aria-label="Scroll tabs right"
        className="absolute right-0 top-0 z-10 flex h-full items-center bg-gradient-to-l from-background via-background/85 to-transparent pl-6 text-muted-foreground hover:text-foreground"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

function MovementBadge({ value }: { value: number }) {
  if (value === 0)
    return (
      <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-muted-foreground">
        <Minus className="h-3 w-3" /> 0
      </span>
    );
  const up = value > 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-bold ${up ? "text-success" : "text-error"}`}
    >
      {up ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
      {Math.abs(value)}
    </span>
  );
}

function LeaderboardPage() {
  const [period, setPeriod] = useState<Period>("all");
  const [bank, setBank] = useState("All");
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<DerivedRow | null>(null);

  const { isTrial, can, requireFeature } = useTrial();
  const canCompete = can("leaderboard");

  const ranked = useMemo(() => deriveBoard(period, bank), [period, bank]);
  const you = useMemo(() => ranked.find((r) => r.isYou)!, [ranked]);
  const total = ranked.length;
  const percentile = Math.max(1, Math.round(((total - you.rank + 1) / total) * 100));

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ranked;
    return ranked.filter((r) => (r.isYou ? "you" : r.name).toLowerCase().includes(q));
  }, [ranked, query]);

  const podium = ranked.slice(0, 3);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const slice = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  // Reset to page 1 whenever the active view changes.
  function changeView(fn: () => void) {
    fn();
    setPage(1);
  }

  const climbHint =
    you.rank <= 3
      ? "You're on the podium — defend your lead by keeping your accuracy above 85%."
      : `Answer ~${Math.max(80, (you.rank - 1) * 12)} more questions at high accuracy to overtake #${you.rank - 1}.`;

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Leaderboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Rank against {BASE_ROWS.length.toLocaleString()} active medical practitioners.
        </p>
      </header>

      {isTrial && !canCompete && (
        <button
          type="button"
          onClick={() => requireFeature("leaderboard")}
          className="mb-5 flex w-full items-center gap-3 rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-left transition hover:bg-warning/15"
        >
          <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-warning/20 text-warning">
            <Lock className="h-5 w-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-bold text-foreground">You can view, but not yet compete</span>
            <span className="block text-xs text-muted-foreground">Trial accounts don't appear in the rankings. Subscribe to claim your spot.</span>
          </span>
          <span className="hidden flex-shrink-0 items-center gap-1.5 rounded-lg bg-gradient-to-r from-primary to-accent px-3 py-2 text-xs font-bold text-white sm:inline-flex">
            <Sparkles className="h-3.5 w-3.5" /> Upgrade
          </span>
        </button>
      )}

      {/* Gradient KPI strip */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <GradientKpiCard
          label="Your Rank"
          value={`#${you.rank}`}
          icon={Crown}
          gradient="navy"
          sub={`of ${total.toLocaleString()} ranked`}
          trend={you.movement !== 0 ? { value: `${Math.abs(you.movement)} this ${period === "all" ? "season" : period}`, up: you.movement > 0 } : undefined}
        />
        <GradientKpiCard
          label="Percentile"
          value={`Top ${100 - percentile + 1 > 0 ? Math.max(1, 100 - percentile) : 1}%`}
          icon={Percent}
          gradient="teal"
          sub="vs. all practitioners"
        />
        <GradientKpiCard
          label="Avg Score"
          value={`${you.avgScore}%`}
          icon={Target}
          gradient="emerald"
          sub="across answered questions"
        />
        <GradientKpiCard
          label="Questions"
          value={you.questions.toLocaleString()}
          icon={Brain}
          gradient="violet"
          sub={period === "all" ? "all time" : `this ${period}`}
        />
      </div>

      {/* Your rank banner */}
      <section className="relative mt-6 overflow-hidden rounded-2xl bg-gradient-to-r from-[#080F1A] via-[#1E3A8A] to-[#0D9488] p-8 text-white shadow-[0_10px_30px_-10px_rgb(0_0_0_/_0.5)]">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none mix-blend-overlay"></div>
        <div className="relative z-10 flex flex-wrap items-center gap-6">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#3B82F6] to-[#00D4C8] text-3xl shadow-[0_0_20px_rgba(0,212,200,0.4)]">
            🏆
          </span>
          <div className="flex-1 min-w-[12rem]">
            <p className="text-xs font-bold uppercase tracking-widest text-[#00D4C8] mb-1">Your Current Rank</p>
            <p className="text-4xl font-extrabold tracking-tight drop-shadow-md flex items-center gap-3">
              #{you.rank}
              <span className="text-sm font-bold"><MovementBadge value={you.movement} /></span>
            </p>
            <p className="mt-2 text-sm text-white/80 font-medium">
              Score <span className="font-bold text-white text-[15px]">{you.avgScore}%</span> <span className="text-white/40 mx-1">•</span>{" "}
              {you.questions.toLocaleString()} questions answered
            </p>
            <p className="mt-2 max-w-xl text-xs text-[#9FE8E2]">{climbHint}</p>
          </div>
          <div className="rounded-full bg-white/10 px-5 py-2.5 text-xs font-bold uppercase tracking-widest border border-white/20 backdrop-blur-sm shadow-inner">
            Top {Math.max(1, 100 - percentile)}% of all practitioners
          </div>
        </div>
      </section>

      {/* Top-3 podium */}
      <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[1, 0, 2].map((order) => {
          const r = podium[order];
          if (!r) return <div key={order} />;
          const isFirst = r.rank === 1;
          const medal =
            r.rank === 1
              ? { ring: "from-[#F59E0B] to-[#FCD34D]", glow: "shadow-[0_0_24px_rgba(245,158,11,0.35)]", icon: <Trophy className="h-5 w-5" /> }
              : r.rank === 2
                ? { ring: "from-[#94A3B8] to-[#CBD5E1]", glow: "shadow-[0_0_20px_rgba(148,163,184,0.3)]", icon: <Medal className="h-5 w-5" /> }
                : { ring: "from-[#B45309] to-[#D97706]", glow: "shadow-[0_0_20px_rgba(217,119,6,0.3)]", icon: <Medal className="h-5 w-5" /> };
          return (
            <button
              key={order}
              type="button"
              onClick={() => setSelected(r)}
              className={`relative flex flex-col items-center rounded-2xl border bg-surface p-6 text-center transition hover:-translate-y-0.5 ${
                isFirst ? "border-warning/40 sm:-mt-3" : "border-border"
              } ${r.isYou ? "ring-2 ring-[#00D4C8]" : ""}`}
            >
              <span className={`mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${medal.ring} text-white ${medal.glow}`}>
                {medal.icon}
              </span>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">#{r.rank}</p>
              <p className={`mt-1 truncate text-sm font-bold ${r.isYou ? "text-accent" : "text-foreground"}`}>
                {r.isYou ? "You" : r.name}
              </p>
              <p className="text-xs text-muted-foreground">{r.specialty}</p>
              <p className="mt-2 font-mono text-lg font-extrabold tabular-nums text-foreground">{r.avgScore}%</p>
              <MovementBadge value={r.movement} />
            </button>
          );
        })}
      </section>

      {/* Filter bar: period tabs + search + bank tabs */}
      <div className="mt-8 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex rounded-lg bg-surface p-1 text-xs font-semibold border border-white/5 shadow-sm">
            {(["weekly", "monthly", "all"] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => changeView(() => setPeriod(p))}
                className={`rounded-md px-4 py-2 capitalize transition-all duration-300 ${
                  period === p ? "bg-[#00D4C8]/10 text-[#00D4C8] shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-surface-alt"
                }`}
              >
                {p === "all" ? "All Time" : p}
              </button>
            ))}
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => changeView(() => setQuery(e.target.value))}
              placeholder="Search practitioners…"
              className="h-9 w-full rounded-lg border border-border bg-surface pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>
        </div>

        <ScrollableTabs>
          <button
            onClick={() => changeView(() => setBank("All"))}
            className={`flex-shrink-0 px-4 py-2 text-sm font-semibold transition-all duration-300 border-b-2 whitespace-nowrap ${
              bank === "All" ? "border-accent text-accent" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            All Banks
          </button>
          {questionBanks.map((b) => (
            <button
              key={b.id}
              onClick={() => changeView(() => setBank(b.id))}
              className={`flex-shrink-0 px-4 py-2 text-sm font-semibold transition-all duration-300 border-b-2 whitespace-nowrap ${
                bank === b.id ? "border-accent text-accent" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {b.name}
            </button>
          ))}
        </ScrollableTabs>
      </div>

      {/* Leaderboard table */}
      <div className="mt-6 overflow-hidden rounded-2xl border border-white/5 bg-surface shadow-[0_10px_30px_-10px_rgb(0_0_0_/_0.3)]">
        <div className="hidden grid-cols-[70px_1fr_140px_70px_110px_100px_90px] gap-4 border-b border-white/5 bg-surface-alt/30 px-6 py-4 text-xs font-bold uppercase tracking-widest text-muted-foreground md:grid">
          <span>Rank</span>
          <span>Practitioner</span>
          <span>Specialty</span>
          <span className="text-center">Trend</span>
          <span className="text-right">Avg Score</span>
          <span className="text-right">Questions</span>
          <span className="text-right">Sessions</span>
        </div>
        {slice.length === 0 && (
          <div className="px-6 py-12 text-center text-sm text-muted-foreground">
            No practitioners match "{query}".
          </div>
        )}
        {slice.map((r) => {
          const c = scoreColor(r.avgScore);
          return (
            <button
              key={r.rank}
              type="button"
              onClick={() => setSelected(r)}
              className={`grid w-full grid-cols-1 items-center gap-3 border-b border-white/5 px-6 py-4 text-left last:border-b-0 md:grid-cols-[70px_1fr_140px_70px_110px_100px_90px] md:gap-4 transition-colors ${
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
              <span className="flex justify-center md:justify-center"><MovementBadge value={r.movement} /></span>
              <span className={`text-right font-mono text-sm font-bold tabular-nums ${c.text}`}>{r.avgScore}%</span>
              <span className="text-right font-mono text-sm font-medium tabular-nums text-foreground/80">{r.questions.toLocaleString()}</span>
              <span className="text-right font-mono text-sm font-medium tabular-nums text-foreground/80">{r.sessions}</span>
            </button>
          );
        })}
      </div>

      {/* Pagination */}
      <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Showing {slice.length} of {filtered.length.toLocaleString()} · Page {safePage} of {totalPages}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={safePage === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="h-8 rounded-md border border-border bg-surface px-3 font-semibold text-foreground hover:bg-surface-alt disabled:opacity-40"
          >
            Previous
          </button>
          <button
            type="button"
            disabled={safePage === totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="h-8 rounded-md border border-border bg-surface px-3 font-semibold text-foreground hover:bg-surface-alt disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>

      {/* Row detail popover */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="w-full max-w-md overflow-hidden rounded-t-2xl border border-border bg-surface shadow-2xl sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative bg-gradient-to-r from-[#0F2B4C] to-[#0E7C7B] p-6 text-white">
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white/80 transition hover:bg-white/20"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="flex items-center gap-4">
                <span className={`flex h-14 w-14 items-center justify-center rounded-2xl text-base font-bold ${
                  selected.isYou ? "bg-gradient-to-br from-[#3B82F6] to-[#00D4C8] text-white" : "bg-white/15 text-white"
                }`}>
                  {selected.initials}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-lg font-bold">{selected.isYou ? "You" : selected.name}</p>
                  <p className="text-sm text-white/75">{selected.specialty}</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-px bg-border">
              <DetailStat label="Rank" value={`#${selected.rank}`} />
              <DetailStat
                label="Movement"
                value={
                  selected.movement === 0 ? "No change" : `${selected.movement > 0 ? "▲" : "▼"} ${Math.abs(selected.movement)}`
                }
                tone={selected.movement === 0 ? "muted" : selected.movement > 0 ? "up" : "down"}
              />
              <DetailStat label="Avg Score" value={`${selected.avgScore}%`} />
              <DetailStat label="Questions" value={selected.questions.toLocaleString()} />
              <DetailStat label="Sessions" value={String(selected.sessions)} />
              <DetailStat
                label="Strongest Bank"
                value={questionBanks.find((b) => b.id === selected.bankId)?.name ?? "—"}
              />
            </div>
            {selected.isYou && (
              <div className="border-t border-border p-4">
                <p className="flex items-start gap-2 text-xs text-muted-foreground">
                  <TrendingUp className="mt-0.5 h-4 w-4 flex-shrink-0 text-accent" />
                  {climbHint}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function DetailStat({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "up" | "down" | "muted";
}) {
  const toneClass =
    tone === "up" ? "text-success" : tone === "down" ? "text-error" : tone === "muted" ? "text-muted-foreground" : "text-foreground";
  return (
    <div className="bg-surface p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={`mt-1 truncate text-base font-bold ${toneClass}`}>{value}</p>
    </div>
  );
}
