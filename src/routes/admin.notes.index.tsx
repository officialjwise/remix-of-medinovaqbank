import { createFileRoute, Link } from "@tanstack/react-router";
import { requirePermission } from "@/lib/route-guards";
import { useEffect, useMemo, useState } from "react";
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
  beforeLoad: () => requirePermission("notes.read"),
  head: () => ({
    meta: [
      { title: "Admin · High-Yield Notes — Medinovaqbank" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminNotes,
});

const PER_PAGE_OPTIONS = [10, 20, 25, 50, 100] as const;

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
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState<"All" | NoteTier>("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState<"All" | NoteStatus>("All");
  const [activeFilter, setActiveFilter] = useState<"All" | "active" | "inactive">("All");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [confirmDelete, setConfirmDelete] = useState<AdminNoteListItem | null>(null);

  const debounced = useDebounce(search, 250);

  // Reset to page 1 whenever the page size, search, or any filter changes so the
  // server-side window always starts from the top of the new result set.
  useEffect(() => {
    setPage(1);
  }, [perPage, debounced, tierFilter, categoryFilter, statusFilter, activeFilter]);

  const { data, isLoading, isFetching, isError } = useAdminNotes({
    page,
    limit: perPage,
    search: debounced.trim() || undefined,
    accessTier: tierFilter === "All" ? undefined : tierFilter,
    status: statusFilter === "All" ? undefined : statusFilter,
    isActive: activeFilter === "All" ? undefined : activeFilter === "active",
    categoryId: categoryFilter === "All" ? undefined : categoryFilter,
  });
  const updateNote = useUpdateNote();
  const reprocess = useReprocessNote();
  const deleteNote = useDeleteNote();
  const { data: categories = [] } = useCategories();

  const notes = useMemo(() => data?.notes ?? [], [data]);
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const currentPage = data?.page ?? page;
  // Step back if the result set shrank below the current page (e.g. after a delete).
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const categoryName = useMemo(() => {
    const map = new Map(categories.map((c) => [c.id, c.name]));
    return (id: string | null) => (id ? (map.get(id) ?? "Uncategorised") : "Uncategorised");
  }, [categories]);

  // Full category list (filtering is server-side; do not derive from the page).
  const categoryOptions = useMemo(
    () =>
      [...categories]
        .map((c) => ({ id: c.id, name: c.name }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [categories],
  );

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
            <span className="font-semibold text-foreground">{total} notes</span>
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
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title…"
            className="h-10 w-full rounded-lg border border-border bg-surface pl-9 pr-3 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </div>
        <select
          value={tierFilter}
          onChange={(e) => setTierFilter(e.target.value as typeof tierFilter)}
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
          onChange={(e) => setCategoryFilter(e.target.value)}
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
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          className="h-10 rounded-lg border border-border bg-surface px-3 text-sm"
        >
          <option value="All">All statuses</option>
          <option value="processing">Processing</option>
          <option value="ready">Ready</option>
          <option value="failed">Failed</option>
        </select>
        <select
          value={activeFilter}
          onChange={(e) => setActiveFilter(e.target.value as typeof activeFilter)}
          className="h-10 rounded-lg border border-border bg-surface px-3 text-sm"
        >
          <option value="All">All</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <select
          value={perPage}
          onChange={(e) => setPerPage(Number(e.target.value))}
          className="h-10 rounded-lg border border-border bg-surface px-3 text-sm"
          aria-label="Notes per page"
        >
          {PER_PAGE_OPTIONS.map((n) => (
            <option key={n} value={n}>
              Show {n} per page
            </option>
          ))}
        </select>
      </div>

      {notes.length === 0 && isFetching ? (
        <div className="flex items-center justify-center py-24 text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading notes…
        </div>
      ) : notes.length === 0 ? (
        <div className="mt-12 rounded-2xl border border-dashed border-border bg-surface p-12 text-center shadow-[var(--shadow-card)]">
          <BookOpen className="mx-auto h-10 w-10 text-muted-foreground/50" />
          <p className="mt-3 text-sm font-semibold text-foreground">
            {total === 0 ? "No notes yet" : "No notes match those filters"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {total === 0
              ? "Upload a PDF to publish your first high-yield note."
              : "Try adjusting your search or filters."}
          </p>
          {total === 0 && (
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
          {notes.map((n) => {
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

      {total > 0 && (
        <div className="mt-6 flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            Showing {(currentPage - 1) * perPage + 1}–{Math.min(currentPage * perPage, total)} of{" "}
            {total}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1 || isFetching}
              className="inline-flex h-9 items-center rounded-lg border border-border bg-surface px-3 text-sm font-semibold text-foreground hover:bg-surface-alt disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm font-semibold text-foreground">
              {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages || isFetching}
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
