import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import {
  ArrowLeft,
  Loader2,
  RotateCcw,
  Trash2,
  Pencil,
  Plus,
  ArrowUp,
  ArrowDown,
  X,
  Check,
  FileText,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import {
  useNotesStore,
  TIER_LABELS,
  getNotePageContent,
  type NoteTier,
  type NoteStatus,
  type NoteTopic,
} from "@/stores/notesStore";
import { useExamTypesStore } from "@/stores/examTypesStore";
import { useCategoriesStore } from "@/stores/categoriesStore";
import { ToggleSwitch } from "@/components/ui/toggle-switch";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/notes/$noteId")({
  head: () => ({
    meta: [
      { title: "Admin · Manage Note — Medinovaqbank" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ManageNotePage,
});

const TIER_PILL: Record<NoteTier, string> = {
  trial_paid: "bg-success/10 text-success",
  paid_only: "bg-warning/10 text-warning",
  hidden: "bg-error/10 text-error",
};

const STATUS_PILL: Record<NoteStatus, string> = {
  ready: "bg-success/10 text-success",
  processing: "bg-warning/10 text-warning",
  failed: "bg-error/10 text-error",
};

const STATUS_LABEL: Record<NoteStatus, string> = {
  ready: "Ready",
  processing: "Processing",
  failed: "Failed",
};

function ManageNotePage() {
  const { noteId } = Route.useParams();
  const navigate = useNavigate();
  const note = useNotesStore((s) => s.getById(noteId));
  const update = useNotesStore((s) => s.update);
  const remove = useNotesStore((s) => s.remove);
  const reprocess = useNotesStore((s) => s.reprocess);
  const setTopics = useNotesStore((s) => s.setTopics);

  const [editOpen, setEditOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!note) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-10 text-center shadow-[var(--shadow-card)]">
        <p className="text-sm text-muted-foreground">Note not found.</p>
        <Link to="/admin/notes" className="mt-3 inline-flex text-sm font-semibold text-primary hover:underline">
          ← Back to notes
        </Link>
      </div>
    );
  }

  const isTrialPaid = note.tier === "trial_paid";

  const commitTopics = (next: NoteTopic[], message: string) => {
    setTopics(note.id, next);
    toast.success(message);
  };

  const moveTopic = (index: number, dir: -1 | 1) => {
    const next = [...note.topics];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    commitTopics(next, "Topic order updated");
  };

  const renameTopic = (id: string, name: string) => {
    commitTopics(
      note.topics.map((t) => (t.id === id ? { ...t, name } : t)),
      "Topic renamed",
    );
  };

  const setTopicRange = (id: string, patch: Partial<Pick<NoteTopic, "pageStart" | "pageEnd">>) => {
    commitTopics(
      note.topics.map((t) => (t.id === id ? { ...t, ...patch } : t)),
      "Topic pages updated",
    );
  };

  const toggleTopicHidden = (id: string) => {
    const topic = note.topics.find((t) => t.id === id);
    commitTopics(
      note.topics.map((t) => (t.id === id ? { ...t, hiddenForTrial: !t.hiddenForTrial } : t)),
      topic?.hiddenForTrial ? "Topic shown to trial users" : "Topic hidden from trial users",
    );
  };

  const deleteTopic = (id: string) => {
    commitTopics(
      note.topics.filter((t) => t.id !== id),
      "Topic removed",
    );
  };

  const addTopic = (name: string, pageStart: number, pageEnd: number) => {
    const next: NoteTopic = {
      id: `t-${Date.now().toString(36)}`,
      name,
      pageStart,
      pageEnd,
      hiddenForTrial: false,
    };
    commitTopics([...note.topics, next], "Topic added");
  };

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        to="/admin/notes"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Notes
      </Link>

      {/* Header */}
      <header className="mt-4 rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${TIER_PILL[note.tier]}`}>
                {TIER_LABELS[note.tier]}
              </span>
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${STATUS_PILL[note.status]}`}>
                {note.status === "processing" && <Loader2 className="h-3 w-3 animate-spin" />}
                {STATUS_LABEL[note.status]}
              </span>
              <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${note.active ? "bg-success/10 text-success" : "bg-surface-alt text-muted-foreground"}`}>
                {note.active ? "Active" : "Inactive"}
              </span>
            </div>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground">{note.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {note.category} · {note.examType} · {note.pageCount} pages · {note.subscribers.toLocaleString()} subscribers
            </p>
          </div>
          <div className="flex flex-shrink-0 flex-wrap items-center gap-2">
            <button
              onClick={() => setEditOpen(true)}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-sm font-semibold text-foreground hover:bg-surface-alt"
            >
              <Pencil className="h-4 w-4" /> Edit
            </button>
            <button
              onClick={() => {
                reprocess(note.id);
                toast.success("Reprocessing note…");
              }}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-sm font-semibold text-foreground hover:bg-surface-alt"
            >
              <RotateCcw className="h-4 w-4" /> Reprocess
            </button>
            <button
              onClick={() => setConfirmDelete(true)}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-error/30 bg-error/10 px-3 text-sm font-semibold text-error hover:bg-error/20"
            >
              <Trash2 className="h-4 w-4" /> Delete
            </button>
          </div>
        </div>
      </header>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* Page preview grouped by topic */}
        <section>
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-foreground">Page Preview</h3>
            <span className="text-xs text-muted-foreground">Admin-only · users see protected images</span>
          </div>
          {note.status === "processing" ? (
            <div className="mt-3 flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface p-12 text-center shadow-[var(--shadow-card)]">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="mt-3 text-sm font-semibold text-foreground">Converting pages…</p>
              <p className="mt-1 text-xs text-muted-foreground">The preview appears once processing completes.</p>
            </div>
          ) : (
            <PagePreview note={note} />
          )}
        </section>

        {/* Topic management */}
        <section>
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-foreground">Topics</h3>
            <span className="text-xs text-muted-foreground">{note.topics.length} total</span>
          </div>

          {!isTrialPaid && (
            <p className="mt-2 flex items-start gap-2 rounded-lg border border-border bg-surface-alt/40 px-3 py-2 text-xs text-muted-foreground">
              <Info className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-primary" />
              "Hide from trial" only applies to <span className="font-semibold text-foreground">Trial + Paid</span> notes.
              This note is <span className="font-semibold text-foreground">{TIER_LABELS[note.tier]}</span>.
            </p>
          )}

          <div className="mt-3 space-y-3">
            {note.topics.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border bg-surface p-6 text-center text-sm text-muted-foreground">
                No topics yet. Add one below.
              </p>
            ) : (
              note.topics.map((t, i) => (
                <TopicRow
                  key={t.id}
                  topic={t}
                  index={i}
                  count={note.topics.length}
                  pageCount={note.pageCount}
                  isTrialPaid={isTrialPaid}
                  onMove={moveTopic}
                  onRename={renameTopic}
                  onRange={setTopicRange}
                  onToggleHidden={toggleTopicHidden}
                  onDelete={deleteTopic}
                />
              ))
            )}
          </div>

          <AddTopicForm pageCount={note.pageCount} onAdd={addTopic} />
        </section>
      </div>

      {editOpen && (
        <EditMetadataModal
          note={note}
          onClose={() => setEditOpen(false)}
          onSave={(patch) => {
            update(note.id, patch);
            setEditOpen(false);
            toast.success("Note updated");
          }}
        />
      )}

      <ConfirmDialog
        open={confirmDelete}
        title="Delete note?"
        variant="destructive"
        confirmLabel="Delete"
        description={
          <>
            This will permanently remove <span className="font-semibold text-foreground">{note.title}</span> and all of its
            pages. This action cannot be undone.
          </>
        }
        onConfirm={() => {
          remove(note.id);
          toast.success("Note deleted");
          navigate({ to: "/admin/notes" });
        }}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page preview                                                        */
/* ------------------------------------------------------------------ */

function PagePreview({ note }: { note: ReturnType<typeof useNotesStore.getState>["notes"][number] }) {
  // Build page list grouped by the topic that owns each page.
  const groups = useMemo(() => {
    const pages = Array.from({ length: note.pageCount }, (_, i) => i + 1);
    const byTopic = new Map<string, { name: string; hiddenForTrial: boolean; pages: number[] }>();
    const order: string[] = [];
    for (const p of pages) {
      const content = getNotePageContent(note, p);
      const key = content.topicId ?? "__general__";
      if (!byTopic.has(key)) {
        const topic = note.topics.find((t) => t.id === content.topicId);
        byTopic.set(key, { name: content.topicName, hiddenForTrial: topic?.hiddenForTrial ?? false, pages: [] });
        order.push(key);
      }
      byTopic.get(key)!.pages.push(p);
    }
    return order.map((k) => ({ key: k, ...byTopic.get(k)! }));
  }, [note]);

  return (
    <div className="mt-3 space-y-5">
      {groups.map((g) => (
        <div key={g.key}>
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold text-foreground">{g.name}</h4>
            {g.hiddenForTrial && note.tier === "trial_paid" && (
              <span className="inline-flex rounded-full bg-warning/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-warning">
                Hidden for trial
              </span>
            )}
            <span className="text-xs text-muted-foreground">
              p.{g.pages[0]}–{g.pages[g.pages.length - 1]}
            </span>
          </div>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            {g.pages.map((p) => {
              const content = getNotePageContent(note, p);
              return (
                <article
                  key={p}
                  className="rounded-xl border border-border bg-surface p-3 shadow-[var(--shadow-card)]"
                >
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      <FileText className="h-3 w-3" /> Page {p}
                    </span>
                  </div>
                  <p className="mt-1.5 line-clamp-2 text-xs font-bold text-foreground">{content.heading}</p>
                  <p className="mt-1 line-clamp-3 text-[11px] leading-relaxed text-muted-foreground">
                    {content.paragraphs[0]}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Topic row                                                           */
/* ------------------------------------------------------------------ */

function TopicRow({
  topic,
  index,
  count,
  pageCount,
  isTrialPaid,
  onMove,
  onRename,
  onRange,
  onToggleHidden,
  onDelete,
}: {
  topic: NoteTopic;
  index: number;
  count: number;
  pageCount: number;
  isTrialPaid: boolean;
  onMove: (index: number, dir: -1 | 1) => void;
  onRename: (id: string, name: string) => void;
  onRange: (id: string, patch: Partial<Pick<NoteTopic, "pageStart" | "pageEnd">>) => void;
  onToggleHidden: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [name, setName] = useState(topic.name);

  return (
    <div className="rounded-xl border border-border bg-surface p-4 shadow-[var(--shadow-card)]">
      <div className="flex items-start gap-2">
        <div className="flex flex-col gap-0.5">
          <button
            onClick={() => onMove(index, -1)}
            disabled={index === 0}
            aria-label="Move up"
            className="rounded-md p-1 text-muted-foreground hover:bg-surface-alt hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ArrowUp className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onMove(index, 1)}
            disabled={index === count - 1}
            aria-label="Move down"
            className="rounded-md p-1 text-muted-foreground hover:bg-surface-alt hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ArrowDown className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="min-w-0 flex-1">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => {
              const trimmed = name.trim();
              if (!trimmed) {
                setName(topic.name);
                return;
              }
              if (trimmed !== topic.name) onRename(topic.id, trimmed);
            }}
            className="h-9 w-full rounded-lg border border-border bg-surface px-2.5 text-sm font-semibold focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            aria-label="Topic name"
          />
          <div className="mt-2 flex items-center gap-2">
            <label className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              From
              <input
                type="number"
                min={1}
                max={pageCount}
                value={topic.pageStart}
                onChange={(e) => onRange(topic.id, { pageStart: clamp(Number(e.target.value), 1, pageCount) })}
                className="h-8 w-16 rounded-lg border border-border bg-surface px-2 text-sm font-semibold text-foreground focus:border-accent focus:outline-none"
              />
            </label>
            <label className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              To
              <input
                type="number"
                min={1}
                max={pageCount}
                value={topic.pageEnd}
                onChange={(e) => onRange(topic.id, { pageEnd: clamp(Number(e.target.value), 1, pageCount) })}
                className="h-8 w-16 rounded-lg border border-border bg-surface px-2 text-sm font-semibold text-foreground focus:border-accent focus:outline-none"
              />
            </label>
          </div>
          <div className="mt-3 flex items-center justify-between gap-2 border-t border-border pt-3">
            <span className="inline-flex items-center gap-2 text-[11px] font-semibold text-muted-foreground">
              <ToggleSwitch
                size="sm"
                checked={topic.hiddenForTrial}
                disabled={!isTrialPaid}
                ariaLabel={`Hide ${topic.name} from trial users`}
                onChange={() => onToggleHidden(topic.id)}
              />
              Hidden for trial
            </span>
            <button
              onClick={() => onDelete(topic.id)}
              aria-label="Delete topic"
              className="inline-flex h-7 items-center gap-1 rounded-lg border border-error/30 bg-error/10 px-2 text-[11px] font-semibold text-error hover:bg-error/20"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AddTopicForm({
  pageCount,
  onAdd,
}: {
  pageCount: number;
  onAdd: (name: string, pageStart: number, pageEnd: number) => void;
}) {
  const [name, setName] = useState("");
  const [pageStart, setPageStart] = useState(1);
  const [pageEnd, setPageEnd] = useState(pageCount);

  const submit = () => {
    if (!name.trim()) {
      toast.error("Topic name is required");
      return;
    }
    const start = clamp(pageStart, 1, pageCount);
    const end = clamp(pageEnd, 1, pageCount);
    if (end < start) {
      toast.error("End page must be on or after the start page");
      return;
    }
    onAdd(name.trim(), start, end);
    setName("");
    setPageStart(1);
    setPageEnd(pageCount);
  };

  return (
    <div className="mt-4 rounded-xl border border-dashed border-border bg-surface-alt/30 p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Add topic</p>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Topic name"
        className="mt-2 h-9 w-full rounded-lg border border-border bg-surface px-2.5 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
      />
      <div className="mt-2 flex items-center gap-2">
        <label className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          From
          <input
            type="number"
            min={1}
            max={pageCount}
            value={pageStart}
            onChange={(e) => setPageStart(Number(e.target.value))}
            className="h-8 w-16 rounded-lg border border-border bg-surface px-2 text-sm font-semibold focus:border-accent focus:outline-none"
          />
        </label>
        <label className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          To
          <input
            type="number"
            min={1}
            max={pageCount}
            value={pageEnd}
            onChange={(e) => setPageEnd(Number(e.target.value))}
            className="h-8 w-16 rounded-lg border border-border bg-surface px-2 text-sm font-semibold focus:border-accent focus:outline-none"
          />
        </label>
        <button
          onClick={submit}
          className="ml-auto inline-flex h-8 items-center gap-1.5 rounded-lg bg-accent px-3 text-xs font-semibold text-accent-foreground hover:bg-accent/90"
        >
          <Plus className="h-3.5 w-3.5" /> Add
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Edit metadata modal                                                 */
/* ------------------------------------------------------------------ */

function EditMetadataModal({
  note,
  onClose,
  onSave,
}: {
  note: ReturnType<typeof useNotesStore.getState>["notes"][number];
  onClose: () => void;
  onSave: (patch: { title: string; description: string; category: string; examType: string; tier: NoteTier }) => void;
}) {
  const categories = useCategoriesStore((s) => s.categories);
  const examTypes = useExamTypesStore(useShallow((s) => s.examTypes.filter((e) => e.active)));

  const [title, setTitle] = useState(note.title);
  const [description, setDescription] = useState(note.description);
  const [category, setCategory] = useState(note.category);
  const [examType, setExamType] = useState(note.examType);
  const [tier, setTier] = useState<NoteTier>(note.tier);

  const save = () => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    onSave({ title: title.trim(), description: description.trim(), category, examType, tier });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-16"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div className="w-full max-w-lg rounded-2xl bg-surface shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <header className="flex items-center justify-between border-b border-border px-5 py-3">
          <h3 className="text-base font-bold text-foreground">Edit note</h3>
          <button onClick={onClose} aria-label="Close" className="rounded-md p-1 text-muted-foreground hover:bg-surface-alt hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </header>
        <div className="space-y-4 p-5">
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Title <span className="text-error">*</span>
            </span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-11 w-full rounded-lg border border-border bg-surface px-3 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-muted-foreground">Description</span>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-muted-foreground">Category</span>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="h-11 w-full rounded-lg border border-border bg-surface px-3 text-sm"
              >
                {!categories.some((c) => c.name === category) && <option value={category}>{category}</option>}
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-muted-foreground">Exam Type</span>
              <select
                value={examType}
                onChange={(e) => setExamType(e.target.value)}
                className="h-11 w-full rounded-lg border border-border bg-surface px-3 text-sm"
              >
                {!examTypes.some((e) => e.name === examType) && <option value={examType}>{examType}</option>}
                {examTypes.map((et) => (
                  <option key={et.id} value={et.name}>
                    {et.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div>
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-muted-foreground">Access Tier</span>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(TIER_LABELS) as NoteTier[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTier(t)}
                  className={cn(
                    "rounded-lg border px-2 py-2 text-xs font-semibold transition",
                    tier === t
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-border bg-surface text-muted-foreground hover:text-foreground",
                  )}
                >
                  {TIER_LABELS[t]}
                </button>
              ))}
            </div>
          </div>
        </div>
        <footer className="flex justify-end gap-2 border-t border-border px-5 py-3">
          <button
            onClick={onClose}
            className="inline-flex h-10 items-center rounded-lg border border-border bg-surface px-4 text-sm font-semibold text-foreground hover:bg-surface-alt"
          >
            Cancel
          </button>
          <button
            onClick={save}
            className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-accent px-4 text-sm font-semibold text-accent-foreground hover:bg-accent/90"
          >
            <Check className="h-4 w-4" /> Save
          </button>
        </footer>
      </div>
    </div>
  );
}

function clamp(n: number, min: number, max: number): number {
  if (Number.isNaN(n)) return min;
  return Math.min(max, Math.max(min, n));
}
