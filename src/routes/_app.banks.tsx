import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Lock, Search } from "lucide-react";
import { questionBanks } from "@/data/banks";
import { useAuthStore } from "@/stores/authStore";
import type { Difficulty, ExamType, QuestionBank } from "@/types";

export const Route = createFileRoute("/_app/banks")({
  head: () => ({
    meta: [
      { title: "Question Banks — Medinovaqbank" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: BanksPage,
});

const subjects = ["All", ...Array.from(new Set(questionBanks.map((b) => b.subject)))];
const difficulties: ("All" | Difficulty)[] = ["All", "Beginner", "Intermediate", "Advanced"];
const examTypes: ("All" | ExamType)[] = ["All", "USMLE", "PLAB", "MDCN", "MEDICAL COUNCIL", "GENERAL"];
const sorts = ["Newest", "Most Questions", "Most Sessions"] as const;

function BanksPage() {
  const subscription = useAuthStore((s) => s.subscription);
  const isLocked = !(subscription?.status === "ACTIVE");

  const [query, setQuery] = useState("");
  const [subject, setSubject] = useState("All");
  const [difficulty, setDifficulty] = useState<"All" | Difficulty>("All");
  const [exam, setExam] = useState<"All" | ExamType>("All");
  const [sort, setSort] = useState<(typeof sorts)[number]>("Newest");
  const [showUpgrade, setShowUpgrade] = useState(false);

  const filtered = useMemo(() => {
    let list = questionBanks.slice();
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (b) =>
          b.name.toLowerCase().includes(q) ||
          b.subject.toLowerCase().includes(q) ||
          b.description.toLowerCase().includes(q),
      );
    }
    if (subject !== "All") list = list.filter((b) => b.subject === subject);
    if (difficulty !== "All") list = list.filter((b) => b.difficulty === difficulty);
    if (exam !== "All") list = list.filter((b) => b.examType === exam);
    if (sort === "Newest") list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    else if (sort === "Most Questions") list.sort((a, b) => b.questionCount - a.questionCount);
    else if (sort === "Most Sessions") list.sort((a, b) => b.sessionsCount - a.sessionsCount);
    return list;
  }, [query, subject, difficulty, exam, sort]);

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Question Banks</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {filtered.length} of {questionBanks.length} banks across every major specialty.
          </p>
        </div>
        <div className="relative w-full sm:w-80">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search banks…"
            className="h-10 w-full rounded-lg border border-border bg-surface pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </div>
      </div>

      {/* Filter bar */}
      <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface p-3">
        <FilterSelect label="Subject" value={subject} onChange={setSubject} options={subjects} />
        <FilterSelect
          label="Difficulty"
          value={difficulty}
          onChange={(v) => setDifficulty(v as "All" | Difficulty)}
          options={difficulties}
        />
        <FilterSelect
          label="Exam"
          value={exam}
          onChange={(v) => setExam(v as "All" | ExamType)}
          options={examTypes}
        />
        <div className="ml-auto">
          <FilterSelect
            label="Sort"
            value={sort}
            onChange={(v) => setSort(v as (typeof sorts)[number])}
            options={sorts as unknown as string[]}
          />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((bank) => (
          <BankCard
            key={bank.id}
            bank={bank}
            locked={isLocked && !bank.isFree}
            onLockedClick={() => setShowUpgrade(true)}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="mt-10 rounded-xl border border-dashed border-border bg-surface p-10 text-center">
          <p className="text-sm text-muted-foreground">No banks match those filters.</p>
        </div>
      )}

      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} />}
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
    <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 rounded-lg border border-border bg-surface px-2.5 text-sm font-medium normal-case tracking-normal text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}

function BankCard({
  bank,
  locked,
  onLockedClick,
}: {
  bank: QuestionBank;
  locked: boolean;
  onLockedClick: () => void;
}) {
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-[var(--shadow-card)] transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-hover)]">
      <div
        className={`h-2 bg-gradient-to-r ${bank.subjectColor}`}
        aria-hidden
      />
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center gap-2">
          <span
            className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white"
            style={{ backgroundColor: bank.accentHex }}
          >
            {bank.subject}
          </span>
          <span className="rounded-full border border-border bg-surface-alt px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            {bank.difficulty}
          </span>
          {bank.isFree && (
            <span className="rounded-full bg-success-light px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-success">
              Free
            </span>
          )}
        </div>

        <h3 className="mt-3 line-clamp-1 text-[18px] font-bold tracking-tight text-foreground">
          {bank.name}
        </h3>
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{bank.description}</p>

        <div className="mt-4 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{bank.questionCount.toLocaleString()}</span>
          <span>questions</span>
          <span>·</span>
          <span className="font-medium text-foreground">{bank.sessionsCount.toLocaleString()}</span>
          <span>sessions</span>
        </div>

        <div className="mt-5 flex items-center gap-2">
          <Link
            to="/quiz/configure/$bankId"
            params={{ bankId: bank.id }}
            className="inline-flex h-9 items-center justify-center rounded-lg bg-accent px-3.5 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent/90"
          >
            Start Quiz
          </Link>
          <Link
            to="/quiz/configure/$bankId"
            params={{ bankId: bank.id }}
            className="text-sm font-semibold text-accent hover:underline"
          >
            View Questions →
          </Link>
        </div>
      </div>

      {locked && (
        <button
          type="button"
          onClick={onLockedClick}
          className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-surface/60 backdrop-blur-sm transition-opacity"
          aria-label={`Unlock ${bank.name}`}
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-foreground text-background">
            <Lock className="h-5 w-5" />
          </span>
          <span className="text-sm font-semibold text-foreground">Subscribe to unlock</span>
        </button>
      )}
    </article>
  );
}

function UpgradeModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal>
      <div className="absolute inset-0 bg-foreground/40" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-surface p-6 shadow-[var(--shadow-card-hover)]">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent-light text-accent">
          <Lock className="h-6 w-6" />
        </div>
        <h2 className="mt-4 text-center text-xl font-bold text-foreground">
          Upgrade to unlock all question banks
        </h2>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Get unlimited access to every bank, AI tutor explanations, and full analytics.
        </p>
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-10 flex-1 rounded-lg border border-border bg-surface text-sm font-semibold text-foreground hover:bg-surface-alt"
          >
            Not now
          </button>
          <Link
            to="/pricing"
            className="inline-flex h-10 flex-1 items-center justify-center rounded-lg bg-accent text-sm font-semibold text-accent-foreground hover:bg-accent/90"
          >
            See Pricing
          </Link>
        </div>
      </div>
    </div>
  );
}
