import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Edit, Plus, Trash2, FileText, Upload, Search, X } from "lucide-react";
import { toast } from "sonner";
import { questionBanks } from "@/data/banks";
import { ToggleSwitch } from "@/components/ui/toggle-switch";
import type { Difficulty, ExamType } from "@/types";

export const Route = createFileRoute("/admin/banks/")({
  head: () => ({
    meta: [{ title: "Admin · Banks — Medinovaqbank" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminBanks,
});

interface BankDraft {
  id?: string;
  name: string;
  subject: string;
  examType: ExamType;
  description: string;
  difficulty: Difficulty;
  isActive: boolean;
}

const emptyDraft: BankDraft = {
  name: "",
  subject: "Internal Medicine",
  examType: "USMLE",
  description: "",
  difficulty: "Intermediate",
  isActive: true,
};

const SUBJECTS = [
  "Internal Medicine",
  "Surgery",
  "OB/GYN",
  "Paediatrics",
  "Pharmacology",
  "Pathology",
  "Radiology",
  "Psychiatry",
  "Anatomy",
];
const EXAM_TYPES: ExamType[] = ["USMLE", "PLAB", "MDCN", "MEDICAL COUNCIL", "GENERAL"];
const DIFFICULTIES: Difficulty[] = ["Beginner", "Intermediate", "Advanced"];

function AdminBanks() {
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("All");
  const [difficultyFilter, setDifficultyFilter] = useState<"All" | Difficulty>("All");
  const [activeFilters, setActiveFilters] = useState<Record<string, boolean>>({});

  const totalQuestions = questionBanks.reduce((s, b) => s + b.questionCount, 0);
  const activeBanks = questionBanks.length;

  const subjects = useMemo(
    () => ["All", ...Array.from(new Set(questionBanks.map((b) => b.subject)))],
    [],
  );

  const filtered = questionBanks.filter((b) => {
    if (subjectFilter !== "All" && b.subject !== subjectFilter) return false;
    if (difficultyFilter !== "All" && b.difficulty !== difficultyFilter) return false;
    if (query.trim()) {
      const s = query.toLowerCase();
      if (!b.name.toLowerCase().includes(s) && !b.description.toLowerCase().includes(s))
        return false;
    }
    return true;
  });

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Question Banks</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{activeBanks} banks</span> ·{" "}
            {totalQuestions.toLocaleString()} questions · {activeBanks} active
          </p>
        </div>
        <Link
          to="/admin/banks/create"
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-gradient-to-r from-[#0E7C7B] to-[#2BC97F] px-4 text-sm font-semibold text-white shadow-md hover:opacity-95"
        >
          <Plus className="h-4 w-4" /> Create New Bank
        </Link>
      </div>

      {/* Toolbar */}
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[240px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search banks…"
            className="h-10 w-full rounded-lg border border-border bg-surface pl-9 pr-3 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </div>
        <select
          value={subjectFilter}
          onChange={(e) => setSubjectFilter(e.target.value)}
          className="h-10 rounded-lg border border-border bg-surface px-3 text-sm"
        >
          {subjects.map((s) => (
            <option key={s} value={s}>
              {s === "All" ? "All subjects" : s}
            </option>
          ))}
        </select>
        <select
          value={difficultyFilter}
          onChange={(e) => setDifficultyFilter(e.target.value as typeof difficultyFilter)}
          className="h-10 rounded-lg border border-border bg-surface px-3 text-sm"
        >
          <option value="All">All difficulties</option>
          {DIFFICULTIES.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>

      {/* Bank cards grid */}
      {filtered.length === 0 ? (
        <div className="mt-12 rounded-2xl border border-dashed border-border bg-surface p-12 text-center text-sm text-muted-foreground">
          No banks match those filters.
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((b) => {
            const isActive = activeFilters[b.id] !== false;
            const difficultyPct =
              b.difficulty === "Beginner" ? 33 : b.difficulty === "Intermediate" ? 66 : 100;
            return (
              <article
                key={b.id}
                className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-[var(--shadow-card)] transition-all hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-14px_rgb(14_124_123_/_0.25)]"
              >
                <div className={`h-1.5 w-full bg-gradient-to-r ${b.subjectColor}`} />
                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-start justify-between gap-3">
                    <span
                      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white"
                      style={{ background: b.accentHex }}
                    >
                      {b.subject}
                    </span>
                    <span className="inline-flex items-center gap-2 text-[11px] font-semibold text-muted-foreground">
                      <ToggleSwitch
                        size="sm"
                        checked={isActive}
                        ariaLabel={`Toggle ${b.name} active`}
                        onChange={() => {
                          setActiveFilters((f) => ({ ...f, [b.id]: !isActive }));
                          toast.success(`${b.name} ${!isActive ? "activated" : "paused"}`);
                        }}
                      />
                      {isActive ? "Active" : "Paused"}
                    </span>
                  </div>

                  <h3 className="mt-3 text-lg font-bold tracking-tight text-foreground">
                    {b.name}
                  </h3>
                  <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">
                    {b.description}
                  </p>

                  <div className="my-4 border-t border-border" />

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <Metric label="Questions" value={b.questionCount.toLocaleString()} />
                    <Metric label="Sessions" value={b.sessionsCount.toLocaleString()} />
                    <Metric label="Exam" value={b.examType} />
                  </div>

                  <div className="mt-4">
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                      <span>Difficulty</span>
                      <span style={{ color: b.accentHex }}>{b.difficulty}</span>
                    </div>
                    <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-surface-alt">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${difficultyPct}%`, background: b.accentHex }}
                      />
                    </div>
                  </div>

                  <div className="mt-5 flex items-center gap-1.5 border-t border-border pt-4">
                    <Link
                      to="/admin/banks/$bankId/questions"
                      params={{ bankId: b.id }}
                      className="inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg bg-surface-alt text-xs font-semibold text-foreground hover:bg-surface-alt/70"
                    >
                      <FileText className="h-3.5 w-3.5" /> Manage
                    </Link>
                    <Link
                      to="/admin/banks/$bankId/upload"
                      params={{ bankId: b.id }}
                      className="inline-flex h-8 items-center justify-center rounded-lg border border-border bg-surface px-2.5 text-xs font-semibold text-muted-foreground hover:bg-surface-alt hover:text-foreground"
                      aria-label="Upload"
                      title="Upload"
                    >
                      <Upload className="h-3.5 w-3.5" />
                    </Link>
                    <Link
                      to="/admin/banks/$bankId/edit"
                      params={{ bankId: b.id }}
                      className="inline-flex h-8 items-center justify-center rounded-lg border border-border bg-surface px-2.5 text-xs font-semibold text-muted-foreground hover:bg-surface-alt hover:text-foreground"
                      aria-label="Edit"
                      title="Edit"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </Link>
                    <button
                      onClick={() => setConfirmDelete(b.id)}
                      className="inline-flex h-8 items-center justify-center rounded-lg border border-error/30 bg-error-light/40 px-2.5 text-xs font-semibold text-error hover:bg-error-light"
                      aria-label="Delete"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Delete confirmation */}
      {confirmDelete && (
        <Modal title="Delete bank?" onClose={() => setConfirmDelete(null)}>
          <p className="text-sm text-muted-foreground">
            This will permanently remove the bank and all its questions. This action cannot be
            undone.
          </p>
          <div className="mt-6 flex justify-end gap-2">
            <button
              onClick={() => setConfirmDelete(null)}
              className="inline-flex h-10 items-center rounded-lg border border-border bg-surface px-4 text-sm font-semibold text-foreground hover:bg-surface-alt"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                toast.success("Bank deleted");
                setConfirmDelete(null);
              }}
              className="inline-flex h-10 items-center rounded-lg bg-error px-4 text-sm font-semibold text-white hover:bg-error/90"
            >
              <Trash2 className="mr-1.5 h-4 w-4" /> Delete
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-16"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-surface shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-border px-5 py-3">
          <h3 className="text-base font-bold text-foreground">{title}</h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1 text-muted-foreground hover:bg-surface-alt hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </header>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-bold tabular-nums text-foreground">{value}</p>
    </div>
  );
}
