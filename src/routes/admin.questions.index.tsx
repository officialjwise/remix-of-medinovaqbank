import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Edit, Eye, Filter, ImageIcon, Plus, Search, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { ToggleSwitch } from "@/components/ui/toggle-switch";
import { useDebounce } from "@/hooks/useDebounce";
import {
  useAdminQuestions,
  useBulkDeleteQuestions,
  useBulkSetActiveQuestions,
  useQuestionBanksLite,
  useToggleQuestionActive,
  type AdminQuestion,
} from "@/api/questions.api";

export const Route = createFileRoute("/admin/questions/")({
  head: () => ({
    meta: [{ title: "Admin · Questions — Medinovaqbank" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminQuestions,
});

function rateTone(rate: number) {
  return rate >= 70 ? "text-success" : rate >= 40 ? "text-warning" : "text-error";
}
function ratePill(rate: number) {
  return rate >= 70
    ? "bg-success/10 text-success"
    : rate >= 40
      ? "bg-warning/10 text-warning"
      : "bg-error/10 text-error";
}

interface Row extends AdminQuestion {
  answered: number;
  rate: number;
}

function AdminQuestions() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 250);
  const [bankFilter, setBankFilter] = useState("All");
  const [imageFilter, setImageFilter] = useState<"All" | "Yes" | "No">("All");
  const [rateBucket, setRateBucket] = useState<"All" | "high" | "mid" | "low">("All");
  const [topicFilter, setTopicFilter] = useState("All");

  const { data: banks } = useQuestionBanksLite();
  // Active only — deleted/deactivated questions are hidden here (manage/restore
  // them from the per-bank questions page's "Inactive" filter).
  const { data: questionsData } = useAdminQuestions({ limit: 100, isActive: true });
  const toggleActive = useToggleQuestionActive();
  const bulkDeleteMut = useBulkDeleteQuestions();
  const bulkSetActiveMut = useBulkSetActiveQuestions();

  const allQuestions: Row[] = useMemo(
    () =>
      (questionsData?.data ?? []).map((q) => ({
        ...q,
        answered: q.timesAnswered,
        rate: q.correctRate,
      })),
    [questionsData],
  );

  const topics = useMemo(
    () => ["All", ...Array.from(new Set(allQuestions.map((q) => q.topic).filter(Boolean)))],
    [allQuestions],
  );

  const bankList = useMemo(() => banks ?? [], [banks]);
  const bankNameById = useMemo(() => new Map(bankList.map((b) => [b.id, b.name])), [bankList]);

  // Active state is server-driven; mirror locally for instant toggles.
  const [inactive, setInactive] = useState<Set<string>>(new Set());
  useEffect(() => {
    setInactive(new Set(allQuestions.filter((q) => !q.isActive).map((q) => q.id)));
  }, [allQuestions]);
  const [deleted, setDeleted] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [preview, setPreview] = useState<Row | null>(null);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);

  const rows = useMemo(() => {
    return allQuestions
      .filter((q) => !deleted.has(q.id))
      .filter((q) => q.isActive)
      .filter((q) => {
        if (bankFilter !== "All" && q.bankId !== bankFilter) return false;
        if (imageFilter !== "All" && q.hasImage !== (imageFilter === "Yes")) return false;
        if (topicFilter !== "All" && q.topic !== topicFilter) return false;
        if (rateBucket === "high" && q.rate < 70) return false;
        if (rateBucket === "mid" && (q.rate < 40 || q.rate >= 70)) return false;
        if (rateBucket === "low" && q.rate >= 40) return false;
        if (debouncedQuery.trim()) {
          const s = debouncedQuery.toLowerCase();
          return q.stem.toLowerCase().includes(s) || q.topic.toLowerCase().includes(s);
        }
        return true;
      });
  }, [allQuestions, deleted, bankFilter, imageFilter, topicFilter, rateBucket, debouncedQuery]);

  const visibleIds = rows.map((q) => q.id);
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
    toggleActive.mutate(
      { id, isActive: active },
      {
        onSuccess: () => toast.success(active ? "Question activated" : "Question deactivated"),
        onError: (err) =>
          toast.error(err instanceof Error ? err.message : "Could not update question"),
      },
    );
  }
  function bulkActivate(active: boolean) {
    const ids = [...selected];
    setInactive((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => (active ? next.delete(id) : next.add(id)));
      return next;
    });
    // One request for the whole selection — avoids the per-id PATCH storm (429).
    bulkSetActiveMut
      .mutateAsync({ ids, isActive: active })
      .then(() =>
        toast.success(
          `${ids.length} question${ids.length === 1 ? "" : "s"} ${active ? "activated" : "deactivated"}`,
        ),
      )
      .catch((err) =>
        toast.error(err instanceof Error ? err.message : "Some questions could not be updated"),
      );
    setSelected(new Set());
  }
  function bulkDelete() {
    const ids = [...selected];
    setDeleted((prev) => new Set([...prev, ...ids]));
    // One request for the whole selection — avoids the per-id DELETE storm (429).
    bulkDeleteMut
      .mutateAsync(ids)
      .then(() => toast.success(`Deleted ${ids.length} question${ids.length === 1 ? "" : "s"}`))
      .catch((err) =>
        toast.error(err instanceof Error ? err.message : "Some questions could not be deleted"),
      );
    setSelected(new Set());
    setConfirmBulkDelete(false);
  }

  return (
    <div>
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Questions</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {(allQuestions.length - deleted.size).toLocaleString()} questions across{" "}
            {bankList.length} banks
          </p>
        </div>
        <Link
          to="/admin/questions/create"
          search={{ bankId: undefined }}
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-gradient-to-r from-primary to-accent px-4 text-sm font-semibold text-white shadow-md hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Create Question
        </Link>
      </header>

      {/* Filters */}
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[240px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search questions, topics…"
            className="h-10 w-full rounded-lg border border-border bg-surface pl-9 pr-3 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </div>
        <div className="relative">
          <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <select
            value={bankFilter}
            onChange={(e) => setBankFilter(e.target.value)}
            className="h-10 rounded-lg border border-border bg-surface pl-9 pr-3 text-sm"
          >
            <option value="All">All banks</option>
            {bankList.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
        <Select value={topicFilter} onChange={setTopicFilter} options={topics} />
        <Select
          value={imageFilter}
          onChange={(v) => setImageFilter(v as typeof imageFilter)}
          options={["All", "Yes", "No"]}
          labels={{ All: "Image: any", Yes: "Has image", No: "No image" }}
        />
        <Select
          value={rateBucket}
          onChange={(v) => setRateBucket(v as typeof rateBucket)}
          options={["All", "high", "mid", "low"]}
          labels={{ All: "Correct: any", high: "≥ 70%", mid: "40–69%", low: "< 40%" }}
        />
      </div>

      {/* Bulk action bar */}
      {someSelected && (
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-accent/30 bg-accent/5 px-3 py-2">
          <span className="text-sm font-semibold text-foreground">{selected.size} selected</span>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <button
              onClick={() => bulkActivate(true)}
              className="inline-flex h-8 items-center rounded-lg border border-border bg-surface px-3 text-xs font-semibold text-foreground hover:bg-surface-alt"
            >
              Activate
            </button>
            <button
              onClick={() => bulkActivate(false)}
              className="inline-flex h-8 items-center rounded-lg border border-border bg-surface px-3 text-xs font-semibold text-foreground hover:bg-surface-alt"
            >
              Deactivate
            </button>
            <button
              onClick={() => setConfirmBulkDelete(true)}
              className="inline-flex h-8 items-center gap-1 rounded-lg bg-error/10 px-3 text-xs font-semibold text-error hover:bg-error/20"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </button>
            <button
              onClick={() => setSelected(new Set())}
              className="rounded-md p-1.5 text-muted-foreground hover:text-foreground"
              aria-label="Clear selection"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <section className="mt-6 overflow-x-auto rounded-2xl border border-border bg-surface shadow-[var(--shadow-card)]">
        {rows.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm font-semibold text-foreground">No questions found</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Try adjusting filters or create a new question.
            </p>
          </div>
        ) : (
          <table className="w-full min-w-[920px] text-sm">
            <thead className="bg-surface-alt/50 text-left text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    aria-label="Select all"
                    className="h-4 w-4 accent-[var(--color-accent)]"
                  />
                </th>
                <th className="px-4 py-3">Question</th>
                <th className="px-4 py-3">Bank</th>
                <th className="px-4 py-3">Topic</th>
                <th className="px-4 py-3">Difficulty</th>
                <th className="px-4 py-3 text-right">Answered</th>
                <th className="px-4 py-3 text-right">Correct %</th>
                <th className="px-4 py-3 text-center">Active</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((q) => {
                const bankName = bankNameById.get(q.bankId);
                const isInactive = inactive.has(q.id);
                const isSelected = selected.has(q.id);
                return (
                  <tr
                    key={q.id}
                    className={`hover:bg-surface-alt/40 ${isSelected ? "bg-accent/5" : ""}`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(q.id)}
                        aria-label="Select question"
                        className="h-4 w-4 accent-[var(--color-accent)]"
                      />
                    </td>
                    <td className="max-w-[360px] px-4 py-3">
                      <div className="flex items-center gap-2">
                        {q.hasImage && (
                          <ImageIcon
                            className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground"
                            aria-label="Has image"
                          />
                        )}
                        <span
                          className={`truncate font-medium ${isInactive ? "text-muted-foreground line-through" : "text-foreground"}`}
                          title={q.stem}
                        >
                          {q.stem}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{bankName ?? "—"}</td>
                    <td className="px-4 py-3 text-foreground/80">{q.topic || "—"}</td>
                    <td className="px-4 py-3">
                      <DiffBadge d={q.difficulty} />
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs text-muted-foreground">
                      {q.answered.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-mono text-xs font-bold ${rateTone(q.rate)}`}>
                        {q.rate}%
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center">
                        <ToggleSwitch
                          checked={!isInactive}
                          onChange={(next) => setActive(q.id, next)}
                          size="sm"
                          ariaLabel="Toggle active"
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-0.5">
                        <button
                          onClick={() => setPreview(q)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border hover:bg-surface-alt"
                          aria-label="Preview"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        <Link
                          to="/admin/banks/$bankId/questions/$questionId"
                          params={{ bankId: q.bankId, questionId: q.id }}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border hover:bg-surface-alt"
                          aria-label="Edit"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>

      {preview && <StudentPreview q={preview} onClose={() => setPreview(null)} />}

      <ConfirmDialog
        open={confirmBulkDelete}
        title={`Delete ${selected.size} question${selected.size === 1 ? "" : "s"}?`}
        description="This removes the selected questions. This cannot be undone."
        variant="destructive"
        confirmLabel="Delete"
        onCancel={() => setConfirmBulkDelete(false)}
        onConfirm={bulkDelete}
      />
    </div>
  );
}

/** Student-facing preview modal with a reveal-answer toggle. */
function StudentPreview({ q, onClose }: { q: Row; onClose: () => void }) {
  const [reveal, setReveal] = useState(false);
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-16"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-2xl bg-surface shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-border px-5 py-4">
          <h3 className="text-sm font-bold text-foreground">Student preview</h3>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
              Reveal answer
              <ToggleSwitch
                checked={reveal}
                onChange={setReveal}
                size="sm"
                ariaLabel="Reveal answer"
              />
            </label>
            <button
              onClick={onClose}
              className="rounded-md p-1.5 text-muted-foreground hover:bg-surface-alt hover:text-foreground"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>
        <div className="space-y-5 p-6">
          {q.imageUrl && (
            <img
              src={q.imageUrl}
              alt="Question illustration"
              className="max-h-72 w-full rounded-lg border border-border object-contain"
            />
          )}
          <p className="text-base font-medium leading-relaxed text-foreground">{q.stem}</p>
          <ul className="space-y-2">
            {q.options.map((o) => {
              const correct = o.key === q.correctKey;
              const showCorrect = reveal && correct;
              return (
                <li
                  key={o.key}
                  className={`flex items-start gap-3 rounded-lg border p-3 text-sm transition-colors ${showCorrect ? "border-success/50 bg-success/5" : "border-border hover:bg-surface-alt/40"}`}
                >
                  <span
                    className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${showCorrect ? "bg-success text-white" : "bg-surface-alt text-foreground"}`}
                  >
                    {o.key}
                  </span>
                  <div className="space-y-2">
                    <span className="text-foreground">{o.text}</span>
                    {o.imageUrl && (
                      <img
                        src={o.imageUrl}
                        alt={`Option ${o.key}`}
                        className="max-h-28 w-auto rounded-md border border-border object-contain"
                      />
                    )}
                  </div>
                  {showCorrect && (
                    <span className="ml-auto flex-shrink-0 rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-success">
                      Correct
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
          {reveal && (
            <div className={`rounded-lg px-3 py-2 text-xs font-semibold ${ratePill(q.rate)}`}>
              {q.rate}% of students answer this correctly · {q.answered.toLocaleString()} attempts
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DiffBadge({ d }: { d: string }) {
  const tone =
    d === "Beginner"
      ? "bg-success/10 text-success"
      : d === "Advanced"
        ? "bg-error/10 text-error"
        : "bg-warning/10 text-warning";
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${tone}`}
    >
      {d}
    </span>
  );
}

function Select({
  value,
  onChange,
  options,
  labels,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  labels?: Record<string, string>;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-10 rounded-lg border border-border bg-surface px-3 text-sm font-medium text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
    >
      {options.map((o) => (
        <option key={o} value={o}>
          {labels?.[o] ?? o}
        </option>
      ))}
    </select>
  );
}
