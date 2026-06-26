import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Copy, Download, Edit, Eye, GripVertical, ImageIcon, Plus, Search, Trash2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { questionBanks } from "@/data/banks";
import { getQuestionsForBank } from "@/data/questions";
import type { Difficulty, Question } from "@/types";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { ToggleSwitch } from "@/components/ui/toggle-switch";
import { useDebounce } from "@/hooks/useDebounce";

export const Route = createFileRoute("/admin/banks/$bankId/questions/")({
  head: () => ({ meta: [{ title: "Admin · Questions — Medinovaqbank" }, { name: "robots", content: "noindex" }] }),
  component: AdminBankQuestions,
});

type Sort = "manual" | "newest" | "oldest" | "rate-desc" | "rate-asc";
const DIFFICULTIES: Difficulty[] = ["Beginner", "Intermediate", "Advanced"];

interface Row extends Question {
  correctRate: number;
  answered: number;
  hasImage: boolean;
}

/** Deterministic answer stats seeded from the question id. */
function statsFor(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 100000;
  return { rate: 18 + (h % 78), answered: 40 + ((h >> 3) % 1960) };
}
function seededHasImage(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 17 + id.charCodeAt(i)) % 100000;
  return h % 3 === 0;
}
function rateTone(rate: number) {
  return rate >= 70 ? "text-success" : rate >= 40 ? "text-warning" : "text-error";
}
function ratePill(rate: number) {
  return rate >= 70 ? "bg-success/10 text-success" : rate >= 40 ? "bg-warning/10 text-warning" : "bg-error/10 text-error";
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
    () =>
      getQuestionsForBank(bankId, 40).map((q) => {
        const s = statsFor(q.id);
        return { ...q, correctRate: s.rate, answered: s.answered, hasImage: !!q.imageUrl || seededHasImage(q.id) };
      }),
    [bankId],
  );

  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 250);
  const [difficulty, setDifficulty] = useState("All");
  const [topic, setTopic] = useState("All");
  const [status, setStatus] = useState<"All" | "Active" | "Inactive">("All");
  const [imageFilter, setImageFilter] = useState<"All" | "Yes" | "No">("All");
  const [rateBucket, setRateBucket] = useState<"All" | "high" | "mid" | "low">("All");
  const [sort, setSort] = useState<Sort>("manual");
  const [page, setPage] = useState(1);
  const perPage = 8;

  const [order, setOrder] = useState<string[]>(() => all.map((q) => q.id));
  useEffect(() => { setOrder(all.map((q) => q.id)); }, [all]);

  const [inactive, setInactive] = useState<Set<string>>(new Set());
  const [deleted, setDeleted] = useState<Set<string>>(new Set());
  const [overrides, setOverrides] = useState<Record<string, { difficulty?: Difficulty; topic?: string }>>({});
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [preview, setPreview] = useState<Row | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Row | null>(null);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);

  const byId = useMemo(() => new Map(all.map((q) => [q.id, q])), [all]);
  const topics = useMemo(() => ["All", ...Array.from(new Set(all.map((q) => q.topic)))], [all]);

  const filtered = useMemo(() => {
    let rows = order
      .map((id) => byId.get(id))
      .filter((q): q is Row => !!q && !deleted.has(q.id))
      .map((q) => ({ ...q, ...overrides[q.id] }));
    if (debouncedQuery.trim()) {
      const s = debouncedQuery.toLowerCase();
      rows = rows.filter((q) => q.stem.toLowerCase().includes(s) || q.topic.toLowerCase().includes(s));
    }
    if (difficulty !== "All") rows = rows.filter((q) => q.difficulty === difficulty);
    if (topic !== "All") rows = rows.filter((q) => q.topic === topic);
    if (status !== "All") rows = rows.filter((q) => (status === "Active" ? !inactive.has(q.id) : inactive.has(q.id)));
    if (imageFilter !== "All") rows = rows.filter((q) => q.hasImage === (imageFilter === "Yes"));
    if (rateBucket === "high") rows = rows.filter((q) => q.correctRate >= 70);
    if (rateBucket === "mid") rows = rows.filter((q) => q.correctRate >= 40 && q.correctRate < 70);
    if (rateBucket === "low") rows = rows.filter((q) => q.correctRate < 40);
    if (sort !== "manual") {
      rows = [...rows].sort((a, b) => {
        if (sort === "rate-desc") return b.correctRate - a.correctRate;
        if (sort === "rate-asc") return a.correctRate - b.correctRate;
        if (sort === "oldest") return a.id.localeCompare(b.id);
        return b.id.localeCompare(a.id);
      });
    }
    return rows;
  }, [order, byId, deleted, overrides, debouncedQuery, difficulty, topic, status, imageFilter, rateBucket, sort, inactive]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const pageRows = filtered.slice((page - 1) * perPage, page * perPage);
  const resetPage = () => setPage(1);
  // Manual reordering only makes sense on an unfiltered, manually-sorted, single page view.
  const canDrag =
    sort === "manual" && !debouncedQuery.trim() && difficulty === "All" && topic === "All" && status === "All" && imageFilter === "All" && rateBucket === "All";

  const visibleIds = pageRows.map((q) => q.id);
  const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selected.has(id));
  const someSelected = selected.size > 0;

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  function toggleSelectAll() {
    setSelected((prev) => {
      if (visibleIds.every((id) => prev.has(id))) {
        const next = new Set(prev);
        visibleIds.forEach((id) => next.delete(id));
        return next;
      }
      return new Set([...prev, ...visibleIds]);
    });
  }
  function setActive(id: string, active: boolean) {
    setInactive((prev) => {
      const next = new Set(prev);
      if (active) next.delete(id);
      else next.add(id);
      return next;
    });
    toast.success(active ? "Question activated" : "Question deactivated");
  }
  function bulkActivate(active: boolean) {
    setInactive((prev) => {
      const next = new Set(prev);
      selected.forEach((id) => (active ? next.delete(id) : next.add(id)));
      return next;
    });
    toast.success(`${selected.size} question${selected.size === 1 ? "" : "s"} ${active ? "activated" : "deactivated"}`);
  }
  function bulkMove(targetBankId: string) {
    if (!targetBankId) return;
    const target = questionBanks.find((b) => b.id === targetBankId);
    toast.success(`Moved ${selected.size} question${selected.size === 1 ? "" : "s"} to ${target?.name ?? "bank"}`);
    setSelected(new Set());
  }
  function bulkDelete() {
    setDeleted((prev) => new Set([...prev, ...selected]));
    toast.success(`Deleted ${selected.size} question${selected.size === 1 ? "" : "s"}`);
    setSelected(new Set());
    setConfirmBulkDelete(false);
  }
  function duplicate(id: string) {
    void id;
    toast.success("Question duplicated");
  }
  function quickEdit(id: string, patch: { difficulty?: Difficulty; topic?: string }) {
    setOverrides((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
    toast.success(patch.difficulty ? "Difficulty updated" : "Topic updated");
  }
  function onDrop(targetId: string) {
    if (!dragId || dragId === targetId) { setDragId(null); return; }
    setOrder((prev) => {
      const next = [...prev];
      const from = next.indexOf(dragId);
      const to = next.indexOf(targetId);
      if (from === -1 || to === -1) return prev;
      next.splice(to, 0, next.splice(from, 1)[0]);
      return next;
    });
    setDragId(null);
    toast.success("Question order updated");
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
        <FilterSelect value={imageFilter} onChange={(v) => { setImageFilter(v as typeof imageFilter); resetPage(); }} options={["All", "Yes", "No"]} labels={{ All: "Image: any", Yes: "Has image", No: "No image" }} />
        <FilterSelect value={rateBucket} onChange={(v) => { setRateBucket(v as typeof rateBucket); resetPage(); }} options={["All", "high", "mid", "low"]} labels={{ All: "Correct: any", high: "≥ 70%", mid: "40–69%", low: "< 40%" }} />
        <FilterSelect
          value={sort}
          onChange={(v) => setSort(v as Sort)}
          options={["manual", "newest", "oldest", "rate-desc", "rate-asc"]}
          labels={{ manual: "Manual order", newest: "Newest", oldest: "Oldest", "rate-desc": "Highest correct %", "rate-asc": "Lowest correct %" }}
        />
      </div>

      {/* Bulk action bar */}
      {someSelected && (
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-accent/30 bg-accent/5 px-3 py-2">
          <span className="text-sm font-semibold text-foreground">{selected.size} selected</span>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <button onClick={() => bulkActivate(true)} className="inline-flex h-8 items-center rounded-lg border border-border bg-surface px-3 text-xs font-semibold text-foreground hover:bg-surface-alt">Activate</button>
            <button onClick={() => bulkActivate(false)} className="inline-flex h-8 items-center rounded-lg border border-border bg-surface px-3 text-xs font-semibold text-foreground hover:bg-surface-alt">Deactivate</button>
            <select
              defaultValue=""
              onChange={(e) => { bulkMove(e.target.value); e.target.value = ""; }}
              className="h-8 rounded-lg border border-border bg-surface px-2 text-xs font-semibold text-foreground"
            >
              <option value="">Move to bank…</option>
              {questionBanks.filter((b) => b.id !== bankId).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            <button onClick={() => setConfirmBulkDelete(true)} className="inline-flex h-8 items-center gap-1 rounded-lg bg-error/10 px-3 text-xs font-semibold text-error hover:bg-error/20">
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </button>
            <button onClick={() => setSelected(new Set())} className="rounded-md p-1.5 text-muted-foreground hover:text-foreground" aria-label="Clear selection"><X className="h-4 w-4" /></button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="mt-4 overflow-x-auto rounded-xl border border-border bg-surface">
        <div className="hidden min-w-[860px] grid-cols-[32px_28px_1fr_64px_110px_84px_84px_70px_120px] gap-3 border-b border-border bg-surface-alt/40 px-4 py-3 text-[10px] font-bold uppercase tracking-wide text-muted-foreground lg:grid">
          <span><input type="checkbox" checked={allSelected} onChange={toggleSelectAll} aria-label="Select all" className="h-4 w-4 accent-[var(--color-accent)]" /></span>
          <span></span>
          <span>Question</span>
          <span className="text-center">Correct</span>
          <span>Difficulty</span>
          <span className="text-right">Answered</span>
          <span className="text-right">Rate</span>
          <span className="text-center">Active</span>
          <span className="text-right">Actions</span>
        </div>

        {pageRows.length === 0 ? (
          <div className="px-4 py-16 text-center">
            <p className="text-sm font-semibold text-foreground">No questions found</p>
            <p className="mt-1 text-xs text-muted-foreground">Try adjusting filters, or add your first question / upload a CSV.</p>
          </div>
        ) : (
          pageRows.map((q) => {
            const isInactive = inactive.has(q.id);
            const isSelected = selected.has(q.id);
            return (
              <div
                key={q.id}
                draggable={canDrag}
                onDragStart={() => canDrag && setDragId(q.id)}
                onDragOver={(e) => { if (canDrag) e.preventDefault(); }}
                onDrop={() => canDrag && onDrop(q.id)}
                className={`grid grid-cols-1 items-center gap-2 border-b border-border px-4 py-3 last:border-b-0 hover:bg-surface-alt/30 lg:grid-cols-[32px_28px_1fr_64px_110px_84px_84px_70px_120px] lg:gap-3 ${dragId === q.id ? "opacity-50" : ""} ${isSelected ? "bg-accent/5" : ""}`}
              >
                <span><input type="checkbox" checked={isSelected} onChange={() => toggleSelect(q.id)} aria-label="Select question" className="h-4 w-4 accent-[var(--color-accent)]" /></span>
                <span
                  className={`flex items-center ${canDrag ? "cursor-grab text-muted-foreground active:cursor-grabbing" : "cursor-not-allowed text-muted-foreground/40"}`}
                  title={canDrag ? "Drag to reorder" : "Clear filters & use Manual order to reorder"}
                >
                  <GripVertical className="h-4 w-4" />
                </span>
                <span className="flex min-w-0 items-center gap-2">
                  {q.hasImage && <ImageIcon className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" aria-label="Has image" />}
                  <span className={`truncate text-sm ${isInactive ? "text-muted-foreground line-through" : "text-foreground"}`} title={q.stem}>{q.stem}</span>
                </span>
                <span className="text-center"><span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-success/10 text-xs font-bold text-success">{q.correctKey}</span></span>
                <span><InlineDifficulty value={q.difficulty} onChange={(d) => quickEdit(q.id, { difficulty: d })} /></span>
                <span className="text-right font-mono text-xs text-muted-foreground">{q.answered.toLocaleString()}</span>
                <span className="text-right">
                  <span className={`font-mono text-xs font-bold ${rateTone(q.correctRate)}`}>{q.correctRate}%</span>
                </span>
                <span className="flex justify-center">
                  <ToggleSwitch checked={!isInactive} onChange={(next) => setActive(q.id, next)} size="sm" ariaLabel="Toggle active" />
                </span>
                <div className="flex items-center justify-end gap-0.5">
                  <button onClick={() => setPreview(q)} className="rounded-md p-1.5 text-muted-foreground hover:bg-surface-alt hover:text-foreground" aria-label="Preview"><Eye className="h-4 w-4" /></button>
                  <Link to="/admin/banks/$bankId/questions/$questionId" params={{ bankId, questionId: q.id }} className="rounded-md p-1.5 text-muted-foreground hover:bg-surface-alt hover:text-foreground" aria-label="Edit"><Edit className="h-4 w-4" /></Link>
                  <button onClick={() => duplicate(q.id)} className="rounded-md p-1.5 text-muted-foreground hover:bg-surface-alt hover:text-foreground" aria-label="Duplicate"><Copy className="h-4 w-4" /></button>
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

      <ConfirmDialog
        open={confirmBulkDelete}
        title={`Delete ${selected.size} question${selected.size === 1 ? "" : "s"}?`}
        description="This removes the selected questions from the bank. This cannot be undone."
        variant="destructive"
        confirmLabel="Delete"
        onCancel={() => setConfirmBulkDelete(false)}
        onConfirm={bulkDelete}
      />
    </div>
  );
}

function PreviewDrawer({ q, bankId, onClose }: { q: Row; bankId: string; onClose: () => void }) {
  const [reveal, setReveal] = useState(false);
  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative flex h-full w-full max-w-lg flex-col bg-surface shadow-2xl">
        <header className="flex items-center justify-between border-b border-border px-5 py-4">
          <h3 className="text-sm font-bold text-foreground">Student preview</h3>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
              Reveal answer
              <ToggleSwitch checked={reveal} onChange={setReveal} size="sm" ariaLabel="Reveal answer" />
            </label>
            <button onClick={onClose} className="rounded-md p-1.5 text-muted-foreground hover:bg-surface-alt hover:text-foreground" aria-label="Close"><X className="h-4 w-4" /></button>
          </div>
        </header>
        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          <div className="flex flex-wrap gap-2">
            <DiffBadge d={q.difficulty} />
            <span className="rounded-full bg-surface-alt px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{q.topic}</span>
            <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${ratePill(q.correctRate)}`}>{q.correctRate}% correct · {q.answered.toLocaleString()} answered</span>
          </div>
          {q.imageUrl && <img src={q.imageUrl} alt="Question illustration" className="max-h-64 w-full rounded-lg border border-border object-contain" />}
          <p className="text-sm font-medium leading-relaxed text-foreground">{q.stem}</p>
          <ul className="space-y-2">
            {q.options.map((o) => {
              const correct = o.key === q.correctKey;
              const showCorrect = reveal && correct;
              return (
                <li key={o.key} className={`flex items-start gap-2 rounded-lg border p-3 text-sm ${showCorrect ? "border-success/40 bg-success/5" : "border-border"}`}>
                  <span className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${showCorrect ? "bg-success text-white" : "bg-surface-alt text-foreground"}`}>{o.key}</span>
                  <div className="space-y-2">
                    <span className="text-foreground">{o.text}</span>
                    {o.imageUrl && <img src={o.imageUrl} alt={`Option ${o.key}`} className="max-h-28 w-auto rounded-md border border-border object-contain" />}
                  </div>
                  {showCorrect && <span className="ml-auto flex-shrink-0 rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-success">Correct</span>}
                </li>
              );
            })}
          </ul>
          {reveal && q.whyCorrect && (
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

function InlineDifficulty({ value, onChange }: { value: Difficulty; onChange: (d: Difficulty) => void }) {
  const tone = value === "Beginner" ? "bg-success/10 text-success" : value === "Advanced" ? "bg-error/10 text-error" : "bg-warning/10 text-warning";
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as Difficulty)}
      aria-label="Quick-edit difficulty"
      className={`cursor-pointer rounded-full border-0 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide outline-none focus:ring-2 focus:ring-accent/30 ${tone}`}
    >
      {DIFFICULTIES.map((d) => <option key={d} value={d}>{d}</option>)}
    </select>
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
