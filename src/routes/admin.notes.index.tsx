import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Plus,
  Search,
  FileText,
  Layers,
  Loader2,
  RotateCcw,
  Trash2,
  Settings2,
  BookOpen,
} from "lucide-react";
import { toast } from "sonner";
import {
  useAdminNotes,
  useUpdateNote,
  useReprocessNote,
  useDeleteNote,
  TIER_LABELS,
  STATUS_LABELS,
  type AdminNoteListItem,
  type NoteTier,
  type NoteStatus,
} from "@/api/admin-notes.api";
import { useCategories } from "@/api/categories.api";
import { ToggleSwitch } from "@/components/ui/toggle-switch";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useDebounce } from "@/hooks/useDebounce";

export const Route = createFileRoute("/admin/notes/")({
  head: () => ({
    meta: [
      { title: "Admin · High-Yield Notes — Medinovaqbank" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminNotes,
});

const PAGE_SIZE = 10;

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

function AdminNotes() {
  const { data, isLoading, isError } = useAdminNotes();
  const updateNote = useUpdateNote();
  const reprocess = useReprocessNote();
  const deleteNote = useDeleteNote();
  const { data: categories = [] } = useCategories();

  const notes = useMemo(() => data?.notes ?? [], [data]);

  const categoryName = useMemo(() => {
    const map = new Map(categories.map((c) => [c.id, c.name]));
    return (id: string | null) => (id ? (map.get(id) ?? "Uncategorised") : "Uncategorised");
  }, [categories]);

  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState<"All" | NoteTier>("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState<"All" | NoteStatus>("All");
  const [activeFilter, setActiveFilter] = useState<"All" | "active" | "inactive">("All");
  const [page, setPage] = useState(1);
  const [confirmDelete, setConfirmDelete] = useState<AdminNoteListItem | null>(null);

  const debounced = useDebounce(search, 250);

  // Distinct category ids present on the loaded notes.
  const categoryOptions = useMemo(() => {
    const ids = Array.from(new Set(notes.map((n) => n.categoryId).filter((x): x is string => !!x)));
    return ids
      .map((id) => ({ id, name: categoryName(id) }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [notes, categoryName]);

  const filtered = useMemo(() => {
    const q = debounced.trim().toLowerCase();
    return notes.filter((n) => {
      if (tierFilter !== "All" && n.tier !== tierFilter) return false;
      if (categoryFilter !== "All" && n.categoryId !== categoryFilter) return false;
      if (statusFilter !== "All" && n.status !== statusFilter) return false;
      if (activeFilter === "active" && !n.active) return false;
      if (activeFilter === "inactive" && n.active) return false;
      if (
        q &&
        !n.title.toLowerCase().includes(q) &&
        !categoryName(n.categoryId).toLowerCase().includes(q)
      )
        return false;
      return true;
    });
  }, [notes, debounced, tierFilter, categoryFilter, statusFilter, activeFilter, categoryName]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const resetPage = () => setPage(1);

  const toggleActive = (n: AdminNoteListItem) => {
    updateNote.mutate(
      { id: n.id, input: { isActive: !n.active } },
      {
        onSuccess: () => toast.success(`${n.title} ${n.active ? "deactivated" : "activated"}`),
        onError: (err) => toast.error(err instanceof Error ? err.message : "Could not update note"),
      },
    );
  };

  const handleReprocess = (n: AdminNoteListItem) => {
    reprocess.mutate(n.id, {
      onSuccess: () => toast.success(`Reprocessing "${n.title}"`),
      onError: (err) => toast.error(err instanceof Error ? err.message : "Reprocess failed"),
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading notes…
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mt-12 rounded-2xl border border-dashed border-error/40 bg-error/5 p-12 text-center">
        <p className="text-sm font-semibold text-error">Could not load notes.</p>
        <p className="mt-1 text-xs text-muted-foreground">Please try again in a moment.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">High-Yield Notes</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{notes.length} notes</span> ·{" "}
            {notes.filter((n) => n.active).length} active
          </p>
        </div>
        <Link
          to="/admin/notes/upload"
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-gradient-to-r from-[#0E7C7B] to-[#2BC97F] px-4 text-sm font-semibold text-white shadow-md hover:opacity-95"
        >
          <Plus className="h-4 w-4" /> Upload Note
        </Link>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              resetPage();
            }}
            placeholder="Search by title or category…"
            className="h-10 w-full rounded-lg border border-border bg-surface pl-9 pr-3 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </div>
        <select
          value={tierFilter}
          onChange={(e) => {
            setTierFilter(e.target.value as typeof tierFilter);
            resetPage();
          }}
          className="h-10 rounded-lg border border-border bg-surface px-3 text-sm"
        >
          <option value="All">All tiers</option>
          {(Object.keys(TIER_LABELS) as NoteTier[]).map((t) => (
            <option key={t} value={t}>
              {TIER_LABELS[t]}
            </option>
          ))}
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value);
            resetPage();
          }}
          className="h-10 rounded-lg border border-border bg-surface px-3 text-sm"
        >
          <option value="All">All categories</option>
          {categoryOptions.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as typeof statusFilter);
            resetPage();
          }}
          className="h-10 rounded-lg border border-border bg-surface px-3 text-sm"
        >
          <option value="All">All statuses</option>
          <option value="processing">Processing</option>
          <option value="ready">Ready</option>
          <option value="failed">Failed</option>
        </select>
        <select
          value={activeFilter}
          onChange={(e) => {
            setActiveFilter(e.target.value as typeof activeFilter);
            resetPage();
          }}
          className="h-10 rounded-lg border border-border bg-surface px-3 text-sm"
        >
          <option value="All">All</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="mt-12 rounded-2xl border border-dashed border-border bg-surface p-12 text-center shadow-[var(--shadow-card)]">
          <BookOpen className="mx-auto h-10 w-10 text-muted-foreground/50" />
          <p className="mt-3 text-sm font-semibold text-foreground">
            {notes.length === 0 ? "No notes yet" : "No notes match those filters"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {notes.length === 0
              ? "Upload a PDF to publish your first high-yield note."
              : "Try adjusting your search or filters."}
          </p>
          {notes.length === 0 && (
            <Link
              to="/admin/notes/upload"
              className="mt-4 inline-flex h-10 items-center gap-2 rounded-lg bg-gradient-to-r from-[#0E7C7B] to-[#2BC97F] px-4 text-sm font-semibold text-white shadow-md hover:opacity-95"
            >
              <Plus className="h-4 w-4" /> Upload Note
            </Link>
          )}
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {pageItems.map((n) => {
            const togglingThis = updateNote.isPending && updateNote.variables?.id === n.id;
            const reprocessingThis = reprocess.isPending && reprocess.variables === n.id;
            return (
              <article
                key={n.id}
                className="flex flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-[var(--shadow-card)] transition-all hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-14px_rgb(14_124_123_/_0.25)]"
              >
                <div className="h-1.5 w-full bg-gradient-to-r from-[#0E7C7B] to-[#2BC97F]" />
                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-start justify-between gap-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${TIER_PILL[n.tier]}`}
                    >
                      {TIER_LABELS[n.tier]}
                    </span>
                    <span className="inline-flex items-center gap-2 text-[11px] font-semibold text-muted-foreground">
                      <ToggleSwitch
                        size="sm"
                        checked={n.active}
                        disabled={togglingThis}
                        ariaLabel={`Toggle ${n.title} active`}
                        onChange={() => toggleActive(n)}
                      />
                      {n.active ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <h3 className="mt-3 line-clamp-2 text-base font-bold tracking-tight text-foreground">
                    {n.title}
                  </h3>
                  <p className="mt-1 text-xs font-medium text-muted-foreground">
                    {categoryName(n.categoryId)}
                  </p>
                  <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">
                    {n.description}
                  </p>

                  <div className="my-4 border-t border-border" />

                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${STATUS_PILL[n.status]}`}
                    >
                      {n.status === "processing" && <Loader2 className="h-3 w-3 animate-spin" />}
                      {STATUS_LABELS[n.status]}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground">
                      <FileText className="h-3.5 w-3.5" /> {n.pageCount} pages
                    </span>
                  </div>

                  {n.status === "processing" && (
                    <div className="mt-3">
                      <div className="mb-1 flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
                        <span>Converting PDF…</span>
                        <span className="tabular-nums">{n.conversionProgress}%</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-alt">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#0E7C7B] to-[#2BC97F] transition-all duration-500"
                          style={{ width: `${Math.max(3, n.conversionProgress)}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="mt-5 flex items-center gap-1.5 border-t border-border pt-4">
                    <Link
                      to="/admin/notes/$noteId"
                      params={{ noteId: n.id }}
                      className="inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg bg-surface-alt text-xs font-semibold text-foreground hover:bg-surface-alt/70"
                    >
                      <Layers className="h-3.5 w-3.5" /> Manage Topics
                    </Link>
                    <Link
                      to="/admin/notes/$noteId"
                      params={{ noteId: n.id }}
                      className="inline-flex h-8 items-center justify-center rounded-lg border border-border bg-surface px-2.5 text-xs font-semibold text-muted-foreground hover:bg-surface-alt hover:text-foreground"
                      aria-label="View & edit"
                      title="View & edit"
                    >
                      <Settings2 className="h-3.5 w-3.5" />
                    </Link>
                    {n.status === "failed" && (
                      <button
                        type="button"
                        onClick={() => handleReprocess(n)}
                        disabled={reprocessingThis}
                        className="inline-flex h-8 items-center justify-center rounded-lg border border-warning/30 bg-warning/10 px-2.5 text-xs font-semibold text-warning hover:bg-warning/20 disabled:cursor-not-allowed disabled:opacity-60"
                        aria-label="Reprocess"
                        title="Reprocess"
                      >
                        {reprocessingThis ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <RotateCcw className="h-3.5 w-3.5" />
                        )}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(n)}
                      className="inline-flex h-8 items-center justify-center rounded-lg border border-error/30 bg-error/10 px-2.5 text-xs font-semibold text-error hover:bg-error/20"
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

      {filtered.length > PAGE_SIZE && (
        <div className="mt-6 flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            Showing {(safePage - 1) * PAGE_SIZE + 1}–
            {Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage <= 1}
              className="inline-flex h-9 items-center rounded-lg border border-border bg-surface px-3 text-sm font-semibold text-foreground hover:bg-surface-alt disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm font-semibold text-foreground">
              {safePage} / {pageCount}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              disabled={safePage >= pageCount}
              className="inline-flex h-9 items-center rounded-lg border border-border bg-surface px-3 text-sm font-semibold text-foreground hover:bg-surface-alt disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete note?"
        variant="destructive"
        confirmLabel="Delete"
        description={
          confirmDelete ? (
            <>
              This will permanently remove{" "}
              <span className="font-semibold text-foreground">{confirmDelete.title}</span> and all
              of its pages. This action cannot be undone.
            </>
          ) : undefined
        }
        onConfirm={async () => {
          if (!confirmDelete) return;
          const target = confirmDelete;
          try {
            await deleteNote.mutateAsync(target.id);
            toast.success("Note deleted");
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Delete failed");
          } finally {
            setConfirmDelete(null);
          }
        }}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}
