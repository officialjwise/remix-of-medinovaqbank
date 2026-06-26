import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, Download, Edit, Eye, Plus, Search, Trash2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { questionBanks } from "@/data/banks";
import { getQuestionsForBank } from "@/data/questions";
import type { Question } from "@/types";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";

export const Route = createFileRoute("/admin/banks/$bankId/questions/")({
  head: () => ({ meta: [{ title: "Admin · Questions — Medinovaqbank" }, { name: "robots", content: "noindex" }] }),
  component: AdminBankQuestions,
});

type Sort = "newest" | "oldest" | "rate-desc" | "rate-asc";

interface Row extends Question {
  correctRate: number;
}

function rateFor(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 1000;
  return 38 + (h % 58); // 38–95
}

function downloadTemplate() {
  const header = "question number,question stem,options (A-D),right option,difficulty (optional),topic (optional)";
  const blob = new Blob([`${header}\n`], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "question-bank-template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function AdminBankQuestions() {
  const { bankId } = Route.useParams();
  const navigate = useNavigate();
  const bank = questionBanks.find((b) => b.id === bankId);

  const all: Row[] = useMemo(
    () => getQuestionsForBank(bankId, 40).map((q) => ({ ...q, correctRate: rateFor(q.id) })),
    [bankId],
  );

  const [query, setQuery] = useState("");
  const [difficulty, setDifficulty] = useState("All");
  const [topic, setTopic] = useState("All");
  const [status, setStatus] = useState<"All" | "Active" | "Inactive">("All");
  const [sort, setSort] = useState<Sort>("newest");
  const [page, setPage] = useState(1);
  const perPage = 8;

  const [inactive, setInactive] = useState<Set<string>>(new Set());
  const [deleted, setDeleted] = useState<Set<string>>(new Set());
  const [preview, setPreview] = useState<Row | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Row | null>(null);

  const topics = useMemo(() => ["All", ...Array.from(new Set(all.map((q) => q.topic)))], [all]);

  const filtered = useMemo(() => {
    let rows = all.filter((q) => !deleted.has(q.id));
    if (query.trim()) {
      const s = query.toLowerCase();
      rows = rows.filter((q) => q.stem.toLowerCase().includes(s) || q.topic.toLowerCase().includes(s));
    }
    if (difficulty !== "All") rows = rows.filter((q) => q.difficulty === difficulty);
    if (topic !== "All") rows = rows.filter((q) => q.topic === topic);
    if (status !== "All") rows = rows.filter((q) => (status === "Active" ? !inactive.has(q.id) : inactive.has(q.id)));
    rows = [...rows].sort((a, b) => {
      if (sort === "rate-desc") return b.correctRate - a.correctRate;
      if (sort === "rate-asc") return a.correctRate - b.correctRate;
      if (sort === "oldest") return a.id.localeCompare(b.id);
      return b.id.localeCompare(a.id);
    });
    return rows;
  }, [all, query, difficulty, topic, status, sort, inactive, deleted]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const pageRows = filtered.slice((page - 1) * perPage, page * perPage);
  const resetPage = () => setPage(1);

  function toggleActive(id: string) {
    setInactive((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      toast.success(next.has(id) ? "Question deactivated" : "Question activated");
      return next;
    });
  }

  if (!bank) {
    return (
      <div className="rounded-xl border border-border bg-surface p-8 text-center">
        <p className="text-sm text-muted-foreground">Bank not found.</p>
        <Link to="/admin/banks" className="mt-3 inline-flex text-sm font-semibold text-primary hover:underline">← Back to banks</Link>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link to="/admin/banks" className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3.5 w-3.5" /> Banks
          </Link>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">{bank.name}</h2>
            <span className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white" style={{ background: bank.accentHex }}>{bank.subject}</span>
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">{filtered.length} of {all.length - deleted.size} questions</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={downloadTemplate} className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-surface px-4 text-sm font-semibold text-foreground hover:bg-surface-alt">
            <Download className="h-4 w-4" /> Template
          </button>
          <button onClick={() => navigate({ to: "/admin/banks/$bankId/upload", params: { bankId } })} className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-surface px-4 text-sm font-semibold text-foreground hover:bg-surface-alt">
            <Upload className="h-4 w-4" /> Upload
          </button>
          <button onClick={() => navigate({ to: "/admin/questions/create", search: { bankId } })} className="inline-flex h-10 items-center gap-2 rounded-lg bg-gradient-to-r from-primary to-accent px-4 text-sm font-bold text-white shadow-md hover:opacity-90">
            <Plus className="h-4 w-4" /> Add Question
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-5 flex flex-wrap items-center gap-2 rounded-xl border border-border bg-surface p-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); resetPage(); }}
            placeholder="Search stem or topic…"
            className="h-9 w-full rounded-lg border border-border bg-surface pl-9 pr-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <FilterSelect value={difficulty} onChange={(v) => { setDifficulty(v); resetPage(); }} options={["All", "Beginner", "Intermediate", "Advanced"]} />
        <FilterSelect value={topic} onChange={(v) => { setTopic(v); resetPage(); }} options={topics} />
        <FilterSelect value={status} onChange={(v) => { setStatus(v as typeof status); resetPage(); }} options={["All", "Active", "Inactive"]} />
        <FilterSelect
          value={sort}
          onChange={(v) => setSort(v as Sort)}
          options={["newest", "oldest", "rate-desc", "rate-asc"]}
          labels={{ newest: "Newest", oldest: "Oldest", "rate-desc": "Highest correct %", "rate-asc": "Lowest correct %" }}
        />
      </div>

      {/* Table */}
      <div className="mt-4 overflow-hidden rounded-xl border border-border bg-surface">
        <div className="hidden grid-cols-[36px_1fr_64px_70px_110px_90px_84px_92px] gap-3 border-b border-border bg-surface-alt/40 px-4 py-3 text-[10px] font-bold uppercase tracking-wide text-muted-foreground lg:grid">
          <span>#</span><span>Question</span><span className="text-center">Opts</span><span className="text-center">Correct</span><span>Difficulty</span><span className="text-right">Rate</span><span className="text-center">Status</span><span className="text-right">Actions</span>
        </div>

        {pageRows.length === 0 ? (
          <div className="px-4 py-16 text-center">
            <p className="text-sm font-semibold text-foreground">No questions found</p>
            <p className="mt-1 text-xs text-muted-foreground">Try adjusting filters, or add your first question / upload a CSV.</p>
          </div>
        ) : (
          pageRows.map((q, i) => {
            const isInactive = inactive.has(q.id);
            return (
              <div key={q.id} className="grid grid-cols-1 items-center gap-2 border-b border-border px-4 py-3 last:border-b-0 hover:bg-surface-alt/30 lg:grid-cols-[36px_1fr_64px_70px_110px_90px_84px_92px] lg:gap-3">
                <span className="font-mono text-xs text-muted-foreground">{(page - 1) * perPage + i + 1}</span>
                <span className={`truncate text-sm ${isInactive ? "text-muted-foreground line-through" : "text-foreground"}`} title={q.stem}>{q.stem}</span>
                <span className="text-center font-mono text-xs text-muted-foreground">{q.options.length}</span>
                <span className="text-center"><span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-success/10 text-xs font-bold text-success">{q.correctKey}</span></span>
                <span><DiffBadge d={q.difficulty} /></span>
                <span className="text-right">
                  <span className={`font-mono text-xs font-bold ${q.correctRate >= 75 ? "text-success" : q.correctRate >= 50 ? "text-warning" : "text-error"}`}>{q.correctRate}%</span>
                </span>
                <span className="flex justify-center">
                  <button onClick={() => toggleActive(q.id)} role="switch" aria-checked={!isInactive} className={`relative h-5 w-9 rounded-full transition-colors ${isInactive ? "bg-surface-alt" : "bg-success"}`} aria-label="Toggle active">
                    <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${isInactive ? "left-0.5" : "left-[18px]"}`} />
                  </button>
                </span>
                <div className="flex items-center justify-end gap-0.5">
                  <button onClick={() => setPreview(q)} className="rounded-md p-1.5 text-muted-foreground hover:bg-surface-alt hover:text-foreground" aria-label="View"><Eye className="h-4 w-4" /></button>
                  <Link to="/admin/banks/$bankId/questions/$questionId" params={{ bankId, questionId: q.id }} className="rounded-md p-1.5 text-muted-foreground hover:bg-surface-alt hover:text-foreground" aria-label="Edit"><Edit className="h-4 w-4" /></Link>
                  <button onClick={() => setConfirmDelete(q)} className="rounded-md p-1.5 text-muted-foreground hover:bg-error/10 hover:text-error" aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {filtered.length > perPage && (
        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
          <span>Page {page} of {totalPages}</span>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-surface hover:bg-surface-alt disabled:opacity-50">‹</button>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-surface hover:bg-surface-alt disabled:opacity-50">›</button>
          </div>
        </div>
      )}

      {/* Preview drawer */}
      {preview && <PreviewDrawer q={preview} bankId={bankId} onClose={() => setPreview(null)} />}

      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete question?"
        description="This removes the question from the bank. This cannot be undone."
        variant="destructive"
        confirmLabel="Delete"
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => {
          if (confirmDelete) setDeleted((prev) => new Set(prev).add(confirmDelete.id));
          toast.success("Question deleted");
          setConfirmDelete(null);
        }}
      />
    </div>
  );
}

function PreviewDrawer({ q, bankId, onClose }: { q: Row; bankId: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative flex h-full w-full max-w-lg flex-col bg-surface shadow-2xl">
        <header className="flex items-center justify-between border-b border-border px-5 py-4">
          <h3 className="text-sm font-bold text-foreground">Question preview</h3>
          <button onClick={onClose} className="rounded-md p-1.5 text-muted-foreground hover:bg-surface-alt hover:text-foreground"><X className="h-4 w-4" /></button>
        </header>
        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          <div className="flex flex-wrap gap-2">
            <DiffBadge d={q.difficulty} />
            <span className="rounded-full bg-surface-alt px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{q.topic}</span>
            <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${q.correctRate >= 75 ? "bg-success/10 text-success" : q.correctRate >= 50 ? "bg-warning/10 text-warning" : "bg-error/10 text-error"}`}>{q.correctRate}% correct</span>
          </div>
          <p className="text-sm font-medium leading-relaxed text-foreground">{q.stem}</p>
          <ul className="space-y-2">
            {q.options.map((o) => {
              const correct = o.key === q.correctKey;
              return (
                <li key={o.key} className={`flex items-start gap-2 rounded-lg border p-3 text-sm ${correct ? "border-success/40 bg-success/5" : "border-border"}`}>
                  <span className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${correct ? "bg-success text-white" : "bg-surface-alt text-foreground"}`}>{o.key}</span>
                  <span className="text-foreground">{o.text}</span>
                </li>
              );
            })}
          </ul>
          {q.whyCorrect && (
            <div className="rounded-lg border border-border bg-surface-alt/40 p-4">
              <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">AI explanation (preview)</p>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{q.whyCorrect}</p>
            </div>
          )}
        </div>
        <footer className="border-t border-border p-4">
          <Link to="/admin/banks/$bankId/questions/$questionId" params={{ bankId, questionId: q.id }} className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-primary to-accent text-sm font-bold text-white hover:opacity-90">
            <Edit className="h-4 w-4" /> Edit question
          </Link>
        </footer>
      </div>
    </div>
  );
}

function DiffBadge({ d }: { d: string }) {
  const tone = d === "Beginner" ? "bg-success/10 text-success" : d === "Advanced" ? "bg-error/10 text-error" : "bg-warning/10 text-warning";
  return <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${tone}`}>{d}</span>;
}

function FilterSelect({ value, onChange, options, labels }: { value: string; onChange: (v: string) => void; options: string[]; labels?: Record<string, string> }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-9 rounded-lg border border-border bg-surface px-2.5 text-sm font-medium text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
    >
      {options.map((o) => <option key={o} value={o}>{labels?.[o] ?? o}</option>)}
    </select>
  );
}
