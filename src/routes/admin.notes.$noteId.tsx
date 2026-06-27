import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
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
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import {
  useAdminNote,
  useUpdateNote,
  useDeleteNote,
  useReprocessNote,
  useUpdateNoteTopics,
  useUpdateNotePage,
  TIER_LABELS,
  STATUS_LABELS,
  type AdminNoteDetail,
  type AdminNoteTopic,
  type AdminNotePage,
  type NoteTier,
  type NoteStatus,
  type TopicInput,
} from "@/api/admin-notes.api";
import { notesApi } from "@/api/notes.api";
import { useExamTypes } from "@/api/exam-types.api";
import { useCategories } from "@/api/categories.api";
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
  trial_and_paid: "bg-success/10 text-success",
  paid_only: "bg-warning/10 text-warning",
  none: "bg-error/10 text-error",
};

const STATUS_PILL: Record<NoteStatus, string> = {
  ready: "bg-success/10 text-success",
  processing: "bg-warning/10 text-warning",
  failed: "bg-error/10 text-error",
};

/** Map the FE topic set back to the backend upsert payload (preserving ids). */
function toTopicInputs(topics: AdminNoteTopic[]): TopicInput[] {
  return topics.map((t, i) => ({
    id: t.id,
    title: t.title,
    sortOrder: i,
    isHiddenForTrial: t.isHiddenForTrial,
  }));
}

function ManageNotePage() {
  const { noteId } = Route.useParams();
  const navigate = useNavigate();
  const { data: note, isLoading, isError } = useAdminNote(noteId);
  const { data: categories = [] } = useCategories();
  const { data: examTypes = [] } = useExamTypes();

  const updateNote = useUpdateNote();
  const deleteNote = useDeleteNote();
  const reprocess = useReprocessNote();
  const updateTopics = useUpdateNoteTopics();
  const updatePage = useUpdateNotePage();

  const [editOpen, setEditOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const categoryName = useMemo(() => {
    const map = new Map(categories.map((c) => [c.id, c.name]));
    return (id: string | null) => (id ? (map.get(id) ?? "Uncategorised") : "Uncategorised");
  }, [categories]);
  const examTypeName = useMemo(() => {
    const map = new Map(examTypes.map((e) => [e.id, e.name]));
    return (id: string | null) => (id ? (map.get(id) ?? "—") : "—");
  }, [examTypes]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading note…
      </div>
    );
  }

  if (isError || !note) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-10 text-center shadow-[var(--shadow-card)]">
        <p className="text-sm text-muted-foreground">Note not found.</p>
        <Link
          to="/admin/notes"
          className="mt-3 inline-flex text-sm font-semibold text-primary hover:underline"
        >
          ← Back to notes
        </Link>
      </div>
    );
  }

  const isTrialPaid = note.tier === "trial_and_paid";
  const topicsPending = updateTopics.isPending;

  const commitTopics = (next: AdminNoteTopic[], message: string) => {
    updateTopics.mutate(
      { id: note.id, topics: toTopicInputs(next) },
      {
        onSuccess: () => toast.success(message),
        onError: (err) =>
          toast.error(err instanceof Error ? err.message : "Could not update topics"),
      },
    );
  };

  const moveTopic = (index: number, dir: -1 | 1) => {
    const next = [...note.topics];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    commitTopics(next, "Topic order updated");
  };

  const renameTopic = (id: string, title: string) => {
    commitTopics(
      note.topics.map((t) => (t.id === id ? { ...t, title } : t)),
      "Topic renamed",
    );
  };

  const toggleTopicHidden = (id: string) => {
    const topic = note.topics.find((t) => t.id === id);
    commitTopics(
      note.topics.map((t) => (t.id === id ? { ...t, isHiddenForTrial: !t.isHiddenForTrial } : t)),
      topic?.isHiddenForTrial ? "Topic shown to trial users" : "Topic hidden from trial users",
    );
  };

  const deleteTopic = (id: string) => {
    commitTopics(
      note.topics.filter((t) => t.id !== id),
      "Topic removed",
    );
  };

  const addTopic = (title: string) => {
    // New topics are created by omitting `id` in the upsert payload.
    const next: TopicInput[] = [
      ...toTopicInputs(note.topics),
      { title, sortOrder: note.topics.length, isHiddenForTrial: false },
    ];
    updateTopics.mutate(
      { id: note.id, topics: next },
      {
        onSuccess: () => toast.success("Topic added"),
        onError: (err) => toast.error(err instanceof Error ? err.message : "Could not add topic"),
      },
    );
  };

  const assignPage = (page: AdminNotePage, topicId: string | null) => {
    updatePage.mutate(
      { id: note.id, pageId: page.id, input: { topicId: topicId ?? undefined } },
      {
        onSuccess: () =>
          toast.success(`Page ${page.pageNumber} assigned to ${topicLabel(note, topicId)}`),
        onError: (err) => toast.error(err instanceof Error ? err.message : "Could not assign page"),
      },
    );
  };

  const togglePageHidden = (page: AdminNotePage) => {
    updatePage.mutate(
      { id: note.id, pageId: page.id, input: { isHiddenForTrial: !page.isHiddenForTrial } },
      {
        onSuccess: () =>
          toast.success(
            page.isHiddenForTrial
              ? `Page ${page.pageNumber} shown to trial`
              : `Page ${page.pageNumber} hidden from trial`,
          ),
        onError: (err) => toast.error(err instanceof Error ? err.message : "Could not update page"),
      },
    );
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
              <span
                className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${TIER_PILL[note.tier]}`}
              >
                {TIER_LABELS[note.tier]}
              </span>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${STATUS_PILL[note.status]}`}
              >
                {note.status === "processing" && <Loader2 className="h-3 w-3 animate-spin" />}
                {STATUS_LABELS[note.status]}
              </span>
              <span
                className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${note.active ? "bg-success/10 text-success" : "bg-surface-alt text-muted-foreground"}`}
              >
                {note.active ? "Active" : "Inactive"}
              </span>
            </div>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground">{note.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {categoryName(note.categoryId)} · {examTypeName(note.examTypeId)} · {note.pageCount}{" "}
              pages
            </p>
            {note.status === "failed" && note.processingError && (
              <p className="mt-2 flex items-start gap-2 rounded-lg border border-error/30 bg-error/5 px-3 py-2 text-xs text-error">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                {note.processingError}
              </p>
            )}
          </div>
          <div className="flex flex-shrink-0 flex-wrap items-center gap-2">
            <button
              onClick={() => setEditOpen(true)}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-sm font-semibold text-foreground hover:bg-surface-alt"
            >
              <Pencil className="h-4 w-4" /> Edit
            </button>
            <button
              onClick={() =>
                reprocess.mutate(note.id, {
                  onSuccess: () => toast.success("Reprocessing note…"),
                  onError: (err) =>
                    toast.error(err instanceof Error ? err.message : "Reprocess failed"),
                })
              }
              disabled={reprocess.isPending}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-sm font-semibold text-foreground hover:bg-surface-alt disabled:cursor-not-allowed disabled:opacity-60"
            >
              {reprocess.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RotateCcw className="h-4 w-4" />
              )}{" "}
              Reprocess
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
            <span className="text-xs text-muted-foreground">
              Admin-only · users see protected images
            </span>
          </div>
          {note.status === "processing" ? (
            <div className="mt-3 flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface p-12 text-center shadow-[var(--shadow-card)]">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="mt-3 text-sm font-semibold text-foreground">Converting pages…</p>
              <p className="mt-1 text-xs text-muted-foreground">
                The preview appears once processing completes.
              </p>
            </div>
          ) : note.pages.length === 0 ? (
            <div className="mt-3 rounded-2xl border border-dashed border-border bg-surface p-10 text-center text-sm text-muted-foreground shadow-[var(--shadow-card)]">
              No pages available yet.
            </div>
          ) : (
            <PagePreview
              note={note}
              onAssign={assignPage}
              onToggleHidden={togglePageHidden}
              isPending={updatePage.isPending}
              pendingPageId={updatePage.variables?.pageId}
            />
          )}
        </section>

        {/* Topic management */}
        <section>
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-foreground">Topics</h3>
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              {topicsPending && <Loader2 className="h-3 w-3 animate-spin" />}
              {note.topics.length} total
            </span>
          </div>

          {!isTrialPaid && (
            <p className="mt-2 flex items-start gap-2 rounded-lg border border-border bg-surface-alt/40 px-3 py-2 text-xs text-muted-foreground">
              <Info className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-primary" />
              "Hide from trial" only applies to{" "}
              <span className="font-semibold text-foreground">Trial + Paid</span> notes. This note
              is <span className="font-semibold text-foreground">{TIER_LABELS[note.tier]}</span>.
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
                  isTrialPaid={isTrialPaid}
                  disabled={topicsPending}
                  pageCount={note.pages.filter((p) => p.topicId === t.id).length}
                  onMove={moveTopic}
                  onRename={renameTopic}
                  onToggleHidden={toggleTopicHidden}
                  onDelete={deleteTopic}
                />
              ))
            )}
          </div>

          <AddTopicForm disabled={topicsPending} onAdd={addTopic} />
        </section>
      </div>

      {editOpen && (
        <EditMetadataModal
          note={note}
          saving={updateNote.isPending}
          onClose={() => setEditOpen(false)}
          onSave={(input) => {
            updateNote.mutate(
              { id: note.id, input },
              {
                onSuccess: () => {
                  setEditOpen(false);
                  toast.success("Note updated");
                },
                onError: (err) =>
                  toast.error(err instanceof Error ? err.message : "Could not update note"),
              },
            );
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
            This will permanently remove{" "}
            <span className="font-semibold text-foreground">{note.title}</span> and all of its
            pages. This action cannot be undone.
          </>
        }
        onConfirm={async () => {
          try {
            await deleteNote.mutateAsync(note.id);
            toast.success("Note deleted");
            navigate({ to: "/admin/notes" });
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Delete failed");
          } finally {
            setConfirmDelete(false);
          }
        }}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}

function topicLabel(note: AdminNoteDetail, topicId: string | null): string {
  if (!topicId) return "General";
  return note.topics.find((t) => t.id === topicId)?.title ?? "General";
}

/* ------------------------------------------------------------------ */
/* Page preview                                                        */
/* ------------------------------------------------------------------ */

function PagePreview({
  note,
  onAssign,
  onToggleHidden,
  isPending,
  pendingPageId,
}: {
  note: AdminNoteDetail;
  onAssign: (page: AdminNotePage, topicId: string | null) => void;
  onToggleHidden: (page: AdminNotePage) => void;
  isPending: boolean;
  pendingPageId?: string;
}) {
  // Group pages by the topic each is assigned to (unassigned -> General).
  const groups = useMemo(() => {
    const byTopic = new Map<
      string,
      { topicId: string | null; name: string; hiddenForTrial: boolean; pages: AdminNotePage[] }
    >();
    const order: string[] = [];
    for (const p of note.pages) {
      const key = p.topicId ?? "__general__";
      if (!byTopic.has(key)) {
        const topic = note.topics.find((t) => t.id === p.topicId);
        byTopic.set(key, {
          topicId: p.topicId,
          name: topic?.title ?? "General",
          hiddenForTrial: topic?.isHiddenForTrial ?? false,
          pages: [],
        });
        order.push(key);
      }
      byTopic.get(key)!.pages.push(p);
    }
    return order.map((k) => byTopic.get(k)!);
  }, [note]);

  return (
    <div className="mt-3 space-y-5">
      {groups.map((g) => (
        <div key={g.topicId ?? "__general__"}>
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold text-foreground">{g.name}</h4>
            {g.hiddenForTrial && note.tier === "trial_and_paid" && (
              <span className="inline-flex rounded-full bg-warning/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-warning">
                Hidden for trial
              </span>
            )}
            <span className="text-xs text-muted-foreground">
              {g.pages.length} page{g.pages.length === 1 ? "" : "s"}
            </span>
          </div>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            {g.pages.map((p) => {
              const busy = isPending && pendingPageId === p.id;
              return (
                <article
                  key={p.id}
                  className="rounded-xl border border-border bg-surface p-3 shadow-[var(--shadow-card)]"
                >
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      <FileText className="h-3 w-3" /> Page {p.pageNumber}
                    </span>
                    {busy && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
                  </div>
                  <AdminPagePreview
                    noteId={note.id}
                    pageNumber={p.pageNumber}
                    ready={note.status === "ready"}
                    statusLabel={STATUS_LABELS[note.status]}
                    statusClass={STATUS_PILL[note.status]}
                  />
                  <label className="mt-2 block">
                    <select
                      value={p.topicId ?? ""}
                      disabled={busy}
                      onChange={(e) => onAssign(p, e.target.value || null)}
                      className="h-8 w-full rounded-lg border border-border bg-surface px-2 text-[11px] font-semibold disabled:opacity-60"
                      aria-label={`Assign page ${p.pageNumber} to a topic`}
                    >
                      <option value="">General (unassigned)</option>
                      {note.topics.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.title}
                        </option>
                      ))}
                    </select>
                  </label>
                  {note.tier === "trial_and_paid" && (
                    <label className="mt-2 flex items-center gap-2 text-[10px] font-semibold text-muted-foreground">
                      <ToggleSwitch
                        size="sm"
                        checked={p.isHiddenForTrial}
                        disabled={busy}
                        ariaLabel={`Hide page ${p.pageNumber} from trial`}
                        onChange={() => onToggleHidden(p)}
                      />
                      Hidden for trial
                    </label>
                  )}
                </article>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Renders the actual watermarked page image for the admin so they can verify the
 * upload converted correctly. Fetches a short-lived signed URL on mount.
 */
function AdminPagePreview({
  noteId,
  pageNumber,
  ready,
  statusLabel,
  statusClass,
}: {
  noteId: string;
  pageNumber: number;
  ready: boolean;
  statusLabel: string;
  statusClass: string;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!ready) return;
    let alive = true;
    notesApi.getPageUrl(noteId, pageNumber).then(
      (r) => alive && setUrl(r.url),
      () => alive && setFailed(true),
    );
    return () => {
      alive = false;
    };
  }, [noteId, pageNumber, ready]);

  return (
    <div className="mt-2 flex aspect-[3/4] items-center justify-center overflow-hidden rounded-lg border border-dashed border-border bg-surface-alt/40 text-[11px] font-semibold text-muted-foreground">
      {!ready ? (
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider",
            statusClass,
          )}
        >
          {statusLabel}
        </span>
      ) : failed ? (
        <span>Preview unavailable</span>
      ) : url ? (
        <img
          src={url}
          alt={`Page ${pageNumber}`}
          className="h-full w-full object-contain"
          onError={() => setFailed(true)}
        />
      ) : (
        <Loader2 className="h-5 w-5 animate-spin" />
      )}
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
  isTrialPaid,
  disabled,
  pageCount,
  onMove,
  onRename,
  onToggleHidden,
  onDelete,
}: {
  topic: AdminNoteTopic;
  index: number;
  count: number;
  isTrialPaid: boolean;
  disabled: boolean;
  pageCount: number;
  onMove: (index: number, dir: -1 | 1) => void;
  onRename: (id: string, title: string) => void;
  onToggleHidden: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [title, setTitle] = useState(topic.title);

  return (
    <div className="rounded-xl border border-border bg-surface p-4 shadow-[var(--shadow-card)]">
      <div className="flex items-start gap-2">
        <div className="flex flex-col gap-0.5">
          <button
            onClick={() => onMove(index, -1)}
            disabled={index === 0 || disabled}
            aria-label="Move up"
            className="rounded-md p-1 text-muted-foreground hover:bg-surface-alt hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ArrowUp className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onMove(index, 1)}
            disabled={index === count - 1 || disabled}
            aria-label="Move down"
            className="rounded-md p-1 text-muted-foreground hover:bg-surface-alt hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ArrowDown className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="min-w-0 flex-1">
          <input
            value={title}
            disabled={disabled}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => {
              const trimmed = title.trim();
              if (!trimmed) {
                setTitle(topic.title);
                return;
              }
              if (trimmed !== topic.title) onRename(topic.id, trimmed);
            }}
            className="h-9 w-full rounded-lg border border-border bg-surface px-2.5 text-sm font-semibold focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:opacity-60"
            aria-label="Topic name"
          />
          <p className="mt-2 text-[11px] font-semibold text-muted-foreground">
            {pageCount} page{pageCount === 1 ? "" : "s"} assigned
          </p>
          <div className="mt-3 flex items-center justify-between gap-2 border-t border-border pt-3">
            <span className="inline-flex items-center gap-2 text-[11px] font-semibold text-muted-foreground">
              <ToggleSwitch
                size="sm"
                checked={topic.isHiddenForTrial}
                disabled={!isTrialPaid || disabled}
                ariaLabel={`Hide ${topic.title} from trial users`}
                onChange={() => onToggleHidden(topic.id)}
              />
              Hidden for trial
            </span>
            <button
              onClick={() => onDelete(topic.id)}
              disabled={disabled}
              aria-label="Delete topic"
              className="inline-flex h-7 items-center gap-1 rounded-lg border border-error/30 bg-error/10 px-2 text-[11px] font-semibold text-error hover:bg-error/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AddTopicForm({ disabled, onAdd }: { disabled: boolean; onAdd: (title: string) => void }) {
  const [title, setTitle] = useState("");

  const submit = () => {
    if (!title.trim()) {
      toast.error("Topic name is required");
      return;
    }
    onAdd(title.trim());
    setTitle("");
  };

  return (
    <div className="mt-4 rounded-xl border border-dashed border-border bg-surface-alt/30 p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Add topic</p>
      <div className="mt-2 flex items-center gap-2">
        <input
          value={title}
          disabled={disabled}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
          placeholder="Topic name"
          className="h-9 flex-1 rounded-lg border border-border bg-surface px-2.5 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:opacity-60"
        />
        <button
          onClick={submit}
          disabled={disabled}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-accent px-3 text-xs font-semibold text-accent-foreground hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
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
  saving,
  onClose,
  onSave,
}: {
  note: AdminNoteDetail;
  saving: boolean;
  onClose: () => void;
  onSave: (input: {
    title: string;
    description: string;
    categoryId?: string;
    examTypeId?: string;
    accessTier: NoteTier;
  }) => void;
}) {
  const { data: categories = [] } = useCategories();
  const { data: examTypes = [] } = useExamTypes();

  const [title, setTitle] = useState(note.title);
  const [description, setDescription] = useState(note.description);
  const [categoryId, setCategoryId] = useState(note.categoryId ?? "");
  const [examTypeId, setExamTypeId] = useState(note.examTypeId ?? "");
  const [tier, setTier] = useState<NoteTier>(note.tier);

  const save = () => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    onSave({
      title: title.trim(),
      description: description.trim(),
      categoryId: categoryId || undefined,
      examTypeId: examTypeId || undefined,
      accessTier: tier,
    });
  };

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
          <h3 className="text-base font-bold text-foreground">Edit note</h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1 text-muted-foreground hover:bg-surface-alt hover:text-foreground"
          >
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
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Description
            </span>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Category
              </span>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="h-11 w-full rounded-lg border border-border bg-surface px-3 text-sm"
              >
                <option value="">Uncategorised</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Exam Type
              </span>
              <select
                value={examTypeId}
                onChange={(e) => setExamTypeId(e.target.value)}
                className="h-11 w-full rounded-lg border border-border bg-surface px-3 text-sm"
              >
                <option value="">—</option>
                {examTypes.map((et) => (
                  <option key={et.id} value={et.id}>
                    {et.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div>
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Access Tier
            </span>
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
            disabled={saving}
            className="inline-flex h-10 items-center rounded-lg border border-border bg-surface px-4 text-sm font-semibold text-foreground hover:bg-surface-alt disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-accent px-4 text-sm font-semibold text-accent-foreground hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}{" "}
            Save
          </button>
        </footer>
      </div>
    </div>
  );
}
